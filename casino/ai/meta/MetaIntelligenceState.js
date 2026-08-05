/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/MetaIntelligenceState.js
 */

export const META_INTELLIGENCE_STATE_VERSION = "8.8.0";

export const MetaIntelligenceState = Object.freeze({
    IDLE: "idle",
    OBSERVING: "observing",
    ASSESSING: "assessing",
    COORDINATING: "coordinating",
    SYNTHESIZING: "synthesizing",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const MetaDecision = Object.freeze({
    PROCEED: "proceed",
    REVIEW: "review",
    HALT: "halt"
});
