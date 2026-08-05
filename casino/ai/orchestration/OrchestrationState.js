/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/OrchestrationState.js
 */
export const ORCHESTRATION_STATE_VERSION = "8.9.0";

export const OrchestrationState = Object.freeze({
    IDLE: "idle",
    PLANNING: "planning",
    RESOLVING: "resolving",
    ALLOCATING: "allocating",
    EXECUTING: "executing",
    SYNCHRONIZING: "synchronizing",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const OrchestrationDecision = Object.freeze({
    RUN: "run",
    DEFER: "defer",
    BLOCK: "block"
});
