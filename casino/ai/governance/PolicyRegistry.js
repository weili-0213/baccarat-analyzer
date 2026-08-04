/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/PolicyRegistry.js
 */

export const POLICY_REGISTRY_VERSION = "7.7.0";

export default class PolicyRegistry {
    constructor() {
        this.policies = new Map();
    }

    register({
        policyId,
        name,
        priority = 0,
        effect = "allow",
        evaluate,
        enabled = true,
        metadata = {}
    } = {}) {
        if (
            typeof policyId !== "string" ||
            policyId.length === 0
        ) {
            throw new TypeError(
                "Policy policyId is required."
            );
        }

        if (
            typeof evaluate !== "function"
        ) {
            throw new TypeError(
                "Policy evaluate must be a function."
            );
        }

        const policy = {
            policyId,
            name: name ?? policyId,
            priority,
            effect,
            evaluate,
            enabled: Boolean(enabled),
            metadata: { ...metadata },
            evaluationCount: 0
        };

        this.policies.set(
            policyId,
            policy
        );

        return policy;
    }

    get(policyId) {
        return this.policies.get(policyId) ?? null;
    }

    all() {
        return [...this.policies.values()]
            .sort(
                (a, b) =>
                    b.priority - a.priority
            );
    }

    enable(policyId) {
        const policy = this.get(policyId);

        if (!policy) {
            return false;
        }

        policy.enabled = true;
        return true;
    }

    disable(policyId) {
        const policy = this.get(policyId);

        if (!policy) {
            return false;
        }

        policy.enabled = false;
        return true;
    }

    unregister(policyId) {
        return this.policies.delete(policyId);
    }

    clear() {
        this.policies.clear();
        return this;
    }

    get summary() {
        return {
            version: POLICY_REGISTRY_VERSION,
            count: this.policies.size,
            enabledCount: [...this.policies.values()]
                .filter(
                    policy =>
                        policy.enabled
                )
                .length
        };
    }
}
