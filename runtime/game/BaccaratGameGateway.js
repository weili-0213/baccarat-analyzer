/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/BaccaratGameGateway.js
 * Purpose: Provides a stable adapter over engine/baccaratGame.js without coupling to one concrete implementation.
 */
export const BACCARAT_GAME_GATEWAY_VERSION = "10.3.0";

function readValue(target, key, fallback = null) {
    const value = target?.[key];

    if (typeof value === "function") {
        return value.call(target);
    }

    return value ?? fallback;
}

export default class BaccaratGameGateway {
    constructor({
        game
    } = {}) {
        if (!game || typeof game !== "object") {
            throw new TypeError(
                "BaccaratGameGateway requires a BaccaratGame-like object."
            );
        }

        this.game = game;
    }

    getShoe() {
        return (
            readValue(this.game, "shoe") ??
            readValue(this.game, "getShoe") ??
            null
        );
    }

    getRound() {
        return (
            readValue(this.game, "currentRound") ??
            readValue(this.game, "round") ??
            readValue(this.game, "getCurrentRound") ??
            null
        );
    }

    getLastResult() {
        return (
            readValue(this.game, "lastResult") ??
            readValue(this.game, "roundResult") ??
            readValue(this.game, "getLastResult") ??
            null
        );
    }

    getStatistics() {
        return (
            readValue(this.game, "statistics") ??
            readValue(this.game, "shoeStatistics") ??
            readValue(this.game, "getStatistics") ??
            null
        );
    }

    getState() {
        if (typeof this.game.toJSON === "function") {
            return this.game.toJSON();
        }

        return {
            shoe: this.getShoe(),
            round: this.getRound(),
            lastResult: this.getLastResult(),
            statistics: this.getStatistics()
        };
    }

    resetShoe(...args) {
        if (typeof this.game.resetShoe === "function") {
            return this.game.resetShoe(...args);
        }

        const shoe = this.getShoe();

        if (shoe && typeof shoe.reset === "function") {
            return shoe.reset(...args);
        }

        throw new Error(
            "BaccaratGameGateway cannot reset the current shoe."
        );
    }

    get summary() {
        return {
            version: BACCARAT_GAME_GATEWAY_VERSION,
            hasShoe: Boolean(this.getShoe()),
            hasRound: Boolean(this.getRound())
        };
    }
}
