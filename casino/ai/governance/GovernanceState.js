/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/GovernanceState.js
 */

export const GOVERNANCE_STATE_VERSION = "7.7.0";

export const GovernanceState = Object.freeze({
    IDLE: "idle",
    REVIEWING: "reviewing",
    EVALUATING: "evaluating",
    APPROVING: "approving",
    BLOCKED: "blocked",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const GovernanceDecision = Object.freeze({
    APPROVE: "approve",
    REVIEW: "review",
    BLOCK: "block"
});

export const PolicyEffect = Object.freeze({
    ALLOW: "allow",
    WARN: "warn",
    DENY: "deny"
});
