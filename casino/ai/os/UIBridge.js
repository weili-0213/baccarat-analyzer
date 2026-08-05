/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/UIBridge.js
 */
export const UI_BRIDGE_VERSION = "9.0.0";

export default class UIBridge {
    constructor({
        operatingSystem
    } = {}) {
        if (
            !operatingSystem ||
            typeof operatingSystem.process !==
                "function"
        ) {
            throw new TypeError(
                "UIBridge requires AIOperatingSystem."
            );
        }

        this.operatingSystem =
            operatingSystem;
    }

    async analyze(input = {}) {
        return this.operatingSystem.process(input);
    }

    getStatus() {
        return this.operatingSystem.summary;
    }

    getGlobalState() {
        return this.operatingSystem
            .globalState
            .snapshot();
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

    get summary() {
        return {
            version: UI_BRIDGE_VERSION,
            operatingSystem:
                this.operatingSystem.summary
        };
    }
}
