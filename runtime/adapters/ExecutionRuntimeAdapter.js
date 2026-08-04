/**
 * Baccarat Analyzer V7.5
 * runtime/adapters/ExecutionRuntimeAdapter.js
 */

export const EXECUTION_RUNTIME_ADAPTER_VERSION = "7.5.0";

export default class ExecutionRuntimeAdapter {
    constructor({
        execution
    } = {}) {
        if (
            !execution ||
            typeof execution.execute !==
                "function"
        ) {
            throw new TypeError(
                "ExecutionRuntimeAdapter requires an ExecutionEngine-compatible object."
            );
        }

        this.execution =
            execution;
    }

    execute(input = {}) {
        return this.execution.execute(
            input
        );
    }

    register(
        action,
        handler
    ) {
        this.execution.register(
            action,
            handler
        );

        return this;
    }

    pause() {
        return this.execution.pause();
    }

    resume() {
        return this.execution.resume();
    }

    reset() {
        return this.execution.reset();
    }

    destroy() {
        return this.execution.destroy();
    }

    get summary() {
        return {
            version:
                EXECUTION_RUNTIME_ADAPTER_VERSION,

            execution:
                this.execution.summary
        };
    }
}
