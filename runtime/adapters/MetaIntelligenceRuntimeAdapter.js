/**
 * Baccarat Analyzer V8.8
 * runtime/adapters/MetaIntelligenceRuntimeAdapter.js
 */

export const META_INTELLIGENCE_RUNTIME_ADAPTER_VERSION = "8.8.0";

export default class MetaIntelligenceRuntimeAdapter {
    constructor({
        metaIntelligence
    } = {}) {
        if (
            !metaIntelligence ||
            typeof metaIntelligence.analyze !==
                "function"
        ) {
            throw new TypeError(
                "MetaIntelligenceRuntimeAdapter requires a MetaIntelligenceEngine-compatible object."
            );
        }

        this.metaIntelligence =
            metaIntelligence;
    }

    analyze(input = {}) {
        return this.metaIntelligence
            .analyze(
                input
            );
    }

    registerCapability(config) {
        return this.metaIntelligence
            .registerCapability(
                config
            );
    }

    pause() {
        return this.metaIntelligence.pause();
    }

    resume() {
        return this.metaIntelligence.resume();
    }

    reset() {
        return this.metaIntelligence.reset();
    }

    destroy() {
        return this.metaIntelligence.destroy();
    }

    get summary() {
        return {
            version:
                META_INTELLIGENCE_RUNTIME_ADAPTER_VERSION,
            metaIntelligence:
                this.metaIntelligence.summary
        };
    }
}
