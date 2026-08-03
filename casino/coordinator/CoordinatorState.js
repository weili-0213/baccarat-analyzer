/**
 * Baccarat Analyzer V6.7
 * casino/coordinator/CoordinatorState.js
 */

export const COORDINATOR_STATE_VERSION = "6.7.0";

export const CoordinatorState = Object.freeze({
    IDLE: "idle",
    INITIALIZING: "initializing",
    READY: "ready",
    RUNNING: "running",
    PAUSED: "paused",
    STOPPED: "stopped",
    ERROR: "error",
    DESTROYED: "destroyed"
});
