/**
 * Baccarat Analyzer V6.8
 * casino/bet/BetState.js
 */

export const BET_STATE_VERSION = "6.8.0";

export const BetState = Object.freeze({
    IDLE: "idle",
    OPEN: "open",
    SETTLING: "settling",
    SETTLED: "settled",
    CANCELLED: "cancelled",
    VOIDED: "voided",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const BetStatus = Object.freeze({
    PENDING: "pending",
    WON: "won",
    LOST: "lost",
    PUSH: "push",
    CANCELLED: "cancelled",
    VOIDED: "voided"
});

export const BetType = Object.freeze({
    PLAYER: "Player",
    BANKER: "Banker",
    TIE: "Tie",
    PLAYER_PAIR: "Player Pair",
    BANKER_PAIR: "Banker Pair",
    EITHER_PAIR: "Either Pair",
    PERFECT_PAIR: "Perfect Pair",
    BIG: "Big",
    SMALL: "Small"
});
