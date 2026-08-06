/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/FeedbackIntegrationState.js
 * Purpose: Defines feedback integration lifecycle states and actions.
 */
export const FEEDBACK_INTEGRATION_STATE_VERSION = "9.9.0";

export const FeedbackIntegrationState = Object.freeze({
    IDLE: "idle",
    COLLECTING: "collecting",
    ANALYZING: "analyzing",
    DISTRIBUTING: "distributing",
    CALIBRATING: "calibrating",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const FeedbackIntegrationAction = Object.freeze({
    UPDATE: "update",
    OBSERVE: "observe",
    ROLLBACK: "rollback"
});
