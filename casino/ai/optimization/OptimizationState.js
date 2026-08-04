/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/OptimizationState.js
 */

export const OPTIMIZATION_STATE_VERSION = "7.9.0";

export const OptimizationState = Object.freeze({
    IDLE: "idle",
    COLLECTING: "collecting",
    GENERATING: "generating",
    EVALUATING: "evaluating",
    APPLYING: "applying",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const OptimizationStatus = Object.freeze({
    DRAFT: "draft",
    CANDIDATE: "candidate",
    SELECTED: "selected",
    APPLIED: "applied",
    REJECTED: "rejected",
    ROLLED_BACK: "rolled-back"
});

export const OptimizationDirection = Object.freeze({
    MAXIMIZE: "maximize",
    MINIMIZE: "minimize",
    TARGET: "target"
});
