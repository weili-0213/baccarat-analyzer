/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/SelfImprovementEngine.js
 */

import {
    SelfImprovementState,
    ImprovementStatus
} from "./SelfImprovementState.js";

import SelfImprovementContext
    from "./SelfImprovementContext.js";

import WeaknessDetector
    from "./WeaknessDetector.js";

import ImprovementGoalGenerator
    from "./ImprovementGoalGenerator.js";

import ExperimentPlanner
    from "./ExperimentPlanner.js";

import ExperimentRunner
    from "./ExperimentRunner.js";

import ImprovementEvaluator
    from "./ImprovementEvaluator.js";

import ImprovementSelector
    from "./ImprovementSelector.js";

import ImprovementSnapshot
    from "./ImprovementSnapshot.js";

import SelfImprovementHistory
    from "./SelfImprovementHistory.js";


export const SELF_IMPROVEMENT_ENGINE_VERSION = "8.1.0";

export const SelfImprovementEvent = Object.freeze({
    STATE_CHANGE: "self-improvement-engine:state-change",
    STARTED: "self-improvement-engine:started",
    WEAKNESSES_DETECTED: "self-improvement-engine:weaknesses-detected",
    GOALS_GENERATED: "self-improvement-engine:goals-generated",
    EXPERIMENT_STARTED: "self-improvement-engine:experiment-started",
    EXPERIMENT_COMPLETED: "self-improvement-engine:experiment-completed",
    IMPROVEMENT_SELECTED: "self-improvement-engine:improvement-selected",
    APPLIED: "self-improvement-engine:applied",
    ROLLED_BACK: "self-improvement-engine:rolled-back",
    COMPLETED: "self-improvement-engine:completed",
    PAUSED: "self-improvement-engine:paused",
    RESUMED: "self-improvement-engine:resumed",
    ERROR: "self-improvement-engine:error",
    DESTROYED: "self-improvement-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class SelfImprovementEngine {
    constructor({
        weaknessDetector = null,
        goalGenerator = null,
        experimentPlanner = null,
        experimentRunner = null,
        evaluator = null,
        selector = null,
        history = null,
        applyParameters = null,
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

        if (
            applyParameters !== null &&
            !isFunction(applyParameters)
        ) {
            throw new TypeError(
                "applyParameters must be a function."
            );
        }

        this.weaknessDetector =
            weaknessDetector ??
            new WeaknessDetector();

        this.goalGenerator =
            goalGenerator ??
            new ImprovementGoalGenerator();

        this.experimentPlanner =
            experimentPlanner ??
            new ExperimentPlanner();

        this.experimentRunner =
            experimentRunner ??
            new ExperimentRunner();

        this.evaluator =
            evaluator ??
            new ImprovementEvaluator();

        this.selector =
            selector ??
            new ImprovementSelector();

        this.history =
            history ??
            new SelfImprovementHistory();

        this.applyParameters =
            applyParameters ??
            (async parameters => ({
                applied:
                    true,
                parameters:
                    { ...parameters }
            }));

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.state =
            SelfImprovementState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.improvementCount = 0;
        this.snapshots = [];
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
                        "self-improvement-engine"
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
            SelfImprovementEvent.STATE_CHANGE,
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
                "SelfImprovementEngine has been destroyed."
            );
        }
    }

    createSnapshot(
        parameters,
        reason
    ) {
        this.sequence++;

        const snapshot =
            new ImprovementSnapshot({
                snapshotId:
                    `improvement-snapshot-${this.clock()}-${this.sequence}`,
                parameters,
                createdAt:
                    this.clock(),
                reason
            });

        this.snapshots.push(
            snapshot
        );

        return snapshot;
    }

    async improve({
        context = {},
        apply = true,
        step = 0.05
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const improvementContext =
            context instanceof
                SelfImprovementContext
                ? context
                : new SelfImprovementContext(
                    context
                );

        this.sequence++;

        const improvementId =
            `improvement-${this.clock()}-${this.sequence}`;

        this.setState(
            SelfImprovementState.ANALYZING
        );

        this.emit(
            SelfImprovementEvent.STARTED,
            {
                improvementId,
                context:
                    improvementContext
            }
        );

        try {
            const weaknessResult =
                await this.weaknessDetector
                    .detect(
                        improvementContext
                    );

            this.emit(
                SelfImprovementEvent.WEAKNESSES_DETECTED,
                weaknessResult
            );

            this.setState(
                SelfImprovementState.GENERATING
            );

            const goals =
                this.goalGenerator
                    .generate(
                        weaknessResult
                    );

            this.emit(
                SelfImprovementEvent.GOALS_GENERATED,
                goals
            );

            const goal =
                goals[0] ??
                null;

            if (!goal) {
                const result = {
                    version:
                        SELF_IMPROVEMENT_ENGINE_VERSION,
                    improvementId,
                    status:
                        ImprovementStatus.REJECTED,
                    reason:
                        "No weakness detected.",
                    weaknessResult,
                    goals,
                    experiments: [],
                    evaluations: [],
                    selection: {
                        ranking: [],
                        selected: null
                    },
                    application:
                        null,
                    createdAt:
                        this.clock()
                };

                this.lastResult =
                    result;

                this.improvementCount++;

                this.history.add(
                    result
                );

                this.setState(
                    SelfImprovementState.COMPLETED
                );

                this.emit(
                    SelfImprovementEvent.COMPLETED,
                    result
                );

                return result;
            }

            const experiments =
                this.experimentPlanner
                    .plan({
                        goal,
                        parameters:
                            improvementContext.parameters,
                        step
                    });

            this.setState(
                SelfImprovementState.EXPERIMENTING
            );

            const experimentResults = [];

            for (const experiment of experiments) {
                this.emit(
                    SelfImprovementEvent.EXPERIMENT_STARTED,
                    experiment
                );

                const result =
                    await this.experimentRunner
                        .run({
                            experiment,
                            context:
                                improvementContext
                        });

                experimentResults.push(
                    result
                );

                this.emit(
                    SelfImprovementEvent.EXPERIMENT_COMPLETED,
                    result
                );
            }

            this.setState(
                SelfImprovementState.EVALUATING
            );

            const evaluations =
                experimentResults.map(
                    result =>
                        this.evaluator
                            .evaluate({
                                goal,
                                baseline:
                                    improvementContext.baseline,
                                result
                            })
                );

            const selection =
                this.selector.select(
                    evaluations
                );

            this.emit(
                SelfImprovementEvent.IMPROVEMENT_SELECTED,
                selection
            );

            let snapshot = null;
            let application = null;
            let status =
                ImprovementStatus.REJECTED;

            if (
                apply &&
                selection.selected
            ) {
                this.setState(
                    SelfImprovementState.APPLYING
                );

                snapshot =
                    this.createSnapshot(
                        improvementContext.parameters,
                        `Before ${improvementId}`
                    );

                const selectedResult =
                    experimentResults.find(
                        item =>
                            item.experimentId ===
                            selection.selected
                                .experimentId
                    );

                const parameter =
                    selectedResult
                        ?.experiment
                        ?.parameter;

                const value =
                    selectedResult
                        ?.experiment
                        ?.after;

                application =
                    await this.applyParameters({
                        ...improvementContext.parameters,
                        [parameter]:
                            value
                    });

                status =
                    application?.applied === false
                        ? ImprovementStatus.REJECTED
                        : ImprovementStatus.APPLIED;

                this.emit(
                    SelfImprovementEvent.APPLIED,
                    application
                );
            }
            else if (
                selection.selected
            ) {
                status =
                    ImprovementStatus.ACCEPTED;
            }

            const result = {
                version:
                    SELF_IMPROVEMENT_ENGINE_VERSION,
                improvementId,
                status,
                weaknessResult,
                goals,
                selectedGoal:
                    goal,
                experiments:
                    experimentResults,
                evaluations,
                selection,
                snapshot:
                    snapshot?.toJSON() ??
                    null,
                application,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.improvementCount++;

            this.history.add(
                result
            );

            this.setState(
                SelfImprovementState.COMPLETED
            );

            this.emit(
                SelfImprovementEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "improve"
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

        this.setState(
            SelfImprovementState.ROLLING_BACK
        );

        const application =
            await this.applyParameters(
                snapshot.parameters
            );

        const result = {
            status:
                ImprovementStatus.ROLLED_BACK,
            snapshot:
                snapshot.toJSON(),
            application
        };

        this.emit(
            SelfImprovementEvent.ROLLED_BACK,
            result
        );

        this.setState(
            SelfImprovementState.COMPLETED
        );

        return result;
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            SelfImprovementState.PAUSED
        );

        this.emit(
            SelfImprovementEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            SelfImprovementState.IDLE
        );

        this.emit(
            SelfImprovementEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();
        this.snapshots = [];
        this.improvementCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            SelfImprovementState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            SelfImprovementState.ERROR
        );

        this.emit(
            SelfImprovementEvent.ERROR,
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
        this.snapshots = [];
        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            SelfImprovementState.DESTROYED
        );

        this.emit(
            SelfImprovementEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                SELF_IMPROVEMENT_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            improvementCount:
                this.improvementCount,
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
            weaknessDetector:
                this.weaknessDetector
                    .summary,
            goalGenerator:
                this.goalGenerator
                    .summary,
            experimentPlanner:
                this.experimentPlanner
                    .summary,
            experimentRunner:
                this.experimentRunner
                    .summary,
            evaluator:
                this.evaluator
                    .summary,
            selector:
                this.selector
                    .summary,
            history:
                this.history
                    .summary
        };
    }
}
