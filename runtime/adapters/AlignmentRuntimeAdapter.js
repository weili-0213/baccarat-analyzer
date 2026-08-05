/**
 * Baccarat Analyzer V8.5
 * runtime/adapters/AlignmentRuntimeAdapter.js
 */

export const ALIGNMENT_RUNTIME_ADAPTER_VERSION = "8.5.0";

export default class AlignmentRuntimeAdapter {
    constructor({
        alignment
    } = {}) {
        if (
            !alignment ||
            typeof alignment.evaluate !==
                "function"
        ) {
            throw new TypeError(
                "AlignmentRuntimeAdapter requires a ValueAlignmentEngine-compatible object."
            );
        }

        this.alignment =
            alignment;
    }

    evaluate(input = {}) {
        return this.alignment
            .evaluate(
                input
            );
    }

    registerValue(config) {
        return this.alignment
            .registerValue(
                config
            );
    }

    pause() {
        return this.alignment.pause();
    }

    resume() {
        return this.alignment.resume();
    }

    reset() {
        return this.alignment.reset();
    }

    destroy() {
        return this.alignment.destroy();
    }

    get summary() {
        return {
            version:
                ALIGNMENT_RUNTIME_ADAPTER_VERSION,
            alignment:
                this.alignment.summary
        };
    }
}
