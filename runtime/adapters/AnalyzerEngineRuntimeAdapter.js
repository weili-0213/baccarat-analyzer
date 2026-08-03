/**
 * Baccarat Analyzer V6.5
 * runtime/adapters/AnalyzerEngineRuntimeAdapter.js
 */

export const ANALYZER_ENGINE_RUNTIME_ADAPTER_VERSION = "6.5.0";

export default class AnalyzerEngineRuntimeAdapter {
    constructor({
        analyzer
    } = {}) {
        if (
            !analyzer ||
            typeof analyzer.analyzeRound !==
                "function"
        ) {
            throw new TypeError(
                "AnalyzerEngineRuntimeAdapter requires an AnalyzerEngine-compatible object."
            );
        }

        this.analyzer =
            analyzer;
    }

    analyzeRound(
        input = {},
        options = {}
    ) {
        return this.analyzer
            .analyzeRound(
                input,
                options
            );
    }

    analyzeShoe(
        input = {},
        options = {}
    ) {
        return this.analyzer
            .analyzeShoe(
                input,
                options
            );
    }

    analyzeSession(
        input = {},
        options = {}
    ) {
        return this.analyzer
            .analyzeSession(
                input,
                options
            );
    }

    reset() {
        return this.analyzer.reset();
    }

    clearCache() {
        return this.analyzer
            .clearCache();
    }

    destroy() {
        this.analyzer.destroy();
        return this;
    }

    get summary() {
        return {
            version:
                ANALYZER_ENGINE_RUNTIME_ADAPTER_VERSION,

            analyzer:
                this.analyzer.summary
        };
    }
}
