/**
 * Baccarat Analyzer V5.4
 * runtime/scheduler/RuntimeScheduler.js
 *
 * Coordinates RuntimeTicker and RuntimeTaskQueue.
 */

import RuntimeTaskQueue, {
    RuntimeTaskPriority
} from "./RuntimeTaskQueue.js";

import RuntimeTicker, {
    RuntimeTickerMode
} from "./RuntimeTicker.js";

import {
    RuntimeEventType
} from "../events/RuntimeEvents.js";


export const RUNTIME_SCHEDULER_VERSION = "5.4.0";

export const RuntimeSchedulerStatus = Object.freeze({
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    STOPPED: "stopped",
    DESTROYED: "destroyed"
});


export default class RuntimeScheduler {
    constructor({
        eventBus = null,
        queue = null,
        ticker = null,
        interval = 100,
        mode = RuntimeTickerMode.INTERVAL,
        scheduler = globalThis,
        clock = () => Date.now(),
        maxTasksPerTick = 10,
        contextFactory = null
    } = {}) {
        if (
            eventBus !== null &&
            typeof eventBus.emit !==
                "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (
            !Number.isInteger(maxTasksPerTick) ||
            maxTasksPerTick < 1
        ) {
            throw new RangeError(
                "maxTasksPerTick must be a positive integer."
            );
        }

        this.eventBus = eventBus;
        this.clock = clock;
        this.maxTasksPerTick =
            maxTasksPerTick;
        this.contextFactory =
            contextFactory;

        this.queue =
            queue ??
            new RuntimeTaskQueue({
                clock
            });

        this.ticker =
            ticker ??
            new RuntimeTicker({
                mode,
                interval,
                scheduler,
                clock,
                onTick:
                    tick =>
                        this.handleTick(tick)
            });

        this.status =
            RuntimeSchedulerStatus.IDLE;

        this.flushCount = 0;
        this.tickCount = 0;
        this.lastFlushAt = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "runtime-scheduler"
                }
            ) ??
            null;
    }

    start() {
        if (
            this.status ===
                RuntimeSchedulerStatus.DESTROYED
        ) {
            throw new Error(
                "RuntimeScheduler has been destroyed."
            );
        }

        this.status =
            RuntimeSchedulerStatus.RUNNING;

        this.ticker.start();

        return this;
    }

    stop() {
        this.ticker.stop();

        this.status =
            RuntimeSchedulerStatus.STOPPED;

        return this;
    }

    pause() {
        this.ticker.pause();

        this.status =
            RuntimeSchedulerStatus.PAUSED;

        return this;
    }

    resume() {
        if (
            this.status ===
                RuntimeSchedulerStatus.DESTROYED
        ) {
            throw new Error(
                "RuntimeScheduler has been destroyed."
            );
        }

        this.status =
            RuntimeSchedulerStatus.RUNNING;

        this.ticker.resume();

        return this;
    }

    schedule(handler, options = {}) {
        return this.queue.enqueue(
            handler,
            options
        );
    }

    scheduleOnce(
        key,
        handler,
        options = {}
    ) {
        return this.schedule(
            handler,
            {
                ...options,
                key,
                coalesce: true
            }
        );
    }

    scheduleDashboardRefresh(
        handler,
        {
            delay = 0,
            priority =
                RuntimeTaskPriority.HIGH
        } = {}
    ) {
        return this.scheduleOnce(
            "dashboard-refresh",
            handler,
            {
                delay,
                priority,
                metadata: {
                    type:
                        "dashboard-refresh"
                }
            }
        );
    }

    scheduleAnalysis(
        handler,
        {
            delay = 0,
            priority =
                RuntimeTaskPriority.CRITICAL
        } = {}
    ) {
        return this.scheduleOnce(
            "analysis",
            handler,
            {
                delay,
                priority,
                metadata: {
                    type:
                        "analysis"
                }
            }
        );
    }

    cancel(id) {
        return this.queue.cancel(id);
    }

    async handleTick(tick = {}) {
        this.tickCount++;

        try {
            const context =
                typeof this.contextFactory ===
                    "function"
                    ? await this.contextFactory(
                        tick
                    )
                    : {
                        tick,
                        scheduler:
                            this
                    };

            const executed =
                await this.queue.flush({
                    limit:
                        this.maxTasksPerTick,
                    context
                });

            if (executed.length > 0) {
                this.flushCount++;
                this.lastFlushAt =
                    this.clock();

                this.emit(
                    RuntimeEventType.SESSION_UPDATED,
                    {
                        executedTasks:
                            executed.map(
                                task => ({
                                    id:
                                        task.id,
                                    key:
                                        task.key,
                                    status:
                                        task.status
                                })
                            )
                    }
                );
            }

            this.lastError = null;

            return executed;
        }
        catch (error) {
            this.lastError = error;

            this.emit(
                RuntimeEventType.ERROR,
                {
                    phase:
                        "scheduler",
                    message:
                        error?.message ??
                        String(error)
                }
            );

            throw error;
        }
    }

    async flushNow() {
        return this.handleTick({
            timestamp:
                this.clock(),
            manual:
                true
        });
    }

    setInterval(value) {
        this.ticker.setInterval(value);
        return this;
    }

    clear() {
        this.queue.clear();
        return this;
    }

    destroy() {
        this.stop();
        this.clear();
        this.ticker.destroy();

        this.status =
            RuntimeSchedulerStatus.DESTROYED;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_SCHEDULER_VERSION,
            status:
                this.status,
            tickCount:
                this.tickCount,
            flushCount:
                this.flushCount,
            lastFlushAt:
                this.lastFlushAt,
            lastError:
                this.lastError
                    ?.message ??
                null,
            queue:
                this.queue.summary,
            ticker:
                this.ticker.summary
        };
    }
}
