/**
 * Baccarat Analyzer V10.0
 * Path: runtime/adapters/ClosedLoopRuntimeAdapter.js
 * Purpose: Exposes the V10.0 closed-loop intelligence system to Runtime and UI.
 */
export const CLOSED_LOOP_RUNTIME_ADAPTER_VERSION = "10.0.0";

export default class ClosedLoopRuntimeAdapter {
    constructor({
        system
    } = {}) {
        if (
            !system ||
            typeof system.run !== "function"
        ) {
            throw new TypeError(
                "ClosedLoopRuntimeAdapter requires AIClosedLoopIntelligenceSystem."
            );
        }

        this.system = system;
    }

    run(input = {}) {
        return this.system.run(input);
    }

    cycle(input = {}) {
        return this.system.run(input);
    }

    pause() {
        return this.system.pause();
    }

    resume() {
        return this.system.resume();
    }

    reset() {
        return this.system.reset();
    }

    destroy() {
        return this.system.destroy();
    }

    get summary() {
        return {
            version:
                CLOSED_LOOP_RUNTIME_ADAPTER_VERSION,
            system:
                this.system.summary
        };
    }
}
