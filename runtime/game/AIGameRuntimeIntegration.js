/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/AIGameRuntimeIntegration.js
 * Purpose: Connects the real Baccarat game engine to V10.2 AI Live Runtime.
 */
import {
    GameRuntimeState
} from "./GameRuntimeState.js";

import GameRuntimeContext
    from "./GameRuntimeContext.js";

import BaccaratGameGateway
    from "./BaccaratGameGateway.js";

import ShoeStateCollector
    from "./ShoeStateCollector.js";

import RoundStateCollector
    from "./RoundStateCollector.js";

import GameAnalysisInputBuilder
    from "./GameAnalysisInputBuilder.js";

import GameSettlementMapper
    from "./GameSettlementMapper.js";

import GameRuntimeHistory
    from "./GameRuntimeHistory.js";

export const AI_GAME_RUNTIME_INTEGRATION_VERSION = "10.3.0";

export const GameRuntimeEvent = Object.freeze({
    STATE_CHANGE:
        "ai-game-runtime:state-change",
    CONNECTED:
        "ai-game-runtime:connected",
    SYNCED:
        "ai-game-runtime:synced",
    ROUND_BEGAN:
        "ai-game-runtime:round-began",
    ANALYSIS_STARTED:
        "ai-game-runtime:analysis-started",
    ANALYSIS_COMPLETED:
        "ai-game-runtime:analysis-completed",
    RESULT_SUBMITTED:
        "ai-game-runtime:result-submitted",
    SETTLEMENT_COMPLETED:
        "ai-game-runtime:settlement-completed",
    NEXT_ROUND:
        "ai-game-runtime:next-round",
    SHOE_RESET:
        "ai-game-runtime:shoe-reset",
    PAUSED:
        "ai-game-runtime:paused",
    RESUMED:
        "ai-game-runtime:resumed",
    STOPPED:
        "ai-game-runtime:stopped",
    ERROR:
        "ai-game-runtime:error",
    DESTROYED:
        "ai-game-runtime:destroyed"
});

export default class AIGameRuntimeIntegration {
    constructor({
        game,
        liveRuntime,
        gameGateway = null,
        shoeCollector = null,
        roundCollector = null,
        inputBuilder = null,
        settlementMapper = null,
        roadmapProvider = null,
        bankrollProvider = null,
        settingsProvider = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (
            !liveRuntime ||
            typeof liveRuntime.start !== "function" ||
            typeof liveRuntime.analyze !== "function" ||
            typeof liveRuntime.submitResult !== "function"
        ) {
            throw new TypeError(
                "AIGameRuntimeIntegration requires V10.2 LiveRuntime."
            );
        }

        if (
            roadmapProvider !== null &&
            typeof roadmapProvider !== "function"
        ) {
            throw new TypeError(
                "roadmapProvider must be a function."
            );
        }

        if (
            bankrollProvider !== null &&
            typeof bankrollProvider !== "function"
        ) {
            throw new TypeError(
                "bankrollProvider must be a function."
            );
        }

        if (
            settingsProvider !== null &&
            typeof settingsProvider !== "function"
        ) {
            throw new TypeError(
                "settingsProvider must be a function."
            );
        }

        if (
            eventBus !== null &&
            typeof eventBus.emit !== "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        this.liveRuntime =
            liveRuntime;

        this.gameGateway =
            gameGateway ??
            new BaccaratGameGateway({
                game
            });

        this.shoeCollector =
            shoeCollector ??
            new ShoeStateCollector();

        this.roundCollector =
            roundCollector ??
            new RoundStateCollector();

        this.inputBuilder =
            inputBuilder ??
            new GameAnalysisInputBuilder();

        this.settlementMapper =
            settlementMapper ??
            new GameSettlementMapper();

        this.roadmapProvider =
            roadmapProvider ??
            (() => null);

        this.bankrollProvider =
            bankrollProvider ??
            (() => null);

        this.settingsProvider =
            settingsProvider ??
            (() => null);

        this.history =
            history ??
            new GameRuntimeHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.context =
            new GameRuntimeContext();

        this.state =
            GameRuntimeState.IDLE;

        this.previousState =
            null;

        this.connected =
            false;

        this.paused =
            false;

        this.destroyed =
            false;

        this.lastError =
            null;
    }

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(
                type,
                payload,
                {
                    source:
                        "ai-game-runtime"
                }
            ) ??
            null
        );
    }

    setState(state) {
        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            GameRuntimeEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "AIGameRuntimeIntegration has been destroyed."
            );
        }
    }

    connect({
        shoeId = null,
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        this.setState(
            GameRuntimeState.CONNECTING
        );

        const shoe =
            this.gameGateway.getShoe();

        if (!shoe) {
            throw new Error(
                "Baccarat game has no active shoe."
            );
        }

        const resolvedShoeId =
            shoeId ??
            shoe.shoeId ??
            `game-shoe-${this.clock()}`;

        this.liveRuntime.start({
            shoeId:
                resolvedShoeId,
            context
        });

        this.context =
            new GameRuntimeContext({
                ...context,
                shoeId:
                    resolvedShoeId
            });

        this.connected =
            true;

        this.setState(
            GameRuntimeState.READY
        );

        this.sync();

        this.emit(
            GameRuntimeEvent.CONNECTED,
            this.summary
        );

        return this.summary;
    }

    sync({
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (!this.connected) {
            throw new Error(
                "Game Runtime is not connected."
            );
        }

        this.setState(
            GameRuntimeState.SYNCING
        );

        const shoe =
            this.gameGateway.getShoe();

        const round =
            this.gameGateway.getRound();

        const statistics =
            this.gameGateway.getStatistics();

        const shoeState =
            this.shoeCollector.collect(
                shoe
            );

        const roundState =
            this.roundCollector.collect(
                round
            );

        const roadmap =
            this.roadmapProvider({
                game:
                    this.gameGateway.game,
                shoeState,
                roundState
            });

        const bankroll =
            this.bankrollProvider({
                game:
                    this.gameGateway.game,
                shoeState,
                roundState
            });

        const settings =
            this.settingsProvider({
                game:
                    this.gameGateway.game,
                shoeState,
                roundState
            });

        this.context.merge({
            gameState:
                this.gameGateway.getState(),
            shoeState,
            roundState,
            statistics,
            roadmap,
            bankroll,
            settings,
            metadata: {
                ...this.context.metadata,
                ...metadata
            }
        });

        this.setState(
            GameRuntimeState.READY
        );

        const record = {
            type:
                "sync",
            context:
                this.context.snapshot(),
            createdAt:
                this.clock()
        };

        this.history.add(
            record
        );

        this.emit(
            GameRuntimeEvent.SYNCED,
            record
        );

        return this.context.snapshot();
    }

    beginRound({
        roundId = null,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (!this.connected) {
            this.connect();
        }

        if (this.paused) {
            return null;
        }

        const nextNumber =
            (this.context.roundNumber ?? 0) + 1;

        const resolvedRoundId =
            roundId ??
            this.gameGateway.getRound()?.roundId ??
            this.gameGateway.getRound()?.id ??
            `game-round-${this.clock()}-${nextNumber}`;

        const session =
            this.liveRuntime.beginRound({
                roundId:
                    resolvedRoundId,
                context: {
                    metadata: {
                        source:
                            "game-runtime",
                        ...metadata
                    }
                }
            });

        this.context.merge({
            roundId:
                resolvedRoundId,
            roundNumber:
                session?.roundNumber ??
                nextNumber,
            roundResult:
                null,
            analysisResult:
                null,
            settlementResult:
                null,
            metadata: {
                ...this.context.metadata,
                ...metadata
            }
        });

        this.setState(
            GameRuntimeState.ROUND_OPEN
        );

        this.sync({
            metadata
        });

        this.setState(
            GameRuntimeState.ROUND_OPEN
        );

        this.emit(
            GameRuntimeEvent.ROUND_BEGAN,
            {
                roundId:
                    this.context.roundId,
                roundNumber:
                    this.context.roundNumber
            }
        );

        return this.context.snapshot();
    }

    async analyzeCurrentRound({
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        if (!this.context.roundId) {
            this.beginRound({
                metadata
            });
        }

        this.sync({
            metadata
        });

        const analysisInput =
            this.inputBuilder.build({
                shoeId:
                    this.context.shoeId,
                roundId:
                    this.context.roundId,
                roundNumber:
                    this.context.roundNumber,
                shoeState:
                    this.context.shoeState,
                roundState:
                    this.context.roundState,
                statistics:
                    this.context.statistics,
                roadmap:
                    this.context.roadmap,
                bankroll:
                    this.context.bankroll,
                settings:
                    this.context.settings,
                metadata: {
                    ...this.context.metadata,
                    ...metadata
                }
            });

        this.context.merge({
            analysisInput
        });

        this.setState(
            GameRuntimeState.ANALYZING
        );

        this.emit(
            GameRuntimeEvent.ANALYSIS_STARTED,
            analysisInput
        );

        try {
            const result =
                await this.liveRuntime.analyze({
                    observation:
                        analysisInput.observation
                });

            this.context.merge({
                analysisResult:
                    result
            });

            this.setState(
                GameRuntimeState.AWAITING_RESULT
            );

            const record = {
                type:
                    "analysis-completed",
                roundId:
                    this.context.roundId,
                result,
                createdAt:
                    this.clock()
            };

            this.history.add(
                record
            );

            this.emit(
                GameRuntimeEvent.ANALYSIS_COMPLETED,
                record
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "analyzeCurrentRound"
            );
        }
    }

    async settleCurrentRound({
        roundResult = null,
        profit = 0,
        payout = 0,
        stake = 0,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const sourceResult =
            roundResult ??
            this.gameGateway.getLastResult();

        if (!sourceResult) {
            throw new Error(
                "No RoundResult is available for settlement."
            );
        }

        const normalizedResult =
            this.roundCollector.collectResult(
                sourceResult
            );

        const settlementInput =
            this.settlementMapper.map({
                roundResult:
                    sourceResult,
                profit,
                payout,
                stake,
                metadata
            });

        this.context.merge({
            roundResult:
                normalizedResult
        });

        this.setState(
            GameRuntimeState.SETTLING
        );

        this.emit(
            GameRuntimeEvent.RESULT_SUBMITTED,
            settlementInput
        );

        try {
            const result =
                await this.liveRuntime.submitResult(
                    settlementInput
                );

            this.context.merge({
                settlementResult:
                    result
            });

            this.setState(
                GameRuntimeState.UPDATING
            );

            this.sync({
                metadata
            });

            this.setState(
                GameRuntimeState.READY
            );

            const record = {
                type:
                    "settlement-completed",
                roundId:
                    this.context.roundId,
                roundResult:
                    normalizedResult,
                result,
                createdAt:
                    this.clock()
            };

            this.history.add(
                record
            );

            this.emit(
                GameRuntimeEvent.SETTLEMENT_COMPLETED,
                record
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "settleCurrentRound"
            );
        }
    }

    nextRound({
        roundId = null,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const next =
            this.beginRound({
                roundId,
                metadata
            });

        this.emit(
            GameRuntimeEvent.NEXT_ROUND,
            next
        );

        return next;
    }

    async completeRoundAndPrepareNext({
        roundResult = null,
        profit = 0,
        payout = 0,
        stake = 0,
        nextRoundId = null,
        autoAnalyzeNext = false,
        metadata = {}
    } = {}) {
        const settlement =
            await this.settleCurrentRound({
                roundResult,
                profit,
                payout,
                stake,
                metadata
            });

        const next =
            this.nextRound({
                roundId:
                    nextRoundId,
                metadata
            });

        let analysis =
            null;

        if (autoAnalyzeNext) {
            analysis =
                await this.analyzeCurrentRound({
                    metadata
                });
        }

        return {
            settlement,
            next,
            analysis
        };
    }

    resetShoe({
        shoeId = null,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        const resetResult =
            this.gameGateway.resetShoe();

        const resolvedShoeId =
            shoeId ??
            `game-shoe-${this.clock()}`;

        this.liveRuntime.resetShoe({
            shoeId:
                resolvedShoeId,
            context: {
                metadata: {
                    source:
                        "game-runtime",
                    ...metadata
                }
            }
        });

        this.context =
            new GameRuntimeContext({
                shoeId:
                    resolvedShoeId,
                metadata: {
                    ...metadata
                }
            });

        this.sync({
            metadata
        });

        this.emit(
            GameRuntimeEvent.SHOE_RESET,
            {
                shoeId:
                    resolvedShoeId,
                resetResult
            }
        );

        return this.context.snapshot();
    }

    pause() {
        this.assertNotDestroyed();

        this.liveRuntime.pause();

        this.paused =
            true;

        this.setState(
            GameRuntimeState.PAUSED
        );

        this.emit(
            GameRuntimeEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.liveRuntime.resume();

        this.paused =
            false;

        this.setState(
            GameRuntimeState.READY
        );

        this.emit(
            GameRuntimeEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    stop() {
        this.assertNotDestroyed();

        this.liveRuntime.stop();

        this.connected =
            false;

        this.paused =
            false;

        this.setState(
            GameRuntimeState.STOPPED
        );

        this.emit(
            GameRuntimeEvent.STOPPED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.liveRuntime.reset?.();

        this.context =
            new GameRuntimeContext();

        this.history.clear();

        this.connected =
            false;

        this.paused =
            false;

        this.lastError =
            null;

        this.setState(
            GameRuntimeState.IDLE
        );

        return this;
    }

    handleError(
        error,
        phase
    ) {
        this.lastError =
            error;

        this.setState(
            GameRuntimeState.ERROR
        );

        this.emit(
            GameRuntimeEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.liveRuntime.destroy?.();

        this.history.clear();

        this.connected =
            false;

        this.paused =
            false;

        this.destroyed =
            true;

        this.context =
            new GameRuntimeContext();

        this.setState(
            GameRuntimeState.DESTROYED
        );

        this.emit(
            GameRuntimeEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_GAME_RUNTIME_INTEGRATION_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            connected:
                this.connected,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            shoeId:
                this.context.shoeId,
            roundId:
                this.context.roundId,
            roundNumber:
                this.context.roundNumber,
            hasAnalysis:
                Boolean(
                    this.context.analysisResult
                ),
            hasSettlement:
                Boolean(
                    this.context.settlementResult
                ),
            history:
                this.history.summary,
            lastError:
                this.lastError?.message ??
                null
        };
    }
}
