/**
 * Baccarat Analyzer V10.4
 * Path: tests/aiCasinoRuntimeIntegration.test.js
 * Purpose: Full V10.4 Runtime Integration Test.
 */

import {
    CASINO_RUNTIME_STATE_VERSION,
    CasinoRuntimeState,
    CasinoRuntimeAction
} from "../runtime/casino/CasinoRuntimeState.js";

import CasinoRuntimeContext, {
    CASINO_RUNTIME_CONTEXT_VERSION
} from "../runtime/casino/CasinoRuntimeContext.js";

import CasinoSessionCoordinator, {
    CASINO_SESSION_COORDINATOR_VERSION
} from "../runtime/casino/CasinoSessionCoordinator.js";

import CasinoRuntimeSynchronizer, {
    CASINO_RUNTIME_SYNCHRONIZER_VERSION
} from "../runtime/casino/CasinoRuntimeSynchronizer.js";

import CasinoBetCoordinator, {
    CASINO_BET_COORDINATOR_VERSION
} from "../runtime/casino/CasinoBetCoordinator.js";

import CasinoDashboardBridge, {
    CASINO_DASHBOARD_BRIDGE_VERSION
} from "../runtime/casino/CasinoDashboardBridge.js";

import CasinoRuntimeHistory, {
    CASINO_RUNTIME_HISTORY_VERSION
} from "../runtime/casino/CasinoRuntimeHistory.js";

import AICasinoRuntimeIntegration, {
    AI_CASINO_RUNTIME_INTEGRATION_VERSION,
    CasinoRuntimeEvent
} from "../runtime/casino/AICasinoRuntimeIntegration.js";

import CasinoRuntimeAdapter, {
    CASINO_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/CasinoRuntimeAdapter.js";

import {
    AI_CASINO_RUNTIME_INTEGRATION_FACTORY_VERSION
} from "../runtime/casino/createAICasinoRuntimeIntegration.js";

const assert = (
    condition,
    message
) => {
    if (!condition) {
        throw new Error(message);
    }
};

export default async function aiCasinoRuntimeIntegrationTest() {
    const messages = [];

    assert(
        [
            CASINO_RUNTIME_STATE_VERSION,
            CASINO_RUNTIME_CONTEXT_VERSION,
            CASINO_SESSION_COORDINATOR_VERSION,
            CASINO_RUNTIME_SYNCHRONIZER_VERSION,
            CASINO_BET_COORDINATOR_VERSION,
            CASINO_DASHBOARD_BRIDGE_VERSION,
            CASINO_RUNTIME_HISTORY_VERSION,
            AI_CASINO_RUNTIME_INTEGRATION_VERSION,
            CASINO_RUNTIME_ADAPTER_VERSION,
            AI_CASINO_RUNTIME_INTEGRATION_FACTORY_VERSION
        ].every(
            version =>
                version === "10.4.0"
        ),
        "V10.4 AI Casino Runtime Integration 版本錯誤"
    );

    assert(
        CasinoRuntimeAction.BOOT ===
            "boot",
        "Casino Runtime Action 錯誤"
    );

    messages.push(
        "✓ V10.4 AI Casino Runtime Integration 版本正確"
    );

    const context =
        new CasinoRuntimeContext({
            casinoSessionId:
                "casino-1",
            shoeId:
                "shoe-1",
            roundNumber:
                0
        });

    assert(
        context.casinoSessionId ===
            "casino-1" &&
        context.shoeId ===
            "shoe-1",
        "Casino Runtime Context 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Context 正確"
    );

    let now =
        100;

    const coordinator =
        new CasinoSessionCoordinator({
            clock:
                () => now++
        });

    const session =
        coordinator.start({
            casinoSessionId:
                "casino-live",
            shoeId:
                "shoe-live"
        });

    const round =
        coordinator.beginRound(
            "round-live-1"
        );

    assert(
        session.casinoSessionId ===
            "casino-live" &&
        session.shoeId ===
            "shoe-live" &&
        round.roundNumber ===
            1,
        "Casino Session Coordinator 錯誤"
    );

    messages.push(
        "✓ Casino Session Coordinator 正確"
    );

    const history =
        new CasinoRuntimeHistory({
            limit:
                10
        });

    history.add({
        type:
            "boot"
    });

    assert(
        history.summary.count ===
            1 &&
        history.latest().type ===
            "boot",
        "Casino Runtime History 錯誤"
    );

    messages.push(
        "✓ Casino Runtime History 正確"
    );

    const sessionStore = {
        active:
            false,
        rounds:
            [],
        analyses:
            [],
        bets:
            [],

        start() {
            this.active =
                true;

            return this.export();
        },

        addRound(round) {
            this.rounds.push(
                round
            );

            return round;
        },

        addAnalysis(analysis) {
            this.analyses.push(
                analysis
            );

            return analysis;
        },

        addBet(bet) {
            this.bets.push(
                bet
            );

            return bet;
        },

        end() {
            this.active =
                false;

            return this.export();
        },

        reset() {
            this.rounds = [];
            this.analyses = [];
            this.bets = [];
        },

        export() {
            return {
                status:
                    this.active
                        ? "active"
                        : "ended",
                rounds:
                    [...this.rounds],
                analyses:
                    [...this.analyses],
                bets:
                    [...this.bets]
            };
        }
    };

    const dashboardRuntime = {
        sessions:
            [],
        paused:
            false,

        async renderSession(session) {
            this.sessions.push(
                session
            );

            return {
                update:
                    this.sessions.length
            };
        },

        pauseLive() {
            this.paused =
                true;
        },

        resumeLive() {
            this.paused =
                false;
        },

        get summary() {
            return {
                updates:
                    this.sessions.length,
                paused:
                    this.paused
            };
        }
    };

    const legacyCalls = [];

    const legacyRuntime = {
        running:
            false,
        paused:
            false,

        async start() {
            this.running =
                true;

            sessionStore.start();

            legacyCalls.push(
                "start"
            );
        },

        async startRound(input) {
            legacyCalls.push(
                [
                    "startRound",
                    input
                ]
            );

            return {
                id:
                    sessionStore.rounds.length + 1,
                input
            };
        },

        async completeRound(input) {
            const result = {
                winner:
                    input.winner ??
                    "Player"
            };

            sessionStore.addRound(
                result
            );

            sessionStore.addAnalysis({
                recommendedBet:
                    "banker"
            });

            legacyCalls.push(
                [
                    "completeRound",
                    input
                ]
            );

            return result;
        },

        async addBet(bet) {
            sessionStore.addBet(
                bet
            );

            await dashboardRuntime.renderSession(
                sessionStore.export()
            );

            return bet;
        },

        pause() {
            this.paused =
                true;
        },

        resume() {
            this.paused =
                false;
        },

        async stop() {
            this.running =
                false;

            sessionStore.end();

            legacyCalls.push(
                "stop"
            );
        },

        reset() {
            sessionStore.reset();
        },

        destroy() {
            this.destroyed =
                true;
        },

        get summary() {
            return {
                running:
                    this.running,
                paused:
                    this.paused
            };
        }
    };

    const gameCalls = [];

    const gameRuntime = {
        connected:
            false,
        paused:
            false,
        destroyed:
            false,
        roundNumber:
            0,

        connect({
            shoeId
        }) {
            this.connected =
                true;

            this.shoeId =
                shoeId;

            gameCalls.push(
                [
                    "connect",
                    shoeId
                ]
            );

            return {
                shoeId
            };
        },

        sync() {
            gameCalls.push(
                "sync"
            );

            return {
                shoeId:
                    this.shoeId,
                roundNumber:
                    this.roundNumber
            };
        },

        beginRound({
            roundId
        }) {
            this.roundNumber++;

            gameCalls.push(
                [
                    "beginRound",
                    roundId
                ]
            );

            return {
                roundId,
                roundNumber:
                    this.roundNumber
            };
        },

        async analyzeCurrentRound() {
            gameCalls.push(
                "analyze"
            );

            return {
                outputs: {
                    simulation: {
                        probabilities: {
                            Player:
                                0.446,
                            Banker:
                                0.459,
                            Tie:
                                0.095
                        }
                    },
                    prediction: {
                        predictedOutcome:
                            "Banker",
                        confidence:
                            0.73
                    },
                    decision: {
                        recommendation: {
                            action:
                                "bet",
                            bestBet:
                                "Banker"
                        }
                    },
                    strategy: {
                        plan: {
                            betType:
                                "Banker",
                            amount:
                                20
                        }
                    }
                }
            };
        },

        async settleCurrentRound({
            roundResult
        }) {
            gameCalls.push(
                [
                    "settle",
                    roundResult
                ]
            );

            return {
                outputs: {
                    execution: {
                        action:
                            "execute"
                    },
                    feedback: {
                        action:
                            "update"
                    },
                    learning: {
                        reward: {
                            reward:
                                5
                        }
                    },
                    adaptive: {
                        action:
                            "apply"
                    }
                }
            };
        },

        resetShoe({
            shoeId
        }) {
            this.shoeId =
                shoeId;

            this.roundNumber =
                0;

            gameCalls.push(
                [
                    "resetShoe",
                    shoeId
                ]
            );

            return {
                shoeId
            };
        },

        pause() {
            this.paused =
                true;
        },

        resume() {
            this.paused =
                false;
        },

        async stop() {
            this.connected =
                false;
        },

        reset() {
            this.roundNumber =
                0;
        },

        destroy() {
            this.destroyed =
                true;
        },

        get summary() {
            return {
                connected:
                    this.connected,
                shoeId:
                    this.shoeId,
                roundNumber:
                    this.roundNumber,
                paused:
                    this.paused
            };
        }
    };

    const synchronizer =
        new CasinoRuntimeSynchronizer();

    const syncSnapshot =
        synchronizer.snapshot({
            legacyRuntime,
            gameRuntime,
            sessionStore,
            dashboardRuntime
        });

    assert(
        syncSnapshot.legacyRuntime &&
        syncSnapshot.gameRuntime &&
        syncSnapshot.session &&
        syncSnapshot.dashboard,
        "Casino Runtime Synchronizer 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Synchronizer 正確"
    );

    const bridge =
        new CasinoDashboardBridge({
            dashboardRuntime
        });

    await bridge.update({
        session:
            sessionStore.export()
    });

    assert(
        bridge.summary.updateCount ===
            1 &&
        dashboardRuntime.sessions.length ===
            1,
        "Casino Dashboard Bridge 錯誤"
    );

    messages.push(
        "✓ Casino Dashboard Bridge 正確"
    );

    const betCoordinator =
        new CasinoBetCoordinator({
            legacyRuntime,
            sessionStore,
            dashboardRuntime
        });

    await betCoordinator.addBet({
        bet:
            "Banker",
        amount:
            20
    });

    assert(
        sessionStore.bets.length ===
            1,
        "Casino Bet Coordinator 錯誤"
    );

    messages.push(
        "✓ Casino Bet Coordinator 正確"
    );

    sessionStore.reset();
    dashboardRuntime.sessions = [];

    const events = [];
    let runtimeNow =
        1000;

    const integration =
        new AICasinoRuntimeIntegration({
            legacyRuntime,
            gameRuntime,
            sessionStore,
            dashboardRuntime,
            eventBus: {
                emit(
                    type,
                    payload
                ) {
                    events.push({
                        type,
                        payload
                    });
                }
            },
            clock:
                () => runtimeNow++
        });

    await integration.boot({
        casinoSessionId:
            "casino-runtime-1",
        shoeId:
            "shoe-runtime-1"
    });

    assert(
        integration.state ===
            CasinoRuntimeState.READY &&
        integration.summary.running &&
        integration.summary.casinoSessionId ===
            "casino-runtime-1" &&
        integration.summary.shoeId ===
            "shoe-runtime-1",
        "Casino Runtime Boot 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Boot 正確"
    );

    const started =
        await integration.startRound({
            roundId:
                "round-runtime-1",
            input: {
                cards: [
                    "AS",
                    "KH"
                ]
            }
        });

    assert(
        started.roundId ===
            "round-runtime-1" &&
        integration.state ===
            CasinoRuntimeState.ROUND_OPEN &&
        integration.summary.roundNumber ===
            1,
        "Casino Runtime Start Round 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Start Round 正確"
    );

    const analysis =
        await integration.analyzeCurrentRound();

    assert(
        analysis.outputs.prediction
            .predictedOutcome ===
            "Banker" &&
        integration.state ===
            CasinoRuntimeState.AWAITING_RESULT &&
        integration.summary.hasAnalysis,
        "Casino Runtime Analyze 錯誤"
    );

    messages.push(
        "✓ Casino → Game Runtime → AI Analyze → Dashboard 正確"
    );

    const settlement =
        await integration.completeRound({
            roundResult: {
                winner:
                    "Banker"
            },
            profit:
                19,
            payout:
                39,
            stake:
                20
        });

    assert(
        settlement.outputs.feedback.action ===
            "update" &&
        settlement.outputs.learning.reward.reward ===
            5 &&
        integration.state ===
            CasinoRuntimeState.READY &&
        integration.summary.hasSettlement &&
        sessionStore.rounds.length ===
            1,
        "Casino Runtime Complete Round 錯誤"
    );

    messages.push(
        "✓ Round → Execution → Feedback → Learning → Adaptive → Casino Sync 正確"
    );

    await integration.addBet({
        bet:
            "Banker",
        amount:
            20,
        profit:
            19
    });

    assert(
        sessionStore.bets.length ===
            1,
        "Casino Runtime Add Bet 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Add Bet 正確"
    );

    const next =
        await integration.nextRound({
            roundId:
                "round-runtime-2",
            autoAnalyze:
                true
        });

    assert(
        next.next.roundId ===
            "round-runtime-2" &&
        next.analysis.outputs.prediction
            .predictedOutcome ===
            "Banker" &&
        integration.summary.roundNumber ===
            2,
        "Casino Runtime Next Round 錯誤"
    );

    messages.push(
        "✓ Next Round + Auto Analyze 正確"
    );

    integration.pause();

    assert(
        integration.state ===
            CasinoRuntimeState.PAUSED &&
        integration.summary.paused &&
        legacyRuntime.paused &&
        gameRuntime.paused &&
        dashboardRuntime.paused,
        "Casino Runtime Pause 錯誤"
    );

    integration.resume();

    assert(
        integration.state ===
            CasinoRuntimeState.READY &&
        !integration.summary.paused &&
        !legacyRuntime.paused &&
        !gameRuntime.paused &&
        !dashboardRuntime.paused,
        "Casino Runtime Resume 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Pause／Resume 正確"
    );

    const reset =
        await integration.resetShoe({
            shoeId:
                "shoe-runtime-2"
        });

    assert(
        reset.shoeId ===
            "shoe-runtime-2" &&
        gameCalls.some(
            call =>
                Array.isArray(call) &&
                call[0] ===
                    "resetShoe"
        ),
        "Casino Runtime Reset Shoe 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Reset Shoe 正確"
    );

    const adapter =
        new CasinoRuntimeAdapter({
            integration
        });

    assert(
        adapter.summary.version ===
            "10.4.0" &&
        adapter.summary.integration
            .shoeId ===
            "shoe-runtime-2",
        "Casino Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Adapter 正確"
    );

    assert(
        [
            CasinoRuntimeEvent.BOOTED,
            CasinoRuntimeEvent.SYNCED,
            CasinoRuntimeEvent.ROUND_STARTED,
            CasinoRuntimeEvent.ANALYSIS_COMPLETED,
            CasinoRuntimeEvent.ROUND_COMPLETED,
            CasinoRuntimeEvent.BET_ADDED,
            CasinoRuntimeEvent.NEXT_ROUND,
            CasinoRuntimeEvent.SHOE_RESET,
            CasinoRuntimeEvent.PAUSED,
            CasinoRuntimeEvent.RESUMED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Casino Runtime Events 錯誤"
    );

    messages.push(
        "✓ Casino Runtime Events 正確"
    );

    await integration.stop();

    assert(
        integration.state ===
            CasinoRuntimeState.STOPPED &&
        !integration.summary.running,
        "Casino Runtime Stop 錯誤"
    );

    integration.reset();

    assert(
        integration.state ===
            CasinoRuntimeState.IDLE &&
        integration.summary.history.count ===
            0,
        "Casino Runtime Reset 錯誤"
    );

    integration.destroy();

    assert(
        integration.state ===
            CasinoRuntimeState.DESTROYED &&
        integration.summary.destroyed &&
        gameRuntime.destroyed,
        "Casino Runtime Destroy 錯誤"
    );

    messages.push(
        "✓ Stop、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Casino Runtime Integration V10.4 測試完成

Casino Runtime State：通過
Casino Runtime Context：通過
Casino Session Coordinator：通過
Casino Runtime Synchronizer：通過
Casino Bet Coordinator：通過
Casino Dashboard Bridge：通過
Casino Runtime History：通過
Casino Runtime Boot：通過
Start Round：通過
Casino AI Analyze Flow：通過
Casino Settlement Flow：通過
Add Bet：通過
Next Round：通過
Reset Shoe：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
