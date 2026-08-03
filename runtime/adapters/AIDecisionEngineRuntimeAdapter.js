/**
 * Baccarat Analyzer V7.0
 * runtime/adapters/AIDecisionEngineRuntimeAdapter.js
 */

export const AI_DECISION_ENGINE_RUNTIME_ADAPTER_VERSION = "7.0.0";

export default class AIDecisionEngineRuntimeAdapter {
    constructor({
        ai
    } = {}) {
        if (
            !ai ||
            typeof ai.evaluate !==
                "function"
        ) {
            throw new TypeError(
                "AIDecisionEngineRuntimeAdapter requires an AIDecisionEngine-compatible object."
            );
        }

        this.ai =
            ai;
    }

    evaluate(input = {}) {
        return this.ai.evaluate(
            input
        );
    }

    predict(input = {}) {
        return this.ai.predict(
            input
        );
    }

    recommend(input = {}) {
        return this.ai.recommend(
            input
        );
    }

    reset() {
        return this.ai.reset();
    }

    destroy() {
        return this.ai.destroy();
    }

    get summary() {
        return {
            version:
                AI_DECISION_ENGINE_RUNTIME_ADAPTER_VERSION,

            ai:
                this.ai.summary
        };
    }
}
