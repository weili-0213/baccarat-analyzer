/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionIntegrationState.js
 * Purpose: Defines execution integration lifecycle states and actions.
 */
export const EXECUTION_INTEGRATION_STATE_VERSION = "9.8.0";
export const ExecutionIntegrationState = Object.freeze({
    IDLE:"idle", COLLECTING:"collecting", VALIDATING:"validating",
    QUEUING:"queuing", EXECUTING:"executing", MONITORING:"monitoring",
    COMPLETED:"completed", PAUSED:"paused", ERROR:"error", DESTROYED:"destroyed"
});
export const ExecutionIntegrationAction = Object.freeze({
    EXECUTE:"execute", SKIP:"skip", REJECT:"reject"
});
