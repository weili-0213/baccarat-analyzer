/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIState.js
 * Purpose: Defines Closed-Loop UI lifecycle states and actions.
 */
export const CLOSED_LOOP_UI_STATE_VERSION="10.1.0";
export const ClosedLoopUIState=Object.freeze({
 IDLE:"idle",CONNECTING:"connecting",READY:"ready",ANALYZING:"analyzing",
 AWAITING_RESULT:"awaiting-result",SUBMITTING_RESULT:"submitting-result",
 COMPLETED:"completed",PAUSED:"paused",ERROR:"error",DESTROYED:"destroyed"
});
export const ClosedLoopUIAction=Object.freeze({ANALYZE:"analyze",SUBMIT_RESULT:"submit-result",PAUSE:"pause",RESUME:"resume",RESET:"reset"});
