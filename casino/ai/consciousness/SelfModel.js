/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/SelfModel.js
 */

export const SELF_MODEL_VERSION = "8.4.0";

export default class SelfModel {
    constructor({
        identity = "baccarat-ai",
        capabilities = [],
        limitations = [],
        goals = [],
        state = {},
        metadata = {}
    } = {}) {
        this.version = SELF_MODEL_VERSION;
        this.identity = identity;
        this.capabilities = [...capabilities];
        this.limitations = [...limitations];
        this.goals = [...goals];
        this.state = { ...state };
        this.metadata = { ...metadata };
    }

    update({
        capabilities = null,
        limitations = null,
        goals = null,
        state = null,
        metadata = null
    } = {}) {
        if (Array.isArray(capabilities)) {
            this.capabilities = [...capabilities];
        }

        if (Array.isArray(limitations)) {
            this.limitations = [...limitations];
        }

        if (Array.isArray(goals)) {
            this.goals = [...goals];
        }

        if (state) {
            this.state = {
                ...this.state,
                ...state
            };
        }

        if (metadata) {
            this.metadata = {
                ...this.metadata,
                ...metadata
            };
        }

        return this;
    }

    snapshot() {
        return {
            version:
                this.version,
            identity:
                this.identity,
            capabilities:
                [...this.capabilities],
            limitations:
                [...this.limitations],
            goals:
                [...this.goals],
            state:
                { ...this.state },
            metadata:
                { ...this.metadata }
        };
    }
}
