/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/AIClosedLoopIntelligenceSystem.js
 * Purpose: Coordinates the complete observe → simulate → predict → decide → strategize → execute → feedback → learn → adapt cycle.
 */
import {
    ClosedLoopState,
    ClosedLoopAction
} from "./ClosedLoopState.js";

import ClosedLoopContext
    from "./ClosedLoopContext.js";

import ObservationCollector
    from "./ObservationCollector.js";

import ClosedLoopPipeline
    from "./ClosedLoopPipeline.js";

import ClosedLoopCheckpointStore
    from "./ClosedLoopCheckpointStore.js";

import ClosedLoopCycleResult
    from "./ClosedLoopCycleResult.js";

import ClosedLoopCycleHistory
    from "./ClosedLoopCycleHistory.js";


export const AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_VERSION = "10.0.0";

export const ClosedLoopEvent = Object.freeze({
    STATE_CHANGE:
        "ai-closed-loop:state-change",
    CYCLE_STARTED:
        "ai-closed-loop:cycle-started",
    OBSERVATION_COLLECTED:
        "ai-closed-loop:observation-collected",
    STAGE_STARTED:
        "ai-closed-loop:stage-started",
    STAGE_COMPLETED:
        "ai-closed-loop:stage-completed",
    STAGE_SKIPPED:
        "ai-closed-loop:stage-skipped",
    CHECKPOINT_SAVED:
        "ai-closed-loop:checkpoint-saved",
    CYCLE_COMPLETED:
        "ai-closed-loop:cycle-completed",
    PAUSED:
        "ai-closed-loop:paused",
    RESUMED:
        "ai-closed-loop:resumed",
    ERROR:
        "ai-closed-loop:error",
    DESTROYED:
        "ai-closed-loop:destroyed"
});


export default class AIClosedLoopIntelligenceSystem {
    constructor({
        pipeline,
        observationCollector = null,
        checkpointStore = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (
            !pipeline ||
            !(pipeline instanceof ClosedLoopPipeline)
        ) {
            throw new TypeError(
                "AIClosedLoopIntelligenceSystem requires ClosedLoopPipeline."
            );
        }

        if (
            eventBus !== null &&
            typeof eventBus.emit !== "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.pipeline = pipeline;

        this.observationCollector =
            observationCollector ??
            new ObservationCollector();

        this.checkpointStore =
            checkpointStore ??
            new ClosedLoopCheckpointStore();

        this.history =
            history ??
            new ClosedLoopCycleHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            ClosedLoopState.IDLE;

        this.previousState =
            null;

        this.paused = false;
        this.destroyed = false;

        this.sequence = 0;
        this.cycleCount = 0;

        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(
                type,
                payload,
                {
                    source:
                        "ai-closed-loop-intelligence-system"
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
            ClosedLoopEvent.STATE_CHANGE,
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
                "AIClosedLoopIntelligenceSystem has been destroyed."
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

        const loopContext =
            context instanceof ClosedLoopContext
                ? context
                : new ClosedLoopContext(context);

        this.sequence++;

        const cycleId =
            `closed-loop-cycle-${this.clock()}-${this.sequence}`;

        const startedAt =
            this.clock();

        const outputs = {};
        const completedStages = [];
        const skippedStages = [];

        this.setState(
            ClosedLoopState.OBSERVING
        );

        this.emit(
            ClosedLoopEvent.CYCLE_STARTED,
            {
                cycleId,
                context: loopContext
            }
        );

        try {
            const observation =
                this.observationCollector.collect(
                    loopContext
                );

            loopContext.merge({
                observation
            });

            outputs.observation =
                observation;

            this.emit(
                ClosedLoopEvent.OBSERVATION_COLLECTED,
                observation
            );

            for (const stage of this.pipeline.stages) {
                const shouldRun =
                    stage.shouldRun({
                        context: loopContext,
                        outputs
                    });

                if (!shouldRun) {
                    skippedStages.push(
                        stage.stageId
                    );

                    this.emit(
                        ClosedLoopEvent.STAGE_SKIPPED,
                        {
                            cycleId,
                            stageId:
                                stage.stageId
                        }
                    );

                    continue;
                }

                this.setState(
                    stage.state
                );

                this.emit(
                    ClosedLoopEvent.STAGE_STARTED,
                    {
                        cycleId,
                        stageId:
                            stage.stageId
                    }
                );

                const stageInput =
                    stage.input({
                        context:
                            loopContext,
                        outputs
                    });

                const stageOutput =
                    await stage.gateway.run(
                        stageInput
                    );

                outputs[
                    stage.outputKey
                ] = stageOutput;

                loopContext.merge({
                    [stage.outputKey]:
                        stageOutput
                });

                completedStages.push(
                    stage.stageId
                );

                this.emit(
                    ClosedLoopEvent.STAGE_COMPLETED,
                    {
                        cycleId,
                        stageId:
                            stage.stageId,
                        output:
                            stageOutput
                    }
                );

                const checkpoint = {
                    cycleId,
                    stageId:
                        stage.stageId,
                    state:
                        this.state,
                    outputs: {
                        ...outputs
                    },
                    context:
                        loopContext.snapshot(),
                    createdAt:
                        this.clock()
                };

                this.checkpointStore.save(
                    checkpoint
                );

                this.emit(
                    ClosedLoopEvent.CHECKPOINT_SAVED,
                    checkpoint
                );
            }

            const action =
                outputs.execution?.action ===
                    "reject" ||
                outputs.feedback?.action ===
                    "rollback"
                    ? ClosedLoopAction.WAIT
                    : ClosedLoopAction.CONTINUE;

            const result =
                new ClosedLoopCycleResult({
                    cycleId,
                    action,
                    outputs,
                    context:
                        loopContext.snapshot(),
                    completedStages,
                    skippedStages,
                    startedAt,
                    completedAt:
                        this.clock()
                });

            this.lastResult =
                result;

            this.cycleCount++;

            this.history.add(
                result
            );

            this.setState(
                ClosedLoopState.COMPLETED
            );

            this.emit(
                ClosedLoopEvent.CYCLE_COMPLETED,
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

    cycle(input = {}) {
        return this.run(input);
    }

    pause() {
        this.assertNotDestroyed();

        this.paused =
            true;

        this.setState(
            ClosedLoopState.PAUSED
        );

        this.emit(
            ClosedLoopEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused =
            false;

        this.setState(
            ClosedLoopState.IDLE
        );

        this.emit(
            ClosedLoopEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.checkpointStore.clear();
        this.history.clear();

        this.cycleCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            ClosedLoopState.IDLE
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
            ClosedLoopState.ERROR
        );

        this.emit(
            ClosedLoopEvent.ERROR,
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

        this.checkpointStore.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            ClosedLoopState.DESTROYED
        );

        this.emit(
            ClosedLoopEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            cycleCount:
                this.cycleCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError?.message ??
                null,
            pipeline:
                this.pipeline.summary,
            checkpoints:
                this.checkpointStore.summary,
            history:
                this.history.summary
        };
    }
}
