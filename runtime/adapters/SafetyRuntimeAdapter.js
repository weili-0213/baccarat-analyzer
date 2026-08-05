/**
 * Baccarat Analyzer V8.7
 * runtime/adapters/SafetyRuntimeAdapter.js
 */
export const SAFETY_RUNTIME_ADAPTER_VERSION = "8.7.0";
export default class SafetyRuntimeAdapter {
    constructor({ safety } = {}) {
        if (!safety || typeof safety.check !== "function") {
            throw new TypeError(
                "SafetyRuntimeAdapter requires a SafetyEngine-compatible object."
            );
        }
        this.safety = safety;
    }
    check(input = {}) {
        return this.safety.check(input);
    }
    registerHazard(config) {
        return this.safety.registerHazard(config);
    }
    pause() {
        return this.safety.pause();
    }
    resume() {
        return this.safety.resume();
    }
    reset() {
        return this.safety.reset();
    }
    destroy() {
        return this.safety.destroy();
    }
    get summary() {
        return {
            version: SAFETY_RUNTIME_ADAPTER_VERSION,
            safety: this.safety.summary
        };
    }
}
