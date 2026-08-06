/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/AIFeedbackIntegration.js
 * Purpose: Coordinates execution feedback analysis, routing and subsystem calibration.
 */
import {
    FeedbackIntegrationState,
    FeedbackIntegrationAction
} from "./FeedbackIntegrationState.js";

import FeedbackIntegrationContext
    from "./FeedbackIntegrationContext.js";

import FeedbackInputCollector
    from "./FeedbackInputCollector.js";

import ExecutionFeedbackAnalyzer
    from "./ExecutionFeedbackAnalyzer.js";

import PerformanceFeedbackAnalyzer
    from "./PerformanceFeedbackAnalyzer.js";

import FeedbackRouter
    from "./FeedbackRouter.js";

import PredictionFeedbackCalibrator
    from "./PredictionFeedbackCalibrator.js";

import DecisionFeedbackCalibrator
    from "./DecisionFeedbackCalibrator.js";

import StrategyFeedbackCalibrator
    from "./StrategyFeedbackCalibrator.js";

import SimulationFeedbackCalibrator
    from "./SimulationFeedbackCalibrator.js";

import FeedbackSnapshot
    from "./FeedbackSnapshot.js";

import FeedbackIntegrationHistory
    from "./FeedbackIntegrationHistory.js";


export const AI_FEEDBACK_INTEGRATION_VERSION = "9.9.0";

export const FeedbackIntegrationEvent = Object.freeze({
    STATE_CHANGE:
        "ai-feedback-integration:state-change",
    STARTED:
        "ai-feedback-integration:started",
    INPUT_COLLECTED:
        "ai-feedback-integration:input-collected",
    EXECUTION_ANALYZED:
        "ai-feedback-integration:execution-analyzed",
    PERFORMANCE_ANALYZED:
        "ai-feedback-integration:performance-analyzed",
    FEEDBACK_ROUTED:
        "ai-feedback-integration:feedback-routed",
    CALIBRATIONS_CREATED:
        "ai-feedback-integration:calibrations-created",
    SNAPSHOT_CREATED:
        "ai-feedback-integration:snapshot-created",
    COMPLETED:
        "ai-feedback-integration:completed",
    PAUSED:
        "ai-feedback-integration:paused",
    RESUMED:
        "ai-feedback-integration:resumed",
    ERROR:
        "ai-feedback-integration:error",
    DESTROYED:
        "ai-feedback-integration:destroyed"
});


export default class AIFeedbackIntegration {
    constructor({
        collector = null,
        executionAnalyzer = null,
        performanceAnalyzer = null,
        router = null,
        predictionCalibrator = null,
        decisionCalibrator = null,
        strategyCalibrator = null,
        simulationCalibrator = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (
            eventBus !== null &&
            typeof eventBus.emit !== "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (
            typeof clock !== "function"
        ) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.collector =
            collector ??
            new FeedbackInputCollector();

        this.executionAnalyzer =
            executionAnalyzer ??
            new ExecutionFeedbackAnalyzer();

        this.performanceAnalyzer =
            performanceAnalyzer ??
            new PerformanceFeedbackAnalyzer();

        this.router =
            router ??
            new FeedbackRouter();

        this.predictionCalibrator =
            predictionCalibrator ??
            new PredictionFeedbackCalibrator();

        this.decisionCalibrator =
            decisionCalibrator ??
            new DecisionFeedbackCalibrator();

        this.strategyCalibrator =
            strategyCalibrator ??
            new StrategyFeedbackCalibrator();

        this.simulationCalibrator =
            simulationCalibrator ??
            new SimulationFeedbackCalibrator();

        this.history =
            history ??
            new FeedbackIntegrationHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.state =
            FeedbackIntegrationState.IDLE;

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

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(
                type,
                payload,
                {
                    source:
                        "ai-feedback-integration"
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
            FeedbackIntegrationEvent.STATE_CHANGE,
            {
                previous,
                current: state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "AIFeedbackIntegration has been destroyed."
            );
        }
    }

    async run({
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const feedbackContext =
            context instanceof
                FeedbackIntegrationContext
                ? context
                : new FeedbackIntegrationContext(
                    context
                );

        this.sequence++;

        const integrationId =
            `feedback-integration-${this.clock()}-${this.sequence}`;

        this.setState(
            FeedbackIntegrationState.COLLECTING
        );

        this.emit(
            FeedbackIntegrationEvent.STARTED,
            {
                integrationId,
                context: feedbackContext
            }
        );

        try {
            const input =
                this.collector.collect(
                    feedbackContext
                );

            this.emit(
                FeedbackIntegrationEvent.INPUT_COLLECTED,
                input
            );

            this.setState(
                FeedbackIntegrationState.ANALYZING
            );

            const executionFeedback =
                this.executionAnalyzer.analyze({
                    execution:
                        input.execution ??
                        {},
                    actualOutcome:
                        input.actualOutcome ??
                        {}
                });

            this.emit(
                FeedbackIntegrationEvent.EXECUTION_ANALYZED,
                executionFeedback
            );

            const performance =
                this.performanceAnalyzer.analyze({
                    executionFeedback,
                    learning:
                        input.learning ??
                        {},
                    bankroll:
                        input.bankroll ??
                        {},
                    statistics:
                        input.statistics ??
                        {}
                });

            this.emit(
                FeedbackIntegrationEvent.PERFORMANCE_ANALYZED,
                performance
            );

            this.setState(
                FeedbackIntegrationState.DISTRIBUTING
            );

            const routed =
                this.router.route({
                    executionFeedback,
                    performance,
                    input
                });

            this.emit(
                FeedbackIntegrationEvent.FEEDBACK_ROUTED,
                routed
            );

            this.setState(
                FeedbackIntegrationState.CALIBRATING
            );

            const calibrations = {
                prediction:
                    this.predictionCalibrator.calibrate(
                        routed.prediction
                    ),
                decision:
                    this.decisionCalibrator.calibrate(
                        routed.decision
                    ),
                strategy:
                    this.strategyCalibrator.calibrate(
                        routed.strategy
                    ),
                simulation:
                    this.simulationCalibrator.calibrate(
                        routed.simulation
                    )
            };

            this.emit(
                FeedbackIntegrationEvent.CALIBRATIONS_CREATED,
                calibrations
            );

            const action =
                performance.severeNegative
                    ? FeedbackIntegrationAction.ROLLBACK
                    : performance.positive
                        ? FeedbackIntegrationAction.UPDATE
                        : FeedbackIntegrationAction.OBSERVE;

            const snapshot =
                new FeedbackSnapshot({
                    snapshotId:
                        `feedback-snapshot-${this.clock()}-${this.sequence}`,
                    executionFeedback,
                    performance,
                    routed,
                    calibrations,
                    action,
                    createdAt:
                        this.clock()
                });

            this.emit(
                FeedbackIntegrationEvent.SNAPSHOT_CREATED,
                snapshot
            );

            const result = {
                version:
                    AI_FEEDBACK_INTEGRATION_VERSION,
                integrationId,
                input,
                executionFeedback,
                performance,
                routed,
                calibrations,
                action,
                snapshot,
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
                FeedbackIntegrationState.COMPLETED
            );

            this.emit(
                FeedbackIntegrationEvent.COMPLETED,
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

    feedback(input = {}) {
        return this.run(input);
    }

    pause() {
        this.assertNotDestroyed();

        this.paused =
            true;

        this.setState(
            FeedbackIntegrationState.PAUSED
        );

        this.emit(
            FeedbackIntegrationEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused =
            false;

        this.setState(
            FeedbackIntegrationState.IDLE
        );

        this.emit(
            FeedbackIntegrationEvent.RESUMED,
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
            FeedbackIntegrationState.IDLE
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
            FeedbackIntegrationState.ERROR
        );

        this.emit(
            FeedbackIntegrationEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
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
            FeedbackIntegrationState.DESTROYED
        );

        this.emit(
            FeedbackIntegrationEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_FEEDBACK_INTEGRATION_VERSION,
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
                this.lastError?.message ??
                null,
            history:
                this.history.summary
        };
    }
}
