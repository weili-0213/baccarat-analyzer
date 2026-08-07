/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoRuntimeState.js
 * Purpose: Defines lifecycle states for AI Casino Runtime Integration.
 */
export const CASINO_RUNTIME_STATE_VERSION = "10.4.0";

export const CasinoRuntimeState = Object.freeze({
    IDLE: "idle",
    BOOTING: "booting",
    READY: "ready",
    SYNCING: "syncing",
    ROUND_OPEN: "round-open",
    ANALYZING: "analyzing",
    AWAITING_RESULT: "awaiting-result",
    SETTLING: "settling",
    UPDATING: "updating",
    PAUSED: "paused",
    STOPPED: "stopped",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const CasinoRuntimeAction = Object.freeze({
    BOOT: "boot",
    SYNC: "sync",
    START_ROUND: "start-round",
    ANALYZE: "analyze",
    COMPLETE_ROUND: "complete-round",
    ADD_BET: "add-bet",
    NEXT_ROUND: "next-round",
    RESET_SHOE: "reset-shoe",
    STOP: "stop"
});
