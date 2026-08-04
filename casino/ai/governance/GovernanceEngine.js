/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/GovernanceEngine.js
 */

import {
    GovernanceState,
    GovernanceDecision
} from "./GovernanceState.js";

import GovernanceContext
    from "./GovernanceContext.js";

import PolicyRegistry
    from "./PolicyRegistry.js";

import PermissionManager
    from "./PermissionManager.js";

import RiskGuard
    from "./RiskGuard.js";

import PolicyEvaluator
    from "./PolicyEvaluator.js";

import ApprovalWorkflow
    from "./ApprovalWorkflow.js";

import AuditTrail
    from "./AuditTrail.js";


export const GOVERNANCE_ENGINE_VERSION = "7.7.0";

export const GovernanceEvent = Object.freeze({
    STATE_CHANGE: "governance-engine:state-change",
    STARTED: "governance-engine:started",
    PERMISSIONS_CHECKED: "governance-engine:permissions-checked",
    POLICIES_EVALUATED: "governance-engine:policies-evaluated",
    RISK_EVALUATED: "governance-engine:risk-evaluated",
    APPROVAL_DECIDED: "governance-engine:approval-decided",
    COMPLETED: "governance-engine:completed",
    PAUSED: "governance-engine:paused",
    RESUMED: "governance-engine:resumed",
    ERROR: "governance-engine:error",
    DESTROYED: "governance-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class GovernanceEngine {
    constructor({
        policies = null,
        permissions = null,
        riskGuard = null,
        policyEvaluator = null,
        approvalWorkflow = null,
        audit = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (!isFunction(clock)) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.policies =
            policies ??
            new PolicyRegistry();

        this.permissions =
            permissions ??
            new PermissionManager();

        this.riskGuard =
            riskGuard ??
            new RiskGuard();

        this.policyEvaluator =
            policyEvaluator ??
            new PolicyEvaluator();

        this.approvalWorkflow =
            approvalWorkflow ??
            new ApprovalWorkflow();

        this.audit =
            audit ??
            new AuditTrail();

        this.eventBus = eventBus;
        this.clock = clock;
        this.sequence = 0;

        this.idFactory =
            idFactory ??
            (
                ({
                    sequence,
                    timestamp
                }) =>
                    `governance-${timestamp}-${sequence}`
            );

        this.state =
            GovernanceState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.lastResult = null;
        this.lastError = null;
        this.reviewCount = 0;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "governance-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous = this.state;

        this.previousState = previous;
        this.state = state;

        this.emit(
            GovernanceEvent.STATE_CHANGE,
            {
                previous,
                current: state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "GovernanceEngine has been destroyed."
            );
        }
    }

    registerPolicy(config) {
        return this.policies.register(
            config
        );
    }

    grant(subject, permission) {
        this.permissions.grant(
            subject,
            permission
        );

        return this;
    }

    revoke(subject, permission) {
        return this.permissions.revoke(
            subject,
            permission
        );
    }

    async review({
        context = {},
        requiredPermission = null
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const governanceContext =
            context instanceof
                GovernanceContext
                ? context
                : new GovernanceContext(
                    context
                );

        this.sequence++;

        const timestamp =
            this.clock();

        const governanceId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp
            });

        this.setState(
            GovernanceState.REVIEWING
        );

        this.emit(
            GovernanceEvent.STARTED,
            {
                governanceId,
                context:
                    governanceContext
            }
        );

        try {
            const subject =
                governanceContext.subject ??
                governanceContext.agent
                    ?.agentId ??
                "anonymous";

            const permissionResult = {
                requiredPermission,
                passed:
                    !requiredPermission ||
                    governanceContext
                        .hasPermission(
                            requiredPermission
                        ) ||
                    this.permissions
                        .has(
                            subject,
                            requiredPermission
                        )
            };

            this.emit(
                GovernanceEvent.PERMISSIONS_CHECKED,
                permissionResult
            );

            this.setState(
                GovernanceState.EVALUATING
            );

            const policyResult =
                await this.policyEvaluator
                    .evaluate({
                        context:
                            governanceContext,
                        policies:
                            this.policies.all()
                    });

            this.emit(
                GovernanceEvent.POLICIES_EVALUATED,
                policyResult
            );

            const riskResult =
                await this.riskGuard
                    .evaluate(
                        governanceContext
                    );

            this.emit(
                GovernanceEvent.RISK_EVALUATED,
                riskResult
            );

            this.setState(
                GovernanceState.APPROVING
            );

            const approval =
                await this.approvalWorkflow
                    .decide({
                        policyResult,
                        riskResult,
                        permissionResult
                    });

            this.emit(
                GovernanceEvent.APPROVAL_DECIDED,
                approval
            );

            const result = {
                version:
                    GOVERNANCE_ENGINE_VERSION,

                governanceId,

                subject,

                action:
                    governanceContext.action,

                decision:
                    approval.decision,

                approved:
                    approval.decision ===
                    GovernanceDecision.APPROVE,

                requiresReview:
                    approval.decision ===
                    GovernanceDecision.REVIEW,

                blocked:
                    approval.decision ===
                    GovernanceDecision.BLOCK,

                reason:
                    approval.reason,

                permissionResult,
                policyResult,
                riskResult,

                createdAt:
                    timestamp
            };

            this.lastResult =
                result;

            this.reviewCount++;

            this.audit.add(
                result
            );

            this.setState(
                result.blocked
                    ? GovernanceState.BLOCKED
                    : GovernanceState.COMPLETED
            );

            this.emit(
                GovernanceEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "review"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            GovernanceState.PAUSED
        );

        this.emit(
            GovernanceEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            GovernanceState.IDLE
        );

        this.emit(
            GovernanceEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.audit.clear();

        this.lastResult = null;
        this.lastError = null;
        this.reviewCount = 0;
        this.paused = false;

        this.setState(
            GovernanceState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError = error;

        this.setState(
            GovernanceState.ERROR
        );

        this.emit(
            GovernanceEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.audit.clear();
        this.policies.clear();
        this.permissions.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            GovernanceState.DESTROYED
        );

        this.emit(
            GovernanceEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                GOVERNANCE_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            paused:
                this.paused,

            destroyed:
                this.destroyed,

            reviewCount:
                this.reviewCount,

            hasResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            policies:
                this.policies.summary,

            permissions:
                this.permissions.summary,

            riskGuard:
                this.riskGuard.summary,

            policyEvaluator:
                this.policyEvaluator.summary,

            approvalWorkflow:
                this.approvalWorkflow.summary,

            audit:
                this.audit.summary
        };
    }
}
