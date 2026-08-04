/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/ApprovalWorkflow.js
 */

import {
    GovernanceDecision
} from "./GovernanceState.js";

export const APPROVAL_WORKFLOW_VERSION = "7.7.0";

export default class ApprovalWorkflow {
    decide({
        policyResult,
        riskResult,
        permissionResult
    } = {}) {
        if (
            permissionResult &&
            !permissionResult.passed
        ) {
            return {
                decision:
                    GovernanceDecision.BLOCK,
                reason:
                    "Permission denied."
            };
        }

        if (
            policyResult &&
            !policyResult.passed
        ) {
            return {
                decision:
                    GovernanceDecision.BLOCK,
                reason:
                    "Policy denied."
            };
        }

        if (
            riskResult &&
            !riskResult.passed
        ) {
            return {
                decision:
                    GovernanceDecision.BLOCK,
                reason:
                    "Risk guard blocked."
            };
        }

        const needsReview =
            Boolean(
                policyResult
                    ?.warnings
                    ?.length
            ) ||
            Boolean(
                riskResult
                    ?.violations
                    ?.some(
                        item =>
                            item.severity === "warn"
                    )
            );

        if (needsReview) {
            return {
                decision:
                    GovernanceDecision.REVIEW,
                reason:
                    "Manual review recommended."
            };
        }

        return {
            decision:
                GovernanceDecision.APPROVE,
            reason:
                "All governance checks passed."
        };
    }

    get summary() {
        return {
            version: APPROVAL_WORKFLOW_VERSION
        };
    }
}
