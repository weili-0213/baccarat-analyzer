/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/AlignmentContext.js
 */

export const ALIGNMENT_CONTEXT_VERSION = "8.5.0";

export default class AlignmentContext {
    constructor({
        goals = [],
        values = [],
        constraints = [],
        decision = null,
        planning = null,
        execution = null,
        governance = null,
        assurance = null,
        autonomous = null,
        consciousness = null,
        metadata = {}
    } = {}) {
        this.version = ALIGNMENT_CONTEXT_VERSION;
        this.goals = [...goals];
        this.values = [...values];
        this.constraints = [...constraints];
        this.decision = decision;
        this.planning = planning;
        this.execution = execution;
        this.governance = governance;
        this.assurance = assurance;
        this.autonomous = autonomous;
        this.consciousness = consciousness;
        this.metadata = { ...metadata };
    }

    merge(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                this[key] = [...value];
            } else if (
                value &&
                typeof value === "object" &&
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
            goals: [...this.goals],
            values: [...this.values],
            constraints: [...this.constraints],
            decision: this.decision,
            planning: this.planning,
            execution: this.execution,
            governance: this.governance,
            assurance: this.assurance,
            autonomous: this.autonomous,
            consciousness: this.consciousness,
            metadata: { ...this.metadata }
        };
    }
}
