/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/AutonomousState.js
 */
export const AUTONOMOUS_STATE_VERSION = "8.0.0";
export const AutonomousState = Object.freeze({
    IDLE: "idle",
    STARTING: "starting",
    RUNNING: "running",
    PLANNING: "planning",
    EXECUTING: "executing",
    LEARNING: "learning",
    OPTIMIZING: "optimizing",
    PAUSED: "paused",
    STOPPED: "stopped",
    COMPLETED: "completed",
    ERROR: "error",
    DESTROYED: "destroyed"
});
export const AutonomousTaskStatus = Object.freeze({
    PENDING: "pending",
    RUNNING: "running",
    COMPLETED: "completed",
    SKIPPED: "skipped",
    FAILED: "failed",
    CANCELLED: "cancelled"
});
