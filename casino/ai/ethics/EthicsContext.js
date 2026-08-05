/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/EthicsContext.js
 */

export const ETHICS_CONTEXT_VERSION = "8.6.0";

export default class EthicsContext {
    constructor({
        subject = null,
        stakeholders = [],
        action = null,
        decision = null,
        planning = null,
        execution = null,
        governance = null,
        assurance = null,
        alignment = null,
        constraints = [],
        metadata = {}
    } = {}) {
        this.version = ETHICS_CONTEXT_VERSION;
        this.subject = subject;
        this.stakeholders = [...stakeholders];
        this.action = action;
        this.decision = decision;
        this.planning = planning;
        this.execution = execution;
        this.governance = governance;
        this.assurance = assurance;
        this.alignment = alignment;
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
            subject: this.subject,
            stakeholders: [...this.stakeholders],
            action: this.action,
            decision: this.decision,
            planning: this.planning,
            execution: this.execution,
            governance: this.governance,
            assurance: this.assurance,
            alignment: this.alignment,
            constraints: [...this.constraints],
            metadata: { ...this.metadata }
        };
    }
}
