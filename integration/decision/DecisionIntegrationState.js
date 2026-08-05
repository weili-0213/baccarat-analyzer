/**
 * Baccarat Analyzer V9.2
 * integration/decision/DecisionIntegrationState.js
 */
export const DECISION_INTEGRATION_STATE_VERSION = "9.2.0";
export const DecisionIntegrationState = Object.freeze({
    IDLE: "idle", COLLECTING: "collecting", ANALYZING: "analyzing",
    STRATEGIZING: "strategizing", DECIDING: "deciding", MAPPING: "mapping",
    COMPLETED: "completed", PAUSED: "paused", ERROR: "error", DESTROYED: "destroyed"
});
export const DecisionIntegrationAction = Object.freeze({ BET: "bet", WAIT: "wait", SKIP: "skip" });
