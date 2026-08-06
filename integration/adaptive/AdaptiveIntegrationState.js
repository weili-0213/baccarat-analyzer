/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveIntegrationState.js
 * Purpose: Defines adaptive integration lifecycle states and actions.
 */
export const ADAPTIVE_INTEGRATION_STATE_VERSION = "9.6.0";
export const AdaptiveIntegrationState = Object.freeze({
    IDLE:"idle", COLLECTING:"collecting", ANALYZING:"analyzing",
    TUNING:"tuning", APPLYING:"applying", VALIDATING:"validating",
    COMPLETED:"completed", PAUSED:"paused", ERROR:"error", DESTROYED:"destroyed"
});
export const AdaptiveAction = Object.freeze({
    APPLY:"apply", OBSERVE:"observe", ROLLBACK:"rollback"
});
