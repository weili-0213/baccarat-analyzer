/**
 * Baccarat Analyzer V9.1
 * runtime/adapters/AIUIRuntimeAdapter.js
 */
export const AI_UI_RUNTIME_ADAPTER_VERSION = "9.1.0";

export default class AIUIRuntimeAdapter {
    constructor({
        controller
    } = {}) {
        if (
            !controller ||
            typeof controller.analyze !==
                "function"
        ) {
            throw new TypeError(
                "AIUIRuntimeAdapter requires AIUIController."
            );
        }

        this.controller =
            controller;
    }

    connect() {
        return this.controller.connect();
    }

    analyze(input = {}) {
        return this.controller.analyze(input);
    }

    bindDefaultActions(options = {}) {
        return this.controller
            .bindDefaultActions(
                options
            );
    }

    pause() {
        return this.controller.pause();
    }

    resume() {
        return this.controller.resume();
    }

    reset() {
        return this.controller.reset();
    }

    destroy() {
        return this.controller.destroy();
    }

    get summary() {
        return {
            version:
                AI_UI_RUNTIME_ADAPTER_VERSION,
            controller:
                this.controller.summary
        };
    }
}
