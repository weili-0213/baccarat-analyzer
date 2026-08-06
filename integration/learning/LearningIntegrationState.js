/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/LearningIntegrationState.js
 * Purpose: Defines learning integration lifecycle states and actions.
 */
export const LEARNING_INTEGRATION_STATE_VERSION = "9.5.0";
export const LearningIntegrationState = Object.freeze({
    IDLE:"idle", COLLECTING:"collecting", EVALUATING:"evaluating",
    REWARDING:"rewarding", LEARNING:"learning", UPDATING:"updating",
    COMPLETED:"completed", PAUSED:"paused", ERROR:"error", DESTROYED:"destroyed"
});
export const LearningIntegrationAction = Object.freeze({
    UPDATE:"update", OBSERVE:"observe", FORGET:"forget"
});
