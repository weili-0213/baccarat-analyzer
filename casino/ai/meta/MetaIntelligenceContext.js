/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/MetaIntelligenceContext.js
 */

export const META_INTELLIGENCE_CONTEXT_VERSION = "8.8.0";

export default class MetaIntelligenceContext {
    constructor({
        decision = null,
        learning = null,
        knowledge = null,
        reasoning = null,
        planning = null,
        execution = null,
        collaboration = null,
        governance = null,
        assurance = null,
        optimization = null,
        autonomous = null,
        selfImprovement = null,
        evolution = null,
        collective = null,
        consciousness = null,
        alignment = null,
        ethics = null,
        safety = null,
        metadata = {}
    } = {}) {
        this.version = META_INTELLIGENCE_CONTEXT_VERSION;
        this.decision = decision;
        this.learning = learning;
        this.knowledge = knowledge;
        this.reasoning = reasoning;
        this.planning = planning;
        this.execution = execution;
        this.collaboration = collaboration;
        this.governance = governance;
        this.assurance = assurance;
        this.optimization = optimization;
        this.autonomous = autonomous;
        this.selfImprovement = selfImprovement;
        this.evolution = evolution;
        this.collective = collective;
        this.consciousness = consciousness;
        this.alignment = alignment;
        this.ethics = ethics;
        this.safety = safety;
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
            assurance: this.assurance,
            optimization: this.optimization,
            autonomous: this.autonomous,
            selfImprovement: this.selfImprovement,
            evolution: this.evolution,
            collective: this.collective,
            consciousness: this.consciousness,
            alignment: this.alignment,
            ethics: this.ethics,
            safety: this.safety,
            metadata: { ...this.metadata }
        };
    }
}
