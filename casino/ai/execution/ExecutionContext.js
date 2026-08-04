/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ExecutionContext.js
 */

export const EXECUTION_CONTEXT_VERSION = "7.5.0";

export default class ExecutionContext {
    constructor({
        plan = null,
        runtime = null,
        session = null,
        bankroll = null,
        metadata = {}
    } = {}) {
        this.version = EXECUTION_CONTEXT_VERSION;
        this.plan = plan;
        this.runtime = runtime;
        this.session = session;
        this.bankroll = bankroll;
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
            plan: this.plan,
            runtime: this.runtime,
            session: this.session,
            bankroll: this.bankroll,
            metadata: { ...this.metadata }
        };
    }
}
