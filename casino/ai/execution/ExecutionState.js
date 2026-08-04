/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ExecutionState.js
 */

export const EXECUTION_STATE_VERSION = "7.5.0";

export const ExecutionState = Object.freeze({
    IDLE: "idle",
    VALIDATING: "validating",
    EXECUTING: "executing",
    WAITING: "waiting",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const ExecutionStatus = Object.freeze({
    PENDING: "pending",
    RUNNING: "running",
    SUCCESS: "success",
    SKIPPED: "skipped",
    BLOCKED: "blocked",
    FAILED: "failed",
    CANCELLED: "cancelled"
});
