/**
 * Baccarat Analyzer V6.4
 * tests/sessionEngine.test.js
 */

import SessionEngine, {
    SESSION_ENGINE_VERSION,
    SessionEvent
} from "../casino/session/SessionEngine.js";

import {
    SESSION_STATE_VERSION,
    SessionState
} from "../casino/session/SessionState.js";

import SessionHistory, {
    SESSION_HISTORY_VERSION
} from "../casino/session/SessionHistory.js";

import SessionStatistics, {
    SESSION_STATISTICS_VERSION
} from "../casino/session/SessionStatistics.js";

import SessionEngineRuntimeAdapter, {
    SESSION_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/SessionEngineRuntimeAdapter.js";

import {
    SESSION_ENGINE_FACTORY_VERSION
} from "../casino/session/createSessionEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createCasinoEngine() {
    return {
        initialized: 0,
        startedRounds: 0,
        completedRounds: 0,
        currentRound: null,
        destroyed: false,

        async initialize() {
            this.initialized++;

            return this.summary;
        },

        async startRound(input = {}) {
            this.startedRounds++;

            this.currentRound = {
                input
            };

            return this.currentRound;
        },

        async completeRound(input = {}) {
            this.completedRounds++;

            this.currentRound = null;

            return {
                winner:
                    input.winner ??
                    "Player",

                playerPair:
                    input.playerPair ??
                    false,

                bankerPair:
                    input.bankerPair ??
                    false,

                natural:
                    input.natural ??
                    false,

                betAmount:
                    input.betAmount ??
                    100,

                profit:
                    input.profit ??
                    0
            };
        },

        destroy() {
            this.destroyed =
                true;
        },

        get summary() {
            return {
                hasShoe:
                    this.initialized > 0,

                shoeNumber:
                    1,

                roundNumber:
                    this.startedRounds
            };
        }
    };
}


function createShoeManager() {
    return {
        created: 0,
        resetCount: 0,
        roundNumber: 0,
        records: [],
        needNewShoe: false,
        completed: 0,
        destroyed: false,

        async create() {
            this.created++;
        },

        beginRound() {
            this.roundNumber++;

            return {
                shoeNumber:
                    this.created,
                roundNumber:
                    this.roundNumber
            };
        },

        recordRound(result) {
            this.records.push(
                result
            );
        },

        needsNewShoe() {
            return this.needNewShoe;
        },

        complete() {
            this.completed++;

            return {
                completed:
                    true
            };
        },

        async reset() {
            this.resetCount++;
            this.created++;
            this.roundNumber = 0;
            this.needNewShoe = false;
        },

        destroy() {
            this.destroyed =
                true;
        },

        get summary() {
            return {
                created:
                    this.created,
                roundNumber:
                    this.roundNumber
            };
        }
    };
}


export default async function sessionEngineTest() {
    const messages = [];

    assert(
        SESSION_ENGINE_VERSION ===
            "6.4.0" &&
        SESSION_STATE_VERSION ===
            "6.4.0" &&
        SESSION_HISTORY_VERSION ===
            "6.4.0" &&
        SESSION_STATISTICS_VERSION ===
            "6.4.0" &&
        SESSION_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "6.4.0" &&
        SESSION_ENGINE_FACTORY_VERSION ===
            "6.4.0",
        "V6.4 Session Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.4 Session Engine 版本正確"
    );

    let now = 100;

    const events = [];
    const storeCalls = [];

    const casinoEngine =
        createCasinoEngine();

    const shoeManager =
        createShoeManager();

    const session =
        new SessionEngine({
            casinoEngine,
            shoeManager,

            history:
                new SessionHistory({
                    limit:
                        10
                }),

            statistics:
                new SessionStatistics(),

            store: {
                async start(payload) {
                    storeCalls.push([
                        "start",
                        payload
                    ]);
                },

                async recordRound(payload) {
                    storeCalls.push([
                        "round",
                        payload
                    ]);
                },

                async end(payload) {
                    storeCalls.push([
                        "end",
                        payload
                    ]);
                }
            },

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            clock:
                () => now++
        });

    assert(
        session.state ===
            SessionState.IDLE,
        "Session initial state 錯誤"
    );

    await session.start({
        metadata: {
            table:
                "A"
        }
    });

    assert(
        session.state ===
            SessionState.ACTIVE &&
        session.summary.sessionId &&
        shoeManager.created ===
            1 &&
        storeCalls[0][0] ===
            "start",
        "Session start 錯誤"
    );

    messages.push(
        "✓ Session Start 與 Shoe Integration 正確"
    );

    await session.startRound({
        source:
            "manual"
    });

    assert(
        session.summary.hasActiveRound ===
            true &&
        casinoEngine.startedRounds ===
            1,
        "Session startRound 錯誤"
    );

    const firstResult =
        await session.completeRound({
            winner:
                "Player",

            playerPair:
                true,

            betAmount:
                100,

            profit:
                95
        });

    assert(
        firstResult.winner ===
            "Player" &&
        session.summary.roundCount ===
            1 &&
        session.summary.statistics
            .winners.Player ===
            1 &&
        session.summary.statistics
            .playerPairs ===
            1 &&
        session.summary.statistics
            .profit ===
            95 &&
        shoeManager.records.length ===
            1 &&
        storeCalls.some(
            record =>
                record[0] ===
                "round"
        ),
        "Round Collection 或 Statistics 錯誤"
    );

    messages.push(
        "✓ Round Collection 與 Session Statistics 正確"
    );

    session.pause();

    const pausedState =
        session.state;

    now += 10;

    session.resume();

    assert(
        pausedState ===
            SessionState.PAUSED &&
        session.state ===
            SessionState.ACTIVE &&
        session.summary
            .pausedDuration > 0,
        "Pause／Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    shoeManager.needNewShoe =
        true;

    await session.startRound();

    assert(
        shoeManager.completed ===
            1 &&
        shoeManager.resetCount ===
            1 &&
        casinoEngine.startedRounds ===
            2,
        "New Shoe Integration 錯誤"
    );

    await session.completeRound({
        winner:
            "Banker",

        bankerPair:
            true,

        natural:
            true,

        betAmount:
            100,

        profit:
            -100
    });

    const completed =
        await session.stop(
            "manual"
        );

    assert(
        completed.completed ===
            true &&
        completed.roundCount ===
            2 &&
        session.state ===
            SessionState.COMPLETED &&
        session.summary.history
            .count === 1 &&
        session.summary.statistics
            .winners.Banker ===
            1 &&
        session.summary.statistics
            .bankerPairs ===
            1 &&
        session.summary.statistics
            .naturals ===
            1 &&
        storeCalls.some(
            record =>
                record[0] ===
                "end"
        ),
        "Session Stop／Summary／History 錯誤"
    );

    messages.push(
        "✓ Session Stop、Summary 與 History 正確"
    );

    const adapterSession =
        new SessionEngine({
            casinoEngine:
                createCasinoEngine(),

            shoeManager:
                createShoeManager()
        });

    const adapter =
        new SessionEngineRuntimeAdapter({
            session:
                adapterSession
        });

    await adapter.start();

    await adapter.startRound();

    await adapter.completeRound({
        winner:
            "Tie"
    });

    await adapter.stop();

    assert(
        adapter.summary.session
            .roundCount === 1 &&
        adapter.summary.session
            .state ===
            SessionState.COMPLETED,
        "Session Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                SessionEvent.STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                SessionEvent.PAUSED
        ) &&
        events.some(
            event =>
                event.type ===
                SessionEvent.RESUMED
        ) &&
        events.some(
            event =>
                event.type ===
                SessionEvent.ROUND_COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                SessionEvent.COMPLETED
        ),
        "Session Events 錯誤"
    );

    messages.push(
        "✓ Session Events 正確"
    );

    assert(
        session.summary.version ===
            "6.4.0" &&
        session.summary.lastError ===
            null &&
        session.summary.history.count ===
            1,
        "Session summary 錯誤"
    );

    session.destroy();

    assert(
        session.state ===
            SessionState.DESTROYED &&
        session.summary.destroyed ===
            true &&
        casinoEngine.destroyed ===
            true &&
        shoeManager.destroyed ===
            true,
        "Session destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Session Engine V6.4 測試完成

Session Start：通過
Pause／Resume：通過
Shoe Integration：通過
Round Collection：通過
Session Statistics：通過
Session Store：通過
New Shoe：通過
Session Summary：通過
Session History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
