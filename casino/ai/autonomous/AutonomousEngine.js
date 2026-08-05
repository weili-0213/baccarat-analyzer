/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/AutonomousEngine.js
 */
import {
    AutonomousState,
    AutonomousTaskStatus
} from "./AutonomousState.js";
import AutonomousContext from "./AutonomousContext.js";
import GoalManager from "./GoalManager.js";
import TaskScheduler from "./TaskScheduler.js";
import AutonomousMemory from "./AutonomousMemory.js";
import AutonomousMonitor from "./AutonomousMonitor.js";

export const AUTONOMOUS_ENGINE_VERSION = "8.0.0";

export const AutonomousEvent = Object.freeze({
    STATE_CHANGE: "autonomous-engine:state-change",
    STARTED: "autonomous-engine:started",
    GOAL_SELECTED: "autonomous-engine:goal-selected",
    TASK_STARTED: "autonomous-engine:task-started",
    TASK_COMPLETED: "autonomous-engine:task-completed",
    TASK_FAILED: "autonomous-engine:task-failed",
    CYCLE_COMPLETED: "autonomous-engine:cycle-completed",
    PAUSED: "autonomous-engine:paused",
    RESUMED: "autonomous-engine:resumed",
    STOPPED: "autonomous-engine:stopped",
    RESTARTED: "autonomous-engine:restarted",
    ERROR: "autonomous-engine:error",
    DESTROYED: "autonomous-engine:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

export default class AutonomousEngine {
    constructor({
        goals = null,
        scheduler = null,
        memory = null,
        monitor = null,
        handlers = {},
        eventBus = null,
        clock = () => Date.now(),
        stopOnError = true
    } = {}) {
        if (eventBus !== null && !isFunction(eventBus.emit)) {
            throw new TypeError("eventBus requires emit().");
        }
        if (!isFunction(clock)) {
            throw new TypeError("clock must be a function.");
        }

        this.goals = goals ?? new GoalManager();
        this.scheduler = scheduler ?? new TaskScheduler();
        this.memory = memory ?? new AutonomousMemory();
        this.monitor = monitor ?? new AutonomousMonitor();
        this.handlers = new Map();

        for (const [type, handler] of Object.entries(handlers)) {
            this.registerHandler(type, handler);
        }

        this.eventBus = eventBus;
        this.clock = clock;
        this.stopOnError = Boolean(stopOnError);
        this.state = AutonomousState.IDLE;
        this.previousState = null;
        this.paused = false;
        this.stopped = false;
        this.stopReason = null;
        this.destroyed = false;
        this.cycleCount = 0;
        this.lastContext = null;
        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(type, payload, {
                source: "autonomous-engine"
            }) ?? null
        );
    }

    setState(state) {
        const previous = this.state;
        this.previousState = previous;
        this.state = state;
        this.emit(AutonomousEvent.STATE_CHANGE, {
            previous,
            current: state
        });
        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error("AutonomousEngine has been destroyed.");
        }
    }

    registerHandler(type, handler) {
        if (typeof type !== "string" || type.length === 0) {
            throw new TypeError("Autonomous handler type is required.");
        }
        if (!isFunction(handler)) {
            throw new TypeError("Autonomous handler must be a function.");
        }
        this.handlers.set(type, handler);
        return this;
    }

    unregisterHandler(type) {
        return this.handlers.delete(type);
    }

    async start({
        context = {},
        goalId = null,
        autoRun = true
    } = {}) {
        this.assertNotDestroyed();

        this.paused = false;
        this.stopped = false;
        this.stopReason = null;
        this.lastError = null;

        const autonomousContext =
            context instanceof AutonomousContext
                ? context
                : new AutonomousContext(context);

        this.lastContext = autonomousContext;
        this.setState(AutonomousState.STARTING);

        const goal = this.goals.select(goalId);

        if (!goal) {
            throw new Error("No active autonomous goal available.");
        }

        autonomousContext.goal = goal;

        if (this.scheduler.pending().length === 0) {
            this.scheduler.buildForGoal(goal);
        }

        this.emit(AutonomousEvent.STARTED, {
            goal,
            context: autonomousContext
        });
        this.emit(AutonomousEvent.GOAL_SELECTED, goal);
        this.setState(AutonomousState.RUNNING);

        if (!autoRun) {
            return {
                started: true,
                goal,
                context: autonomousContext
            };
        }

        return this.runCycle({
            context: autonomousContext
        });
    }

    async runCycle({
        context = this.lastContext ?? {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        if (this.stopped) {
            return {
                stopped: true,
                reason: this.stopReason
            };
        }

        const autonomousContext =
            context instanceof AutonomousContext
                ? context
                : new AutonomousContext(context);

        this.lastContext = autonomousContext;
        this.cycleCount++;

        const cycleStartedAt = this.clock();
        const taskResults = [];

        try {
            while (!this.paused && !this.stopped) {
                const task = this.scheduler.next();

                if (!task) {
                    break;
                }

                task.status = AutonomousTaskStatus.RUNNING;
                autonomousContext.task = task;

                const stateByTask = {
                    planning: AutonomousState.PLANNING,
                    execution: AutonomousState.EXECUTING,
                    learning: AutonomousState.LEARNING,
                    optimization: AutonomousState.OPTIMIZING
                };

                this.setState(
                    stateByTask[task.type] ??
                    AutonomousState.RUNNING
                );

                this.emit(AutonomousEvent.TASK_STARTED, task);

                const handler = this.handlers.get(task.type);

                if (!handler) {
                    task.status = task.optional
                        ? AutonomousTaskStatus.SKIPPED
                        : AutonomousTaskStatus.FAILED;

                    const missing = {
                        taskId: task.taskId,
                        type: task.type,
                        status: task.status,
                        error:
                            `No autonomous handler for task: ${task.type}`
                    };

                    taskResults.push(missing);
                    this.memory.add({
                        type: "task",
                        goalId:
                            autonomousContext.goal?.goalId ??
                            null,
                        taskId: task.taskId,
                        result: missing,
                        timestamp: this.clock()
                    });
                    this.emit(
                        AutonomousEvent.TASK_FAILED,
                        missing
                    );

                    if (this.stopOnError && !task.optional) {
                        throw new Error(missing.error);
                    }

                    continue;
                }

                try {
                    const output = await handler({
                        task,
                        context: autonomousContext,
                        engine: this
                    });

                    autonomousContext.set(task.type, output);
                    task.status = AutonomousTaskStatus.COMPLETED;

                    const completed = {
                        taskId: task.taskId,
                        type: task.type,
                        status: task.status,
                        output
                    };

                    taskResults.push(completed);
                    this.memory.add({
                        type: "task",
                        goalId:
                            autonomousContext.goal?.goalId ??
                            null,
                        taskId: task.taskId,
                        result: completed,
                        timestamp: this.clock()
                    });
                    this.emit(
                        AutonomousEvent.TASK_COMPLETED,
                        completed
                    );
                } catch (error) {
                    task.status = AutonomousTaskStatus.FAILED;

                    const failed = {
                        taskId: task.taskId,
                        type: task.type,
                        status: task.status,
                        error: error?.message ?? String(error)
                    };

                    taskResults.push(failed);
                    this.memory.add({
                        type: "task",
                        goalId:
                            autonomousContext.goal?.goalId ??
                            null,
                        taskId: task.taskId,
                        result: failed,
                        timestamp: this.clock()
                    });
                    this.emit(
                        AutonomousEvent.TASK_FAILED,
                        failed
                    );

                    if (this.stopOnError) {
                        throw error;
                    }
                }
            }

            const health = this.monitor.inspect({
                state: this.state,
                context: autonomousContext,
                scheduler: this.scheduler,
                memory: this.memory,
                cycleCount: this.cycleCount
            });

            const completed =
                this.scheduler.pending().length === 0 &&
                !this.paused &&
                !this.stopped;

            if (completed) {
                this.goals.complete(
                    autonomousContext.goal?.goalId
                );
            }

            const result = {
                version: AUTONOMOUS_ENGINE_VERSION,
                cycle: this.cycleCount,
                goal: autonomousContext.goal,
                tasks: taskResults,
                completed,
                paused: this.paused,
                stopped: this.stopped,
                health,
                context: autonomousContext.toJSON(),
                startedAt: cycleStartedAt,
                completedAt: this.clock()
            };

            this.lastResult = result;

            this.memory.add({
                type: "cycle",
                goalId:
                    autonomousContext.goal?.goalId ??
                    null,
                result,
                timestamp: this.clock()
            });

            this.setState(
                completed
                    ? AutonomousState.COMPLETED
                    : this.paused
                        ? AutonomousState.PAUSED
                        : this.stopped
                            ? AutonomousState.STOPPED
                            : AutonomousState.RUNNING
            );

            this.emit(
                AutonomousEvent.CYCLE_COMPLETED,
                result
            );

            return result;
        } catch (error) {
            return this.handleError(error, "runCycle");
        }
    }

    pause() {
        this.assertNotDestroyed();
        this.paused = true;
        this.setState(AutonomousState.PAUSED);
        this.emit(AutonomousEvent.PAUSED, this.summary);
        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();
        this.paused = false;
        this.setState(AutonomousState.RUNNING);
        this.emit(AutonomousEvent.RESUMED, this.summary);
        return this.summary;
    }

    stop(reason = "stopped", { emergency = false } = {}) {
        this.assertNotDestroyed();

        this.stopped = true;
        this.stopReason = reason;

        for (const task of this.scheduler.pending()) {
            task.status = AutonomousTaskStatus.CANCELLED;
        }

        this.setState(AutonomousState.STOPPED);
        this.emit(AutonomousEvent.STOPPED, {
            reason,
            emergency
        });

        return this.summary;
    }

    async restart(input = {}) {
        this.assertNotDestroyed();

        this.scheduler.clear();
        this.paused = false;
        this.stopped = false;
        this.stopReason = null;
        this.lastError = null;

        this.setState(AutonomousState.STARTING);
        this.emit(AutonomousEvent.RESTARTED, input);

        return this.start(input);
    }

    reset() {
        this.assertNotDestroyed();

        this.scheduler.clear();
        this.memory.clear();
        this.paused = false;
        this.stopped = false;
        this.stopReason = null;
        this.cycleCount = 0;
        this.lastContext = null;
        this.lastResult = null;
        this.lastError = null;

        this.setState(AutonomousState.IDLE);
        return this;
    }

    handleError(error, phase) {
        this.lastError = error;
        this.setState(AutonomousState.ERROR);
        this.emit(AutonomousEvent.ERROR, {
            phase,
            message: error?.message ?? String(error)
        });
        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.goals.clear();
        this.scheduler.clear();
        this.memory.clear();
        this.handlers.clear();
        this.lastContext = null;
        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(AutonomousState.DESTROYED);
        this.emit(AutonomousEvent.DESTROYED, null);

        return this;
    }

    get summary() {
        return {
            version: AUTONOMOUS_ENGINE_VERSION,
            state: this.state,
            previousState: this.previousState,
            paused: this.paused,
            stopped: this.stopped,
            stopReason: this.stopReason,
            destroyed: this.destroyed,
            cycleCount: this.cycleCount,
            hasResult: Boolean(this.lastResult),
            lastError: this.lastError?.message ?? null,
            goals: this.goals.summary,
            scheduler: this.scheduler.summary,
            memory: this.memory.summary,
            monitor: this.monitor.summary,
            handlerCount: this.handlers.size
        };
    }
}
