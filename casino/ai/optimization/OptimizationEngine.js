/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/OptimizationEngine.js
 */

import {
    OptimizationState,
    OptimizationStatus
} from "./OptimizationState.js";

import OptimizationContext
    from "./OptimizationContext.js";

import MetricCollector
    from "./MetricCollector.js";

import ParameterSpace
    from "./ParameterSpace.js";

import CandidateGenerator
    from "./CandidateGenerator.js";

import CandidateEvaluator
    from "./CandidateEvaluator.js";

import OptimizationSelector
    from "./OptimizationSelector.js";

import OptimizationSnapshot
    from "./OptimizationSnapshot.js";

import OptimizationHistory
    from "./OptimizationHistory.js";


export const OPTIMIZATION_ENGINE_VERSION = "7.9.0";

export const OptimizationEvent = Object.freeze({
    STATE_CHANGE: "optimization-engine:state-change",
    STARTED: "optimization-engine:started",
    METRICS_COLLECTED: "optimization-engine:metrics-collected",
    CANDIDATES_GENERATED: "optimization-engine:candidates-generated",
    CANDIDATE_EVALUATED: "optimization-engine:candidate-evaluated",
    CANDIDATE_SELECTED: "optimization-engine:candidate-selected",
    PARAMETERS_APPLIED: "optimization-engine:parameters-applied",
    ROLLED_BACK: "optimization-engine:rolled-back",
    COMPLETED: "optimization-engine:completed",
    PAUSED: "optimization-engine:paused",
    RESUMED: "optimization-engine:resumed",
    ERROR: "optimization-engine:error",
    DESTROYED: "optimization-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class OptimizationEngine {
    constructor({
        metrics = null,
        parameterSpace = null,
        generator = null,
        evaluator = null,
        selector = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null,
        applyParameters = null
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

        if (
            applyParameters !== null &&
            !isFunction(applyParameters)
        ) {
            throw new TypeError(
                "applyParameters must be a function."
            );
        }

        this.metrics =
            metrics ??
            new MetricCollector();

        this.parameterSpace =
            parameterSpace ??
            new ParameterSpace();

        this.generator =
            generator ??
            new CandidateGenerator();

        this.evaluator =
            evaluator ??
            new CandidateEvaluator();

        this.selector =
            selector ??
            new OptimizationSelector();

        this.history =
            history ??
            new OptimizationHistory();

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
                    `optimization-${timestamp}-${sequence}`
            );

        this.applyParameters =
            applyParameters ??
            (
                async parameters => {
                    for (
                        const [
                            name,
                            value
                        ] of
                        Object.entries(
                            parameters
                        )
                    ) {
                        this.parameterSpace
                            .update(
                                name,
                                value
                            );
                    }

                    return {
                        applied:
                            true,
                        parameters:
                            { ...parameters }
                    };
                }
            );

        this.state =
            OptimizationState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.lastResult = null;
        this.lastError = null;
        this.optimizationCount = 0;
        this.snapshots = [];
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "optimization-engine"
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
            OptimizationEvent.STATE_CHANGE,
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
                "OptimizationEngine has been destroyed."
            );
        }
    }

    defineParameter(config) {
        return this.parameterSpace
            .define(
                config
            );
    }

    createSnapshot(reason = null) {
        this.sequence++;

        const timestamp =
            this.clock();

        const snapshot =
            new OptimizationSnapshot({
                snapshotId:
                    `snapshot-${timestamp}-${this.sequence}`,
                parameters:
                    this.parameterSpace.current(),
                reason,
                createdAt:
                    timestamp
            });

        this.snapshots.push(
            snapshot
        );

        return snapshot;
    }

    async optimize({
        context = {},
        objectives = [],
        constraints = [],
        apply = true
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const optimizationContext =
            context instanceof
                OptimizationContext
                ? context
                : new OptimizationContext(
                    context
                );

        this.sequence++;

        const timestamp =
            this.clock();

        const optimizationId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp
            });

        this.setState(
            OptimizationState.COLLECTING
        );

        this.emit(
            OptimizationEvent.STARTED,
            {
                optimizationId,
                context:
                    optimizationContext
            }
        );

        try {
            const collectedMetrics =
                await this.metrics
                    .collect(
                        optimizationContext
                    );

            this.emit(
                OptimizationEvent.METRICS_COLLECTED,
                collectedMetrics
            );

            this.setState(
                OptimizationState.GENERATING
            );

            const candidates =
                await this.generator
                    .generate(
                        this.parameterSpace
                    );

            this.emit(
                OptimizationEvent.CANDIDATES_GENERATED,
                candidates
            );

            this.setState(
                OptimizationState.EVALUATING
            );

            const evaluations = [];

            for (const candidate of candidates) {
                const evaluation =
                    await this.evaluator
                        .evaluate({
                            candidate,
                            metrics:
                                collectedMetrics,
                            objectives,
                            constraints: [
                                ...optimizationContext
                                    .constraints,
                                ...constraints
                            ]
                        });

                evaluations.push(
                    evaluation
                );

                this.emit(
                    OptimizationEvent.CANDIDATE_EVALUATED,
                    evaluation
                );
            }

            const selection =
                this.selector.select(
                    evaluations
                );

            this.emit(
                OptimizationEvent.CANDIDATE_SELECTED,
                selection
            );

            let snapshot = null;
            let application = null;
            let status =
                OptimizationStatus.REJECTED;

            if (
                apply &&
                selection.selected
            ) {
                this.setState(
                    OptimizationState.APPLYING
                );

                snapshot =
                    this.createSnapshot(
                        `Before ${optimizationId}`
                    );

                application =
                    await this.applyParameters(
                        selection.selected
                            .parameters,
                        optimizationContext
                    );

                status =
                    application?.applied === false
                        ? OptimizationStatus.REJECTED
                        : OptimizationStatus.APPLIED;

                this.emit(
                    OptimizationEvent.PARAMETERS_APPLIED,
                    application
                );
            }
            else if (
                selection.selected
            ) {
                status =
                    OptimizationStatus.SELECTED;
            }

            const result = {
                version:
                    OPTIMIZATION_ENGINE_VERSION,
                optimizationId,
                status,
                metrics:
                    collectedMetrics,
                candidates,
                evaluations,
                selection,
                snapshot:
                    snapshot?.toJSON() ??
                    null,
                application,
                createdAt:
                    timestamp
            };

            this.lastResult =
                result;

            this.optimizationCount++;

            this.history.add(
                result
            );

            this.setState(
                OptimizationState.COMPLETED
            );

            this.emit(
                OptimizationEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "optimize"
            );
        }
    }

    async rollback(
        snapshot =
            this.snapshots[
                this.snapshots.length - 1
            ] ??
            null
    ) {
        this.assertNotDestroyed();

        if (!snapshot) {
            return null;
        }

        const result =
            await this.applyParameters(
                snapshot.parameters,
                {
                    rollback:
                        true
                }
            );

        this.emit(
            OptimizationEvent.ROLLED_BACK,
            {
                snapshot:
                    snapshot.toJSON(),
                result
            }
        );

        return {
            status:
                OptimizationStatus.ROLLED_BACK,
            snapshot:
                snapshot.toJSON(),
            result
        };
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            OptimizationState.PAUSED
        );

        this.emit(
            OptimizationEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            OptimizationState.IDLE
        );

        this.emit(
            OptimizationEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();
        this.snapshots = [];

        this.lastResult = null;
        this.lastError = null;
        this.optimizationCount = 0;
        this.paused = false;

        this.setState(
            OptimizationState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            OptimizationState.ERROR
        );

        this.emit(
            OptimizationEvent.ERROR,
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

        this.parameterSpace.clear();
        this.history.clear();
        this.snapshots = [];

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            OptimizationState.DESTROYED
        );

        this.emit(
            OptimizationEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                OPTIMIZATION_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            optimizationCount:
                this.optimizationCount,
            snapshotCount:
                this.snapshots.length,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            parameterSpace:
                this.parameterSpace
                    .summary,
            metrics:
                this.metrics.summary,
            generator:
                this.generator.summary,
            evaluator:
                this.evaluator.summary,
            selector:
                this.selector.summary,
            history:
                this.history.summary
        };
    }
}
