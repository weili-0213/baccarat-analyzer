/**
 * Baccarat Analyzer V7.0
 * casino/ai/AIDecisionEngine.js
 *
 * Rule-based and explainable AI decision fusion layer.
 */

import {
    AIState,
    AIAction
} from "./AIState.js";

import PatternRecognizer
    from "./PatternRecognizer.js";

import TrendPredictor
    from "./TrendPredictor.js";

import ProbabilityFusion
    from "./ProbabilityFusion.js";

import RecommendationModel
    from "./RecommendationModel.js";

import DecisionModel
    from "./DecisionModel.js";

import DecisionHistory
    from "./DecisionHistory.js";


export const AI_DECISION_ENGINE_VERSION = "7.0.0";

export const AIEvent = Object.freeze({
    STATE_CHANGE: "ai-decision:state-change",
    STARTED: "ai-decision:started",
    PATTERNS_FOUND: "ai-decision:patterns-found",
    TREND_PREDICTED: "ai-decision:trend-predicted",
    PROBABILITY_FUSED: "ai-decision:probability-fused",
    RECOMMENDATION_READY: "ai-decision:recommendation-ready",
    COMPLETED: "ai-decision:completed",
    SKIPPED: "ai-decision:skipped",
    WAITING: "ai-decision:waiting",
    ERROR: "ai-decision:error",
    DESTROYED: "ai-decision:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class AIDecisionEngine {
    constructor({
        patternRecognizer = null,
        trendPredictor = null,
        probabilityFusion = null,
        recommendationModel = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (!isFunction(clock)) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.patternRecognizer =
            patternRecognizer ??
            new PatternRecognizer();

        this.trendPredictor =
            trendPredictor ??
            new TrendPredictor();

        this.probabilityFusion =
            probabilityFusion ??
            new ProbabilityFusion();

        this.recommendationModel =
            recommendationModel ??
            new RecommendationModel();

        this.history =
            history ??
            new DecisionHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.sequence = 0;

        this.idFactory =
            idFactory ??
            (
                ({
                    sequence,
                    timestamp
                }) =>
                    `ai-decision-${timestamp}-${sequence}`
            );

        this.state =
            AIState.IDLE;

        this.previousState = null;
        this.lastDecision = null;
        this.lastError = null;
        this.evaluationCount = 0;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "ai-decision-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                AIState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown AIState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            AIEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "AIDecisionEngine has been destroyed."
            );
        }
    }

    async evaluate({
        analysis = {},
        roadmap = {},
        statistics = {},
        history = [],
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        this.evaluationCount++;
        this.sequence++;

        const createdAt =
            this.clock();

        const decisionId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp:
                    createdAt
            });

        this.setState(
            AIState.EVALUATING
        );

        this.emit(
            AIEvent.STARTED,
            {
                decisionId,
                analysis,
                roadmap,
                statistics
            }
        );

        try {
            const patterns =
                await this.patternRecognizer
                    .recognize({
                        history,
                        roadmap,
                        statistics
                    });

            this.emit(
                AIEvent.PATTERNS_FOUND,
                patterns
            );

            const trend =
                await this.trendPredictor
                    .predict({
                        patterns,
                        statistics,
                        history
                    });

            this.emit(
                AIEvent.TREND_PREDICTED,
                trend
            );

            const fusedProbability =
                await this.probabilityFusion
                    .fuse({
                        probability:
                            analysis.probability ??
                            {},
                        trend
                    });

            this.emit(
                AIEvent.PROBABILITY_FUSED,
                fusedProbability
            );

            const recommendation =
                await this.recommendationModel
                    .build({
                        fusedProbability,
                        analysis,
                        trend,
                        patterns
                    });

            this.emit(
                AIEvent.RECOMMENDATION_READY,
                recommendation
            );

            const score =
                this.calculateScore({
                    recommendation,
                    trend,
                    patterns
                });

            const decision =
                new DecisionModel({
                    decisionId,

                    action:
                        recommendation.action,

                    bestBet:
                        recommendation.bestBet,

                    candidateBet:
                        recommendation.candidateBet,

                    confidence:
                        recommendation.confidence,

                    score,

                    expectedValue:
                        recommendation.expectedValue,

                    kelly:
                        recommendation.kelly,

                    risk:
                        recommendation.risk,

                    fusedProbability,
                    trend,
                    patterns,

                    reasons:
                        recommendation.reasons,

                    metadata,
                    createdAt
                });

            this.lastDecision =
                decision;

            this.history.add(
                decision.toJSON()
            );

            if (
                decision.action ===
                AIAction.RECOMMEND
            ) {
                this.setState(
                    AIState.COMPLETED
                );

                this.emit(
                    AIEvent.COMPLETED,
                    decision
                );
            }
            else if (
                decision.action ===
                AIAction.WAIT
            ) {
                this.setState(
                    AIState.SKIPPED
                );

                this.emit(
                    AIEvent.WAITING,
                    decision
                );
            }
            else {
                this.setState(
                    AIState.SKIPPED
                );

                this.emit(
                    AIEvent.SKIPPED,
                    decision
                );
            }

            return decision;
        }
        catch (error) {
            return this.handleError(
                error,
                "evaluate"
            );
        }
    }

    predict(input = {}) {
        return this.evaluate(
            input
        );
    }

    recommend(input = {}) {
        return this.evaluate(
            input
        );
    }

    calculateScore({
        recommendation,
        trend,
        patterns
    }) {
        const confidenceScore =
            (
                recommendation.confidence ??
                0
            ) * 60;

        const trendScore =
            (
                trend.strength ??
                0
            ) * 20;

        const patternScore =
            Math.min(
                20,
                patterns.reduce(
                    (
                        total,
                        pattern
                    ) =>
                        total +
                        (
                            pattern.strength ??
                            0
                        ) *
                        5,
                    0
                )
            );

        return Math.round(
            Math.min(
                100,
                confidenceScore +
                    trendScore +
                    patternScore
            )
        );
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            AIState.ERROR
        );

        this.emit(
            AIEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    reset() {
        this.assertNotDestroyed();

        this.lastDecision = null;
        this.lastError = null;

        this.setState(
            AIState.IDLE
        );

        return this;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.history.clear();

        this.lastDecision = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            AIState.DESTROYED
        );

        this.emit(
            AIEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_DECISION_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            evaluationCount:
                this.evaluationCount,

            hasDecision:
                Boolean(
                    this.lastDecision
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            history:
                this.history.summary,

            components: {
                patternRecognizer:
                    this.patternRecognizer
                        .summary,

                trendPredictor:
                    this.trendPredictor
                        .summary,

                probabilityFusion:
                    this.probabilityFusion
                        .summary,

                recommendationModel:
                    this.recommendationModel
                        .summary
            }
        };
    }
}
