/**
 * Baccarat Analyzer V6.2
 * casino/round/RoundResultBuilder.js
 */

export const ROUND_RESULT_BUILDER_VERSION = "6.2.0";

function getCards(hand) {
    if (!hand) {
        return [];
    }

    if (
        typeof hand.getCards ===
            "function"
    ) {
        return hand.getCards();
    }

    if (Array.isArray(hand.cards)) {
        return [...hand.cards];
    }

    return [];
}

function getValue(hand) {
    if (!hand) {
        return null;
    }

    if (Number.isFinite(hand.value)) {
        return hand.value;
    }

    if (
        typeof hand.getValue ===
            "function"
    ) {
        return hand.getValue();
    }

    return null;
}

function getRank(card) {
    return (
        card?.pairValue ??
        card?.rank ??
        null
    );
}

export default class RoundResultBuilder {
    constructor({
        sideBetResolver = null
    } = {}) {
        if (
            sideBetResolver !== null &&
            typeof sideBetResolver !==
                "function"
        ) {
            throw new TypeError(
                "sideBetResolver must be a function."
            );
        }

        this.sideBetResolver =
            sideBetResolver;
    }

    async build({
        roundId,
        shoeNumber,
        roundNumber,
        playerHand,
        bankerHand,
        dealerResult = {},
        startedAt,
        completedAt,
        metadata = {}
    } = {}) {
        const playerCards =
            getCards(playerHand);

        const bankerCards =
            getCards(bankerHand);

        const playerValue =
            getValue(playerHand);

        const bankerValue =
            getValue(bankerHand);

        let winner =
            dealerResult.winner ??
            "Tie";

        if (
            !dealerResult.winner &&
            Number.isFinite(playerValue) &&
            Number.isFinite(bankerValue)
        ) {
            if (playerValue > bankerValue) {
                winner = "Player";
            }
            else if (
                bankerValue >
                playerValue
            ) {
                winner = "Banker";
            }
        }

        const playerPair =
            playerCards.length >= 2 &&
            getRank(playerCards[0]) !==
                null &&
            getRank(playerCards[0]) ===
                getRank(playerCards[1]);

        const bankerPair =
            bankerCards.length >= 2 &&
            getRank(bankerCards[0]) !==
                null &&
            getRank(bankerCards[0]) ===
                getRank(bankerCards[1]);

        const natural =
            playerCards.length === 2 &&
            bankerCards.length === 2 &&
            (
                playerValue >= 8 ||
                bankerValue >= 8
            );

        const baseResult = {
            version:
                ROUND_RESULT_BUILDER_VERSION,

            roundId,
            shoeNumber,
            roundNumber,

            winner,

            playerValue,
            bankerValue,

            playerCards,
            bankerCards,

            playerPair,
            bankerPair,

            anyPair:
                playerPair ||
                bankerPair,

            perfectPair:
                false,

            natural,

            playerNatural:
                playerCards.length === 2 &&
                playerValue >= 8,

            bankerNatural:
                bankerCards.length === 2 &&
                bankerValue >= 8,

            margin:
                Math.abs(
                    (playerValue ?? 0) -
                    (bankerValue ?? 0)
                ),

            reason:
                dealerResult.reason ??
                "round-complete",

            startedAt,
            completedAt,

            duration:
                Math.max(
                    0,
                    (
                        completedAt ??
                        0
                    ) -
                    (
                        startedAt ??
                        0
                    )
                ),

            metadata: {
                ...metadata
            }
        };

        const sideBets =
            this.sideBetResolver
                ? await this.sideBetResolver(
                    baseResult
                )
                : {};

        return {
            ...baseResult,
            sideBets
        };
    }

    get summary() {
        return {
            version:
                ROUND_RESULT_BUILDER_VERSION,

            hasSideBetResolver:
                Boolean(
                    this.sideBetResolver
                )
        };
    }
}
