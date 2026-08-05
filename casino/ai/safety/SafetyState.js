/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/SafetyState.js
 */
export const SAFETY_STATE_VERSION = "8.7.0";
export const SafetyState = Object.freeze({
    IDLE: "idle",
    SCANNING: "scanning",
    EVALUATING: "evaluating",
    GUARDING: "guarding",
    RESPONDING: "responding",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});
export const SafetyLevel = Object.freeze({
    SAFE: "safe",
    CAUTION: "caution",
    UNSAFE: "unsafe"
});
