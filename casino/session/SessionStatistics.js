/**
 * Baccarat Analyzer V6.4
 * casino/session/SessionStatistics.js
 */

export const SESSION_STATISTICS_VERSION = "6.4.0";

export default class SessionStatistics {
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
                result.profit
            )
        ) {
            this.profit +=
                result.profit;
        }

        if (
            Number.isFinite(
                result.betAmount
            )
        ) {
            this.totalBet +=
                result.betAmount;
        }

        this.lastResult =
            result;

        this.peakProfit =
            Math.max(
                this.peakProfit,
                this.profit
            );

        this.maxDrawdown =
            Math.max(
                this.maxDrawdown,
                this.peakProfit -
                    this.profit
            );

        return this.snapshot();
    }

    snapshot() {
        return {
            version:
                SESSION_STATISTICS_VERSION,

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

            totalBet:
                this.totalBet,

            profit:
                this.profit,

            roi:
                this.totalBet > 0
                    ? this.profit /
                        this.totalBet
                    : 0,

            peakProfit:
                this.peakProfit,

            maxDrawdown:
                this.maxDrawdown
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
        this.totalBet = 0;
        this.profit = 0;
        this.peakProfit = 0;
        this.maxDrawdown = 0;
        this.lastResult = null;

        return this;
    }

    get summary() {
        return this.snapshot();
    }
}
