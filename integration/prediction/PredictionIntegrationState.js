/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PredictionIntegrationState.js
 * Purpose: Defines prediction integration lifecycle states and actions.
 */

export const PREDICTION_INTEGRATION_STATE_VERSION = "9.4.0";

export const PredictionIntegrationState = Object.freeze({
    IDLE: "idle",
    COLLECTING: "collecting",
    EXTRACTING: "extracting",
    PREDICTING: "predicting",
    CALIBRATING: "calibrating",
    FUSING: "fusing",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const PredictionAction = Object.freeze({
    PREDICT: "predict",
    WAIT: "wait",
    ABSTAIN: "abstain"
});
