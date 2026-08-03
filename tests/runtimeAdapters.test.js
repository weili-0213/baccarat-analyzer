/**
 * Baccarat Analyzer V5.1
 * tests/runtimeAdapters.test.js
 */

import createCasinoRuntime, {
    RUNTIME_ADAPTERS_VERSION
} from "../runtime/createCasinoRuntime.js";

import {
    GAME_RUNTIME_ADAPTER_VERSION
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
        started:
            false,

        current:
            null,

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
                shouldBet:
                    true,

                recommendedBet:
                    "player",

                context
            };
        }
    };
}


function createStore() {
    return {
        active:
            false,

        rounds:
            [],

        analyses:
            [],

        bets:
            [],

        start() {
            this.active = true;
            return this.export();
        },

        addRound(round) {
            this.rounds.push(round);
            return round;
        },

        addAnalysis(analysis) {
            this.analyses.push(analysis);
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
        sessions:
            [],

        paused:
            false,

        async renderSession(session) {
            this.sessions.push(session);

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


export default async function runtimeAdaptersTest() {
    const messages = [];

    assert(
        RUNTIME_ADAPTERS_VERSION ===
            "5.1.0" &&
        GAME_RUNTIME_ADAPTER_VERSION ===
            "5.1.0" &&
        ANALYZER_RUNTIME_ADAPTER_VERSION ===
            "5.1.0" &&
        SESSION_RUNTIME_ADAPTER_VERSION ===
            "5.1.0" &&
        DASHBOARD_RUNTIME_ADAPTER_VERSION ===
            "5.1.0",
        "V5.1 Adapter 版本錯誤"
    );

    messages.push(
        "✓ V5.1 Adapter 版本正確"
    );

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

    messages.push(
        "✓ Runtime Adapters 建立正確"
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
        "Adapter 自動流程錯誤"
    );

    messages.push(
        "✓ Game → Analyzer → Session → Dashboard 正確"
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
        "Bet Adapter 流程錯誤"
    );

    messages.push(
        "✓ Bet Adapter 正確"
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

    messages.push(
        "✓ Dashboard Live Adapter 正確"
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
        "Adapter summary 錯誤"
    );

    await runtime.stop();

    runtime.destroy();

    messages.push(
        "✓ Adapter Lifecycle 正確"
    );

    return `
${messages.join("\n")}

Runtime Adapters V5.1 測試完成

Game Adapter：通過
Analyzer Adapter：通過
Session Adapter：通過
Dashboard Adapter：通過
Runtime Factory：通過
Integration Flow：通過
Lifecycle：通過
`;
}
