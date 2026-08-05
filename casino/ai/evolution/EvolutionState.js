/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/EvolutionState.js
 */

export const EVOLUTION_STATE_VERSION = "8.2.0";

export const EvolutionState = Object.freeze({
    IDLE: "idle",
    INITIALIZING: "initializing",
    EVALUATING: "evaluating",
    SELECTING: "selecting",
    CROSSING: "crossing",
    MUTATING: "mutating",
    ADVANCING: "advancing",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const GenomeStatus = Object.freeze({
    NEW: "new",
    EVALUATED: "evaluated",
    SELECTED: "selected",
    REJECTED: "rejected",
    ELITE: "elite"
});
