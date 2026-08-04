/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/OptimizationContext.js
 */

export const OPTIMIZATION_CONTEXT_VERSION = "7.9.0";

export default class OptimizationContext {
    constructor({
        learning = null,
        assurance = null,
        strategy = null,
        decision = null,
        planning = null,
        execution = null,
        metrics = {},
        parameters = {},
        constraints = [],
        metadata = {}
    } = {}) {
        this.version = OPTIMIZATION_CONTEXT_VERSION;
        this.learning = learning;
        this.assurance = assurance;
        this.strategy = strategy;
        this.decision = decision;
        this.planning = planning;
        this.execution = execution;
        this.metrics = { ...metrics };
        this.parameters = { ...parameters };
        this.constraints = Array.isArray(constraints)
            ? [...constraints]
            : [];
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
            learning: this.learning,
            assurance: this.assurance,
            strategy: this.strategy,
            decision: this.decision,
            planning: this.planning,
            execution: this.execution,
            metrics: { ...this.metrics },
            parameters: { ...this.parameters },
            constraints: [...this.constraints],
            metadata: { ...this.metadata }
        };
    }
}
