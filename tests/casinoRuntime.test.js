/**
 * Baccarat Analyzer V5.0
 * tests/casinoRuntime.test.js
 */

import CasinoRuntime, {
    CASINO_RUNTIME_VERSION,
    RuntimeStatus,
    RuntimeEvent
} from "../runtime/CasinoRuntime.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createGame() {
    return {
        started: false,
        stopped: false,
        destroyed: false,
        roundNumber: 0,

        async start() {
            this.started = true;
        },

        async startRound(input = {}) {
            this.roundNumber++;

            return {
                id:
                    this.roundNumber,

                input
            };
        },

        async completeRound(input = {}) {
            return {
                roundNumber:
                    this.roundNumber,

                winner:
                    input.winner ??
                    "Player"
            };
        },

        async stop() {
            this.stopped = true;
        },

        async reset() {
            this.roundNumber = 0;
        },

        destroy() {
            this.destroyed = true;
        }
    };
}


function createAnalyzer() {
    return {
        count: 0,
        destroyed: false,

        async analyze(options = {}) {
            this.count++;

            return {
                method:
                    "provided",

                shouldBet:
                    true,

                recommendedBet:
                    "player",

                round:
                    options.round ??
                    null
            };
        },

        destroy() {
            this.destroyed = true;
        }
    };
}


function createSessionStore() {
    return {
        active: false,
        rounds: [],
        analyses: [],
        bets: [],
        startedAt: null,
        endedAt: null,

        start(options = {}) {
            this.active = true;
            this.startedAt =
                options.startedAt ??
                null;

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

        end(options = {}) {
            this.active = false;
            this.endedAt =
                options.endedAt ??
                null;

            return this.export();
        },

        reset() {
            this.active = false;
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
                    [...this.bets],

                startedAt:
                    this.startedAt,

                endedAt:
                    this.endedAt
            };
        }
    };
}


function createDashboard() {
    return {
        updates: [],
        paused: false,
        destroyed: false,

        async renderSession(session) {
            this.updates.push(session);

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
        },

        destroy() {
            this.destroyed = true;
        }
    };
}


export default async function casinoRuntimeTest() {
    const messages = [];

    assert(
        CASINO_RUNTIME_VERSION ===
            "5.0.0",
        "CasinoRuntime 版本錯誤"
    );

    const game =
        createGame();

    const analyzer =
        createAnalyzer();

    const sessionStore =
        createSessionStore();

    const dashboard =
        createDashboard();

    let clock = 0;

    const runtime =
        new CasinoRuntime({
            game,
            analyzer,
            sessionStore,
            dashboard,

            clock:
                () =>
                    `2026-08-03T10:00:${String(
                        clock++
                    ).padStart(2, "0")}.000Z`
        });

    const events = [];

    runtime.on(
        RuntimeEvent.STATUS_CHANGE,
        event => {
            events.push(
                event.payload.current
            );
        }
    );

    messages.push(
        "✓ V5.0 建立正確"
    );

    await runtime.start({
        session: {
            shoeNumber: 1
        }
    });

    assert(
        runtime.status ===
            RuntimeStatus.READY &&
        runtime.summary.running ===
            true &&
        game.started ===
            true &&
        sessionStore.active ===
            true &&
        dashboard.updates.length ===
            1,
        "Runtime start() 錯誤"
    );

    messages.push(
        "✓ Runtime start() 正確"
    );

    const round =
        await runtime.startRound({
            cards: [
                "AS",
                "KH"
            ]
        });

    assert(
        runtime.status ===
            RuntimeStatus.ROUND_ACTIVE &&
        runtime.summary.hasCurrentRound ===
            true &&
        round.id === 1,
        "startRound() 錯誤"
    );

    messages.push(
        "✓ startRound() 正確"
    );

    const result =
        await runtime.completeRound({
            winner: "Banker"
        });

    assert(
        result.winner ===
            "Banker" &&
        runtime.status ===
            RuntimeStatus.READY &&
        runtime.summary.roundCount ===
            1 &&
        runtime.summary.analysisCount ===
            1 &&
        sessionStore.rounds.length ===
            1 &&
        sessionStore.analyses.length ===
            1 &&
        dashboard.updates.length ===
            2,
        "completeRound() 自動流程錯誤"
    );

    messages.push(
        "✓ Round → Analysis → Dashboard 自動流程正確"
    );

    await runtime.addBet({
        bet: "player",
        amount: 100,
        profit: 100
    });

    assert(
        sessionStore.bets.length ===
            1 &&
        dashboard.updates.length ===
            3,
        "addBet() 錯誤"
    );

    messages.push(
        "✓ Bet 與 Dashboard 更新正確"
    );

    runtime.pause();

    assert(
        runtime.status ===
            RuntimeStatus.PAUSED &&
        dashboard.paused ===
            true,
        "pause() 錯誤"
    );

    runtime.resume();

    assert(
        runtime.status ===
            RuntimeStatus.READY &&
        dashboard.paused ===
            false,
        "resume() 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    await runtime.stop();

    assert(
        runtime.status ===
            RuntimeStatus.STOPPED &&
        game.stopped ===
            true &&
        sessionStore.active ===
            false &&
        sessionStore.endedAt !==
            null &&
        dashboard.updates.length ===
            4,
        "stop() 錯誤"
    );

    messages.push(
        "✓ Runtime stop() 正確"
    );

    assert(
        runtime.summary.version ===
            "5.0.0" &&
        runtime.summary.roundCount ===
            1 &&
        runtime.summary.analysisCount ===
            1 &&
        runtime.summary.dashboardUpdateCount ===
            4 &&
        runtime.summary.lastError ===
            null &&
        events.includes(
            RuntimeStatus.READY
        ) &&
        events.includes(
            RuntimeStatus.ROUND_ACTIVE
        ) &&
        events.includes(
            RuntimeStatus.ANALYZING
        ) &&
        events.includes(
            RuntimeStatus.STOPPED
        ),
        "Runtime summary 或 events 錯誤"
    );

    messages.push(
        "✓ Runtime State Machine 與 Events 正確"
    );

    runtime.destroy();

    assert(
        runtime.status ===
            RuntimeStatus.DESTROYED &&
        game.destroyed ===
            true &&
        analyzer.destroyed ===
            true &&
        dashboard.destroyed ===
            true,
        "destroy() 錯誤"
    );

    messages.push(
        "✓ destroy() 正確"
    );

    return `
${messages.join("\n")}

Casino Runtime V5.0 測試完成

Lifecycle：通過
Runtime State Machine：通過
Game Integration：通過
Session Integration：通過
Analyzer Integration：通過
Dashboard Integration：通過
Events：通過
Destroy：通過
`;
}
