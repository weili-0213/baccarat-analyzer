/**
 * Baccarat Analyzer V6.6
 * casino/dashboard/DashboardState.js
 */

export const DASHBOARD_STATE_VERSION = "6.6.0";

export const DashboardState = Object.freeze({
    IDLE: "idle",
    MOUNTING: "mounting",
    READY: "ready",
    UPDATING: "updating",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});
