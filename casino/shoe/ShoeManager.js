/**
 * Baccarat Analyzer V6.3
 * casino/shoe/ShoeManager.js
 *
 * Manages complete baccarat shoe lifecycle.
 */

import {
    ShoeState
} from "./ShoeState.js";

import ShoeHistory
    from "./ShoeHistory.js";

import ShoeStatistics
    from "./ShoeStatistics.js";


export const SHOE_MANAGER_VERSION = "6.3.0";

export const ShoeEvent = Object.freeze({
    STATE_CHANGE: "shoe-manager:state-change",
    CREATED: "shoe-manager:created",
    SHUFFLED: "shoe-manager:shuffled",
    BURNED: "shoe-manager:burned",
    READY: "shoe-manager:ready",
    ROUND_RECORDED: "shoe-manager:round-recorded",
    CUT_REACHED: "shoe-manager:cut-reached",
    COMPLETED: "shoe-manager:completed",
    RESET: "shoe-manager:reset",
    ERROR: "shoe-manager:error",
    DESTROYED: "shoe-manager:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class ShoeManager {
    constructor({
        shoeFactory,
        burnFactory = null,
        history = null,
        statistics = null,
        eventBus = null,
        clock = () => Date.now(),
        options = {}
    } = {}) {
        if (!isFunction(shoeFactory)) {
            throw new TypeError(
                "ShoeManager requires shoeFactory()."
            );
        }

        if (
            burnFactory !== null &&
            !isFunction(burnFactory)
        ) {
            throw new TypeError(
                "burnFactory must be a function."
            );
        }

        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (!isFunction(clock)) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.shoeFactory =
            shoeFactory;

        this.burnFactory =
            burnFactory;

        this.history =
            history ??
            new ShoeHistory();

        this.statistics =
            statistics ??
            new ShoeStatistics();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.options = {
            deckCount:
                options.deckCount ??
                8,

            autoShuffle:
                options.autoShuffle ??
                true,

            autoBurn:
                options.autoBurn ??
                true,

            cutCardRemaining:
                options.cutCardRemaining ??
                14,

            minimumRoundCards:
                options.minimumRoundCards ??
                6
        };

        this.state =
            ShoeState.IDLE;

        this.previousState = null;

        this.shoe = null;
        this.burn = null;

        this.shoeNumber = 0;
        this.roundNumber = 0;

        this.createdAt = null;
        this.completedAt = null;
        this.cutReachedAt = null;

        this.lastBurnResult = null;
        this.lastError = null;

        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "shoe-manager"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                ShoeState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown ShoeState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            ShoeEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "ShoeManager has been destroyed."
            );
        }
    }

    async create(options = {}) {
        this.assertNotDestroyed();

        if (
            this.state ===
                ShoeState.IN_PLAY
        ) {
            throw new Error(
                "Cannot create a new shoe while current shoe is in play."
            );
        }

        this.setState(
            ShoeState.CREATING
        );

        try {
            const deckCount =
                options.deckCount ??
                this.options.deckCount;

            this.shoe =
                await this.shoeFactory({
                    deckCount,
                    shoeNumber:
                        this.shoeNumber + 1,
                    options
                });

            if (!this.shoe) {
                throw new Error(
                    "shoeFactory() returned no shoe."
                );
            }

            this.shoeNumber++;
            this.roundNumber = 0;

            this.createdAt =
                this.clock();

            this.completedAt = null;
            this.cutReachedAt = null;

            this.lastBurnResult = null;
            this.lastError = null;

            this.statistics.reset();

            if (
                isFunction(this.shoe.create) &&
                this.getRemainingCards() === 0
            ) {
                await this.shoe.create();
            }

            this.emit(
                ShoeEvent.CREATED,
                {
                    shoeNumber:
                        this.shoeNumber,
                    deckCount,
                    remaining:
                        this.getRemainingCards()
                }
            );

            if (
                (
                    options.shuffle ??
                    this.options.autoShuffle
                ) &&
                isFunction(
                    this.shoe.shuffle
                )
            ) {
                await this.shuffle();
            }

            if (
                options.burn ??
                this.options.autoBurn
            ) {
                await this.executeBurn(
                    options.burnOptions ??
                    {}
                );
            }

            this.setState(
                ShoeState.READY
            );

            this.emit(
                ShoeEvent.READY,
                this.summary
            );

            return this.shoe;
        }
        catch (error) {
            return this.handleError(
                error,
                "create"
            );
        }
    }

    async shuffle() {
        this.assertNotDestroyed();

        if (!this.shoe) {
            throw new Error(
                "No shoe available to shuffle."
            );
        }

        this.setState(
            ShoeState.SHUFFLING
        );

        await this.shoe.shuffle();

        this.emit(
            ShoeEvent.SHUFFLED,
            {
                shoeNumber:
                    this.shoeNumber,
                remaining:
                    this.getRemainingCards()
            }
        );

        return this.shoe;
    }

    async executeBurn(options = {}) {
        this.assertNotDestroyed();

        if (!this.burnFactory) {
            return null;
        }

        if (!this.shoe) {
            throw new Error(
                "No shoe available for burn."
            );
        }

        this.setState(
            ShoeState.BURNING
        );

        this.burn =
            await this.burnFactory({
                shoe:
                    this.shoe,
                options
            });

        this.lastBurnResult =
            this.burn &&
            isFunction(this.burn.execute)
                ? await this.burn.execute()
                : this.burn;

        this.emit(
            ShoeEvent.BURNED,
            {
                shoeNumber:
                    this.shoeNumber,
                result:
                    this.lastBurnResult,
                remaining:
                    this.getRemainingCards()
            }
        );

        return this.lastBurnResult;
    }

    beginRound() {
        this.assertNotDestroyed();

        if (!this.canStartRound()) {
            throw new Error(
                "Shoe cannot start another round."
            );
        }

        this.roundNumber++;

        this.setState(
            ShoeState.IN_PLAY
        );

        return {
            shoeNumber:
                this.shoeNumber,
            roundNumber:
                this.roundNumber
        };
    }

    recordRound(result = {}) {
        this.assertNotDestroyed();

        if (
            this.state !==
                ShoeState.IN_PLAY
        ) {
            throw new Error(
                "No active round to record."
            );
        }

        this.statistics.recordRound(
            result
        );

        this.emit(
            ShoeEvent.ROUND_RECORDED,
            {
                shoeNumber:
                    this.shoeNumber,
                roundNumber:
                    this.roundNumber,
                result,
                statistics:
                    this.statistics.snapshot()
            }
        );

        if (this.hasReachedCutCard()) {
            this.cutReachedAt =
                this.clock();

            this.setState(
                ShoeState.CUT_REACHED
            );

            this.emit(
                ShoeEvent.CUT_REACHED,
                {
                    shoeNumber:
                        this.shoeNumber,
                    roundNumber:
                        this.roundNumber,
                    remaining:
                        this.getRemainingCards()
                }
            );
        }
        else {
            this.setState(
                ShoeState.READY
            );
        }

        return this.summary;
    }

    canStartRound() {
        return (
            this.shoe &&
            (
                this.state ===
                    ShoeState.READY ||
                this.state ===
                    ShoeState.IN_PLAY
            ) &&
            !this.needsNewShoe()
        );
    }

    hasReachedCutCard() {
        return (
            this.getRemainingCards() <=
            this.options.cutCardRemaining
        );
    }

    needsNewShoe() {
        return (
            !this.shoe ||
            this.state ===
                ShoeState.CUT_REACHED ||
            this.state ===
                ShoeState.COMPLETED ||
            this.getRemainingCards() <
                this.options.minimumRoundCards
        );
    }

    complete(reason = "completed") {
        this.assertNotDestroyed();

        this.completedAt =
            this.clock();

        this.setState(
            ShoeState.COMPLETED
        );

        const record = {
            shoeNumber:
                this.shoeNumber,

            completed:
                true,

            reason,

            createdAt:
                this.createdAt,

            completedAt:
                this.completedAt,

            duration:
                this.createdAt !== null
                    ? Math.max(
                        0,
                        this.completedAt -
                            this.createdAt
                    )
                    : 0,

            roundCount:
                this.roundNumber,

            remaining:
                this.getRemainingCards(),

            statistics:
                this.statistics.snapshot(),

            burn:
                this.lastBurnResult
        };

        this.history.add(record);

        this.emit(
            ShoeEvent.COMPLETED,
            record
        );

        return record;
    }

    async reset(options = {}) {
        this.assertNotDestroyed();

        if (
            this.shoe &&
            this.state !==
                ShoeState.COMPLETED
        ) {
            this.complete(
                "reset"
            );
        }

        await this.create(options);

        this.emit(
            ShoeEvent.RESET,
            this.summary
        );

        return this.summary;
    }

    getRemainingCards() {
        if (!this.shoe) {
            return 0;
        }

        if (
            Number.isFinite(
                this.shoe.remaining
            )
        ) {
            return this.shoe.remaining;
        }

        if (
            Array.isArray(
                this.shoe.cards
            )
        ) {
            return this.shoe.cards.length;
        }

        return 0;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            ShoeState.ERROR
        );

        this.emit(
            ShoeEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.shoe
            ?.destroy
            ?.();

        this.burn
            ?.destroy
            ?.();

        this.shoe = null;
        this.burn = null;

        this.destroyed =
            true;

        this.setState(
            ShoeState.DESTROYED
        );

        this.emit(
            ShoeEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                SHOE_MANAGER_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            shoeNumber:
                this.shoeNumber,

            roundNumber:
                this.roundNumber,

            createdAt:
                this.createdAt,

            completedAt:
                this.completedAt,

            cutReachedAt:
                this.cutReachedAt,

            remainingCards:
                this.getRemainingCards(),

            hasShoe:
                Boolean(
                    this.shoe
                ),

            hasBurn:
                Boolean(
                    this.lastBurnResult
                ),

            canStartRound:
                this.canStartRound(),

            cutReached:
                this.hasReachedCutCard(),

            needsNewShoe:
                this.needsNewShoe(),

            lastError:
                this.lastError
                    ?.message ??
                null,

            options: {
                ...this.options
            },

            statistics:
                this.statistics.summary,

            history:
                this.history.summary
        };
    }
}
