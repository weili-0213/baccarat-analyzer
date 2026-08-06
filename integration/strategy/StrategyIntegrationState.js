/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyIntegrationState.js
 * Purpose: Defines strategy integration lifecycle states and actions.
 */
export const STRATEGY_INTEGRATION_STATE_VERSION = "9.7.0";
export const StrategyIntegrationState = Object.freeze({
    IDLE:"idle", COLLECTING:"collecting", SCORING:"scoring",
    SELECTING:"selecting", RESOLVING:"resolving", BUILDING:"building",
    COMPLETED:"completed", PAUSED:"paused", ERROR:"error", DESTROYED:"destroyed"
});
export const StrategyIntegrationAction = Object.freeze({
    EXECUTE:"execute", WAIT:"wait", REJECT:"reject"
});
