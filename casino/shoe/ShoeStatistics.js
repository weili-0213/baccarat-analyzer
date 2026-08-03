/**
 * Baccarat Analyzer V6.3
 * casino/shoe/ShoeStatistics.js
 */

export const SHOE_STATISTICS_VERSION = "6.3.0";

export default class ShoeStatistics {
    constructor() {
        this.reset();
    }

    recordRound(result = {}) {
        this.roundCount++;

        const winner =
            result.winner;

        if (
            winner === "Player" ||
            winner === "Banker" ||
            winner === "Tie"
        ) {
            this.winners[winner]++;
        }

        if (result.playerPair) {
            this.playerPairs++;
        }

        if (result.bankerPair) {
            this.bankerPairs++;
        }

        if (result.natural) {
            this.naturals++;
        }

        if (
            Number.isFinite(
                result.cardsUsed
            )
        ) {
            this.cardsUsed +=
                result.cardsUsed;
        }

        this.lastResult =
            result;

        return this.snapshot();
    }

    snapshot() {
        const decisiveRounds =
            this.winners.Player +
            this.winners.Banker;

        return {
            version:
                SHOE_STATISTICS_VERSION,

            roundCount:
                this.roundCount,

            winners: {
                ...this.winners
            },

            playerPairs:
                this.playerPairs,

            bankerPairs:
                this.bankerPairs,

            naturals:
                this.naturals,

            cardsUsed:
                this.cardsUsed,

            playerRate:
                decisiveRounds > 0
                    ? this.winners.Player /
                        decisiveRounds
                    : 0,

            bankerRate:
                decisiveRounds > 0
                    ? this.winners.Banker /
                        decisiveRounds
                    : 0,

            tieRate:
                this.roundCount > 0
                    ? this.winners.Tie /
                        this.roundCount
                    : 0
        };
    }

    reset() {
        this.roundCount = 0;

        this.winners = {
            Player: 0,
            Banker: 0,
            Tie: 0
        };

        this.playerPairs = 0;
        this.bankerPairs = 0;
        this.naturals = 0;
        this.cardsUsed = 0;
        this.lastResult = null;

        return this;
    }

    get summary() {
        return this.snapshot();
    }
}
