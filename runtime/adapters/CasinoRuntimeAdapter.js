/**
 * Baccarat Analyzer V10.4
 * Path: runtime/adapters/CasinoRuntimeAdapter.js
 * Purpose: Exposes V10.4 AI Casino Runtime Integration to app/UI bootstrap.
 */
export const CASINO_RUNTIME_ADAPTER_VERSION = "10.4.0";

export default class CasinoRuntimeAdapter {
    constructor({
        integration
    } = {}) {
        if (
            !integration ||
            typeof integration.boot !== "function"
        ) {
            throw new TypeError(
                "CasinoRuntimeAdapter requires AICasinoRuntimeIntegration."
            );
        }

        this.integration =
            integration;
    }

    boot(input = {}) {
        return this.integration.boot(
            input
        );
    }

    sync() {
        return this.integration.sync();
    }

    startRound(input = {}) {
        return this.integration.startRound(
            input
        );
    }

    analyzeCurrentRound(input = {}) {
        return this.integration.analyzeCurrentRound(
            input
        );
    }

    completeRound(input = {}) {
        return this.integration.completeRound(
            input
        );
    }

    addBet(input = {}) {
        return this.integration.addBet(
            input
        );
    }

    nextRound(input = {}) {
        return this.integration.nextRound(
            input
        );
    }

    completeRoundAndPrepareNext(input = {}) {
        return this.integration.completeRoundAndPrepareNext(
            input
        );
    }

    resetShoe(input = {}) {
        return this.integration.resetShoe(
            input
        );
    }

    pause() {
        return this.integration.pause();
    }

    resume() {
        return this.integration.resume();
    }

    stop() {
        return this.integration.stop();
    }

    reset() {
        return this.integration.reset();
    }

    destroy() {
        return this.integration.destroy();
    }

    get summary() {
        return {
            version:
                CASINO_RUNTIME_ADAPTER_VERSION,
            integration:
                this.integration.summary
        };
    }
}
