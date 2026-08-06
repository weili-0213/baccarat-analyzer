/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopState.js
 * Purpose: Defines the lifecycle states and actions of the closed-loop intelligence system.
 */
export const CLOSED_LOOP_STATE_VERSION = "10.0.0";

export const ClosedLoopState = Object.freeze({
    IDLE: "idle",
    OBSERVING: "observing",
    SIMULATING: "simulating",
    PREDICTING: "predicting",
    DECIDING: "deciding",
    STRATEGIZING: "strategizing",
    EXECUTING: "executing",
    FEEDBACK: "feedback",
    LEARNING: "learning",
    ADAPTING: "adapting",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const ClosedLoopAction = Object.freeze({
    CONTINUE: "continue",
    WAIT: "wait",
    HALT: "halt"
});
