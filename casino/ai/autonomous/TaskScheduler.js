/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/TaskScheduler.js
 */
import { AutonomousTaskStatus } from "./AutonomousState.js";
export const AUTONOMOUS_TASK_SCHEDULER_VERSION = "8.0.0";
export default class TaskScheduler {
    constructor() {
        this.queue = [];
        this.sequence = 0;
    }
    schedule({
        taskId = null,
        type,
        priority = 0,
        payload = {},
        optional = false,
        metadata = {}
    } = {}) {
        if (typeof type !== "string" || type.length === 0) {
            throw new TypeError("Autonomous task type is required.");
        }
        this.sequence++;
        const task = {
            taskId: taskId ?? `task-${this.sequence}`,
            type,
            priority,
            payload: { ...payload },
            optional: Boolean(optional),
            status: AutonomousTaskStatus.PENDING,
            metadata: { ...metadata }
        };
        this.queue.push(task);
        this.queue.sort((a, b) => b.priority - a.priority);
        return task;
    }
    buildForGoal(goal) {
        if (!goal) return [];
        const types = Array.isArray(goal.metadata?.tasks)
            ? goal.metadata.tasks
            : [
                "decision",
                "reasoning",
                "planning",
                "governance",
                "execution",
                "learning",
                "assurance",
                "optimization"
            ];
        return types.map((type, index) =>
            this.schedule({
                type,
                priority: types.length - index,
                payload: { goalId: goal.goalId }
            })
        );
    }
    next() {
        return this.queue.find(
            task => task.status === AutonomousTaskStatus.PENDING
        ) ?? null;
    }
    mark(taskId, status) {
        const task = this.queue.find(item => item.taskId === taskId);
        if (!task) return false;
        task.status = status;
        return true;
    }
    pending() {
        return this.queue.filter(
            task => task.status === AutonomousTaskStatus.PENDING
        );
    }
    clear() {
        this.queue = [];
        this.sequence = 0;
        return this;
    }
    get summary() {
        return {
            version: AUTONOMOUS_TASK_SCHEDULER_VERSION,
            count: this.queue.length,
            pendingCount: this.pending().length,
            completedCount: this.queue.filter(
                task => task.status === AutonomousTaskStatus.COMPLETED
            ).length,
            failedCount: this.queue.filter(
                task => task.status === AutonomousTaskStatus.FAILED
            ).length
        };
    }
}
