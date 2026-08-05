/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/ConsciousnessState.js
 *
 * Note:
 * This module models software self-observation and metacognitive state.
 * It does not claim biological or subjective consciousness.
 */

export const CONSCIOUSNESS_STATE_VERSION = "8.4.0";

export const ConsciousnessState = Object.freeze({
    IDLE: "idle",
    OBSERVING: "observing",
    ATTENDING: "attending",
    REFLECTING: "reflecting",
    INTEGRATING: "integrating",
    COMPLETED: "completed",
    PAUSED: "paused",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const AwarenessLevel = Object.freeze({
    LOW: "low",
    MODERATE: "moderate",
    HIGH: "high"
});
