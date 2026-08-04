/**
 * Baccarat Analyzer V7.7
 * tests/aiGovernanceEngine.test.js
 */

import GovernanceEngine, {
    GOVERNANCE_ENGINE_VERSION,
    GovernanceEvent
} from "../casino/ai/governance/GovernanceEngine.js";

import {
    GOVERNANCE_STATE_VERSION,
    GovernanceState,
    GovernanceDecision,
    PolicyEffect
} from "../casino/ai/governance/GovernanceState.js";

import GovernanceContext, {
    GOVERNANCE_CONTEXT_VERSION
} from "../casino/ai/governance/GovernanceContext.js";

import PolicyRegistry, {
    POLICY_REGISTRY_VERSION
} from "../casino/ai/governance/PolicyRegistry.js";

import PermissionManager, {
    PERMISSION_MANAGER_VERSION
} from "../casino/ai/governance/PermissionManager.js";

import RiskGuard, {
    RISK_GUARD_VERSION
} from "../casino/ai/governance/RiskGuard.js";

import PolicyEvaluator, {
    POLICY_EVALUATOR_VERSION
} from "../casino/ai/governance/PolicyEvaluator.js";

import ApprovalWorkflow, {
    APPROVAL_WORKFLOW_VERSION
} from "../casino/ai/governance/ApprovalWorkflow.js";

import AuditTrail, {
    AUDIT_TRAIL_VERSION
} from "../casino/ai/governance/AuditTrail.js";

import GovernanceRuntimeAdapter, {
    GOVERNANCE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/GovernanceRuntimeAdapter.js";

import {
    GOVERNANCE_ENGINE_FACTORY_VERSION
} from "../casino/ai/governance/createGovernanceEngine.js";


function assert(
    condition,
    message
) {
    if (!condition) {
        throw new Error(
            message
        );
    }
}


export default async function aiGovernanceEngineTest() {
    const messages = [];

    assert(
        [
            GOVERNANCE_ENGINE_VERSION,
            GOVERNANCE_STATE_VERSION,
            GOVERNANCE_CONTEXT_VERSION,
            POLICY_REGISTRY_VERSION,
            PERMISSION_MANAGER_VERSION,
            RISK_GUARD_VERSION,
            POLICY_EVALUATOR_VERSION,
            APPROVAL_WORKFLOW_VERSION,
            AUDIT_TRAIL_VERSION,
            GOVERNANCE_RUNTIME_ADAPTER_VERSION,
            GOVERNANCE_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "7.7.0"
        ),
        "V7.7 AI Governance Engine 版本錯誤"
    );

    messages.push(
        "✓ V7.7 AI Governance Engine 版本正確"
    );

    const context =
        new GovernanceContext({
            subject:
                "execution-agent",

            action:
                "execute-bet",

            decision: {
                confidence:
                    0.8,

                risk:
                    "low",

                amount:
                    25
            },

            bankroll: {
                balance:
                    1000
            },

            session: {
                profit:
                    0
            },

            permissions: [
                "bet:execute"
            ]
        });

    assert(
        context.hasPermission(
            "bet:execute"
        ) === true &&
        context.decision.risk ===
            "low",
        "Governance Context 錯誤"
    );

    messages.push(
        "✓ Governance Context 正確"
    );

    const policies =
        new PolicyRegistry();

    policies.register({
        policyId:
            "deny-high-risk",

        name:
            "Deny High Risk",

        priority:
            100,

        effect:
            PolicyEffect.DENY,

        evaluate:
            current =>
                current.decision
                    ?.risk ===
                "high"
    });

    policies.register({
        policyId:
            "warn-low-confidence",

        name:
            "Warn Low Confidence",

        priority:
            50,

        effect:
            PolicyEffect.WARN,

        evaluate:
            current =>
                (
                    current.decision
                        ?.confidence ??
                    0
                ) <
                0.6
    });

    assert(
        policies.summary.count ===
            2 &&
        policies.all()[0]
            .policyId ===
            "deny-high-risk",
        "Policy Registry 錯誤"
    );

    messages.push(
        "✓ Policy Registry 正確"
    );

    const permissions =
        new PermissionManager();

    permissions.grant(
        "execution-agent",
        "bet:execute"
    );

    assert(
        permissions.has(
            "execution-agent",
            "bet:execute"
        ) === true,
        "Permission Manager 錯誤"
    );

    messages.push(
        "✓ Permission Manager 正確"
    );

    const riskGuard =
        new RiskGuard({
            maxBetRatio:
                0.05,

            minimumConfidence:
                0.5,

            blockHighRisk:
                true
        });

    const riskResult =
        riskGuard.evaluate(
            context
        );

    assert(
        riskResult.passed ===
            true &&
        riskResult.violations
            .length === 0,
        "Risk Guard 錯誤"
    );

    messages.push(
        "✓ Risk Guard 正確"
    );

    const policyEvaluator =
        new PolicyEvaluator();

    const policyResult =
        policyEvaluator.evaluate({
            context,
            policies:
                policies.all()
        });

    assert(
        policyResult.passed ===
            true &&
        policyResult.denied
            .length === 0,
        "Policy Evaluator 錯誤"
    );

    messages.push(
        "✓ Policy Evaluator 正確"
    );

    const approvalWorkflow =
        new ApprovalWorkflow();

    const approval =
        approvalWorkflow.decide({
            policyResult,
            riskResult,

            permissionResult: {
                passed:
                    true
            }
        });

    assert(
        approval.decision ===
            GovernanceDecision.APPROVE,
        "Approval Workflow 錯誤"
    );

    messages.push(
        "✓ Approval Workflow 正確"
    );

    let now = 100;

    const events = [];

    const engine =
        new GovernanceEngine({
            policies,
            permissions,
            riskGuard,
            policyEvaluator,
            approvalWorkflow,

            audit:
                new AuditTrail({
                    limit:
                        20
                }),

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            clock:
                () => now++
        });

    assert(
        engine.state ===
            GovernanceState.IDLE,
        "Governance Engine initial state 錯誤"
    );

    const approved =
        await engine.review({
            context,

            requiredPermission:
                "bet:execute"
        });

    assert(
        approved.approved ===
            true &&
        approved.decision ===
            GovernanceDecision.APPROVE &&
        engine.state ===
            GovernanceState.COMPLETED &&
        engine.summary.reviewCount ===
            1 &&
        engine.summary.audit
            .count === 1,
        "Approved Governance Review 錯誤"
    );

    messages.push(
        "✓ Approved Governance Review 正確"
    );

    const blocked =
        await engine.review({
            context: {
                subject:
                    "execution-agent",

                action:
                    "execute-bet",

                decision: {
                    confidence:
                        0.9,

                    risk:
                        "high",

                    amount:
                        100
                },

                bankroll: {
                    balance:
                        1000
                },

                permissions: [
                    "bet:execute"
                ]
            },

            requiredPermission:
                "bet:execute"
        });

    assert(
        blocked.blocked ===
            true &&
        blocked.decision ===
            GovernanceDecision.BLOCK &&
        engine.state ===
            GovernanceState.BLOCKED,
        "Blocked Governance Review 錯誤"
    );

    messages.push(
        "✓ Blocked Governance Review 正確"
    );

    const deniedPermission =
        await engine.review({
            context: {
                subject:
                    "guest-agent",

                action:
                    "execute-bet",

                decision: {
                    confidence:
                        0.8,

                    risk:
                        "low",

                    amount:
                        10
                },

                bankroll: {
                    balance:
                        1000
                }
            },

            requiredPermission:
                "bet:execute"
        });

    assert(
        deniedPermission.blocked ===
            true &&
        deniedPermission.permissionResult
            .passed === false,
        "Permission Denied 錯誤"
    );

    messages.push(
        "✓ Permission Denied 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.review({
            context
        });

    assert(
        engine.state ===
            GovernanceState.PAUSED &&
        pausedResult ===
            null,
        "Governance Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            GovernanceState.IDLE &&
        engine.summary.paused ===
            false,
        "Governance Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new GovernanceRuntimeAdapter({
            governance:
                engine
        });

    const adapterResult =
        await adapter.review({
            context,

            requiredPermission:
                "bet:execute"
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.governance
            .reviewCount === 4,
        "Governance Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            GovernanceEvent.STARTED,
            GovernanceEvent.PERMISSIONS_CHECKED,
            GovernanceEvent.POLICIES_EVALUATED,
            GovernanceEvent.RISK_EVALUATED,
            GovernanceEvent.APPROVAL_DECIDED,
            GovernanceEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Governance Events 錯誤"
    );

    messages.push(
        "✓ Governance Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            GovernanceState.IDLE &&
        engine.summary.reviewCount ===
            0 &&
        engine.summary.audit
            .count === 0,
        "Governance Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            GovernanceState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.policies
            .count === 0 &&
        engine.summary.permissions
            .grantCount === 0,
        "Governance Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Governance Engine V7.7 測試完成

Governance State：通過
Governance Context：通過
Policy Registry：通過
Permission Manager：通過
Risk Guard：通過
Policy Evaluator：通過
Approval Workflow：通過
Audit Trail：通過
Approved Review：通過
Blocked Review：通過
Permission Denied：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
