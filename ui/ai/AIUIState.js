/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIState.js
 */
export const AI_UI_STATE_VERSION = "9.1.0";

export const AIUIState = Object.freeze({
    IDLE: "idle",
    CONNECTING: "connecting",
    READY: "ready",
    ANALYZING: "analyzing",
    RENDERING: "rendering",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const AIUIStatus = Object.freeze({
    ONLINE: "online",
    DEGRADED: "degraded",
    OFFLINE: "offline"
});
