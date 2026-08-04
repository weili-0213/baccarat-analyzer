/**
 * Baccarat Analyzer V7.6
 * runtime/adapters/CollaborationRuntimeAdapter.js
 */

export const COLLABORATION_RUNTIME_ADAPTER_VERSION = "7.6.0";

export default class CollaborationRuntimeAdapter {
    constructor({
        collaboration
    } = {}) {
        if (
            !collaboration ||
            typeof collaboration.collaborate !==
                "function"
        ) {
            throw new TypeError(
                "CollaborationRuntimeAdapter requires a CollaborationEngine-compatible object."
            );
        }

        this.collaboration =
            collaboration;
    }

    collaborate(input = {}) {
        return this.collaboration
            .collaborate(
                input
            );
    }

    registerAgent(config) {
        return this.collaboration
            .registerAgent(
                config
            );
    }

    unregisterAgent(agentId) {
        return this.collaboration
            .unregisterAgent(
                agentId
            );
    }

    pause() {
        return this.collaboration.pause();
    }

    resume() {
        return this.collaboration.resume();
    }

    reset() {
        return this.collaboration.reset();
    }

    destroy() {
        return this.collaboration.destroy();
    }

    get summary() {
        return {
            version:
                COLLABORATION_RUNTIME_ADAPTER_VERSION,

            collaboration:
                this.collaboration.summary
        };
    }
}
