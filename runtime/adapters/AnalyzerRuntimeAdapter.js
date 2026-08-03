/**
 * Baccarat Analyzer V5.1
 * runtime/adapters/AnalyzerRuntimeAdapter.js
 *
 * Adapts analysis/analyzer.js to CasinoRuntime.
 */

export const ANALYZER_RUNTIME_ADAPTER_VERSION = "5.1.0";

export default class AnalyzerRuntimeAdapter {
    constructor({
        analyzer,
        contextFactory = null
    } = {}) {
        if (
            !analyzer ||
            (
                typeof analyzer.analyze !== "function" &&
                typeof analyzer.run !== "function"
            )
        ) {
            throw new TypeError(
                "AnalyzerRuntimeAdapter requires analyzer.analyze() or analyzer.run()."
            );
        }

        this.analyzer = analyzer;
        this.contextFactory = contextFactory;
        this.analysisCount = 0;
        this.lastResult = null;
    }

    async analyze(options = {}) {
        const context =
            typeof this.contextFactory ===
                "function"
                ? await this.contextFactory(
                    options
                )
                : options;

        let result;

        if (
            typeof this.analyzer.analyze ===
                "function"
        ) {
            result =
                await this.analyzer.analyze(
                    context
                );
        }
        else {
            result =
                await this.analyzer.run(
                    context
                );
        }

        this.analysisCount++;
        this.lastResult = result;

        return result;
    }

    setContext(context = {}) {
        if (
            typeof this.analyzer
                .setContext ===
                "function"
        ) {
            this.analyzer.setContext(
                context
            );
        }

        return this;
    }

    setMode(mode) {
        if (
            typeof this.analyzer
                .setMode ===
                "function"
        ) {
            this.analyzer.setMode(mode);
        }

        return this;
    }

    destroy() {
        this.analyzer?.destroy?.();
        this.lastResult = null;

        return this;
    }

    get summary() {
        return {
            version:
                ANALYZER_RUNTIME_ADAPTER_VERSION,
            analysisCount:
                this.analysisCount,
            hasLastResult:
                Boolean(this.lastResult)
        };
    }
}
