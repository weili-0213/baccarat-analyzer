/**
 * Baccarat Analyzer V6.0
 * runtime/adapters/CasinoEngineRuntimeAdapter.js
 *
 * Adapts CasinoEngine to CasinoRuntime's Game contract.
 */

export const CASINO_ENGINE_RUNTIME_ADAPTER_VERSION = "6.0.0";

export default class CasinoEngineRuntimeAdapter {
    constructor({
        engine
    } = {}) {
        if (
            !engine ||
            typeof engine.startRound !==
                "function" ||
            typeof engine.completeRound !==
                "function"
        ) {
            throw new TypeError(
                "CasinoEngineRuntimeAdapter requires a CasinoEngine-compatible object."
            );
        }

        this.engine = engine;
    }

    async start(options = {}) {
        if (
            typeof this.engine.initialize ===
                "function" &&
            !this.engine.summary
                ?.hasShoe
        ) {
            return this.engine.initialize(
                options
            );
        }

        return this.engine.summary;
    }

    startRound(input = {}) {
        return this.engine.startRound(
            input
        );
    }

    completeRound(input = {}) {
        return this.engine.completeRound(
            input
        );
    }

    reset(options = {}) {
        return this.engine.reset(
            options
        );
    }

    stop() {
        return this.engine.stop();
    }

    destroy() {
        this.engine.destroy?.();
        return this;
    }

    get summary() {
        return {
            version:
                CASINO_ENGINE_RUNTIME_ADAPTER_VERSION,

            engine:
                this.engine.summary
        };
    }
}
