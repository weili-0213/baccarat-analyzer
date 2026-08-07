/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/GameRuntimeState.js
 * Purpose: Defines AI Game Runtime Integration lifecycle states.
 */
export const GAME_RUNTIME_STATE_VERSION = "10.3.0";

export const GameRuntimeState = Object.freeze({
    IDLE: "idle",
    CONNECTING: "connecting",
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

export const GameRuntimeAction = Object.freeze({
    CONNECT: "connect",
    SYNC: "sync",
    BEGIN_ROUND: "begin-round",
    ANALYZE: "analyze",
    SETTLE: "settle",
    NEXT_ROUND: "next-round",
    RESET_SHOE: "reset-shoe"
});
