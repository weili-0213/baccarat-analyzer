/**
 * Baccarat Analyzer V8.1
 * runtime/adapters/SelfImprovementRuntimeAdapter.js
 */

export const SELF_IMPROVEMENT_RUNTIME_ADAPTER_VERSION = "8.1.0";

export default class SelfImprovementRuntimeAdapter {
    constructor({
        selfImprovement
    } = {}) {
        if (
            !selfImprovement ||
            typeof selfImprovement.improve !==
                "function"
        ) {
            throw new TypeError(
                "SelfImprovementRuntimeAdapter requires a SelfImprovementEngine-compatible object."
            );
        }

        this.selfImprovement =
            selfImprovement;
    }

    improve(input = {}) {
        return this.selfImprovement
            .improve(
                input
            );
    }

    rollback(snapshot = null) {
        return this.selfImprovement
            .rollback(
                snapshot ??
                undefined
            );
    }

    pause() {
        return this.selfImprovement.pause();
    }

    resume() {
        return this.selfImprovement.resume();
    }

    reset() {
        return this.selfImprovement.reset();
    }

    destroy() {
        return this.selfImprovement.destroy();
    }

    get summary() {
        return {
            version:
                SELF_IMPROVEMENT_RUNTIME_ADAPTER_VERSION,
            selfImprovement:
                this.selfImprovement.summary
        };
    }
}
