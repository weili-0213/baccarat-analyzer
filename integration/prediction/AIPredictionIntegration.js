/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/AIPredictionIntegration.js
 * Purpose: Coordinates feature extraction, prediction, calibration and fusion.
 */

import {
    PredictionIntegrationState,
    PredictionAction
} from "./PredictionIntegrationState.js";

import PredictionIntegrationContext
    from "./PredictionIntegrationContext.js";

import PredictionInputCollector
    from "./PredictionInputCollector.js";

import PredictionFeatureExtractor
    from "./PredictionFeatureExtractor.js";

import PredictionCalibrator
    from "./PredictionCalibrator.js";

import PredictionFusionEngine
    from "./PredictionFusionEngine.js";

import PredictionIntegrationHistory
    from "./PredictionIntegrationHistory.js";


export const AI_PREDICTION_INTEGRATION_VERSION = "9.4.0";

export const PredictionIntegrationEvent = Object.freeze({
    STATE_CHANGE: "ai-prediction-integration:state-change",
    STARTED: "ai-prediction-integration:started",
    INPUT_COLLECTED: "ai-prediction-integration:input-collected",
    FEATURES_EXTRACTED: "ai-prediction-integration:features-extracted",
    TREND_PREDICTED: "ai-prediction-integration:trend-predicted",
    PATTERN_PREDICTED: "ai-prediction-integration:pattern-predicted",
    PREDICTIONS_CALIBRATED: "ai-prediction-integration:predictions-calibrated",
    PREDICTIONS_FUSED: "ai-prediction-integration:predictions-fused",
    COMPLETED: "ai-prediction-integration:completed",
    PAUSED: "ai-prediction-integration:paused",
    RESUMED: "ai-prediction-integration:resumed",
    ERROR: "ai-prediction-integration:error",
    DESTROYED: "ai-prediction-integration:destroyed"
});


function isFunction(value) {
    return typeof value ===
        "function";
}


export default class AIPredictionIntegration {
    constructor({
        collector = null,
        featureExtractor = null,
        trendGateway,
        patternGateway,
        calibrator = null,
        fusion = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (
            !trendGateway ||
            !isFunction(
                trendGateway
                    .predict
            )
        ) {
            throw new TypeError(
                "AIPredictionIntegration requires trendGateway."
            );
        }

        if (
            !patternGateway ||
            !isFunction(
                patternGateway
                    .predict
            )
        ) {
            throw new TypeError(
                "AIPredictionIntegration requires patternGateway."
            );
        }

        if (
            eventBus !== null &&
            !isFunction(
                eventBus.emit
            )
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (
            !isFunction(
                clock
            )
        ) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.collector =
            collector ??
            new PredictionInputCollector();

        this.featureExtractor =
            featureExtractor ??
            new PredictionFeatureExtractor();

        this.trendGateway =
            trendGateway;

        this.patternGateway =
            patternGateway;

        this.calibrator =
            calibrator ??
            new PredictionCalibrator();

        this.fusion =
            fusion ??
            new PredictionFusionEngine();

        this.history =
            history ??
            new PredictionIntegrationHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.state =
            PredictionIntegrationState.IDLE;

        this.previousState =
            null;

        this.paused =
            false;

        this.destroyed =
            false;

        this.sequence =
            0;

        this.runCount =
            0;

        this.lastResult =
            null;

        this.lastError =
            null;
    }

    emit(
        type,
        payload = null
    ) {
        return (
            this.eventBus
                ?.emit(
                    type,
                    payload,
                    {
                        source:
                            "ai-prediction-integration"
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
            PredictionIntegrationEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (
            this.destroyed
        ) {
            throw new Error(
                "AIPredictionIntegration has been destroyed."
            );
        }
    }

    async run({
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        if (
            this.paused
        ) {
            return null;
        }

        const predictionContext =
            context instanceof
                PredictionIntegrationContext
                ? context
                : new PredictionIntegrationContext(
                    context
                );

        this.sequence++;

        const integrationId =
            `prediction-integration-${this.clock()}-${this.sequence}`;

        this.setState(
            PredictionIntegrationState.COLLECTING
        );

        this.emit(
            PredictionIntegrationEvent.STARTED,
            {
                integrationId,
                context:
                    predictionContext
            }
        );

        try {
            const input =
                this.collector
                    .collect(
                        predictionContext
                    );

            this.emit(
                PredictionIntegrationEvent.INPUT_COLLECTED,
                input
            );

            this.setState(
                PredictionIntegrationState.EXTRACTING
            );

            const features =
                this.featureExtractor
                    .extract(
                        input
                    );

            this.emit(
                PredictionIntegrationEvent.FEATURES_EXTRACTED,
                features
            );

            this.setState(
                PredictionIntegrationState.PREDICTING
            );

            const trendRaw =
                await this.trendGateway
                    .predict({
                        input,
                        features
                    });

            this.emit(
                PredictionIntegrationEvent.TREND_PREDICTED,
                trendRaw
            );

            const patternRaw =
                await this.patternGateway
                    .predict({
                        input,
                        features
                    });

            this.emit(
                PredictionIntegrationEvent.PATTERN_PREDICTED,
                patternRaw
            );

            this.setState(
                PredictionIntegrationState.CALIBRATING
            );

            const trend =
                this.calibrator
                    .calibrate({
                        prediction:
                            trendRaw
                    });

            const pattern =
                this.calibrator
                    .calibrate({
                        prediction:
                            patternRaw
                    });

            const simulation =
                this.calibrator
                    .calibrate({
                        prediction: {
                            probabilities:
                                input.simulation
                                    ?.merged
                                    ?.probabilities ??
                                input.simulation
                                    ?.probabilities ??
                                {},
                            confidence:
                                input.simulation
                                    ?.merged
                                    ?.confidence ??
                                input.simulation
                                    ?.confidence ??
                                0
                        }
                    });

            this.emit(
                PredictionIntegrationEvent.PREDICTIONS_CALIBRATED,
                {
                    trend,
                    pattern,
                    simulation
                }
            );

            this.setState(
                PredictionIntegrationState.FUSING
            );

            const fused =
                this.fusion
                    .fuse({
                        trend,
                        pattern,
                        simulation,
                        weights:
                            input.settings
                                ?.predictionWeights ??
                            {}
                    });

            this.emit(
                PredictionIntegrationEvent.PREDICTIONS_FUSED,
                fused
            );

            const minimumConfidence =
                input.settings
                    ?.minimumPredictionConfidence ??
                0.05;

            const action =
                fused.predictedOutcome ===
                    null
                    ? PredictionAction.ABSTAIN
                    : fused.confidence <
                        minimumConfidence
                        ? PredictionAction.WAIT
                        : PredictionAction.PREDICT;

            const result = {
                version:
                    AI_PREDICTION_INTEGRATION_VERSION,
                integrationId,
                input,
                features,
                trend,
                pattern,
                simulation,
                fused,
                action,
                predictedOutcome:
                    fused.predictedOutcome,
                confidence:
                    fused.confidence,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.runCount++;

            this.history.add(
                result
            );

            this.setState(
                PredictionIntegrationState.COMPLETED
            );

            this.emit(
                PredictionIntegrationEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "run"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused =
            true;

        this.setState(
            PredictionIntegrationState.PAUSED
        );

        this.emit(
            PredictionIntegrationEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused =
            false;

        this.setState(
            PredictionIntegrationState.IDLE
        );

        this.emit(
            PredictionIntegrationEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.runCount =
            0;

        this.lastResult =
            null;

        this.lastError =
            null;

        this.paused =
            false;

        this.setState(
            PredictionIntegrationState.IDLE
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
            PredictionIntegrationState.ERROR
        );

        this.emit(
            PredictionIntegrationEvent.ERROR,
            {
                phase,
                message:
                    error
                        ?.message ??
                    String(
                        error
                    )
            }
        );

        throw error;
    }

    destroy() {
        if (
            this.destroyed
        ) {
            return this;
        }

        this.history.clear();

        this.lastResult =
            null;

        this.lastError =
            null;

        this.destroyed =
            true;

        this.setState(
            PredictionIntegrationState.DESTROYED
        );

        this.emit(
            PredictionIntegrationEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_PREDICTION_INTEGRATION_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            runCount:
                this.runCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            collector:
                this.collector.summary,
            featureExtractor:
                this.featureExtractor.summary,
            trendGateway:
                this.trendGateway.summary,
            patternGateway:
                this.patternGateway.summary,
            calibrator:
                this.calibrator.summary,
            fusion:
                this.fusion.summary,
            history:
                this.history.summary
        };
    }
}
