/**
 * Baccarat Analyzer V8.6
 * runtime/adapters/EthicsRuntimeAdapter.js
 */

export const ETHICS_RUNTIME_ADAPTER_VERSION = "8.6.0";

export default class EthicsRuntimeAdapter {
    constructor({
        ethics
    } = {}) {
        if (
            !ethics ||
            typeof ethics.evaluate !==
                "function"
        ) {
            throw new TypeError(
                "EthicsRuntimeAdapter requires an EthicsEngine-compatible object."
            );
        }

        this.ethics =
            ethics;
    }

    evaluate(input = {}) {
        return this.ethics
            .evaluate(
                input
            );
    }

    registerPrinciple(config) {
        return this.ethics
            .registerPrinciple(
                config
            );
    }

    pause() {
        return this.ethics.pause();
    }

    resume() {
        return this.ethics.resume();
    }

    reset() {
        return this.ethics.reset();
    }

    destroy() {
        return this.ethics.destroy();
    }

    get summary() {
        return {
            version:
                ETHICS_RUNTIME_ADAPTER_VERSION,
            ethics:
                this.ethics.summary
        };
    }
}
