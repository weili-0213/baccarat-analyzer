/**
 * Baccarat Analyzer V7.9
 * runtime/adapters/OptimizationRuntimeAdapter.js
 */

export const OPTIMIZATION_RUNTIME_ADAPTER_VERSION = "7.9.0";

export default class OptimizationRuntimeAdapter {
    constructor({
        optimization
    } = {}) {
        if (
            !optimization ||
            typeof optimization.optimize !==
                "function"
        ) {
            throw new TypeError(
                "OptimizationRuntimeAdapter requires an OptimizationEngine-compatible object."
            );
        }

        this.optimization =
            optimization;
    }

    optimize(input = {}) {
        return this.optimization
            .optimize(
                input
            );
    }

    defineParameter(config) {
        return this.optimization
            .defineParameter(
                config
            );
    }

    rollback(snapshot = null) {
        return this.optimization
            .rollback(
                snapshot ??
                undefined
            );
    }

    pause() {
        return this.optimization.pause();
    }

    resume() {
        return this.optimization.resume();
    }

    reset() {
        return this.optimization.reset();
    }

    destroy() {
        return this.optimization.destroy();
    }

    get summary() {
        return {
            version:
                OPTIMIZATION_RUNTIME_ADAPTER_VERSION,
            optimization:
                this.optimization.summary
        };
    }
}
