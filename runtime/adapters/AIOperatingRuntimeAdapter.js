/**
 * Baccarat Analyzer V9.0
 * runtime/adapters/AIOperatingRuntimeAdapter.js
 */
export const AI_OPERATING_RUNTIME_ADAPTER_VERSION = "9.0.0";

export default class AIOperatingRuntimeAdapter {
    constructor({
        operatingSystem
    } = {}) {
        if (
            !operatingSystem ||
            typeof operatingSystem.process !==
                "function"
        ) {
            throw new TypeError(
                "AIOperatingRuntimeAdapter requires AIOperatingSystem."
            );
        }

        this.operatingSystem =
            operatingSystem;
    }

    boot() {
        return this.operatingSystem.boot();
    }

    process(input = {}) {
        return this.operatingSystem.process(input);
    }

    registerEngine(config) {
        return this.operatingSystem
            .registerEngine(
                config
            );
    }

    pause() {
        return this.operatingSystem.pause();
    }

    resume() {
        return this.operatingSystem.resume();
    }

    reset() {
        return this.operatingSystem.reset();
    }

    shutdown() {
        return this.operatingSystem.shutdown();
    }

    destroy() {
        return this.operatingSystem.destroy();
    }

    get summary() {
        return {
            version:
                AI_OPERATING_RUNTIME_ADAPTER_VERSION,
            operatingSystem:
                this.operatingSystem.summary
        };
    }
}
