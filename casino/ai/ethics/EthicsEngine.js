/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/EthicsEngine.js
 */

import {
    EthicsState
} from "./EthicsState.js";

import EthicsContext
    from "./EthicsContext.js";

import EthicalPrincipleRegistry
    from "./EthicalPrincipleRegistry.js";

import HarmEvaluator
    from "./HarmEvaluator.js";

import FairnessEvaluator
    from "./FairnessEvaluator.js";

import ConsentEvaluator
    from "./ConsentEvaluator.js";

import ProportionalityEvaluator
    from "./ProportionalityEvaluator.js";

import EthicsConflictResolver
    from "./EthicsConflictResolver.js";

import EthicsScorer
    from "./EthicsScorer.js";

import EthicsHistory
    from "./EthicsHistory.js";


export const ETHICS_ENGINE_VERSION = "8.6.0";

export const EthicsEvent = Object.freeze({
    STATE_CHANGE: "ethics-engine:state-change",
    STARTED: "ethics-engine:started",
    PRINCIPLES_LOADED: "ethics-engine:principles-loaded",
    PRINCIPLE_EVALUATED: "ethics-engine:principle-evaluated",
    HARM_EVALUATED: "ethics-engine:harm-evaluated",
    FAIRNESS_EVALUATED: "ethics-engine:fairness-evaluated",
    CONSENT_EVALUATED: "ethics-engine:consent-evaluated",
    PROPORTIONALITY_EVALUATED: "ethics-engine:proportionality-evaluated",
    CONFLICTS_RESOLVED: "ethics-engine:conflicts-resolved",
    SCORE_CALCULATED: "ethics-engine:score-calculated",
    COMPLETED: "ethics-engine:completed",
    PAUSED: "ethics-engine:paused",
    RESUMED: "ethics-engine:resumed",
    ERROR: "ethics-engine:error",
    DESTROYED: "ethics-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class EthicsEngine {
    constructor({
        principles = null,
        harm = null,
        fairness = null,
        consent = null,
        proportionality = null,
        resolver = null,
        scorer = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
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

        this.principles =
            principles ??
            new EthicalPrincipleRegistry();

        this.harm =
            harm ??
            new HarmEvaluator();

        this.fairness =
            fairness ??
            new FairnessEvaluator();

        this.consent =
            consent ??
            new ConsentEvaluator();

        this.proportionality =
            proportionality ??
            new ProportionalityEvaluator();

        this.resolver =
            resolver ??
            new EthicsConflictResolver();

        this.scorer =
            scorer ??
            new EthicsScorer();

        this.history =
            history ??
            new EthicsHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            EthicsState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.evaluationCount = 0;
        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "ethics-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            EthicsEvent.STATE_CHANGE,
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
                "EthicsEngine has been destroyed."
            );
        }
    }

    registerPrinciple(config) {
        return this.principles
            .register(
                config
            );
    }

    async evaluate({
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const ethicsContext =
            context instanceof
                EthicsContext
                ? context
                : new EthicsContext(
                    context
                );

        this.sequence++;

        const ethicsId =
            `ethics-${this.clock()}-${this.sequence}`;

        this.setState(
            EthicsState.LOADING
        );

        this.emit(
            EthicsEvent.STARTED,
            {
                ethicsId,
                context:
                    ethicsContext
            }
        );

        try {
            const principles =
                this.principles.all();

            this.emit(
                EthicsEvent.PRINCIPLES_LOADED,
                principles.map(
                    principle => ({
                        principleId:
                            principle.principleId,
                        weight:
                            principle.weight
                    })
                )
            );

            this.setState(
                EthicsState.EVALUATING
            );

            const principleResults = [];

            for (const principle of principles) {
                const evaluation =
                    await principle.evaluate({
                        context:
                            ethicsContext,
                        action:
                            ethicsContext.action
                    });

                const result = {
                    principleId:
                        principle.principleId,
                    score:
                        Number.isFinite(
                            evaluation?.score
                        )
                            ? Math.max(
                                0,
                                Math.min(
                                    100,
                                    evaluation.score
                                )
                            )
                            : evaluation?.passed === false
                                ? 0
                                : 100,
                    passed:
                        evaluation?.passed !==
                        false,
                    reason:
                        evaluation?.reason ??
                        null,
                    weight:
                        principle.weight
                };

                principleResults.push(
                    result
                );

                this.emit(
                    EthicsEvent.PRINCIPLE_EVALUATED,
                    result
                );
            }

            const harm =
                this.harm.evaluate({
                    action:
                        ethicsContext.action ??
                        {},
                    context:
                        ethicsContext
                });

            this.emit(
                EthicsEvent.HARM_EVALUATED,
                harm
            );

            const fairness =
                this.fairness.evaluate({
                    stakeholders:
                        ethicsContext.stakeholders,
                    action:
                        ethicsContext.action ??
                        {}
                });

            this.emit(
                EthicsEvent.FAIRNESS_EVALUATED,
                fairness
            );

            const consent =
                this.consent.evaluate({
                    subject:
                        ethicsContext.subject ??
                        {},
                    action:
                        ethicsContext.action ??
                        {}
                });

            this.emit(
                EthicsEvent.CONSENT_EVALUATED,
                consent
            );

            const proportionality =
                this.proportionality.evaluate({
                    action:
                        ethicsContext.action ??
                        {},
                    context:
                        ethicsContext
                });

            this.emit(
                EthicsEvent.PROPORTIONALITY_EVALUATED,
                proportionality
            );

            const domainResults = {
                harm,
                fairness,
                consent,
                proportionality
            };

            this.setState(
                EthicsState.RESOLVING
            );

            const resolution =
                this.resolver.resolve({
                    principleResults,
                    domainResults
                });

            this.emit(
                EthicsEvent.CONFLICTS_RESOLVED,
                resolution
            );

            this.setState(
                EthicsState.SCORING
            );

            const scored =
                this.scorer.score({
                    principleResults,
                    domainResults
                });

            this.emit(
                EthicsEvent.SCORE_CALCULATED,
                scored
            );

            const result = {
                version:
                    ETHICS_ENGINE_VERSION,
                ethicsId,
                principleResults,
                domainResults,
                resolution,
                score:
                    scored.score,
                decision:
                    scored.decision,
                ethical:
                    scored.ethical &&
                    !resolution.hasConflict,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.evaluationCount++;

            this.history.add(
                result
            );

            this.setState(
                EthicsState.COMPLETED
            );

            this.emit(
                EthicsEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "evaluate"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            EthicsState.PAUSED
        );

        this.emit(
            EthicsEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            EthicsState.IDLE
        );

        this.emit(
            EthicsEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.evaluationCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            EthicsState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            EthicsState.ERROR
        );

        this.emit(
            EthicsEvent.ERROR,
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

        this.principles.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            EthicsState.DESTROYED
        );

        this.emit(
            EthicsEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                ETHICS_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            evaluationCount:
                this.evaluationCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            principles:
                this.principles.summary,
            harm:
                this.harm.summary,
            fairness:
                this.fairness.summary,
            consent:
                this.consent.summary,
            proportionality:
                this.proportionality.summary,
            resolver:
                this.resolver.summary,
            scorer:
                this.scorer.summary,
            history:
                this.history.summary
        };
    }
}
