/**
 * Baccarat Analyzer V9.9
 * Path: tests/aiFeedbackIntegration.test.js
 * Purpose: Full V9.9 syntax-compatible runtime integration test.
 */
import {
    FEEDBACK_INTEGRATION_STATE_VERSION,
    FeedbackIntegrationState,
    FeedbackIntegrationAction
} from "../integration/feedback/FeedbackIntegrationState.js";

import FeedbackIntegrationContext, {
    FEEDBACK_INTEGRATION_CONTEXT_VERSION
} from "../integration/feedback/FeedbackIntegrationContext.js";

import FeedbackInputCollector, {
    FEEDBACK_INPUT_COLLECTOR_VERSION
} from "../integration/feedback/FeedbackInputCollector.js";

import ExecutionFeedbackAnalyzer, {
    EXECUTION_FEEDBACK_ANALYZER_VERSION
} from "../integration/feedback/ExecutionFeedbackAnalyzer.js";

import PerformanceFeedbackAnalyzer, {
    PERFORMANCE_FEEDBACK_ANALYZER_VERSION
} from "../integration/feedback/PerformanceFeedbackAnalyzer.js";

import FeedbackRouter, {
    FEEDBACK_ROUTER_VERSION
} from "../integration/feedback/FeedbackRouter.js";

import PredictionFeedbackCalibrator, {
    PREDICTION_FEEDBACK_CALIBRATOR_VERSION
} from "../integration/feedback/PredictionFeedbackCalibrator.js";

import DecisionFeedbackCalibrator, {
    DECISION_FEEDBACK_CALIBRATOR_VERSION
} from "../integration/feedback/DecisionFeedbackCalibrator.js";

import StrategyFeedbackCalibrator, {
    STRATEGY_FEEDBACK_CALIBRATOR_VERSION
} from "../integration/feedback/StrategyFeedbackCalibrator.js";

import SimulationFeedbackCalibrator, {
    SIMULATION_FEEDBACK_CALIBRATOR_VERSION
} from "../integration/feedback/SimulationFeedbackCalibrator.js";

import FeedbackSnapshot, {
    FEEDBACK_SNAPSHOT_VERSION
} from "../integration/feedback/FeedbackSnapshot.js";

import FeedbackIntegrationHistory, {
    FEEDBACK_INTEGRATION_HISTORY_VERSION
} from "../integration/feedback/FeedbackIntegrationHistory.js";

import AIFeedbackIntegration, {
    AI_FEEDBACK_INTEGRATION_VERSION,
    FeedbackIntegrationEvent
} from "../integration/feedback/AIFeedbackIntegration.js";

import FeedbackIntegrationRuntimeAdapter, {
    FEEDBACK_INTEGRATION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/FeedbackIntegrationRuntimeAdapter.js";

import {
    AI_FEEDBACK_INTEGRATION_FACTORY_VERSION
} from "../integration/feedback/createAIFeedbackIntegration.js";


const assert = (
    condition,
    message
) => {
    if (!condition) {
        throw new Error(message);
    }
};


export default async function aiFeedbackIntegrationTest() {
    const messages = [];

    assert(
        [
            FEEDBACK_INTEGRATION_STATE_VERSION,
            FEEDBACK_INTEGRATION_CONTEXT_VERSION,
            FEEDBACK_INPUT_COLLECTOR_VERSION,
            EXECUTION_FEEDBACK_ANALYZER_VERSION,
            PERFORMANCE_FEEDBACK_ANALYZER_VERSION,
            FEEDBACK_ROUTER_VERSION,
            PREDICTION_FEEDBACK_CALIBRATOR_VERSION,
            DECISION_FEEDBACK_CALIBRATOR_VERSION,
            STRATEGY_FEEDBACK_CALIBRATOR_VERSION,
            SIMULATION_FEEDBACK_CALIBRATOR_VERSION,
            FEEDBACK_SNAPSHOT_VERSION,
            FEEDBACK_INTEGRATION_HISTORY_VERSION,
            AI_FEEDBACK_INTEGRATION_VERSION,
            FEEDBACK_INTEGRATION_RUNTIME_ADAPTER_VERSION,
            AI_FEEDBACK_INTEGRATION_FACTORY_VERSION
        ].every(
            version =>
                version === "9.9.0"
        ),
        "V9.9 AI Feedback Integration 版本錯誤"
    );

    assert(
        FeedbackIntegrationAction.UPDATE ===
            "update",
        "Feedback Action 錯誤"
    );

    messages.push(
        "✓ V9.9 AI Feedback Integration 版本正確"
    );

    const context =
        new FeedbackIntegrationContext({
            execution: {
                monitoring: {
                    accepted: true,
                    amount: 20,
                    betType: "Banker"
                }
            },
            actualOutcome: {
                winner: "Banker",
                profit: 19
            },
            learning: {
                reward: {
                    reward: 7
                }
            },
            strategy: {
                selection: {
                    strategy: {
                        strategyId: "balanced"
                    }
                }
            },
            prediction: {
                predictedOutcome: "Banker"
            },
            decision: {
                recommendation: {
                    bestBet: "Banker"
                }
            },
            simulation: {
                merged: {
                    sourceCount: 3
                }
            },
            bankroll: {
                balance: 1019
            },
            statistics: {
                roundCount: 21
            }
        });

    assert(
        context.actualOutcome.winner ===
            "Banker",
        "Feedback Context 錯誤"
    );

    messages.push(
        "✓ Feedback Integration Context 正確"
    );

    const input =
        new FeedbackInputCollector()
            .collect(context);

    assert(
        input.execution.monitoring.amount ===
            20 &&
        input.bankroll.balance ===
            1019,
        "Feedback Input Collector 錯誤"
    );

    messages.push(
        "✓ Feedback Input Collector 正確"
    );

    const executionFeedback =
        new ExecutionFeedbackAnalyzer()
            .analyze({
                execution:
                    input.execution,
                actualOutcome:
                    input.actualOutcome
            });

    assert(
        executionFeedback.accepted &&
        executionFeedback.correct &&
        executionFeedback.profit ===
            19,
        "Execution Feedback Analyzer 錯誤"
    );

    messages.push(
        "✓ Execution Feedback Analyzer 正確"
    );

    const performance =
        new PerformanceFeedbackAnalyzer()
            .analyze({
                executionFeedback,
                learning:
                    input.learning,
                bankroll:
                    input.bankroll,
                statistics:
                    input.statistics
            });

    assert(
        performance.positive &&
        performance.roi ===
            0.95 &&
        performance.quality >
            0.5,
        "Performance Feedback Analyzer 錯誤"
    );

    messages.push(
        "✓ Performance Feedback Analyzer 正確"
    );

    const routed =
        new FeedbackRouter()
            .route({
                executionFeedback,
                performance,
                input
            });

    assert(
        routed.prediction.correct &&
        routed.strategy.strategyId ===
            "balanced" &&
        routed.simulation.sourceCount ===
            3,
        "Feedback Router 錯誤"
    );

    messages.push(
        "✓ Feedback Router 正確"
    );

    const calibrations = {
        prediction:
            new PredictionFeedbackCalibrator()
                .calibrate(
                    routed.prediction
                ),
        decision:
            new DecisionFeedbackCalibrator()
                .calibrate(
                    routed.decision
                ),
        strategy:
            new StrategyFeedbackCalibrator()
                .calibrate(
                    routed.strategy
                ),
        simulation:
            new SimulationFeedbackCalibrator()
                .calibrate(
                    routed.simulation
                )
    };

    assert(
        calibrations.prediction
            .confidenceDelta >
            0 &&
        calibrations.decision
            .riskDelta >
            0 &&
        calibrations.strategy
            .scoreDelta >
            0 &&
        calibrations.simulation
            .weightDelta >
            0,
        "Feedback Calibrators 錯誤"
    );

    messages.push(
        "✓ Prediction、Decision、Strategy、Simulation Calibrator 正確"
    );

    const snapshot =
        new FeedbackSnapshot({
            snapshotId:
                "feedback-snapshot-1",
            executionFeedback,
            performance,
            routed,
            calibrations,
            action:
                FeedbackIntegrationAction.UPDATE
        });

    assert(
        snapshot.snapshotId ===
            "feedback-snapshot-1" &&
        snapshot.action ===
            "update",
        "Feedback Snapshot 錯誤"
    );

    messages.push(
        "✓ Feedback Snapshot 正確"
    );

    let now = 100;
    const events = [];

    const integration =
        new AIFeedbackIntegration({
            history:
                new FeedbackIntegrationHistory({
                    limit: 20
                }),
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
        integration.state ===
            FeedbackIntegrationState.IDLE,
        "Feedback initial state 錯誤"
    );

    const result =
        await integration.run({
            context
        });

    assert(
        result.action ===
            FeedbackIntegrationAction.UPDATE &&
        result.executionFeedback.correct &&
        result.performance.positive &&
        result.snapshot &&
        integration.state ===
            FeedbackIntegrationState.COMPLETED &&
        integration.summary.runCount ===
            1 &&
        integration.summary.history.count ===
            1,
        "AI Feedback Integration 錯誤"
    );

    messages.push(
        "✓ Collect → Analyze → Route → Calibrate → Snapshot 正確"
    );

    const rollbackResult =
        await integration.run({
            context:
                new FeedbackIntegrationContext({
                    execution: {
                        monitoring: {
                            accepted: true,
                            amount: 50,
                            betType: "Player"
                        }
                    },
                    actualOutcome: {
                        winner: "Banker",
                        profit: -50
                    },
                    learning: {
                        reward: {
                            reward: -5
                        }
                    },
                    strategy: {
                        selection: {
                            strategy: {
                                strategyId:
                                    "aggressive"
                            }
                        }
                    },
                    simulation: {
                        merged: {
                            sourceCount: 3
                        }
                    }
                })
        });

    assert(
        rollbackResult.action ===
            FeedbackIntegrationAction.ROLLBACK &&
        rollbackResult.performance.severeNegative,
        "Negative Feedback Rollback 錯誤"
    );

    messages.push(
        "✓ Negative Feedback Rollback 正確"
    );

    integration.pause();

    assert(
        await integration.run({
            context
        }) === null &&
        integration.state ===
            FeedbackIntegrationState.PAUSED,
        "Pause 錯誤"
    );

    integration.resume();

    assert(
        integration.state ===
            FeedbackIntegrationState.IDLE &&
        !integration.summary.paused,
        "Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new FeedbackIntegrationRuntimeAdapter({
            integration
        });

    const adapterResult =
        await adapter.feedback({
            context
        });

    assert(
        adapterResult &&
        adapter.summary.integration.runCount ===
            3,
        "Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            FeedbackIntegrationEvent.STARTED,
            FeedbackIntegrationEvent.INPUT_COLLECTED,
            FeedbackIntegrationEvent.EXECUTION_ANALYZED,
            FeedbackIntegrationEvent.PERFORMANCE_ANALYZED,
            FeedbackIntegrationEvent.FEEDBACK_ROUTED,
            FeedbackIntegrationEvent.CALIBRATIONS_CREATED,
            FeedbackIntegrationEvent.SNAPSHOT_CREATED,
            FeedbackIntegrationEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type === type
                )
        ),
        "Feedback Events 錯誤"
    );

    messages.push(
        "✓ Feedback Integration Events 正確"
    );

    integration.reset();

    assert(
        integration.state ===
            FeedbackIntegrationState.IDLE &&
        integration.summary.runCount ===
            0 &&
        integration.summary.history.count ===
            0,
        "Reset 錯誤"
    );

    integration.destroy();

    assert(
        integration.state ===
            FeedbackIntegrationState.DESTROYED &&
        integration.summary.destroyed,
        "Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Feedback Integration V9.9 測試完成

Feedback Integration State：通過
Feedback Integration Context：通過
Feedback Input Collector：通過
Execution Feedback Analyzer：通過
Performance Feedback Analyzer：通過
Feedback Router：通過
Prediction Feedback Calibrator：通過
Decision Feedback Calibrator：通過
Strategy Feedback Calibrator：通過
Simulation Feedback Calibrator：通過
Feedback Snapshot：通過
AI Feedback Integration：通過
Negative Feedback Rollback：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
