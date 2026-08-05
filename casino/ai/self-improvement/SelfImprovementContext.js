/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/SelfImprovementContext.js
 */

export const SELF_IMPROVEMENT_CONTEXT_VERSION = "8.1.0";

export default class SelfImprovementContext {
    constructor({
        autonomous = null,
        learning = null,
        assurance = null,
        optimization = null,
        baseline = {},
        current = {},
        parameters = {},
        constraints = [],
        metadata = {}
    } = {}) {
        this.version = SELF_IMPROVEMENT_CONTEXT_VERSION;
        this.autonomous = autonomous;
        this.learning = learning;
        this.assurance = assurance;
        this.optimization = optimization;
        this.baseline = { ...baseline };
        this.current = { ...current };
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
            autonomous: this.autonomous,
            learning: this.learning,
            assurance: this.assurance,
            optimization: this.optimization,
            baseline: { ...this.baseline },
            current: { ...this.current },
            parameters: { ...this.parameters },
            constraints: [...this.constraints],
            metadata: { ...this.metadata }
        };
    }
}
