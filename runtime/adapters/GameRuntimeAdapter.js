/**
 * Baccarat Analyzer V10.3
 * Path: runtime/adapters/GameRuntimeAdapter.js
 * Purpose:
 *   Dual-mode Game Runtime Adapter.
 *   - Legacy mode: keeps V5.1 CasinoRuntime compatibility with { game }.
 *   - Integration mode: exposes V10.3 AIGameRuntimeIntegration with { integration }.
 */

export const GAME_RUNTIME_ADAPTER_VERSION = "10.3.1";
export const GAME_RUNTIME_ADAPTER_LEGACY_COMPAT_VERSION = "5.1.0";

export const GameRuntimeAdapterMode = Object.freeze({
    LEGACY_GAME: "legacy-game",
    AI_INTEGRATION: "ai-integration"
});

export default class GameRuntimeAdapter {
    constructor({
        game = null,
        integration = null,
        roundFactory = null
    } = {}) {
        if (!game && !integration) {
            throw new TypeError(
                "GameRuntimeAdapter requires game or integration."
            );
        }

        if (
            integration &&
            typeof integration.connect !== "function"
        ) {
            throw new TypeError(
                "GameRuntimeAdapter integration requires connect()."
            );
        }

        this.mode =
            integration
                ? GameRuntimeAdapterMode.AI_INTEGRATION
                : GameRuntimeAdapterMode.LEGACY_GAME;

        this.integration =
            integration;

        this.game =
            game;

        this.roundFactory =
            roundFactory;

        this.currentRound =
            null;

        this.started =
            false;

        this.roundCount =
            0;
    }

    /*
     * ============================================================
     * V5.1 CasinoRuntime compatibility API
     * ============================================================
     */

    async start(options = {}) {
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            const result =
                await this.integration.connect(
                    options
                );

            this.started =
                true;

            return result;
        }

        if (
            typeof this.game.start ===
            "function"
        ) {
            await this.game.start(
                options
            );
        }
        else if (
            typeof this.game.reset ===
            "function"
        ) {
            await this.game.reset(
                options
            );
        }

        this.started =
            true;

        this.currentRound =
            null;

        this.roundCount =
            0;

        return this.summary;
    }

    async startRound(input = {}) {
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            if (!this.started) {
                await this.start();
            }

            const result =
                await this.integration.beginRound(
                    input
                );

            this.currentRound =
                result;

            return result;
        }

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
                await this.game.startRound(
                    input
                );
        }
        else if (
            typeof this.roundFactory ===
            "function"
        ) {
            this.currentRound =
                await this.roundFactory({
                    game:
                        this.game,
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
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            const result =
                await this.integration
                    .settleCurrentRound(
                        input
                    );

            this.currentRound =
                null;

            this.roundCount++;

            return result;
        }

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
            typeof this.currentRound
                ?.complete ===
            "function"
        ) {
            result =
                await this.currentRound
                    .complete(
                        input
                    );
        }
        else if (
            input.result
        ) {
            result =
                input.result;
        }
        else {
            result = {
                ...this.currentRound,
                ...input
            };
        }

        this.currentRound =
            null;

        this.roundCount++;

        return result;
    }

    /*
     * ============================================================
     * V10.3 Game Runtime API
     * ============================================================
     */

    connect(input = {}) {
        this.assertIntegrationMode(
            "connect"
        );

        return this.integration.connect(
            input
        );
    }

    sync(input = {}) {
        this.assertIntegrationMode(
            "sync"
        );

        return this.integration.sync(
            input
        );
    }

    beginRound(input = {}) {
        this.assertIntegrationMode(
            "beginRound"
        );

        return this.integration.beginRound(
            input
        );
    }

    analyzeCurrentRound(input = {}) {
        this.assertIntegrationMode(
            "analyzeCurrentRound"
        );

        return this.integration
            .analyzeCurrentRound(
                input
            );
    }

    settleCurrentRound(input = {}) {
        this.assertIntegrationMode(
            "settleCurrentRound"
        );

        return this.integration
            .settleCurrentRound(
                input
            );
    }

    nextRound(input = {}) {
        this.assertIntegrationMode(
            "nextRound"
        );

        return this.integration.nextRound(
            input
        );
    }

    completeRoundAndPrepareNext(
        input = {}
    ) {
        this.assertIntegrationMode(
            "completeRoundAndPrepareNext"
        );

        return this.integration
            .completeRoundAndPrepareNext(
                input
            );
    }

    resetShoe(input = {}) {
        this.assertIntegrationMode(
            "resetShoe"
        );

        return this.integration.resetShoe(
            input
        );
    }

    /*
     * ============================================================
     * Shared lifecycle
     * ============================================================
     */

    pause() {
        return this.integration?.pause?.()
            ?? this;
    }

    resume() {
        return this.integration?.resume?.()
            ?? this;
    }

    async stop() {
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            const result =
                await this.integration.stop();

            this.currentRound =
                null;

            this.started =
                false;

            return result;
        }

        if (
            typeof this.game.stop ===
            "function"
        ) {
            await this.game.stop();
        }

        this.currentRound =
            null;

        this.started =
            false;

        return this.summary;
    }

    async reset(options = {}) {
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            const result =
                await this.integration.reset();

            this.currentRound =
                null;

            this.roundCount =
                0;

            this.started =
                false;

            return result;
        }

        if (
            typeof this.game.reset ===
            "function"
        ) {
            await this.game.reset(
                options
            );
        }

        this.currentRound =
            null;

        this.roundCount =
            0;

        this.started =
            false;

        return this.summary;
    }

    destroy() {
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            this.integration?.destroy?.();
        }
        else {
            this.game?.destroy?.();
        }

        this.currentRound =
            null;

        this.started =
            false;

        return this;
    }

    assertIntegrationMode(method) {
        if (
            this.mode !==
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            throw new Error(
                `${method}() requires AI integration mode.`
            );
        }
    }

    get summary() {
        if (
            this.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION
        ) {
            return {
                version:
                    GAME_RUNTIME_ADAPTER_VERSION,
                legacyCompatibility:
                    GAME_RUNTIME_ADAPTER_LEGACY_COMPAT_VERSION,
                mode:
                    this.mode,
                started:
                    this.started,
                roundCount:
                    this.roundCount,
                hasCurrentRound:
                    Boolean(
                        this.currentRound
                    ),
                integration:
                    this.integration.summary ??
                    null
            };
        }

        return {
            version:
                GAME_RUNTIME_ADAPTER_VERSION,
            legacyCompatibility:
                GAME_RUNTIME_ADAPTER_LEGACY_COMPAT_VERSION,
            mode:
                this.mode,
            started:
                this.started,
            roundCount:
                this.roundCount,
            hasCurrentRound:
                Boolean(
                    this.currentRound
                )
        };
    }
}
