/**
 * Baccarat Analyzer V6.5
 * casino/analyzer/AnalyzerState.js
 */

export const ANALYZER_STATE_VERSION = "6.5.0";

export const AnalyzerState = Object.freeze({
    IDLE: "idle",
    ANALYZING: "analyzing",
    COMPLETED: "completed",
    ERROR: "error",
    DESTROYED: "destroyed"
});
