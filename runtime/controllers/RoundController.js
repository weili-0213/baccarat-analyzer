/**
 * Baccarat Analyzer V5.2
 * runtime/controllers/RoundController.js
 *
 * Manages the current round input state.
 */

export const ROUND_CONTROLLER_VERSION = "5.2.0";

export const RoundInputStatus = Object.freeze({
    EMPTY: "empty",
    INPUTTING: "inputting",
    READY: "ready",
    COMPLETED: "completed"
});

function clone(value) {
    return JSON.parse(
        JSON.stringify(value)
    );
}

export default class RoundController {
    constructor({
        requiredCards = 4,
        validator = null
    } = {}) {
        if (
            !Number.isInteger(requiredCards) ||
            requiredCards < 1
        ) {
            throw new RangeError(
                "requiredCards must be a positive integer."
            );
        }

        this.requiredCards =
            requiredCards;

        this.validator =
            validator;

        this.cards =
            [];

        this.metadata =
            {};

        this.lastResult =
            null;
    }

    addCard(card) {
        if (
            this.cards.length >=
                this.requiredCards
        ) {
            throw new Error(
                "Round input is already complete."
            );
        }

        if (
            this.validator &&
            !this.validator(card)
        ) {
            throw new Error(
                "Invalid card input."
            );
        }

        this.cards.push(
            clone(card)
        );

        return this.summary;
    }

    removeLastCard() {
        return this.cards.pop() ??
            null;
    }

    setCards(cards = []) {
        if (!Array.isArray(cards)) {
            throw new TypeError(
                "cards must be an array."
            );
        }

        if (
            cards.length >
            this.requiredCards
        ) {
            throw new Error(
                "Too many round cards."
            );
        }

        this.cards =
            cards.map(clone);

        return this.summary;
    }

    setMetadata(metadata = {}) {
        this.metadata = {
            ...this.metadata,
            ...metadata
        };

        return this.summary;
    }

    buildStartPayload(extra = {}) {
        return {
            ...extra,

            cards:
                this.cards.map(clone),

            metadata: {
                ...this.metadata,
                ...(extra.metadata ?? {})
            }
        };
    }

    buildCompletionPayload(extra = {}) {
        if (!this.isReady) {
            throw new Error(
                `Round requires ${this.requiredCards} cards before completion.`
            );
        }

        return {
            ...extra,

            cards:
                this.cards.map(clone),

            metadata: {
                ...this.metadata,
                ...(extra.metadata ?? {})
            }
        };
    }

    complete(result) {
        this.lastResult =
            clone(result);

        return this.summary;
    }

    reset() {
        this.cards =
            [];

        this.metadata =
            {};

        this.lastResult =
            null;

        return this;
    }

    destroy() {
        return this.reset();
    }

    get isReady() {
        return (
            this.cards.length ===
            this.requiredCards
        );
    }

    get status() {
        if (this.lastResult) {
            return RoundInputStatus.COMPLETED;
        }

        if (this.cards.length === 0) {
            return RoundInputStatus.EMPTY;
        }

        if (this.isReady) {
            return RoundInputStatus.READY;
        }

        return RoundInputStatus.INPUTTING;
    }

    get summary() {
        return {
            version:
                ROUND_CONTROLLER_VERSION,

            status:
                this.status,

            requiredCards:
                this.requiredCards,

            cardCount:
                this.cards.length,

            remainingCards:
                Math.max(
                    0,
                    this.requiredCards -
                    this.cards.length
                ),

            ready:
                this.isReady,

            cards:
                this.cards.map(clone),

            metadata: {
                ...this.metadata
            },

            hasResult:
                Boolean(this.lastResult)
        };
    }
}
