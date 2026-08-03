/**
 * Baccarat Analyzer V5.4
 * runtime/scheduler/RuntimeTaskQueue.js
 *
 * Priority task queue with:
 * - delayed tasks
 * - cancellation
 * - deduplication
 * - coalescing
 * - retry metadata
 */

export const RUNTIME_TASK_QUEUE_VERSION = "5.4.0";

export const RuntimeTaskPriority = Object.freeze({
    LOW: 10,
    NORMAL: 50,
    HIGH: 100,
    CRITICAL: 1000
});

export const RuntimeTaskStatus = Object.freeze({
    QUEUED: "queued",
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELLED: "cancelled"
});

function normalizePriority(value) {
    return Number.isFinite(value)
        ? value
        : RuntimeTaskPriority.NORMAL;
}

export default class RuntimeTaskQueue {
    constructor({
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.clock = clock;

        this.idFactory =
            idFactory ??
            (() =>
                `task-${++this.sequence}`
            );

        this.sequence = 0;
        this.tasks = new Map();
        this.completed = [];
        this.failed = [];
        this.cancelled = [];
        this.enqueueCount = 0;
        this.executeCount = 0;
    }

    enqueue(handler, {
        id = null,
        key = null,
        priority = RuntimeTaskPriority.NORMAL,
        delay = 0,
        metadata = {},
        coalesce = false
    } = {}) {
        if (typeof handler !== "function") {
            throw new TypeError(
                "Task handler must be a function."
            );
        }

        if (
            !Number.isFinite(delay) ||
            delay < 0
        ) {
            throw new RangeError(
                "Task delay must be zero or greater."
            );
        }

        if (coalesce && key) {
            const existing =
                this.findByKey(key);

            if (existing) {
                existing.handler = handler;
                existing.metadata = {
                    ...existing.metadata,
                    ...metadata
                };
                existing.priority =
                    normalizePriority(priority);
                existing.runAt =
                    this.clock() + delay;
                existing.coalescedCount++;

                return existing.id;
            }
        }

        const taskId =
            id ??
            this.idFactory();

        if (this.tasks.has(taskId)) {
            throw new Error(
                `Task already exists: ${taskId}`
            );
        }

        const task = {
            id: taskId,
            key,
            handler,
            priority:
                normalizePriority(priority),
            createdAt:
                this.clock(),
            runAt:
                this.clock() + delay,
            metadata: {
                ...metadata
            },
            status:
                RuntimeTaskStatus.QUEUED,
            coalescedCount: 0,
            result: undefined,
            error: null
        };

        this.tasks.set(taskId, task);
        this.enqueueCount++;

        return taskId;
    }

    findByKey(key) {
        for (const task of this.tasks.values()) {
            if (
                task.key === key &&
                task.status ===
                    RuntimeTaskStatus.QUEUED
            ) {
                return task;
            }
        }

        return null;
    }

    cancel(id) {
        const task =
            this.tasks.get(id);

        if (!task) {
            return false;
        }

        task.status =
            RuntimeTaskStatus.CANCELLED;

        this.tasks.delete(id);
        this.cancelled.push(task);

        return true;
    }

    clear() {
        for (const id of [
            ...this.tasks.keys()
        ]) {
            this.cancel(id);
        }

        return this;
    }

    getReadyTasks(now = this.clock()) {
        return [
            ...this.tasks.values()
        ]
            .filter(task =>
                task.status ===
                    RuntimeTaskStatus.QUEUED &&
                task.runAt <= now
            )
            .sort(
                (a, b) =>
                    b.priority -
                        a.priority ||
                    a.runAt -
                        b.runAt ||
                    a.createdAt -
                        b.createdAt
            );
    }

    async executeNext(context = {}) {
        const task =
            this.getReadyTasks()[0];

        if (!task) {
            return null;
        }

        this.tasks.delete(task.id);

        task.status =
            RuntimeTaskStatus.RUNNING;

        try {
            task.result =
                await task.handler({
                    ...context,
                    task
                });

            task.status =
                RuntimeTaskStatus.COMPLETED;

            this.completed.push(task);
            this.executeCount++;

            return task;
        }
        catch (error) {
            task.error = error;
            task.status =
                RuntimeTaskStatus.FAILED;

            this.failed.push(task);
            this.executeCount++;

            return task;
        }
    }

    async flush({
        limit = Infinity,
        context = {}
    } = {}) {
        const executed = [];

        while (
            executed.length < limit
        ) {
            const task =
                await this.executeNext(
                    context
                );

            if (!task) {
                break;
            }

            executed.push(task);
        }

        return executed;
    }

    getTask(id) {
        return (
            this.tasks.get(id) ??
            this.completed.find(
                task => task.id === id
            ) ??
            this.failed.find(
                task => task.id === id
            ) ??
            this.cancelled.find(
                task => task.id === id
            ) ??
            null
        );
    }

    get summary() {
        return {
            version:
                RUNTIME_TASK_QUEUE_VERSION,
            queuedCount:
                this.tasks.size,
            completedCount:
                this.completed.length,
            failedCount:
                this.failed.length,
            cancelledCount:
                this.cancelled.length,
            enqueueCount:
                this.enqueueCount,
            executeCount:
                this.executeCount
        };
    }
}
