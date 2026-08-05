/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/EthicsState.js
 */

export const ETHICS_STATE_VERSION = "8.6.0";

export const EthicsState = Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    EVALUATING: "evaluating",
    RESOLVING: "resolving",
    SCORING: "scoring",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const EthicsDecision = Object.freeze({
    APPROVE: "approve",
    REVIEW: "review",
    REJECT: "reject"
});
