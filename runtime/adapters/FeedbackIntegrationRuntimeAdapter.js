/**
 * Baccarat Analyzer V9.9
 * Path: runtime/adapters/FeedbackIntegrationRuntimeAdapter.js
 * Purpose: Exposes V9.9 feedback integration to Runtime and AI OS.
 */
export const FEEDBACK_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.9.0";

export default class FeedbackIntegrationRuntimeAdapter {
    constructor({
        integration
    } = {}) {
        if (
            !integration ||
            typeof integration.run !==
                "function"
        ) {
            throw new TypeError(
                "FeedbackIntegrationRuntimeAdapter requires AIFeedbackIntegration."
            );
        }

        this.integration =
            integration;
    }

    run(input = {}) {
        return this.integration.run(input);
    }

    feedback(input = {}) {
        return this.integration.run(input);
    }

    pause() {
        return this.integration.pause();
    }

    resume() {
        return this.integration.resume();
    }

    reset() {
        return this.integration.reset();
    }

    destroy() {
        return this.integration.destroy();
    }

    get summary() {
        return {
            version:
                FEEDBACK_INTEGRATION_RUNTIME_ADAPTER_VERSION,
            integration:
                this.integration.summary
        };
    }
}
