/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/TaskRegistry.js
 */
export const TASK_REGISTRY_VERSION = "8.9.0";

export default class TaskRegistry {
    constructor() {
        this.tasks = new Map();
    }

    register(task = {}) {
        const taskId =
            task.taskId ??
            task.id;

        if (
            typeof taskId !== "string" ||
            taskId.length === 0
        ) {
            throw new TypeError(
                "TaskRegistry taskId is required."
            );
        }

        const normalized = {
            taskId,
            engineId:
                task.engineId ??
                null,
            priority:
                Number.isFinite(task.priority)
                    ? task.priority
                    : 0,
            dependencies:
                Array.isArray(task.dependencies)
                    ? [...task.dependencies]
                    : [],
            resourceCost:
                Number.isFinite(task.resourceCost)
                    ? task.resourceCost
                    : 1,
            payload:
                task.payload ?? null,
            metadata:
                { ...(task.metadata ?? {}) }
        };

        this.tasks.set(
            taskId,
            normalized
        );

        return normalized;
    }

    get(taskId) {
        return this.tasks.get(taskId) ?? null;
    }

    all() {
        return [...this.tasks.values()];
    }

    clear() {
        this.tasks.clear();
        return this;
    }

    get summary() {
        return {
            version: TASK_REGISTRY_VERSION,
            count: this.tasks.size
        };
    }
}
