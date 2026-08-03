/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyState.js
 */

export const STRATEGY_STATE_VERSION = "6.9.0";

export const StrategyState = Object.freeze({
    IDLE: "idle",
    EVALUATING: "evaluating",
    DECIDED: "decided",
    SKIPPED: "skipped",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const StrategyAction = Object.freeze({
    BET: "bet",
    SKIP: "skip"
});
