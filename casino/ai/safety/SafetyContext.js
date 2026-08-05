/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/SafetyContext.js
 */
export const SAFETY_CONTEXT_VERSION = "8.7.0";
export default class SafetyContext {
    constructor({
        action = null,
        decision = null,
        planning = null,
        execution = null,
        governance = null,
        assurance = null,
        alignment = null,
        ethics = null,
        runtime = null,
        constraints = [],
        metadata = {}
    } = {}) {
        this.version = SAFETY_CONTEXT_VERSION;
        this.action = action;
        this.decision = decision;
        this.planning = planning;
        this.execution = execution;
        this.governance = governance;
        this.assurance = assurance;
        this.alignment = alignment;
        this.ethics = ethics;
        this.runtime = runtime;
        this.constraints = [...constraints];
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
            action: this.action,
            decision: this.decision,
            planning: this.planning,
            execution: this.execution,
            governance: this.governance,
            assurance: this.assurance,
            alignment: this.alignment,
            ethics: this.ethics,
            runtime: this.runtime,
            constraints: [...this.constraints],
            metadata: { ...this.metadata }
        };
    }
}
