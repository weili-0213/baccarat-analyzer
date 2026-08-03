/**
 * Baccarat Analyzer V5.1
 * runtime/adapters/GameRuntimeAdapter.js
 *
 * Adapts the existing baccarat game layer to CasinoRuntime.
 */

export const GAME_RUNTIME_ADAPTER_VERSION = "5.1.0";

function requireFunction(target, name) {
    if (
        !target ||
        typeof target[name] !== "function"
    ) {
        throw new TypeError(
            `GameRuntimeAdapter requires game.${name}().`
        );
    }
}

export default class GameRuntimeAdapter {
    constructor({
        game,
        roundFactory = null
    } = {}) {
        if (!game) {
            throw new TypeError(
                "GameRuntimeAdapter requires game."
            );
        }

        this.game = game;
        this.roundFactory = roundFactory;
        this.currentRound = null;
        this.started = false;
        this.roundCount = 0;
    }

    async start(options = {}) {
        if (
            typeof this.game.start === "function"
        ) {
            await this.game.start(options);
        }
        else if (
            typeof this.game.reset === "function"
        ) {
            await this.game.reset(options);
        }

        this.started = true;
        this.currentRound = null;
        this.roundCount = 0;

        return this.summary;
    }

    async startRound(input = {}) {
        if (!this.started) {
            await this.start();
        }

        if (this.currentRound) {
            throw new Error(
                "A runtime round is already active."
            );
        }

        if (
            typeof this.game.startRound ===
                "function"
        ) {
            this.currentRound =
                await this.game.startRound(input);
        }
        else if (
            typeof this.roundFactory ===
                "function"
        ) {
            this.currentRound =
                await this.roundFactory({
                    game: this.game,
                    input,
                    index:
                        this.roundCount + 1
                });
        }
        else {
            this.currentRound = {
                index:
                    this.roundCount + 1,
                input
            };
        }

        return this.currentRound;
    }

    async completeRound(input = {}) {
        if (!this.currentRound) {
            throw new Error(
                "No active runtime round."
            );
        }

        let result;

        if (
            typeof this.game.completeRound ===
                "function"
        ) {
            result =
                await this.game.completeRound(
                    input
                );
        }
        else if (
            typeof this.currentRound.complete ===
                "function"
        ) {
            result =
                await this.currentRound.complete(
                    input
                );
        }
        else if (
            input.result
        ) {
            result = input.result;
        }
        else {
            result = {
                ...this.currentRound,
                ...input
            };
        }

        this.currentRound = null;
        this.roundCount++;

        return result;
    }

    async stop() {
        if (
            typeof this.game.stop === "function"
        ) {
            await this.game.stop();
        }

        this.currentRound = null;
        this.started = false;

        return this.summary;
    }

    async reset(options = {}) {
        if (
            typeof this.game.reset === "function"
        ) {
            await this.game.reset(options);
        }

        this.currentRound = null;
        this.roundCount = 0;
        this.started = false;

        return this.summary;
    }

    destroy() {
        this.game?.destroy?.();
        this.currentRound = null;
        this.started = false;

        return this;
    }

    get summary() {
        return {
            version:
                GAME_RUNTIME_ADAPTER_VERSION,
            started:
                this.started,
            roundCount:
                this.roundCount,
            hasCurrentRound:
                Boolean(this.currentRound)
        };
    }
}
