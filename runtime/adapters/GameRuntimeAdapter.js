/**
 * Baccarat Analyzer V10.3
 * Path: runtime/adapters/GameRuntimeAdapter.js
 * Purpose: Exposes V10.3 AI Game Runtime Integration to app/UI bootstrap.
 */
export const GAME_RUNTIME_ADAPTER_VERSION = "10.3.0";

export default class GameRuntimeAdapter {
    constructor({
        integration
    } = {}) {
        if (
            !integration ||
            typeof integration.connect !== "function"
        ) {
            throw new TypeError(
                "GameRuntimeAdapter requires AIGameRuntimeIntegration."
            );
        }

        this.integration =
            integration;
    }

    connect(input = {}) {
        return this.integration.connect(
            input
        );
    }

    sync(input = {}) {
        return this.integration.sync(
            input
        );
    }

    beginRound(input = {}) {
        return this.integration.beginRound(
            input
        );
    }

    analyzeCurrentRound(input = {}) {
        return this.integration.analyzeCurrentRound(
            input
        );
    }

    settleCurrentRound(input = {}) {
        return this.integration.settleCurrentRound(
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
                GAME_RUNTIME_ADAPTER_VERSION,
            integration:
                this.integration.summary
        };
    }
}
