/**
 * Baccarat Analyzer V6.2
 * casino/round/RoundState.js
 */

export const ROUND_STATE_VERSION = "6.2.0";

export const RoundState = Object.freeze({
    IDLE: "idle",
    STARTING: "starting",
    DEALING: "dealing",
    RESOLVING: "resolving",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    ERROR: "error",
    DESTROYED: "destroyed"
});
