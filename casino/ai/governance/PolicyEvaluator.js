/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/PolicyEvaluator.js
 */

import {
    PolicyEffect
} from "./GovernanceState.js";

export const POLICY_EVALUATOR_VERSION = "7.7.0";

export default class PolicyEvaluator {
    evaluate({
        context,
        policies = []
    } = {}) {
        const results = [];

        for (const policy of policies) {
            if (!policy.enabled) {
                continue;
            }

            policy.evaluationCount++;

            const matched =
                Boolean(
                    policy.evaluate(
                        context
                    )
                );

            results.push({
                policyId: policy.policyId,
                name: policy.name,
                priority: policy.priority,
                effect: policy.effect,
                matched
            });
        }

        const matched =
            results.filter(
                result =>
                    result.matched
            );

        const denied =
            matched.filter(
                result =>
                    result.effect ===
                    PolicyEffect.DENY
            );

        const warnings =
            matched.filter(
                result =>
                    result.effect ===
                    PolicyEffect.WARN
            );

        return {
            passed:
                denied.length === 0,
            results,
            matched,
            denied,
            warnings
        };
    }

    get summary() {
        return {
            version: POLICY_EVALUATOR_VERSION
        };
    }
}
