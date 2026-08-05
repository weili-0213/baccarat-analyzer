/**
 * Baccarat Analyzer V8.9
 * runtime/adapters/OrchestrationRuntimeAdapter.js
 */
export const ORCHESTRATION_RUNTIME_ADAPTER_VERSION = "8.9.0";

export default class OrchestrationRuntimeAdapter {
    constructor({
        orchestration
    } = {}) {
        if (
            !orchestration ||
            typeof orchestration.orchestrate !==
                "function"
        ) {
            throw new TypeError(
                "OrchestrationRuntimeAdapter requires an OrchestrationEngine-compatible object."
            );
        }

        this.orchestration =
            orchestration;
    }

    orchestrate(input = {}) {
        return this.orchestration
            .orchestrate(
                input
            );
    }

    registerTask(task) {
        return this.orchestration
            .registerTask(
                task
            );
    }

    pause() {
        return this.orchestration.pause();
    }

    resume() {
        return this.orchestration.resume();
    }

    reset() {
        return this.orchestration.reset();
    }

    destroy() {
        return this.orchestration.destroy();
    }

    get summary() {
        return {
            version:
                ORCHESTRATION_RUNTIME_ADAPTER_VERSION,
            orchestration:
                this.orchestration.summary
        };
    }
}
