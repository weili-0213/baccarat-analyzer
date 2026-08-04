/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/PlanningContext.js
 */
export const PLANNING_CONTEXT_VERSION = "7.4.0";
export default class PlanningContext {
    constructor({
        goal = null,
        decision = null,
        reasoning = null,
        knowledge = null,
        strategy = null,
        bankroll = {},
        session = {},
        constraints = [],
        metadata = {}
    } = {}) {
        this.version = PLANNING_CONTEXT_VERSION;
        this.goal = goal;
        this.decision = decision;
        this.reasoning = reasoning;
        this.knowledge = knowledge;
        this.strategy = strategy;
        this.bankroll = { ...bankroll };
        this.session = { ...session };
        this.constraints = Array.isArray(constraints) ? [...constraints] : [];
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
            goal: this.goal,
            decision: this.decision,
            reasoning: this.reasoning,
            knowledge: this.knowledge,
            strategy: this.strategy,
            bankroll: { ...this.bankroll },
            session: { ...this.session },
            constraints: [...this.constraints],
            metadata: { ...this.metadata }
        };
    }
}
