/**
 * Baccarat Analyzer V8.0
 * runtime/adapters/AutonomousRuntimeAdapter.js
 */
export const AUTONOMOUS_RUNTIME_ADAPTER_VERSION = "8.0.0";
export default class AutonomousRuntimeAdapter {
    constructor({ autonomous } = {}) {
        if (!autonomous || typeof autonomous.start !== "function") {
            throw new TypeError(
                "AutonomousRuntimeAdapter requires an AutonomousEngine-compatible object."
            );
        }
        this.autonomous = autonomous;
    }
    start(input = {}) {
        return this.autonomous.start(input);
    }
    runCycle(input = {}) {
        return this.autonomous.runCycle(input);
    }
    registerHandler(type, handler) {
        this.autonomous.registerHandler(type, handler);
        return this;
    }
    pause() {
        return this.autonomous.pause();
    }
    resume() {
        return this.autonomous.resume();
    }
    stop(reason = "stopped") {
        return this.autonomous.stop(reason);
    }
    restart(input = {}) {
        return this.autonomous.restart(input);
    }
    reset() {
        return this.autonomous.reset();
    }
    destroy() {
        return this.autonomous.destroy();
    }
    get summary() {
        return {
            version: AUTONOMOUS_RUNTIME_ADAPTER_VERSION,
            autonomous: this.autonomous.summary
        };
    }
}
