/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ReasoningState.js
 */
export const REASONING_STATE_VERSION = "7.3.0";
export const ReasoningState = Object.freeze({
    IDLE: "idle",
    BUILDING: "building",
    COLLECTING: "collecting",
    RESOLVING: "resolving",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});
export const ReasoningVerdict = Object.freeze({
    SUPPORT: "support",
    OPPOSE: "oppose",
    UNCERTAIN: "uncertain"
});
