/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ExecutionEngine.js
 */

import {
    ExecutionState,
    ExecutionStatus
} from "./ExecutionState.js";

import ExecutionContext
    from "./ExecutionContext.js";

import ExecutionResult
    from "./ExecutionResult.js";

import StepValidator
    from "./StepValidator.js";

import ActionDispatcher
    from "./ActionDispatcher.js";

import ExecutionQueue
    from "./ExecutionQueue.js";

import ExecutionHistory
    from "./ExecutionHistory.js";


export const EXECUTION_ENGINE_VERSION = "7.5.0";

export const ExecutionEvent = Object.freeze({
    STATE_CHANGE: "execution-engine:state-change",
    STARTED: "execution-engine:started",
    STEP_VALIDATED: "execution-engine:step-validated",
    STEP_STARTED: "execution-engine:step-started",
    STEP_COMPLETED: "execution-engine:step-completed",
    STEP_FAILED: "execution-engine:step-failed",
    COMPLETED: "execution-engine:completed",
    PAUSED: "execution-engine:paused",
    RESUMED: "execution-engine:resumed",
    ERROR: "execution-engine:error",
    DESTROYED: "execution-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class ExecutionEngine {
    constructor({
        validator = null,
        dispatcher = null,
        queue = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null,
        stopOnError = true
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

        this.validator =
            validator ??
            new StepValidator();

        this.dispatcher =
            dispatcher ??
            new ActionDispatcher();

        this.queue =
            queue ??
            new ExecutionQueue();

        this.history =
            history ??
            new ExecutionHistory();

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
                    `execution-${timestamp}-${sequence}`
            );

        this.stopOnError =
            Boolean(stopOnError);

        this.state =
            ExecutionState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.lastResult = null;
        this.lastError = null;
        this.executionCount = 0;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "execution-engine"
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
            ExecutionEvent.STATE_CHANGE,
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
                "ExecutionEngine has been destroyed."
            );
        }
    }

    register(action, handler) {
        this.dispatcher.register(
            action,
            handler
        );

        return this;
    }

    async execute({
        context = {},
        plan = null
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const executionContext =
            context instanceof
                ExecutionContext
                ? context
                : new ExecutionContext({
                    ...context,
                    plan:
                        plan ??
                        context.plan ??
                        null
                });

        const activePlan =
            plan ??
            executionContext.plan;

        if (!activePlan) {
            throw new TypeError(
                "ExecutionEngine requires plan."
            );
        }

        this.sequence++;

        const startedAt =
            this.clock();

        const executionId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp:
                    startedAt
            });

        this.queue.clear();

        for (
            const step of
            activePlan.steps ??
            []
        ) {
            this.queue.enqueue(
                step
            );
        }

        this.setState(
            ExecutionState.VALIDATING
        );

        this.emit(
            ExecutionEvent.STARTED,
            {
                executionId,
                plan:
                    activePlan
            }
        );

        const stepResults = [];

        try {
            while (
                this.queue.size > 0
            ) {
                if (this.paused) {
                    this.setState(
                        ExecutionState.WAITING
                    );
                    break;
                }

                const step =
                    this.queue.dequeue();

                const validation =
                    this.validator.validate(
                        step,
                        executionContext
                    );

                this.emit(
                    ExecutionEvent.STEP_VALIDATED,
                    {
                        step,
                        validation
                    }
                );

                if (!validation.valid) {
                    const blocked = {
                        stepId:
                            step?.stepId ??
                            null,

                        action:
                            step?.action ??
                            null,

                        status:
                            ExecutionStatus.BLOCKED,

                        errors:
                            validation.errors
                    };

                    stepResults.push(
                        blocked
                    );

                    if (
                        this.stopOnError
                    ) {
                        break;
                    }

                    continue;
                }

                this.setState(
                    ExecutionState.EXECUTING
                );

                this.emit(
                    ExecutionEvent.STEP_STARTED,
                    step
                );

                try {
                    const output =
                        await this.dispatcher
                            .dispatch(
                                step.action,
                                step.payload ??
                                    {},
                                executionContext
                            );

                    const completed = {
                        stepId:
                            step.stepId,

                        action:
                            step.action,

                        status:
                            ExecutionStatus.SUCCESS,

                        output
                    };

                    stepResults.push(
                        completed
                    );

                    this.emit(
                        ExecutionEvent.STEP_COMPLETED,
                        completed
                    );
                }
                catch (error) {
                    const failed = {
                        stepId:
                            step.stepId,

                        action:
                            step.action,

                        status:
                            ExecutionStatus.FAILED,

                        error:
                            error?.message ??
                            String(error)
                    };

                    stepResults.push(
                        failed
                    );

                    this.emit(
                        ExecutionEvent.STEP_FAILED,
                        failed
                    );

                    if (
                        this.stopOnError
                    ) {
                        throw error;
                    }
                }
            }

            const failed =
                stepResults.some(
                    item =>
                        item.status ===
                            ExecutionStatus.FAILED ||
                        item.status ===
                            ExecutionStatus.BLOCKED
                );

            const status =
                failed
                    ? ExecutionStatus.FAILED
                    : ExecutionStatus.SUCCESS;

            const result =
                new ExecutionResult({
                    executionId,

                    planId:
                        activePlan.planId ??
                        null,

                    status,

                    steps:
                        stepResults,

                    startedAt,

                    completedAt:
                        this.clock(),

                    metadata:
                        executionContext
                            .metadata
                });

            this.lastResult =
                result;

            this.executionCount++;

            this.history.add(
                result.toJSON()
            );

            this.setState(
                ExecutionState.COMPLETED
            );

            this.emit(
                ExecutionEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "execute"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            ExecutionState.PAUSED
        );

        this.emit(
            ExecutionEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            ExecutionState.IDLE
        );

        this.emit(
            ExecutionEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.queue.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.executionCount = 0;
        this.paused = false;

        this.setState(
            ExecutionState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            ExecutionState.ERROR
        );

        this.emit(
            ExecutionEvent.ERROR,
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

        this.queue.clear();
        this.history.clear();
        this.dispatcher.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            ExecutionState.DESTROYED
        );

        this.emit(
            ExecutionEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                EXECUTION_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            paused:
                this.paused,

            destroyed:
                this.destroyed,

            executionCount:
                this.executionCount,

            hasResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            dispatcher:
                this.dispatcher.summary,

            queue:
                this.queue.summary,

            history:
                this.history.summary,

            validator:
                this.validator.summary
        };
    }
}
