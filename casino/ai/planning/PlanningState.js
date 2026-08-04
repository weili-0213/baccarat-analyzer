/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/PlanningState.js
 */
export const PLANNING_STATE_VERSION = "7.4.0";
export const PlanningState = Object.freeze({
    IDLE: "idle",
    PREPARING: "preparing",
    PLANNING: "planning",
    EVALUATING: "evaluating",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});
export const PlanStatus = Object.freeze({
    DRAFT: "draft",
    READY: "ready",
    BLOCKED: "blocked",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
});
export const PlanActionType = Object.freeze({
    ANALYZE: "analyze",
    WAIT: "wait",
    BET: "bet",
    SKIP: "skip",
    REVIEW: "review",
    STOP: "stop"
});
