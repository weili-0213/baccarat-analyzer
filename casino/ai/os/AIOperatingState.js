/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/AIOperatingState.js
 */
export const AI_OPERATING_STATE_VERSION = "9.0.0";

export const AIOperatingState = Object.freeze({
    IDLE: "idle",
    BOOTING: "booting",
    READY: "ready",
    PROCESSING: "processing",
    SYNCHRONIZING: "synchronizing",
    PAUSED: "paused",
    ERROR: "error",
    SHUTDOWN: "shutdown",
    DESTROYED: "destroyed"
});

export const AIOperatingDecision = Object.freeze({
    PROCEED: "proceed",
    REVIEW: "review",
    HALT: "halt"
});
