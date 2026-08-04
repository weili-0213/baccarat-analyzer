/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/GovernanceContext.js
 */

export const GOVERNANCE_CONTEXT_VERSION = "7.7.0";

export default class GovernanceContext {
    constructor({
        subject = null,
        action = null,
        decision = null,
        plan = null,
        execution = null,
        agent = null,
        bankroll = {},
        session = {},
        permissions = [],
        metadata = {}
    } = {}) {
        this.version = GOVERNANCE_CONTEXT_VERSION;
        this.subject = subject;
        this.action = action;
        this.decision = decision;
        this.plan = plan;
        this.execution = execution;
        this.agent = agent;
        this.bankroll = { ...bankroll };
        this.session = { ...session };
        this.permissions = Array.isArray(permissions)
            ? [...permissions]
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

    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    toJSON() {
        return {
            version: this.version,
            subject: this.subject,
            action: this.action,
            decision: this.decision,
            plan: this.plan,
            execution: this.execution,
            agent: this.agent,
            bankroll: { ...this.bankroll },
            session: { ...this.session },
            permissions: [...this.permissions],
            metadata: { ...this.metadata }
        };
    }
}
