/**
 * Baccarat Analyzer V8.4
 * runtime/adapters/ConsciousnessRuntimeAdapter.js
 */

export const CONSCIOUSNESS_RUNTIME_ADAPTER_VERSION = "8.4.0";

export default class ConsciousnessRuntimeAdapter {
    constructor({
        consciousness
    } = {}) {
        if (
            !consciousness ||
            typeof consciousness.process !==
                "function"
        ) {
            throw new TypeError(
                "ConsciousnessRuntimeAdapter requires a ConsciousnessEngine-compatible object."
            );
        }

        this.consciousness =
            consciousness;
    }

    process(input = {}) {
        return this.consciousness
            .process(
                input
            );
    }

    pause() {
        return this.consciousness.pause();
    }

    resume() {
        return this.consciousness.resume();
    }

    reset() {
        return this.consciousness.reset();
    }

    destroy() {
        return this.consciousness.destroy();
    }

    get summary() {
        return {
            version:
                CONSCIOUSNESS_RUNTIME_ADAPTER_VERSION,
            consciousness:
                this.consciousness.summary
        };
    }
}
