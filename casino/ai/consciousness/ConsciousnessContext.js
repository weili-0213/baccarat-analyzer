/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/ConsciousnessContext.js
 */

export const CONSCIOUSNESS_CONTEXT_VERSION = "8.4.0";

export default class ConsciousnessContext {
    constructor({
        perception = null,
        decision = null,
        reasoning = null,
        planning = null,
        execution = null,
        learning = null,
        governance = null,
        assurance = null,
        autonomous = null,
        collective = null,
        selfModel = null,
        metadata = {}
    } = {}) {
        this.version = CONSCIOUSNESS_CONTEXT_VERSION;
        this.perception = perception;
        this.decision = decision;
        this.reasoning = reasoning;
        this.planning = planning;
        this.execution = execution;
        this.learning = learning;
        this.governance = governance;
        this.assurance = assurance;
        this.autonomous = autonomous;
        this.collective = collective;
        this.selfModel = selfModel;
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
            perception: this.perception,
            decision: this.decision,
            reasoning: this.reasoning,
            planning: this.planning,
            execution: this.execution,
            learning: this.learning,
            governance: this.governance,
            assurance: this.assurance,
            autonomous: this.autonomous,
            collective: this.collective,
            selfModel: this.selfModel,
            metadata: { ...this.metadata }
        };
    }
}
