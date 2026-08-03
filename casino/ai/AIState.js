/**
 * Baccarat Analyzer V7.0
 * casino/ai/AIState.js
 */

export const AI_STATE_VERSION = "7.0.0";

export const AIState = Object.freeze({
    IDLE: "idle",
    EVALUATING: "evaluating",
    COMPLETED: "completed",
    SKIPPED: "skipped",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const AIAction = Object.freeze({
    RECOMMEND: "recommend",
    SKIP: "skip",
    WAIT: "wait"
});
