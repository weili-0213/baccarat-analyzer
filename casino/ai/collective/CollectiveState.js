/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/CollectiveState.js
 */

export const COLLECTIVE_STATE_VERSION = "8.3.0";

export const CollectiveState = Object.freeze({
    IDLE: "idle",
    DISCOVERING: "discovering",
    GATHERING: "gathering",
    DELIBERATING: "deliberating",
    SYNTHESIZING: "synthesizing",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const CollectiveRole = Object.freeze({
    OBSERVER: "observer",
    ANALYST: "analyst",
    CRITIC: "critic",
    STRATEGIST: "strategist",
    COORDINATOR: "coordinator"
});
