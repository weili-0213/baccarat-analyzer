/**
 * Baccarat Analyzer V8.3
 * runtime/adapters/CollectiveRuntimeAdapter.js
 */

export const COLLECTIVE_RUNTIME_ADAPTER_VERSION = "8.3.0";

export default class CollectiveRuntimeAdapter {
    constructor({
        collective
    } = {}) {
        if (
            !collective ||
            typeof collective.decide !==
                "function"
        ) {
            throw new TypeError(
                "CollectiveRuntimeAdapter requires a CollectiveIntelligenceEngine-compatible object."
            );
        }

        this.collective =
            collective;
    }

    decide(input = {}) {
        return this.collective
            .decide(
                input
            );
    }

    registerAgent(config) {
        return this.collective
            .registerAgent(
                config
            );
    }

    unregisterAgent(agentId) {
        return this.collective
            .unregisterAgent(
                agentId
            );
    }

    pause() {
        return this.collective.pause();
    }

    resume() {
        return this.collective.resume();
    }

    reset() {
        return this.collective.reset();
    }

    destroy() {
        return this.collective.destroy();
    }

    get summary() {
        return {
            version:
                COLLECTIVE_RUNTIME_ADAPTER_VERSION,
            collective:
                this.collective.summary
        };
    }
}
