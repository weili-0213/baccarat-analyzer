/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/AICasinoRuntimeIntegration.js
 * Purpose: Unifies CasinoRuntime, V10.3 Game Runtime, V10.2 Live Runtime and Dashboard.
 */
import {
    CasinoRuntimeState
} from "./CasinoRuntimeState.js";

import CasinoRuntimeContext
    from "./CasinoRuntimeContext.js";

import CasinoSessionCoordinator
    from "./CasinoSessionCoordinator.js";

import CasinoRuntimeSynchronizer
    from "./CasinoRuntimeSynchronizer.js";

import CasinoBetCoordinator
    from "./CasinoBetCoordinator.js";

import CasinoDashboardBridge
    from "./CasinoDashboardBridge.js";

import CasinoRuntimeHistory
    from "./CasinoRuntimeHistory.js";

export const AI_CASINO_RUNTIME_INTEGRATION_VERSION = "10.4.0";

export const CasinoRuntimeEvent = Object.freeze({
    STATE_CHANGE:
        "ai-casino-runtime:state-change",
    BOOTED:
        "ai-casino-runtime:booted",
    SYNCED:
        "ai-casino-runtime:synced",
    ROUND_STARTED:
        "ai-casino-runtime:round-started",
    ANALYSIS_COMPLETED:
        "ai-casino-runtime:analysis-completed",
    ROUND_COMPLETED:
        "ai-casino-runtime:round-completed",
    BET_ADDED:
        "ai-casino-runtime:bet-added",
    NEXT_ROUND:
        "ai-casino-runtime:next-round",
    SHOE_RESET:
        "ai-casino-runtime:shoe-reset",
    PAUSED:
        "ai-casino-runtime:paused",
    RESUMED:
        "ai-casino-runtime:resumed",
    STOPPED:
        "ai-casino-runtime:stopped",
    ERROR:
        "ai-casino-runtime:error",
    DESTROYED:
        "ai-casino-runtime:destroyed"
});

export default class AICasinoRuntimeIntegration {
    constructor({
        legacyRuntime = null,
        gameRuntime,
        sessionStore = null,
        dashboardRuntime = null,
        sessionCoordinator = null,
        synchronizer = null,
        betCoordinator = null,
        dashboardBridge = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (
            !gameRuntime ||
            typeof gameRuntime.connect !== "function" ||
            typeof gameRuntime.beginRound !== "function" ||
            typeof gameRuntime.analyzeCurrentRound !== "function"
        ) {
            throw new TypeError(
                "AICasinoRuntimeIntegration requires V10.3 Game Runtime."
            );
        }

        if (
            legacyRuntime !== null &&
            typeof legacyRuntime.start !== "function"
        ) {
            throw new TypeError(
                "legacyRuntime requires start()."
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

        this.legacyRuntime =
            legacyRuntime;

        this.gameRuntime =
            gameRuntime;

        this.sessionStore =
            sessionStore;

        this.dashboardRuntime =
            dashboardRuntime;

        this.clock =
            clock;

        this.sessionCoordinator =
            sessionCoordinator ??
            new CasinoSessionCoordinator({
                clock
            });

        this.synchronizer =
            synchronizer ??
            new CasinoRuntimeSynchronizer();

        this.betCoordinator =
            betCoordinator ??
            new CasinoBetCoordinator({
                legacyRuntime,
                sessionStore,
                dashboardRuntime
            });

        this.dashboardBridge =
            dashboardBridge ??
            new CasinoDashboardBridge({
                dashboardRuntime
            });

        this.history =
            history ??
            new CasinoRuntimeHistory();

        this.eventBus =
            eventBus;

        this.context =
            new CasinoRuntimeContext();

        this.state =
            CasinoRuntimeState.IDLE;

        this.previousState =
            null;

        this.running =
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
                        "ai-casino-runtime"
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
            CasinoRuntimeEvent.STATE_CHANGE,
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
                "AICasinoRuntimeIntegration has been destroyed."
            );
        }
    }

    async boot({
        casinoSessionId = null,
        shoeId = null,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        this.setState(
            CasinoRuntimeState.BOOTING
        );

        const session =
            this.sessionCoordinator.start({
                casinoSessionId,
                shoeId
            });

        if (
            this.legacyRuntime &&
            typeof this.legacyRuntime.start ===
                "function"
        ) {
            await this.legacyRuntime.start();
        }

        this.gameRuntime.connect({
            shoeId:
                session.shoeId,
            context: {
                metadata: {
                    source:
                        "casino-runtime",
                    ...metadata
                }
            }
        });

        this.context =
            new CasinoRuntimeContext({
                casinoSessionId:
                    session.casinoSessionId,
                shoeId:
                    session.shoeId,
                metadata: {
                    ...metadata
                }
            });

        this.running =
            true;

        this.paused =
            false;

        this.setState(
            CasinoRuntimeState.READY
        );

        await this.sync();

        const record = {
            type:
                "boot",
            session,
            createdAt:
                this.clock()
        };

        this.history.add(
            record
        );

        this.emit(
            CasinoRuntimeEvent.BOOTED,
            record
        );

        return this.summary;
    }

    async sync() {
        this.assertNotDestroyed();

        this.setState(
            CasinoRuntimeState.SYNCING
        );

        const game =
            this.gameRuntime.sync();

        const snapshot =
            this.synchronizer.snapshot({
                legacyRuntime:
                    this.legacyRuntime,
                gameRuntime:
                    this.gameRuntime,
                sessionStore:
                    this.sessionStore,
                dashboardRuntime:
                    this.dashboardRuntime
            });

        this.context.merge({
            game,
            session:
                snapshot.session,
            dashboard:
                snapshot.dashboard
        });

        await this.dashboardBridge.update(
            snapshot
        );

        this.setState(
            CasinoRuntimeState.READY
        );

        const record = {
            type:
                "sync",
            snapshot,
            createdAt:
                this.clock()
        };

        this.history.add(
            record
        );

        this.emit(
            CasinoRuntimeEvent.SYNCED,
            record
        );

        return snapshot;
    }

    async startRound({
        roundId = null,
        input = {},
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (!this.running) {
            await this.boot({
                metadata
            });
        }

        if (this.paused) {
            return null;
        }

        const session =
            this.sessionCoordinator.beginRound(
                roundId
            );

        if (
            this.legacyRuntime &&
            typeof this.legacyRuntime.startRound ===
                "function"
        ) {
            await this.legacyRuntime.startRound(
                input
            );
        }

        const game =
            this.gameRuntime.beginRound({
                roundId:
                    session.roundId,
                metadata
            });

        this.context.merge({
            roundId:
                session.roundId,
            roundNumber:
                session.roundNumber,
            game,
            analysis:
                null,
            settlement:
                null,
            metadata: {
                ...this.context.metadata,
                ...metadata
            }
        });

        this.setState(
            CasinoRuntimeState.ROUND_OPEN
        );

        this.emit(
            CasinoRuntimeEvent.ROUND_STARTED,
            {
                roundId:
                    session.roundId,
                roundNumber:
                    session.roundNumber
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
            await this.startRound({
                metadata
            });
        }

        this.setState(
            CasinoRuntimeState.ANALYZING
        );

        try {
            const result =
                await this.gameRuntime
                    .analyzeCurrentRound({
                        metadata
                    });

            this.context.merge({
                analysis:
                    result
            });

            this.setState(
                CasinoRuntimeState.AWAITING_RESULT
            );

            await this.sync();

            this.setState(
                CasinoRuntimeState.AWAITING_RESULT
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
                CasinoRuntimeEvent.ANALYSIS_COMPLETED,
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

    async completeRound({
        roundResult,
        profit = 0,
        payout = 0,
        stake = 0,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        this.setState(
            CasinoRuntimeState.SETTLING
        );

        try {
            const settlement =
                await this.gameRuntime
                    .settleCurrentRound({
                        roundResult,
                        profit,
                        payout,
                        stake,
                        metadata
                    });

            if (
                this.legacyRuntime &&
                typeof this.legacyRuntime.completeRound ===
                    "function"
            ) {
                await this.legacyRuntime.completeRound({
                    winner:
                        roundResult?.winner ??
                        null
                });
            }

            this.context.merge({
                settlement
            });

            this.setState(
                CasinoRuntimeState.UPDATING
            );

            await this.sync();

            this.setState(
                CasinoRuntimeState.READY
            );

            const record = {
                type:
                    "round-completed",
                roundId:
                    this.context.roundId,
                settlement,
                createdAt:
                    this.clock()
            };

            this.history.add(
                record
            );

            this.emit(
                CasinoRuntimeEvent.ROUND_COMPLETED,
                record
            );

            return settlement;
        }
        catch (error) {
            return this.handleError(
                error,
                "completeRound"
            );
        }
    }

    async addBet(bet) {
        this.assertNotDestroyed();

        const saved =
            await this.betCoordinator.addBet(
                bet
            );

        this.context.merge({
            bet:
                saved
        });

        await this.sync();

        this.emit(
            CasinoRuntimeEvent.BET_ADDED,
            saved
        );

        return saved;
    }

    async nextRound({
        roundId = null,
        input = {},
        metadata = {},
        autoAnalyze = false
    } = {}) {
        const next =
            await this.startRound({
                roundId,
                input,
                metadata
            });

        let analysis =
            null;

        if (autoAnalyze) {
            analysis =
                await this.analyzeCurrentRound({
                    metadata
                });
        }

        this.emit(
            CasinoRuntimeEvent.NEXT_ROUND,
            {
                next,
                analysis
            }
        );

        return {
            next,
            analysis
        };
    }

    async completeRoundAndPrepareNext({
        roundResult,
        profit = 0,
        payout = 0,
        stake = 0,
        nextRoundId = null,
        nextInput = {},
        autoAnalyzeNext = false,
        metadata = {}
    } = {}) {
        const settlement =
            await this.completeRound({
                roundResult,
                profit,
                payout,
                stake,
                metadata
            });

        const next =
            await this.nextRound({
                roundId:
                    nextRoundId,
                input:
                    nextInput,
                metadata,
                autoAnalyze:
                    autoAnalyzeNext
            });

        return {
            settlement,
            ...next
        };
    }

    async resetShoe({
        shoeId = null,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        const session =
            this.sessionCoordinator.resetShoe(
                shoeId
            );

        const game =
            this.gameRuntime.resetShoe({
                shoeId:
                    session.shoeId,
                metadata
            });

        this.context =
            new CasinoRuntimeContext({
                casinoSessionId:
                    session.casinoSessionId,
                shoeId:
                    session.shoeId,
                game,
                metadata: {
                    ...metadata
                }
            });

        await this.sync();

        this.emit(
            CasinoRuntimeEvent.SHOE_RESET,
            session
        );

        return this.context.snapshot();
    }

    pause() {
        this.assertNotDestroyed();

        this.legacyRuntime?.pause?.();
        this.gameRuntime.pause?.();
        this.dashboardBridge.pause();

        this.paused =
            true;

        this.setState(
            CasinoRuntimeState.PAUSED
        );

        this.emit(
            CasinoRuntimeEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.legacyRuntime?.resume?.();
        this.gameRuntime.resume?.();
        this.dashboardBridge.resume();

        this.paused =
            false;

        this.setState(
            CasinoRuntimeState.READY
        );

        this.emit(
            CasinoRuntimeEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    async stop() {
        this.assertNotDestroyed();

        await this.legacyRuntime?.stop?.();
        await this.gameRuntime.stop?.();

        this.running =
            false;

        this.paused =
            false;

        this.setState(
            CasinoRuntimeState.STOPPED
        );

        this.emit(
            CasinoRuntimeEvent.STOPPED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.legacyRuntime?.reset?.();
        this.gameRuntime.reset?.();

        this.sessionCoordinator.reset();
        this.history.clear();

        this.context =
            new CasinoRuntimeContext();

        this.running =
            false;

        this.paused =
            false;

        this.lastError =
            null;

        this.setState(
            CasinoRuntimeState.IDLE
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
            CasinoRuntimeState.ERROR
        );

        this.emit(
            CasinoRuntimeEvent.ERROR,
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

        this.legacyRuntime?.destroy?.();
        this.gameRuntime.destroy?.();

        this.history.clear();

        this.running =
            false;

        this.paused =
            false;

        this.destroyed =
            true;

        this.context =
            new CasinoRuntimeContext();

        this.setState(
            CasinoRuntimeState.DESTROYED
        );

        this.emit(
            CasinoRuntimeEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_CASINO_RUNTIME_INTEGRATION_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            running:
                this.running,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            casinoSessionId:
                this.context.casinoSessionId,
            shoeId:
                this.context.shoeId,
            roundId:
                this.context.roundId,
            roundNumber:
                this.context.roundNumber,
            hasAnalysis:
                Boolean(
                    this.context.analysis
                ),
            hasSettlement:
                Boolean(
                    this.context.settlement
                ),
            history:
                this.history.summary,
            dashboard:
                this.dashboardBridge.summary,
            lastError:
                this.lastError?.message ??
                null
        };
    }
}
