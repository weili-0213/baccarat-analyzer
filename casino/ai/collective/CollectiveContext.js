/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/CollectiveContext.js
 */

export const COLLECTIVE_CONTEXT_VERSION = "8.3.0";

export default class CollectiveContext {
    constructor({
        task = null,
        autonomous = null,
        knowledge = null,
        reasoning = null,
        planning = null,
        collaboration = null,
        governance = null,
        assurance = null,
        optimization = null,
        evolution = null,
        metadata = {}
    } = {}) {
        this.version = COLLECTIVE_CONTEXT_VERSION;
        this.task = task;
        this.autonomous = autonomous;
        this.knowledge = knowledge;
        this.reasoning = reasoning;
        this.planning = planning;
        this.collaboration = collaboration;
        this.governance = governance;
        this.assurance = assurance;
        this.optimization = optimization;
        this.evolution = evolution;
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
            task: this.task,
            autonomous: this.autonomous,
            knowledge: this.knowledge,
            reasoning: this.reasoning,
            planning: this.planning,
            collaboration: this.collaboration,
            governance: this.governance,
            assurance: this.assurance,
            optimization: this.optimization,
            evolution: this.evolution,
            metadata: { ...this.metadata }
        };
    }
}
