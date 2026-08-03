/**
 * Baccarat Analyzer V6.9
 * runtime/adapters/StrategyEngineRuntimeAdapter.js
 */

export const STRATEGY_ENGINE_RUNTIME_ADAPTER_VERSION = "6.9.0";

export default class StrategyEngineRuntimeAdapter {
    constructor({
        strategy
    } = {}) {
        if (
            !strategy ||
            typeof strategy.evaluate !==
                "function"
        ) {
            throw new TypeError(
                "StrategyEngineRuntimeAdapter requires a StrategyEngine-compatible object."
            );
        }

        this.strategy =
            strategy;
    }

    evaluate(input = {}) {
        return this.strategy.evaluate(
            input
        );
    }

    evaluateAndCreateBet(
        input = {}
    ) {
        return this.strategy
            .evaluateAndCreateBet(
                input
            );
    }

    reset() {
        return this.strategy.reset();
    }

    destroy() {
        return this.strategy.destroy();
    }

    get summary() {
        return {
            version:
                STRATEGY_ENGINE_RUNTIME_ADAPTER_VERSION,

            strategy:
                this.strategy.summary
        };
    }
}
