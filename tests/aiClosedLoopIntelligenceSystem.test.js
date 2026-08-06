/**
 * Baccarat Analyzer V10.0
 * Path: tests/aiClosedLoopIntelligenceSystem.test.js
 * Purpose: Full V10.0 syntax-compatible runtime integration test.
 */
import {
    CLOSED_LOOP_STATE_VERSION,
    ClosedLoopState,
    ClosedLoopAction
} from "../integration/closedloop/ClosedLoopState.js";

import ClosedLoopContext, {
    CLOSED_LOOP_CONTEXT_VERSION
} from "../integration/closedloop/ClosedLoopContext.js";

import ObservationCollector, {
    OBSERVATION_COLLECTOR_VERSION
} from "../integration/closedloop/ObservationCollector.js";

import ClosedLoopStageGateway, {
    CLOSED_LOOP_STAGE_GATEWAY_VERSION
} from "../integration/closedloop/ClosedLoopStageGateway.js";

import ClosedLoopPipeline, {
    CLOSED_LOOP_PIPELINE_VERSION
} from "../integration/closedloop/ClosedLoopPipeline.js";

import ClosedLoopCheckpointStore, {
    CLOSED_LOOP_CHECKPOINT_STORE_VERSION
} from "../integration/closedloop/ClosedLoopCheckpointStore.js";

import ClosedLoopCycleResult, {
    CLOSED_LOOP_CYCLE_RESULT_VERSION
} from "../integration/closedloop/ClosedLoopCycleResult.js";

import ClosedLoopCycleHistory, {
    CLOSED_LOOP_CYCLE_HISTORY_VERSION
} from "../integration/closedloop/ClosedLoopCycleHistory.js";

import AIClosedLoopIntelligenceSystem, {
    AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_VERSION,
    ClosedLoopEvent
} from "../integration/closedloop/AIClosedLoopIntelligenceSystem.js";

import ClosedLoopRuntimeAdapter, {
    CLOSED_LOOP_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/ClosedLoopRuntimeAdapter.js";

import createAIClosedLoopIntelligenceSystem, {
    AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_FACTORY_VERSION
} from "../integration/closedloop/createAIClosedLoopIntelligenceSystem.js";


const assert = (
    condition,
    message
) => {
    if (!condition) {
        throw new Error(message);
    }
};


export default async function aiClosedLoopIntelligenceSystemTest() {
    const messages = [];

    assert(
        [
            CLOSED_LOOP_STATE_VERSION,
            CLOSED_LOOP_CONTEXT_VERSION,
            OBSERVATION_COLLECTOR_VERSION,
            CLOSED_LOOP_STAGE_GATEWAY_VERSION,
            CLOSED_LOOP_PIPELINE_VERSION,
            CLOSED_LOOP_CHECKPOINT_STORE_VERSION,
            CLOSED_LOOP_CYCLE_RESULT_VERSION,
            CLOSED_LOOP_CYCLE_HISTORY_VERSION,
            AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_VERSION,
            CLOSED_LOOP_RUNTIME_ADAPTER_VERSION,
            AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_FACTORY_VERSION
        ].every(
            version =>
                version === "10.0.0"
        ),
        "V10.0 AI Closed-Loop Intelligence System 版本錯誤"
    );

    assert(
        ClosedLoopAction.CONTINUE ===
            "continue",
        "Closed Loop Action 錯誤"
    );

    messages.push(
        "✓ V10.0 AI Closed-Loop Intelligence System 版本正確"
    );

    const context =
        new ClosedLoopContext({
            observation: {
                round: {
                    roundId: "r1"
                },
                shoe: {
                    remaining: 300
                },
                remainingCards: [
                    "AS",
                    "KH"
                ]
            },
            actualOutcome: {
                winner: "Banker",
                profit: 19
            },
            statistics: {
                roundCount: 20
            },
            roadmap: {
                bigRoad: [
                    "B",
                    "B",
                    "P"
                ]
            },
            bankroll: {
                balance: 1000
            },
            settings: {
                minimumConfidence: 0.5
            }
        });

    assert(
        context.actualOutcome.winner ===
            "Banker" &&
        context.bankroll.balance ===
            1000,
        "Closed Loop Context 錯誤"
    );

    messages.push(
        "✓ Closed Loop Context 正確"
    );

    const observation =
        new ObservationCollector()
            .collect(context);

    assert(
        observation.round.roundId ===
            "r1" &&
        observation.statistics.roundCount ===
            20,
        "Observation Collector 錯誤"
    );

    messages.push(
        "✓ Observation Collector 正確"
    );

    const target = {
        async runStage(input) {
            return {
                ok: true,
                input
            };
        }
    };

    const gateway =
        new ClosedLoopStageGateway({
            stageId: "test",
            target,
            method: "runStage"
        });

    const gatewayResult =
        await gateway.run({
            value: 1
        });

    assert(
        gatewayResult.ok &&
        gateway.summary.stageId ===
            "test",
        "Closed Loop Stage Gateway 錯誤"
    );

    messages.push(
        "✓ Closed Loop Stage Gateway 正確"
    );

    const pipeline =
        new ClosedLoopPipeline({
            stages: [
                {
                    stageId:
                        "test",
                    state:
                        ClosedLoopState.SIMULATING,
                    outputKey:
                        "test",
                    order:
                        1,
                    gateway
                }
            ]
        });

    assert(
        pipeline.summary.count ===
            1 &&
        pipeline.list()[0].stageId ===
            "test",
        "Closed Loop Pipeline 錯誤"
    );

    messages.push(
        "✓ Closed Loop Pipeline 正確"
    );

    const checkpointStore =
        new ClosedLoopCheckpointStore({
            limit: 20
        });

    checkpointStore.save({
        cycleId: "c1",
        stageId: "test"
    });

    assert(
        checkpointStore.summary.count ===
            1 &&
        checkpointStore.latest().cycleId ===
            "c1",
        "Closed Loop Checkpoint Store 錯誤"
    );

    checkpointStore.clear();

    messages.push(
        "✓ Closed Loop Checkpoint Store 正確"
    );

    const history =
        new ClosedLoopCycleHistory({
            limit: 20
        });

    const sampleResult =
        new ClosedLoopCycleResult({
            cycleId: "c1",
            action:
                ClosedLoopAction.CONTINUE,
            outputs: {},
            context: {},
            completedStages: [],
            skippedStages: [],
            startedAt: 1,
            completedAt: 2
        });

    history.add(
        sampleResult
    );

    assert(
        history.summary.count ===
            1 &&
        history.latest().cycleId ===
            "c1",
        "Closed Loop Cycle Result／History 錯誤"
    );

    history.clear();

    messages.push(
        "✓ Closed Loop Cycle Result 與 History 正確"
    );

    const calls = [];

    const createStage = (
        name,
        method,
        resultFactory
    ) => ({
        async [method](input) {
            calls.push(name);
            return resultFactory(input);
        }
    });

    const simulation =
        createStage(
            "simulation",
            "simulate",
            () => ({
                merged: {
                    probabilities: {
                        Player: 0.4,
                        Banker: 0.5,
                        Tie: 0.1
                    },
                    confidence: 0.2,
                    sourceCount: 3
                }
            })
        );

    const prediction =
        createStage(
            "prediction",
            "predict",
            () => ({
                predictedOutcome:
                    "Banker",
                confidence:
                    0.8
            })
        );

    const decision =
        createStage(
            "decision",
            "analyze",
            () => ({
                recommendation: {
                    action: "bet",
                    bestBet: "Banker",
                    confidence: 0.85,
                    recommendedAmount: 40
                }
            })
        );

    const strategy =
        createStage(
            "strategy",
            "strategize",
            () => ({
                action: "execute",
                plan: {
                    action: "bet",
                    betType: "Banker",
                    amount: 20,
                    strategyId:
                        "balanced"
                }
            })
        );

    const execution =
        createStage(
            "execution",
            "execute",
            () => ({
                action: "execute",
                monitoring: {
                    accepted: true,
                    amount: 20,
                    betType: "Banker"
                }
            })
        );

    const feedback =
        createStage(
            "feedback",
            "feedback",
            () => ({
                action: "update",
                performance: {
                    positive: true
                }
            })
        );

    const learning =
        createStage(
            "learning",
            "learn",
            () => ({
                reward: {
                    reward: 7
                },
                learned: true
            })
        );

    const adaptive =
        createStage(
            "adaptive",
            "adapt",
            () => ({
                action: "apply",
                snapshot: {
                    revision: 1
                }
            })
        );

    let now = 100;
    const events = [];

    const system =
        createAIClosedLoopIntelligenceSystem({
            simulation,
            prediction,
            decision,
            strategy,
            execution,
            feedback,
            learning,
            adaptive,
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
                () => now++
        });

    assert(
        system.state ===
            ClosedLoopState.IDLE &&
        system.summary.pipeline.count ===
            8,
        "Closed Loop initial state 錯誤"
    );

    const result =
        await system.run({
            context
        });

    assert(
        result.action ===
            ClosedLoopAction.CONTINUE &&
        result.completedStages.length ===
            8 &&
        result.outputs.simulation &&
        result.outputs.prediction &&
        result.outputs.decision &&
        result.outputs.strategy &&
        result.outputs.execution &&
        result.outputs.feedback &&
        result.outputs.learning &&
        result.outputs.adaptive &&
        system.state ===
            ClosedLoopState.COMPLETED &&
        system.summary.cycleCount ===
            1 &&
        system.summary.history.count ===
            1 &&
        system.summary.checkpoints.count ===
            8,
        "AI Closed-Loop Intelligence System 錯誤"
    );

    messages.push(
        "✓ Observe → Simulate → Predict → Decide → Strategize → Execute → Feedback → Learn → Adapt 正確"
    );

    assert(
        calls.join(",") ===
            "simulation,prediction,decision,strategy,execution,feedback,learning,adaptive",
        "Closed Loop Stage Order 錯誤"
    );

    messages.push(
        "✓ Closed Loop Stage Order 正確"
    );

    const noOutcomeContext =
        new ClosedLoopContext({
            observation: {
                round: {
                    roundId: "r2"
                }
            }
        });

    const noOutcomeResult =
        await system.run({
            context:
                noOutcomeContext
        });

    assert(
        noOutcomeResult.skippedStages.includes(
            "feedback"
        ) &&
        noOutcomeResult.skippedStages.includes(
            "learning"
        ) &&
        noOutcomeResult.skippedStages.includes(
            "adaptive"
        ),
        "Conditional Stage Skip 錯誤"
    );

    messages.push(
        "✓ Conditional Stage Skip 正確"
    );

    system.pause();

    assert(
        await system.run({
            context
        }) === null &&
        system.state ===
            ClosedLoopState.PAUSED,
        "Pause 錯誤"
    );

    system.resume();

    assert(
        system.state ===
            ClosedLoopState.IDLE &&
        !system.summary.paused,
        "Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new ClosedLoopRuntimeAdapter({
            system
        });

    const adapterResult =
        await adapter.cycle({
            context
        });

    assert(
        adapterResult &&
        adapter.summary.system.cycleCount ===
            3,
        "Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            ClosedLoopEvent.CYCLE_STARTED,
            ClosedLoopEvent.OBSERVATION_COLLECTED,
            ClosedLoopEvent.STAGE_STARTED,
            ClosedLoopEvent.STAGE_COMPLETED,
            ClosedLoopEvent.STAGE_SKIPPED,
            ClosedLoopEvent.CHECKPOINT_SAVED,
            ClosedLoopEvent.CYCLE_COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type === type
                )
        ),
        "Closed Loop Events 錯誤"
    );

    messages.push(
        "✓ Closed Loop Events 正確"
    );

    system.reset();

    assert(
        system.state ===
            ClosedLoopState.IDLE &&
        system.summary.cycleCount ===
            0 &&
        system.summary.history.count ===
            0 &&
        system.summary.checkpoints.count ===
            0,
        "Reset 錯誤"
    );

    system.destroy();

    assert(
        system.state ===
            ClosedLoopState.DESTROYED &&
        system.summary.destroyed,
        "Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Closed-Loop Intelligence System V10.0 測試完成

Closed Loop State：通過
Closed Loop Context：通過
Observation Collector：通過
Closed Loop Stage Gateway：通過
Closed Loop Pipeline：通過
Closed Loop Checkpoint Store：通過
Closed Loop Cycle Result：通過
Closed Loop Cycle History：通過
AI Closed-Loop Intelligence System：通過
Closed Loop Stage Order：通過
Conditional Stage Skip：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
