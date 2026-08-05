/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/OrchestrationContext.js
 */
export const ORCHESTRATION_CONTEXT_VERSION = "8.9.0";

export default class OrchestrationContext {
    constructor({
        tasks = [],
        engines = {},
        resources = {},
        globalState = {},
        metadata = {}
    } = {}) {
        this.version = ORCHESTRATION_CONTEXT_VERSION;
        this.tasks = [...tasks];
        this.engines = { ...engines };
        this.resources = { ...resources };
        this.globalState = { ...globalState };
        this.metadata = { ...metadata };
    }

    merge(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                this[key] = [...value];
            } else if (
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
            tasks: [...this.tasks],
            engines: { ...this.engines },
            resources: { ...this.resources },
            globalState: { ...this.globalState },
            metadata: { ...this.metadata }
        };
    }
}
