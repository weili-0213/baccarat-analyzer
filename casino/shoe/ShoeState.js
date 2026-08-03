/**
 * Baccarat Analyzer V6.3
 * casino/shoe/ShoeState.js
 */

export const SHOE_STATE_VERSION = "6.3.0";

export const ShoeState = Object.freeze({
    IDLE: "idle",
    CREATING: "creating",
    SHUFFLING: "shuffling",
    BURNING: "burning",
    READY: "ready",
    IN_PLAY: "in-play",
    CUT_REACHED: "cut-reached",
    COMPLETED: "completed",
    ERROR: "error",
    DESTROYED: "destroyed"
});
