/**
 * Baccarat Analyzer V6.7
 * tests/casinoCoordinator.test.js
 */

import CasinoCoordinator, {
    CASINO_COORDINATOR_VERSION,
    CoordinatorEvent
} from "../casino/coordinator/CasinoCoordinator.js";

import {
    COORDINATOR_STATE_VERSION,
    CoordinatorState
} from "../casino/coordinator/CoordinatorState.js";

import EngineRegistry, {
    ENGINE_REGISTRY_VERSION
} from "../casino/coordinator/EngineRegistry.js";

import CoordinatorHistory, {
    COORDINATOR_HISTORY_VERSION
} from "../casino/coordinator/CoordinatorHistory.js";

import CasinoCoordinatorRuntimeAdapter, {
    CASINO_COORDINATOR_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/CasinoCoordinatorRuntimeAdapter.js";

import {
    CASINO_COORDINATOR_FACTORY_VERSION
} from "../casino/coordinator/createCasinoCoordinator.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createComponents() {
    const calls = [];

    const runtime = {
        initialized: 0,
        started: 0,
        paused: 0,
        resumed: 0,
        stopped: 0,
        destroyed: 0,

        initialize() {
            this.initialized++;
            calls.push(
                "runtime.initialize"
            );
        },

        start() {
            this.started++;
            calls.push(
                "runtime.start"
            );
        },

        pause() {
            this.paused++;
        },

        resume() {
            this.resumed++;
        },

        stop() {
            this.stopped++;
            calls.push(
                "runtime.stop"
            );
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                state:
                    "ready",
                destroyed:
                    false,
                lastError:
                    null
            };
        }
    };

    const casino = {
        startedRounds: 0,
        completedRounds: 0,
        destroyed: 0,

        async startRound(input) {
            this.startedRounds++;

            return {
                input
            };
        },

        async completeRound(input) {
            this.completedRounds++;

            return {
                winner:
                    input.winner ??
                    "Player"
            };
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                state:
                    "ready",
                destroyed:
                    false,
                lastError:
                    null
            };
        }
    };

    const session = {
        started: 0,
        paused: 0,
        resumed: 0,
        stopped: 0,
        rounds: 0,
        currentRound: null,
        destroyed: 0,

        async start() {
            this.started++;
            calls.push(
                "session.start"
            );
        },

        async startRound(input) {
            this.rounds++;
            this.currentRound = {
                input
            };

            return this.currentRound;
        },

        async completeRound(input) {
            this.currentRound = null;

            return {
                roundId:
                    `round-${this.rounds}`,

                winner:
                    input.winner ??
                    "Banker",

                playerValue:
                    4,

                bankerValue:
                    7
            };
        },

        pause() {
            this.paused++;
        },

        resume() {
            this.resumed++;
        },

        async stop() {
            this.stopped++;
            calls.push(
                "session.stop"
            );
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                state:
                    "active",

                sessionId:
                    "session-1",

                roundCount:
                    this.rounds,

                statistics: {
                    roundCount:
                        this.rounds
                },

                destroyed:
                    false,

                lastError:
                    null
            };
        }
    };

    const analyzer = {
        analyzed: 0,
        destroyed: 0,

        async analyzeRound(input) {
            this.analyzed++;

            return {
                analysisId:
                    `analysis-${this.analyzed}`,

                mode:
                    "round",

                probability: {
                    Banker:
                        0.46
                },

                recommendation: {
                    action:
                        "bet",

                    bestBet:
                        "Banker"
                },

                input
            };
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                state:
                    "completed",
                destroyed:
                    false,
                lastError:
                    null
            };
        }
    };

    const dashboard = {
        mounted: 0,
        updated: 0,
        paused: 0,
        resumed: 0,
        destroyed: 0,

        mount() {
            this.mounted++;
        },

        async updateFromAnalysis(input) {
            this.updated++;

            return {
                rendered:
                    true,
                input
            };
        },

        pause() {
            this.paused++;
        },

        resume() {
            this.resumed++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                state:
                    "ready",
                destroyed:
                    false,
                lastError:
                    null
            };
        }
    };

    const shoe = {
        destroyed: 0,

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                state:
                    "ready",

                shoeNumber:
                    1,

                destroyed:
                    false,

                lastError:
                    null
            };
        }
    };

    return {
        calls,
        runtime,
        casino,
        session,
        analyzer,
        dashboard,
        shoe
    };
}


export default async function casinoCoordinatorTest() {
    const messages = [];

    assert(
        CASINO_COORDINATOR_VERSION ===
            "6.7.0" &&
        COORDINATOR_STATE_VERSION ===
            "6.7.0" &&
        ENGINE_REGISTRY_VERSION ===
            "6.7.0" &&
        COORDINATOR_HISTORY_VERSION ===
            "6.7.0" &&
        CASINO_COORDINATOR_RUNTIME_ADAPTER_VERSION ===
            "6.7.0" &&
        CASINO_COORDINATOR_FACTORY_VERSION ===
            "6.7.0",
        "V6.7 Casino Coordinator 版本錯誤"
    );

    messages.push(
        "✓ V6.7 Casino Coordinator 版本正確"
    );

    let now = 100;

    const events = [];

    const components =
        createComponents();

    const coordinator =
        new CasinoCoordinator({
            ...components,

            registry:
                new EngineRegistry(),

            history:
                new CoordinatorHistory({
                    limit:
                        10
                }),

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
        coordinator.state ===
            CoordinatorState.IDLE &&
        coordinator.summary.registry
            .count === 6 &&
        coordinator.summary.registry
            .names.includes(
                "session"
            ) &&
        coordinator.summary.registry
            .names.includes(
                "analyzer"
            ) &&
        coordinator.summary.registry
            .names.includes(
                "dashboard"
            ),
        "Engine Registry 錯誤"
    );

    messages.push(
        "✓ Engine Registry 正確"
    );

    await coordinator.initialize({
        dashboardTarget:
            "#dashboard"
    });

    assert(
        coordinator.state ===
            CoordinatorState.READY &&
        components.runtime
            .initialized === 1 &&
        components.dashboard
            .mounted === 1,
        "Coordinator initialize 錯誤"
    );

    messages.push(
        "✓ Initialize 與 Boot Sequence 正確"
    );

    await coordinator.start();

    assert(
        coordinator.state ===
            CoordinatorState.RUNNING &&
        components.runtime
            .started === 1 &&
        components.session
            .started === 1 &&
        components.calls[0] ===
            "runtime.initialize" &&
        components.calls[1] ===
            "runtime.start" &&
        components.calls[2] ===
            "session.start",
        "Coordinator start sequence 錯誤"
    );

    messages.push(
        "✓ Runtime 與 Session Start Sequence 正確"
    );

    const record =
        await coordinator.playRound({
            roundInput: {
                source:
                    "manual"
            },

            completeInput: {
                winner:
                    "Banker"
            },

            dashboardMetadata: {
                table:
                    "A"
            }
        });

    assert(
        record.roundResult.winner ===
            "Banker" &&
        record.analysis.mode ===
            "round" &&
        record.analysis
            .recommendation.bestBet ===
            "Banker" &&
        record.dashboard.rendered ===
            true &&
        coordinator.summary
            .hasRoundResult === true &&
        coordinator.summary
            .hasAnalysis === true &&
        coordinator.summary
            .hasDashboard === true &&
        coordinator.summary
            .history.count === 1,
        "Round → Analyze → Dashboard 協調錯誤"
    );

    messages.push(
        "✓ Round → Session → Analyzer → Dashboard 正確"
    );

    coordinator.pause();

    assert(
        coordinator.state ===
            CoordinatorState.PAUSED &&
        components.session
            .paused === 1 &&
        components.dashboard
            .paused === 1 &&
        components.runtime
            .paused === 1,
        "Coordinator pause 錯誤"
    );

    coordinator.resume();

    assert(
        coordinator.state ===
            CoordinatorState.RUNNING &&
        components.session
            .resumed === 1 &&
        components.dashboard
            .resumed === 1 &&
        components.runtime
            .resumed === 1,
        "Coordinator resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const health =
        coordinator.healthCheck();

    assert(
        health.healthy ===
            true &&
        health.unhealthyCount ===
            0 &&
        health.healthyCount ===
            coordinator.summary
                .registry.count,
        "Health Check 錯誤"
    );

    messages.push(
        "✓ Engine Health Check 正確"
    );

    const adapter =
        new CasinoCoordinatorRuntimeAdapter({
            coordinator
        });

    const adapterRecord =
        await adapter.playRound({
            completeInput: {
                winner:
                    "Player"
            }
        });

    assert(
        adapterRecord.roundResult
            .winner === "Player" &&
        adapter.summary.coordinator
            .operationCount === 2,
        "Coordinator Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    await coordinator.stop(
        "manual"
    );

    assert(
        coordinator.state ===
            CoordinatorState.STOPPED &&
        components.session
            .stopped === 1 &&
        components.runtime
            .stopped === 1 &&
        components.dashboard
            .paused === 2,
        "Coordinator stop 錯誤"
    );

    messages.push(
        "✓ Stop Sequence 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                CoordinatorEvent.INITIALIZED
        ) &&
        events.some(
            event =>
                event.type ===
                CoordinatorEvent.STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                CoordinatorEvent.ROUND_COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                CoordinatorEvent.ANALYSIS_COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                CoordinatorEvent.DASHBOARD_UPDATED
        ) &&
        events.some(
            event =>
                event.type ===
                CoordinatorEvent.HEALTH_CHECKED
        ),
        "Coordinator Events 錯誤"
    );

    messages.push(
        "✓ Coordinator Events 正確"
    );

    assert(
        coordinator.summary.version ===
            "6.7.0" &&
        coordinator.summary.lastError ===
            null &&
        coordinator.summary
            .operationCount === 2,
        "Coordinator summary 錯誤"
    );

    await coordinator.destroy();

    assert(
        coordinator.state ===
            CoordinatorState.DESTROYED &&
        coordinator.summary
            .destroyed === true &&
        coordinator.summary.registry
            .count === 0 &&
        coordinator.summary.history
            .count === 0 &&
        components.runtime
            .destroyed === 1 &&
        components.session
            .destroyed === 1 &&
        components.casino
            .destroyed === 1 &&
        components.analyzer
            .destroyed === 1 &&
        components.dashboard
            .destroyed === 1 &&
        components.shoe
            .destroyed === 1,
        "Coordinator destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Casino Coordinator V6.7 測試完成

Engine Registry：通過
Initialize：通過
Boot Sequence：通過
Runtime Start：通過
Session Start：通過
Round Coordination：通過
Analyzer Coordination：通過
Dashboard Coordination：通過
Pause／Resume：通過
Health Check：通過
History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
