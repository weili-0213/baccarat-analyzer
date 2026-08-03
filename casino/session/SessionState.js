/**
 * Baccarat Analyzer V6.4
 * casino/session/SessionState.js
 */

export const SESSION_STATE_VERSION = "6.4.0";

export const SessionState = Object.freeze({
    IDLE: "idle",
    STARTING: "starting",
    ACTIVE: "active",
    PAUSED: "paused",
    STOPPING: "stopping",
    COMPLETED: "completed",
    ERROR: "error",
    DESTROYED: "destroyed"
});
