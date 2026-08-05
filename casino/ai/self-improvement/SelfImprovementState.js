/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/SelfImprovementState.js
 */

export const SELF_IMPROVEMENT_STATE_VERSION = "8.1.0";

export const SelfImprovementState = Object.freeze({
    IDLE: "idle",
    ANALYZING: "analyzing",
    GENERATING: "generating",
    EXPERIMENTING: "experimenting",
    EVALUATING: "evaluating",
    APPLYING: "applying",
    ROLLING_BACK: "rolling-back",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const ImprovementStatus = Object.freeze({
    DRAFT: "draft",
    TESTING: "testing",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    APPLIED: "applied",
    ROLLED_BACK: "rolled-back"
});
