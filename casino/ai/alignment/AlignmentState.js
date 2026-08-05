/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/AlignmentState.js
 */

export const ALIGNMENT_STATE_VERSION = "8.5.0";

export const AlignmentState = Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    EVALUATING: "evaluating",
    RESOLVING: "resolving",
    VALIDATING: "validating",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const AlignmentLevel = Object.freeze({
    ALIGNED: "aligned",
    PARTIAL: "partial",
    MISALIGNED: "misaligned"
});
