/**
 * Baccarat Analyzer V7.4
 * runtime/adapters/PlanningRuntimeAdapter.js
 */
export const PLANNING_RUNTIME_ADAPTER_VERSION = "7.4.0";
export default class PlanningRuntimeAdapter {
    constructor({ planning } = {}) {
        if (!planning || typeof planning.plan !== "function") {
            throw new TypeError(
                "PlanningRuntimeAdapter requires a PlanningEngine-compatible object."
            );
        }
        this.planning = planning;
    }
    plan(input = {}) {
        return this.planning.plan(input);
    }
    pause() {
        return this.planning.pause();
    }
    resume() {
        return this.planning.resume();
    }
    reset() {
        return this.planning.reset();
    }
    destroy() {
        return this.planning.destroy();
    }
    get summary() {
        return {
            version: PLANNING_RUNTIME_ADAPTER_VERSION,
            planning: this.planning.summary
        };
    }
}
