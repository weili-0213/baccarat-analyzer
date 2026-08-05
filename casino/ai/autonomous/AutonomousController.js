/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/AutonomousController.js
 */
export const AUTONOMOUS_CONTROLLER_VERSION = "8.0.0";
export default class AutonomousController {
    constructor({ engine } = {}) {
        if (!engine) {
            throw new TypeError(
                "AutonomousController requires engine."
            );
        }
        this.engine = engine;
    }
    start(input = {}) {
        return this.engine.start(input);
    }
    runCycle(input = {}) {
        return this.engine.runCycle(input);
    }
    pause() {
        return this.engine.pause();
    }
    resume() {
        return this.engine.resume();
    }
    stop(reason = "stopped") {
        return this.engine.stop(reason);
    }
    restart(input = {}) {
        return this.engine.restart(input);
    }
    emergencyStop(reason = "emergency-stop") {
        return this.engine.stop(reason, { emergency: true });
    }
    reset() {
        return this.engine.reset();
    }
    destroy() {
        return this.engine.destroy();
    }
    get summary() {
        return {
            version: AUTONOMOUS_CONTROLLER_VERSION,
            engine: this.engine.summary
        };
    }
}
