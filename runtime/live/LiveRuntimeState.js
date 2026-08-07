/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeState.js
 * Purpose: Defines lifecycle states and actions for AI Live Runtime Integration.
 */
export const LIVE_RUNTIME_STATE_VERSION="10.2.0";
export const LiveRuntimeState=Object.freeze({
IDLE:"idle",STARTING:"starting",READY:"ready",ROUND_OPEN:"round-open",
OBSERVING:"observing",ANALYZING:"analyzing",AWAITING_RESULT:"awaiting-result",
SETTLING:"settling",COMPLETED:"completed",PAUSED:"paused",STOPPED:"stopped",
ERROR:"error",DESTROYED:"destroyed"});
export const LiveRuntimeAction=Object.freeze({
START:"start",BEGIN_ROUND:"begin-round",ANALYZE:"analyze",
SUBMIT_RESULT:"submit-result",NEXT_ROUND:"next-round",
RESET_SHOE:"reset-shoe",STOP:"stop"});
