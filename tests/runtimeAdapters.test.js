/**
 * Baccarat Analyzer V10.3
 * Path: tests/runtimeAdapters.test.js
 * Purpose:
 *   Compatibility regression test for the legacy V5.1 CasinoRuntime
 *   plus the V10.3 GameRuntimeAdapter integration API.
 */

import createCasinoRuntime, {
    RUNTIME_ADAPTERS_VERSION
} from "../runtime/createCasinoRuntime.js";

import GameRuntimeAdapter, {
    GAME_RUNTIME_ADAPTER_VERSION,
    GAME_RUNTIME_ADAPTER_LEGACY_COMPAT_VERSION,
    GameRuntimeAdapterMode
} from "../runtime/adapters/GameRuntimeAdapter.js";

import {
    ANALYZER_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AnalyzerRuntimeAdapter.js";

import {
    SESSION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/SessionRuntimeAdapter.js";

import {
    DASHBOARD_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/DashboardRuntimeAdapter.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createGame() {
    return {
        started: false,
        current: null,

        async start() {
            this.started = true;
        },

        async startRound(input) {
            this.current = {
                id: 1,
                input
            };

            return this.current;
        },

        async completeRound(input) {
            const result = {
                winner:
                    input.winner ??
                    "Player"
            };

            this.current = null;

            return result;
        },

        async stop() {
            this.started = false;
        }
    };
}


function createAnalyzer() {
    return {
        async analyze(context) {
            return {
                shouldBet: true,
                recommendedBet:
                    "player",
                context
            };
        }
    };
}


function createStore() {
    return {
        active: false,
        rounds: [],
        analyses: [],
        bets: [],

        start() {
            this.active = true;
            return this.export();
        },

        addRound(round) {
            this.rounds.push(round);
            return round;
        },

        addAnalysis(analysis) {
            this.analyses.push(
                analysis
            );
            return analysis;
        },

        addBet(bet) {
            this.bets.push(bet);
            return bet;
        },

        end() {
            this.active = false;
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
}


function createDashboard() {
    return {
        sessions: [],
        paused: false,

        async renderSession(session) {
            this.sessions.push(
                session
            );

            return {
                rounds:
                    session.rounds.length
            };
        },

        pauseLive() {
            this.paused = true;
        },

        resumeLive() {
            this.paused = false;
        }
    };
}


function createAIIntegration() {
    return {
        calls: [],
        paused: false,
        destroyed: false,

        connect(input = {}) {
            this.calls.push([
                "connect",
                input
            ]);

            return {
                state: "ready"
            };
        },

        sync(input = {}) {
            this.calls.push([
                "sync",
                input
            ]);

            return {
                synced: true
            };
        },

        beginRound(input = {}) {
            this.calls.push([
                "beginRound",
                input
            ]);

            return {
                roundId:
                    input.roundId ??
                    "ai-round-1"
            };
        },

        analyzeCurrentRound(input = {}) {
            this.calls.push([
                "analyzeCurrentRound",
                input
            ]);

            return {
                prediction:
                    "Banker"
            };
        },

        settleCurrentRound(input = {}) {
            this.calls.push([
                "settleCurrentRound",
                input
            ]);

            return {
                feedback:
                    "update"
            };
        },

        nextRound(input = {}) {
            this.calls.push([
                "nextRound",
                input
            ]);

            return {
                roundId:
                    "ai-round-2"
            };
        },

        completeRoundAndPrepareNext(
            input = {}
        ) {
            this.calls.push([
                "completeRoundAndPrepareNext",
                input
            ]);

            return {
                completed: true
            };
        },

        resetShoe(input = {}) {
            this.calls.push([
                "resetShoe",
                input
            ]);

            return {
                shoeId:
                    input.shoeId ??
                    "shoe-2"
            };
        },

        pause() {
            this.paused = true;
        },

        resume() {
            this.paused = false;
        },

        stop() {
            return {
                state: "stopped"
            };
        },

        reset() {
            return {
                state: "idle"
            };
        },

        destroy() {
            this.destroyed = true;
        },

        get summary() {
            return {
                callCount:
                    this.calls.length
            };
        }
    };
}


export default async function runtimeAdaptersTest() {
    const messages = [];

    /*
     * Mixed-version compatibility is intentional.
     * createCasinoRuntime and three legacy adapters remain V5.1.
     * GameRuntimeAdapter is V10.3.1 and explicitly advertises V5.1 compatibility.
     */
    assert(
        RUNTIME_ADAPTERS_VERSION ===
            "5.1.0" &&
        ANALYZER_RUNTIME_ADAPTER_VERSION ===
            "5.1.0" &&
        SESSION_RUNTIME_ADAPTER_VERSION ===
            "5.1.0" &&
        DASHBOARD_RUNTIME_ADAPTER_VERSION ===
            "5.1.0",
        "Legacy V5.1 Runtime Adapter versions 錯誤"
    );

    assert(
        GAME_RUNTIME_ADAPTER_VERSION ===
            "10.3.1" &&
        GAME_RUNTIME_ADAPTER_LEGACY_COMPAT_VERSION ===
            "5.1.0",
        "V10.3 GameRuntimeAdapter compatibility version 錯誤"
    );

    messages.push(
        "✓ V5.1 / V10.3 Adapter compatibility versions 正確"
    );


    /*
     * Legacy CasinoRuntime flow.
     */
    const game =
        createGame();

    const analyzer =
        createAnalyzer();

    const store =
        createStore();

    const dashboard =
        createDashboard();

    const runtime =
        createCasinoRuntime({
            game,
            analyzer,
            sessionStore:
                store,
            dashboard,
            runtimeOptions: {
                autoAnalyze:
                    true,
                autoDashboard:
                    true
            }
        });

    assert(
        runtime.adapters.game &&
        runtime.adapters.analyzer &&
        runtime.adapters.session &&
        runtime.adapters.dashboard,
        "Runtime Adapters 建立錯誤"
    );

    assert(
        runtime.adapters.game.mode ===
            GameRuntimeAdapterMode.LEGACY_GAME,
        "CasinoRuntime 應使用 legacy-game mode"
    );

    messages.push(
        "✓ Legacy CasinoRuntime Adapters 建立正確"
    );

    await runtime.start();

    await runtime.startRound({
        cards: [
            "AS",
            "KH"
        ]
    });

    await runtime.completeRound({
        winner:
            "Banker"
    });

    assert(
        store.rounds.length ===
            1 &&
        store.analyses.length ===
            1 &&
        dashboard.sessions.length ===
            2,
        "Legacy Adapter 自動流程錯誤"
    );

    messages.push(
        "✓ Legacy Game → Analyzer → Session → Dashboard 正確"
    );

    await runtime.addBet({
        bet:
            "player",
        amount:
            100,
        profit:
            100
    });

    assert(
        store.bets.length ===
            1 &&
        dashboard.sessions.length ===
            3,
        "Legacy Bet Adapter 流程錯誤"
    );

    messages.push(
        "✓ Legacy Bet Adapter 正確"
    );

    runtime.pause();

    assert(
        dashboard.paused ===
            true,
        "Dashboard pauseLive() 錯誤"
    );

    runtime.resume();

    assert(
        dashboard.paused ===
            false,
        "Dashboard resumeLive() 錯誤"
    );

    assert(
        runtime.adapters.game
            .summary
            .roundCount ===
            1 &&
        runtime.adapters.analyzer
            .summary
            .analysisCount ===
            1 &&
        runtime.adapters.dashboard
            .summary
            .updateCount ===
            3,
        "Legacy Adapter summary 錯誤"
    );

    messages.push(
        "✓ Legacy Adapter Lifecycle 與 Summary 正確"
    );

    await runtime.stop();
    runtime.destroy();


    /*
     * V10.3 AI integration mode.
     */
    const integration =
        createAIIntegration();

    const aiAdapter =
        new GameRuntimeAdapter({
            integration
        });

    assert(
        aiAdapter.mode ===
            GameRuntimeAdapterMode.AI_INTEGRATION &&
        aiAdapter.summary.version ===
            "10.3.1",
        "AI Integration mode 建立錯誤"
    );

    await aiAdapter.connect({
        shoeId:
            "shoe-1"
    });

    await aiAdapter.sync();

    await aiAdapter.beginRound({
        roundId:
            "ai-round-1"
    });

    const analysis =
        await aiAdapter
            .analyzeCurrentRound();

    const settlement =
        await aiAdapter
            .settleCurrentRound({
                roundResult: {
                    winner:
                        "Banker"
                }
            });

    await aiAdapter.nextRound();

    await aiAdapter
        .completeRoundAndPrepareNext();

    await aiAdapter.resetShoe({
        shoeId:
            "shoe-2"
    });

    assert(
        analysis.prediction ===
            "Banker" &&
        settlement.feedback ===
            "update",
        "V10.3 AI Integration API 錯誤"
    );

    aiAdapter.pause();

    assert(
        integration.paused,
        "V10.3 AI Integration pause 錯誤"
    );

    aiAdapter.resume();

    assert(
        !integration.paused,
        "V10.3 AI Integration resume 錯誤"
    );

    aiAdapter.destroy();

    assert(
        integration.destroyed,
        "V10.3 AI Integration destroy 錯誤"
    );

    messages.push(
        "✓ V10.3 AI Game Runtime Adapter API 正確"
    );


    return `
${messages.join("\n")}

Runtime Adapter Compatibility Refactor V10.3 測試完成

Legacy V5.1 Runtime Factory：通過
Legacy Game Adapter：通過
Analyzer Adapter：通過
Session Adapter：通過
Dashboard Adapter：通過
Legacy Integration Flow：通過
V10.3 Game Runtime Adapter：通過
Dual Mode Compatibility：通過
Lifecycle：通過
`;
}
