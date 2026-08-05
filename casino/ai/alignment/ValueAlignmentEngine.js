/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/ValueAlignmentEngine.js
 */

import {
    AlignmentState
} from "./AlignmentState.js";

import AlignmentContext
    from "./AlignmentContext.js";

import ValueRegistry
    from "./ValueRegistry.js";

import GoalAlignmentEvaluator
    from "./GoalAlignmentEvaluator.js";

import ActionAlignmentEvaluator
    from "./ActionAlignmentEvaluator.js";

import AlignmentConflictResolver
    from "./AlignmentConflictResolver.js";

import AlignmentScorer
    from "./AlignmentScorer.js";

import AlignmentHistory
    from "./AlignmentHistory.js";


export const VALUE_ALIGNMENT_ENGINE_VERSION = "8.5.0";

export const AlignmentEvent = Object.freeze({
    STATE_CHANGE: "value-alignment-engine:state-change",
    STARTED: "value-alignment-engine:started",
    VALUES_LOADED: "value-alignment-engine:values-loaded",
    GOALS_EVALUATED: "value-alignment-engine:goals-evaluated",
    ACTIONS_EVALUATED: "value-alignment-engine:actions-evaluated",
    CONFLICTS_RESOLVED: "value-alignment-engine:conflicts-resolved",
    SCORE_CALCULATED: "value-alignment-engine:score-calculated",
    COMPLETED: "value-alignment-engine:completed",
    PAUSED: "value-alignment-engine:paused",
    RESUMED: "value-alignment-engine:resumed",
    ERROR: "value-alignment-engine:error",
    DESTROYED: "value-alignment-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class ValueAlignmentEngine {
    constructor({
        values = null,
        goalEvaluator = null,
        actionEvaluator = null,
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

        this.values =
            values ??
            new ValueRegistry();

        this.goalEvaluator =
            goalEvaluator ??
            new GoalAlignmentEvaluator();

        this.actionEvaluator =
            actionEvaluator ??
            new ActionAlignmentEvaluator();

        this.resolver =
            resolver ??
            new AlignmentConflictResolver();

        this.scorer =
            scorer ??
            new AlignmentScorer();

        this.history =
            history ??
            new AlignmentHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            AlignmentState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.alignmentCount = 0;
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
                        "value-alignment-engine"
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
            AlignmentEvent.STATE_CHANGE,
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
                "ValueAlignmentEngine has been destroyed."
            );
        }
    }

    registerValue(config) {
        return this.values
            .register(
                config
            );
    }

    async evaluate({
        context = {},
        actions = []
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const alignmentContext =
            context instanceof
                AlignmentContext
                ? context
                : new AlignmentContext(
                    context
                );

        this.sequence++;

        const alignmentId =
            `alignment-${this.clock()}-${this.sequence}`;

        this.setState(
            AlignmentState.LOADING
        );

        this.emit(
            AlignmentEvent.STARTED,
            {
                alignmentId,
                context:
                    alignmentContext
            }
        );

        try {
            const registeredValues =
                this.values.all();

            this.emit(
                AlignmentEvent.VALUES_LOADED,
                registeredValues.map(
                    value => ({
                        valueId:
                            value.valueId,
                        weight:
                            value.weight
                    })
                )
            );

            this.setState(
                AlignmentState.EVALUATING
            );

            const goalResults =
                this.goalEvaluator
                    .evaluate({
                        goals:
                            alignmentContext.goals,
                        values:
                            registeredValues,
                        context:
                            alignmentContext
                    });

            this.emit(
                AlignmentEvent.GOALS_EVALUATED,
                goalResults
            );

            const actionResults =
                this.actionEvaluator
                    .evaluate({
                        actions,
                        constraints:
                            alignmentContext.constraints,
                        context:
                            alignmentContext
                    });

            this.emit(
                AlignmentEvent.ACTIONS_EVALUATED,
                actionResults
            );

            this.setState(
                AlignmentState.RESOLVING
            );

            const resolution =
                this.resolver
                    .resolve({
                        goalResults,
                        actionResults
                    });

            this.emit(
                AlignmentEvent.CONFLICTS_RESOLVED,
                resolution
            );

            this.setState(
                AlignmentState.VALIDATING
            );

            const score =
                this.scorer
                    .score({
                        goalResults,
                        actionResults
                    });

            this.emit(
                AlignmentEvent.SCORE_CALCULATED,
                score
            );

            const result = {
                version:
                    VALUE_ALIGNMENT_ENGINE_VERSION,
                alignmentId,
                goalResults,
                actionResults,
                resolution,
                score:
                    score.score,
                level:
                    score.level,
                aligned:
                    score.aligned,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.alignmentCount++;

            this.history.add(
                result
            );

            this.setState(
                AlignmentState.COMPLETED
            );

            this.emit(
                AlignmentEvent.COMPLETED,
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
            AlignmentState.PAUSED
        );

        this.emit(
            AlignmentEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            AlignmentState.IDLE
        );

        this.emit(
            AlignmentEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.alignmentCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            AlignmentState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            AlignmentState.ERROR
        );

        this.emit(
            AlignmentEvent.ERROR,
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

        this.values.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            AlignmentState.DESTROYED
        );

        this.emit(
            AlignmentEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                VALUE_ALIGNMENT_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            alignmentCount:
                this.alignmentCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            values:
                this.values.summary,
            goalEvaluator:
                this.goalEvaluator.summary,
            actionEvaluator:
                this.actionEvaluator.summary,
            resolver:
                this.resolver.summary,
            scorer:
                this.scorer.summary,
            history:
                this.history.summary
        };
    }
}
