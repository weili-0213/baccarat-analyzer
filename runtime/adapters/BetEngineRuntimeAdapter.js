/**
 * Baccarat Analyzer V6.8
 * runtime/adapters/BetEngineRuntimeAdapter.js
 */

export const BET_ENGINE_RUNTIME_ADAPTER_VERSION = "6.8.0";

export default class BetEngineRuntimeAdapter {
    constructor({
        betEngine
    } = {}) {
        if (
            !betEngine ||
            typeof betEngine.createBet !==
                "function"
        ) {
            throw new TypeError(
                "BetEngineRuntimeAdapter requires a BetEngine-compatible object."
            );
        }

        this.betEngine =
            betEngine;
    }

    createBet(input = {}) {
        return this.betEngine
            .createBet(
                input
            );
    }

    createFromRecommendation(
        input = {}
    ) {
        return this.betEngine
            .createFromRecommendation(
                input
            );
    }

    cancelBet(
        betId,
        reason
    ) {
        return this.betEngine
            .cancelBet(
                betId,
                reason
            );
    }

    voidBet(
        betId,
        reason
    ) {
        return this.betEngine
            .voidBet(
                betId,
                reason
            );
    }

    settleBet(
        betId,
        result
    ) {
        return this.betEngine
            .settleBet(
                betId,
                result
            );
    }

    settleRound(
        roundId,
        result
    ) {
        return this.betEngine
            .settleRound(
                roundId,
                result
            );
    }

    reset(options = {}) {
        return this.betEngine
            .reset(
                options
            );
    }

    destroy() {
        return this.betEngine
            .destroy();
    }

    get summary() {
        return {
            version:
                BET_ENGINE_RUNTIME_ADAPTER_VERSION,

            betEngine:
                this.betEngine.summary
        };
    }
}
