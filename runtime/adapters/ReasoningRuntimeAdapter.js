/**
 * Baccarat Analyzer V7.3
 * runtime/adapters/ReasoningRuntimeAdapter.js
 */
export const REASONING_RUNTIME_ADAPTER_VERSION = "7.3.0";
export default class ReasoningRuntimeAdapter {
    constructor({ reasoning } = {}) {
        if (!reasoning || typeof reasoning.reason !== "function") {
            throw new TypeError(
                "ReasoningRuntimeAdapter requires a ReasoningEngine-compatible object."
            );
        }
        this.reasoning = reasoning;
    }
    reason(input = {}) {
        return this.reasoning.reason(input);
    }
    pause() {
        return this.reasoning.pause();
    }
    resume() {
        return this.reasoning.resume();
    }
    reset() {
        return this.reasoning.reset();
    }
    destroy() {
        return this.reasoning.destroy();
    }
    get summary() {
        return {
            version: REASONING_RUNTIME_ADAPTER_VERSION,
            reasoning: this.reasoning.summary
        };
    }
}
