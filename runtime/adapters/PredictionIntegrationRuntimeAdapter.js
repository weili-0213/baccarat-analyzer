/**
 * Baccarat Analyzer V9.4
 * Path: runtime/adapters/PredictionIntegrationRuntimeAdapter.js
 * Purpose: Exposes prediction integration to Runtime and AI OS.
 */

export const PREDICTION_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.4.0";

export default class PredictionIntegrationRuntimeAdapter {
    constructor({
        integration
    } = {}) {
        if (
            !integration ||
            typeof integration.run !==
                "function"
        ) {
            throw new TypeError(
                "PredictionIntegrationRuntimeAdapter requires AIPredictionIntegration."
            );
        }

        this.integration =
            integration;
    }

    run(input = {}) {
        return this.integration
            .run(
                input
            );
    }

    predict(input = {}) {
        return this.integration
            .run(
                input
            );
    }

    pause() {
        return this.integration
            .pause();
    }

    resume() {
        return this.integration
            .resume();
    }

    reset() {
        return this.integration
            .reset();
    }

    destroy() {
        return this.integration
            .destroy();
    }

    get summary() {
        return {
            version:
                PREDICTION_INTEGRATION_RUNTIME_ADAPTER_VERSION,
            integration:
                this.integration.summary
        };
    }
}
