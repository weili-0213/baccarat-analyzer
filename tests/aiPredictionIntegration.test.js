/**
 * Baccarat Analyzer V9.4
 * Path: tests/aiPredictionIntegration.test.js
 * Purpose: Full V9.4 syntax-compatible runtime integration test.
 */

import {
    PREDICTION_INTEGRATION_STATE_VERSION,
    PredictionIntegrationState,
    PredictionAction
} from "../integration/prediction/PredictionIntegrationState.js";

import PredictionIntegrationContext, {
    PREDICTION_INTEGRATION_CONTEXT_VERSION
} from "../integration/prediction/PredictionIntegrationContext.js";

import PredictionInputCollector, {
    PREDICTION_INPUT_COLLECTOR_VERSION
} from "../integration/prediction/PredictionInputCollector.js";

import PredictionFeatureExtractor, {
    PREDICTION_FEATURE_EXTRACTOR_VERSION
} from "../integration/prediction/PredictionFeatureExtractor.js";

import TrendPredictionGateway, {
    TREND_PREDICTION_GATEWAY_VERSION
} from "../integration/prediction/TrendPredictionGateway.js";

import PatternPredictionGateway, {
    PATTERN_PREDICTION_GATEWAY_VERSION
} from "../integration/prediction/PatternPredictionGateway.js";

import PredictionCalibrator, {
    PREDICTION_CALIBRATOR_VERSION
} from "../integration/prediction/PredictionCalibrator.js";

import PredictionFusionEngine, {
    PREDICTION_FUSION_ENGINE_VERSION
} from "../integration/prediction/PredictionFusionEngine.js";

import PredictionIntegrationHistory, {
    PREDICTION_INTEGRATION_HISTORY_VERSION
} from "../integration/prediction/PredictionIntegrationHistory.js";

import AIPredictionIntegration, {
    AI_PREDICTION_INTEGRATION_VERSION,
    PredictionIntegrationEvent
} from "../integration/prediction/AIPredictionIntegration.js";

import PredictionIntegrationRuntimeAdapter, {
    PREDICTION_INTEGRATION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/PredictionIntegrationRuntimeAdapter.js";

import {
    AI_PREDICTION_INTEGRATION_FACTORY_VERSION
} from "../integration/prediction/createAIPredictionIntegration.js";


function assert(
    condition,
    message
) {
    if (
        !condition
    ) {
        throw new Error(
            message
        );
    }
}


export default async function aiPredictionIntegrationTest() {
    const messages =
        [];

    assert(
        [
            PREDICTION_INTEGRATION_STATE_VERSION,
            PREDICTION_INTEGRATION_CONTEXT_VERSION,
            PREDICTION_INPUT_COLLECTOR_VERSION,
            PREDICTION_FEATURE_EXTRACTOR_VERSION,
            TREND_PREDICTION_GATEWAY_VERSION,
            PATTERN_PREDICTION_GATEWAY_VERSION,
            PREDICTION_CALIBRATOR_VERSION,
            PREDICTION_FUSION_ENGINE_VERSION,
            PREDICTION_INTEGRATION_HISTORY_VERSION,
            AI_PREDICTION_INTEGRATION_VERSION,
            PREDICTION_INTEGRATION_RUNTIME_ADAPTER_VERSION,
            AI_PREDICTION_INTEGRATION_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "9.4.0"
        ),
        "V9.4 AI Prediction Integration 版本錯誤"
    );

    assert(
        PredictionAction.PREDICT ===
            "predict",
        "Prediction Action 錯誤"
    );

    messages.push(
        "✓ V9.4 AI Prediction Integration 版本正確"
    );

    const context =
        new PredictionIntegrationContext({
            simulation: {
                merged: {
                    probabilities: {
                        Player:
                            0.44,
                        Banker:
                            0.47,
                        Tie:
                            0.09
                    },
                    confidence:
                        0.15
                }
            },
            statistics: {
                roundCount:
                    20
            },
            roadmap: {
                bigRoad: [
                    "B",
                    "B",
                    "P"
                ]
            },
            recentOutcomes: [
                "Banker",
                "Banker",
                "Player",
                "Banker"
            ],
            settings: {
                minimumPredictionConfidence:
                    0.05
            }
        });

    assert(
        context.recentOutcomes
            .length === 4 &&
        context.simulation
            .merged
            .probabilities
            .Banker === 0.47,
        "Prediction Integration Context 錯誤"
    );

    messages.push(
        "✓ Prediction Integration Context 正確"
    );

    const input =
        new PredictionInputCollector()
            .collect(
                context
            );

    assert(
        input.recentOutcomes
            .length === 4 &&
        input.roadmap
            .bigRoad
            .length === 3,
        "Prediction Input Collector 錯誤"
    );

    messages.push(
        "✓ Prediction Input Collector 正確"
    );

    const features =
        new PredictionFeatureExtractor()
            .extract(
                input
            );

    assert(
        features.recentBankerRate ===
            0.75 &&
        features.roadmapSize ===
            3 &&
        features.simulationBanker ===
            0.47,
        "Prediction Feature Extractor 錯誤"
    );

    messages.push(
        "✓ Prediction Feature Extractor 正確"
    );

    const trendPredictor = {
        async predict() {
            return {
                probabilities: {
                    Player:
                        0.4,
                    Banker:
                        0.52,
                    Tie:
                        0.08
                },
                confidence:
                    0.7
            };
        }
    };

    const patternPredictor = {
        async predict() {
            return {
                probabilities: {
                    Player:
                        0.43,
                    Banker:
                        0.49,
                    Tie:
                        0.08
                },
                confidence:
                    0.6
            };
        }
    };

    const trendGateway =
        new TrendPredictionGateway({
            predictor:
                trendPredictor
        });

    const patternGateway =
        new PatternPredictionGateway({
            predictor:
                patternPredictor
        });

    assert(
        (
            await trendGateway
                .predict({})
        ).probabilities.Banker ===
            0.52,
        "Trend Prediction Gateway 錯誤"
    );

    assert(
        (
            await patternGateway
                .predict({})
        ).probabilities.Banker ===
            0.49,
        "Pattern Prediction Gateway 錯誤"
    );

    messages.push(
        "✓ Trend、Pattern Prediction Gateway 正確"
    );

    const calibrator =
        new PredictionCalibrator();

    const calibrated =
        calibrator.calibrate({
            prediction: {
                probabilities: {
                    Player:
                        44,
                    Banker:
                        47,
                    Tie:
                        9
                },
                confidence:
                    1.2
            }
        });

    assert(
        calibrated
            .probabilities
            .Banker === 0.47 &&
        calibrated
            .confidence === 1,
        "Prediction Calibrator 錯誤"
    );

    messages.push(
        "✓ Prediction Calibrator 正確"
    );

    const fused =
        new PredictionFusionEngine()
            .fuse({
                trend:
                    await trendGateway
                        .predict({}),
                pattern:
                    await patternGateway
                        .predict({}),
                simulation: {
                    probabilities: {
                        Player:
                            0.44,
                        Banker:
                            0.47,
                        Tie:
                            0.09
                    },
                    confidence:
                        0.5
                }
            });

    assert(
        fused.predictedOutcome ===
            "Banker" &&
        fused.sourceCount ===
            3 &&
        fused.probabilities
            .Banker >
            fused.probabilities
                .Player,
        "Prediction Fusion Engine 錯誤"
    );

    messages.push(
        "✓ Prediction Fusion Engine 正確"
    );

    let now =
        100;

    const events =
        [];

    const integration =
        new AIPredictionIntegration({
            trendGateway,
            patternGateway,
            history:
                new PredictionIntegrationHistory({
                    limit:
                        20
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
                () =>
                    now++
        });

    assert(
        integration.state ===
            PredictionIntegrationState.IDLE,
        "Prediction Integration initial state 錯誤"
    );

    const result =
        await integration.run({
            context
        });

    assert(
        result.predictedOutcome ===
            "Banker" &&
        result.action ===
            PredictionAction.PREDICT &&
        result.confidence >
            0 &&
        integration.state ===
            PredictionIntegrationState.COMPLETED &&
        integration.summary
            .runCount === 1 &&
        integration.summary
            .history.count === 1,
        "AI Prediction Integration 錯誤"
    );

    messages.push(
        "✓ Collect → Extract → Predict → Calibrate → Fuse 正確"
    );

    const waitResult =
        await integration.run({
            context:
                new PredictionIntegrationContext({
                    simulation: {
                        merged: {
                            probabilities: {
                                Player:
                                    0.5,
                                Banker:
                                    0.5,
                                Tie:
                                    0
                            },
                            confidence:
                                0
                        }
                    },
                    settings: {
                        minimumPredictionConfidence:
                            1
                    }
                })
        });

    assert(
        waitResult.action ===
            PredictionAction.WAIT,
        "Prediction Wait Decision 錯誤"
    );

    messages.push(
        "✓ Prediction Wait Decision 正確"
    );

    integration.pause();

    const pausedResult =
        await integration.run({
            context
        });

    assert(
        integration.state ===
            PredictionIntegrationState.PAUSED &&
        pausedResult ===
            null,
        "Prediction Integration Pause 錯誤"
    );

    integration.resume();

    assert(
        integration.state ===
            PredictionIntegrationState.IDLE &&
        integration.summary
            .paused === false,
        "Prediction Integration Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new PredictionIntegrationRuntimeAdapter({
            integration
        });

    const adapterResult =
        await adapter.predict({
            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary
            .integration
            .runCount === 3,
        "Prediction Integration Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            PredictionIntegrationEvent.STARTED,
            PredictionIntegrationEvent.INPUT_COLLECTED,
            PredictionIntegrationEvent.FEATURES_EXTRACTED,
            PredictionIntegrationEvent.TREND_PREDICTED,
            PredictionIntegrationEvent.PATTERN_PREDICTED,
            PredictionIntegrationEvent.PREDICTIONS_CALIBRATED,
            PredictionIntegrationEvent.PREDICTIONS_FUSED,
            PredictionIntegrationEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Prediction Integration Events 錯誤"
    );

    messages.push(
        "✓ Prediction Integration Events 正確"
    );

    integration.reset();

    assert(
        integration.state ===
            PredictionIntegrationState.IDLE &&
        integration.summary
            .runCount === 0 &&
        integration.summary
            .history.count === 0,
        "Prediction Integration Reset 錯誤"
    );

    integration.destroy();

    assert(
        integration.state ===
            PredictionIntegrationState.DESTROYED &&
        integration.summary
            .destroyed === true,
        "Prediction Integration Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Prediction Integration V9.4 測試完成

Prediction Integration State：通過
Prediction Integration Context：通過
Prediction Input Collector：通過
Prediction Feature Extractor：通過
Trend Prediction Gateway：通過
Pattern Prediction Gateway：通過
Prediction Calibrator：通過
Prediction Fusion Engine：通過
AI Prediction Integration：通過
Prediction Wait Decision：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
