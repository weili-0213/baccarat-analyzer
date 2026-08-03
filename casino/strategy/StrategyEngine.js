/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyEngine.js
 *
 * Converts Analyzer recommendations into executable betting decisions.
 */

import {
    StrategyState,
    StrategyAction
} from "./StrategyState.js";

import StrategyPipeline
    from "./StrategyPipeline.js";

import StrategyHistory
    from "./StrategyHistory.js";

import StrategyDecision
    from "./StrategyDecision.js";

import {
    resolveStrategyPreset
} from "./StrategyPreset.js";


export const STRATEGY_ENGINE_VERSION = "6.9.0";

export const StrategyEvent = Object.freeze({
    STATE_CHANGE: "strategy-engine:state-change",
    EVALUATION_STARTED: "strategy-engine:evaluation-started",
    RULE_EVALUATED: "strategy-engine:rule-evaluated",
    DECIDED: "strategy-engine:decided",
    SKIPPED: "strategy-engine:skipped",
    BET_CREATED: "strategy-engine:bet-created",
    ERROR: "strategy-engine:error",
    DESTROYED: "strategy-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


const RISK_ORDER = Object.freeze({
    low: 1,
    medium: 2,
    high: 3,
    extreme: 4,
    unavailable: 99
});


export default class StrategyEngine {
    constructor({
        pipeline = null,
        history = null,
        betEngine = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null,
        preset = "balanced",
        config = {}
    } = {}) {
        if (
            betEngine !== null &&
            !isFunction(
                betEngine.createFromRecommendation
            )
        ) {
            throw new TypeError(
                "betEngine requires createFromRecommendation()."
            );
        }

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

        this.pipeline =
            pipeline ??
            new StrategyPipeline();

        this.history =
            history ??
            new StrategyHistory();

        this.betEngine =
            betEngine;

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
                    `decision-${timestamp}-${sequence}`
            );

        this.preset =
            resolveStrategyPreset(
                preset
            );

        this.config = {
            minimumEV:
                config.minimumEV ??
                this.preset.minimumEV,

            minimumConfidence:
                config.minimumConfidence ??
                this.preset.minimumConfidence,

            maximumKelly:
                config.maximumKelly ??
                this.preset.maximumKelly,

            maximumRisk:
                config.maximumRisk ??
                this.preset.maximumRisk,

            bankrollFractionCap:
                config.bankrollFractionCap ??
                this.preset.bankrollFractionCap,

            skipOnUnavailable:
                config.skipOnUnavailable ??
                true
        };

        this.state =
            StrategyState.IDLE;

        this.previousState = null;
        this.lastDecision = null;
        this.lastError = null;
        this.evaluationCount = 0;
        this.betCount = 0;
        this.skipCount = 0;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "strategy-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                StrategyState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown StrategyState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            StrategyEvent.STATE_CHANGE,
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
                "StrategyEngine has been destroyed."
            );
        }
    }

    registerDefaultRules() {
        if (
            this.pipeline.rules.length > 0
        ) {
            return this;
        }

        this.pipeline.register({
            name:
                "recommendation-available",

            priority:
                100,

            stopOnMatch:
                true,

            evaluate:
                ({ recommendation }) => {
                    const available =
                        Boolean(
                            recommendation &&
                            (
                                recommendation.bestBet ||
                                recommendation.betType
                            )
                        );

                    return {
                        matched:
                            !available,

                        action:
                            StrategyAction.SKIP,

                        reason:
                            "recommendation-unavailable"
                    };
                }
        });

        this.pipeline.register({
            name:
                "ev-threshold",

            priority:
                90,

            stopOnMatch:
                true,

            evaluate:
                ({ metrics }) => ({
                    matched:
                        !Number.isFinite(
                            metrics.expectedValue
                        ) ||
                        metrics.expectedValue <
                            this.config.minimumEV,

                    action:
                        StrategyAction.SKIP,

                    reason:
                        "ev-below-threshold",

                    data: {
                        value:
                            metrics.expectedValue,

                        minimum:
                            this.config.minimumEV
                    }
                })
        });

        this.pipeline.register({
            name:
                "confidence-threshold",

            priority:
                80,

            stopOnMatch:
                true,

            evaluate:
                ({ metrics }) => ({
                    matched:
                        !Number.isFinite(
                            metrics.confidence
                        ) ||
                        metrics.confidence <
                            this.config.minimumConfidence,

                    action:
                        StrategyAction.SKIP,

                    reason:
                        "confidence-below-threshold",

                    data: {
                        value:
                            metrics.confidence,

                        minimum:
                            this.config.minimumConfidence
                    }
                })
        });

        this.pipeline.register({
            name:
                "kelly-filter",

            priority:
                70,

            stopOnMatch:
                true,

            evaluate:
                ({ metrics }) => ({
                    matched:
                        !Number.isFinite(
                            metrics.kelly
                        ) ||
                        metrics.kelly <= 0,

                    action:
                        StrategyAction.SKIP,

                    reason:
                        "kelly-not-positive",

                    data: {
                        value:
                            metrics.kelly
                    }
                })
        });

        this.pipeline.register({
            name:
                "risk-filter",

            priority:
                60,

            stopOnMatch:
                true,

            evaluate:
                ({ metrics }) => {
                    const current =
                        RISK_ORDER[
                            metrics.risk
                        ] ??
                        RISK_ORDER.unavailable;

                    const maximum =
                        RISK_ORDER[
                            this.config.maximumRisk
                        ] ??
                        RISK_ORDER.medium;

                    return {
                        matched:
                            current >
                            maximum,

                        action:
                            StrategyAction.SKIP,

                        reason:
                            "risk-too-high",

                        data: {
                            value:
                                metrics.risk,

                            maximum:
                                this.config.maximumRisk
                        }
                    };
                }
        });

        return this;
    }

    normalizeInput({
        analysis,
        bankroll = null,
        roundId = null,
        metadata = {}
    } = {}) {
        const recommendation =
            analysis?.recommendation ??
            null;

        const bestBet =
            recommendation
                ?.bestBet ??
            recommendation
                ?.betType ??
            analysis?.ranking?.[0]
                ?.bet ??
            null;

        const rankingItem =
            Array.isArray(
                analysis?.ranking
            )
                ? analysis.ranking.find(
                    item =>
                        item.bet ===
                        bestBet
                )
                : null;

        const expectedValue =
            recommendation
                ?.expectedValue ??
            recommendation
                ?.ev ??
            rankingItem
                ?.ev ??
            analysis?.ev?.[bestBet] ??
            null;

        const kelly =
            recommendation
                ?.kelly ??
            analysis?.kelly?.[bestBet] ??
            null;

        const confidence =
            recommendation
                ?.confidence ??
            analysis?.confidence
                ?.overall ??
            analysis?.confidence?.[bestBet] ??
            null;

        const risk =
            recommendation
                ?.risk ??
            analysis?.risk
                ?.level ??
            analysis?.risk ??
            "unavailable";

        return {
            analysis,
            recommendation,
            bankroll,
            roundId,
            metadata,

            metrics: {
                bestBet,
                expectedValue,
                kelly,
                confidence,
                risk
            }
        };
    }

    async evaluate(input = {}) {
        this.assertNotDestroyed();

        this.registerDefaultRules();

        this.evaluationCount++;

        const context =
            this.normalizeInput(
                input
            );

        this.setState(
            StrategyState.EVALUATING
        );

        this.emit(
            StrategyEvent.EVALUATION_STARTED,
            context
        );

        try {
            const ruleResults =
                await this.pipeline
                    .execute(
                        context
                    );

            for (
                const result of
                ruleResults
            ) {
                this.emit(
                    StrategyEvent.RULE_EVALUATED,
                    result
                );
            }

            const skipRule =
                ruleResults.find(
                    result =>
                        result.matched &&
                        result.action ===
                            StrategyAction.SKIP
                );

            const timestamp =
                this.clock();

            this.sequence++;

            const decisionId =
                this.idFactory({
                    sequence:
                        this.sequence,
                    timestamp
                });

            let decision;

            if (skipRule) {
                decision =
                    new StrategyDecision({
                        decisionId,

                        action:
                            StrategyAction.SKIP,

                        reason:
                            skipRule.reason,

                        reasons:
                            ruleResults
                                .filter(
                                    result =>
                                        result.matched
                                )
                                .map(
                                    result =>
                                        result.reason
                                ),

                        matchedRules:
                            ruleResults
                                .filter(
                                    result =>
                                        result.matched
                                )
                                .map(
                                    result =>
                                        result.rule
                                ),

                        expectedValue:
                            context.metrics
                                .expectedValue,

                        kelly:
                            context.metrics
                                .kelly,

                        confidence:
                            context.metrics
                                .confidence,

                        risk:
                            context.metrics
                                .risk,

                        metadata:
                            context.metadata,

                        createdAt:
                            timestamp
                    });

                this.skipCount++;

                this.setState(
                    StrategyState.SKIPPED
                );

                this.emit(
                    StrategyEvent.SKIPPED,
                    decision
                );
            }
            else {
                const cappedKelly =
                    Math.min(
                        context.metrics.kelly,
                        this.config.maximumKelly
                    );

                const bankrollFraction =
                    Math.min(
                        cappedKelly,
                        this.config
                            .bankrollFractionCap
                    );

                const amount =
                    Number.isFinite(
                        context.bankroll
                            ?.available
                    )
                        ? context.bankroll
                            .available *
                            bankrollFraction
                        : null;

                decision =
                    new StrategyDecision({
                        decisionId,

                        action:
                            StrategyAction.BET,

                        betType:
                            context.metrics
                                .bestBet,

                        amount,

                        bankrollFraction,

                        expectedValue:
                            context.metrics
                                .expectedValue,

                        kelly:
                            context.metrics
                                .kelly,

                        confidence:
                            context.metrics
                                .confidence,

                        risk:
                            context.metrics
                                .risk,

                        reason:
                            "strategy-conditions-passed",

                        matchedRules:
                            [],

                        metadata:
                            context.metadata,

                        createdAt:
                            timestamp
                    });

                this.betCount++;

                this.setState(
                    StrategyState.DECIDED
                );

                this.emit(
                    StrategyEvent.DECIDED,
                    decision
                );
            }

            this.lastDecision =
                decision;

            this.history.add(
                decision.toJSON()
            );

            return decision;
        }
        catch (error) {
            return this.handleError(
                error,
                "evaluate"
            );
        }
    }

    async evaluateAndCreateBet(
        input = {}
    ) {
        const decision =
            await this.evaluate(
                input
            );

        if (
            !decision.shouldBet ||
            !this.betEngine
        ) {
            return {
                decision,
                bet:
                    null
            };
        }

        const bet =
            this.betEngine
                .createFromRecommendation({
                    roundId:
                        input.roundId,

                    recommendation: {
                        bestBet:
                            decision.betType,

                        expectedValue:
                            decision.expectedValue,

                        kelly:
                            decision.kelly,

                        confidence:
                            decision.confidence,

                        risk:
                            decision.risk
                    },

                    amount:
                        decision.amount,

                    bankrollFraction:
                        decision.amount ===
                            null
                            ? decision
                                .bankrollFraction
                            : null,

                    metadata: {
                        decisionId:
                            decision.decisionId,
                        ...decision.metadata
                    }
                });

        this.emit(
            StrategyEvent.BET_CREATED,
            {
                decision,
                bet
            }
        );

        return {
            decision,
            bet
        };
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            StrategyState.ERROR
        );

        this.emit(
            StrategyEvent.ERROR,
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
            StrategyState.IDLE
        );

        return this;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.pipeline.clear();
        this.history.clear();

        this.lastDecision = null;
        this.lastError = null;

        this.destroyed =
            true;

        this.setState(
            StrategyState.DESTROYED
        );

        this.emit(
            StrategyEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                STRATEGY_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            evaluationCount:
                this.evaluationCount,

            betCount:
                this.betCount,

            skipCount:
                this.skipCount,

            hasDecision:
                Boolean(
                    this.lastDecision
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            preset:
                this.preset.name,

            config: {
                ...this.config
            },

            pipeline:
                this.pipeline.summary,

            history:
                this.history.summary
        };
    }
}
