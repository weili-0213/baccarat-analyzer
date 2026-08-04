/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/AssuranceState.js
 */

export const ASSURANCE_STATE_VERSION = "7.8.0";

export const AssuranceState = Object.freeze({
    IDLE: "idle",
    INSPECTING: "inspecting",
    VALIDATING: "validating",
    SCORING: "scoring",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const AssuranceLevel = Object.freeze({
    PASS: "pass",
    WARN: "warn",
    FAIL: "fail"
});

export const AssuranceCheckType = Object.freeze({
    INTEGRITY: "integrity",
    QUALITY: "quality",
    CONSISTENCY: "consistency",
    DRIFT: "drift",
    SAFETY: "safety"
});
