/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/SharedContext.js
 */

export const SHARED_CONTEXT_VERSION = "7.6.0";

export default class SharedContext {
    constructor({
        task = null,
        decision = null,
        knowledge = null,
        reasoning = null,
        planning = null,
        execution = null,
        learning = null,
        metadata = {}
    } = {}) {
        this.version = SHARED_CONTEXT_VERSION;
        this.task = task;
        this.decision = decision;
        this.knowledge = knowledge;
        this.reasoning = reasoning;
        this.planning = planning;
        this.execution = execution;
        this.learning = learning;
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
                this[key] = {
                    ...this[key],
                    ...value
                };
            } else {
                this[key] = value;
            }
        }

        return this;
    }

    get(key, fallback = null) {
        return this[key] ?? fallback;
    }

    set(key, value) {
        this[key] = value;
        return this;
    }

    toJSON() {
        return {
            version: this.version,
            task: this.task,
            decision: this.decision,
            knowledge: this.knowledge,
            reasoning: this.reasoning,
            planning: this.planning,
            execution: this.execution,
            learning: this.learning,
            metadata: { ...this.metadata }
        };
    }
}
