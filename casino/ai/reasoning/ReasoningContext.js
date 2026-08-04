/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ReasoningContext.js
 */
export const REASONING_CONTEXT_VERSION = "7.3.0";
export default class ReasoningContext {
    constructor({
        query = null,
        decision = null,
        analysis = {},
        knowledge = {},
        statistics = {},
        roadmap = {},
        history = [],
        metadata = {}
    } = {}) {
        this.version = REASONING_CONTEXT_VERSION;
        this.query = query;
        this.decision = decision;
        this.analysis = { ...analysis };
        this.knowledge = { ...knowledge };
        this.statistics = { ...statistics };
        this.roadmap = { ...roadmap };
        this.history = Array.isArray(history) ? [...history] : [];
        this.metadata = { ...metadata };
    }
    merge(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                this[key] &&
                typeof this[key] === "object" &&
                !Array.isArray(this[key])
            ) {
                this[key] = { ...this[key], ...value };
            } else {
                this[key] = value;
            }
        }
        return this;
    }
    toJSON() {
        return {
            version: this.version,
            query: this.query,
            decision: this.decision,
            analysis: { ...this.analysis },
            knowledge: { ...this.knowledge },
            statistics: { ...this.statistics },
            roadmap: { ...this.roadmap },
            history: [...this.history],
            metadata: { ...this.metadata }
        };
    }
}
