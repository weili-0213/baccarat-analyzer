/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/AssuranceContext.js
 */

export const ASSURANCE_CONTEXT_VERSION = "7.8.0";

export default class AssuranceContext {
    constructor({
        decision = null,
        learning = null,
        knowledge = null,
        reasoning = null,
        planning = null,
        execution = null,
        collaboration = null,
        governance = null,
        baseline = {},
        metadata = {}
    } = {}) {
        this.version = ASSURANCE_CONTEXT_VERSION;
        this.decision = decision;
        this.learning = learning;
        this.knowledge = knowledge;
        this.reasoning = reasoning;
        this.planning = planning;
        this.execution = execution;
        this.collaboration = collaboration;
        this.governance = governance;
        this.baseline = { ...baseline };
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

    toJSON() {
        return {
            version: this.version,
            decision: this.decision,
            learning: this.learning,
            knowledge: this.knowledge,
            reasoning: this.reasoning,
            planning: this.planning,
            execution: this.execution,
            collaboration: this.collaboration,
            governance: this.governance,
            baseline: { ...this.baseline },
            metadata: { ...this.metadata }
        };
    }
}
