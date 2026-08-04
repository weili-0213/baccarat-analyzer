/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/GoalManager.js
 */
export const GOAL_MANAGER_VERSION = "7.4.0";
export default class GoalManager {
    constructor() {
        this.goals = new Map();
    }
    define({
        goalId,
        name,
        priority = 0,
        target = null,
        active = true,
        metadata = {}
    } = {}) {
        if (typeof goalId !== "string" || goalId.length === 0) {
            throw new TypeError("Goal goalId is required.");
        }
        if (typeof name !== "string" || name.length === 0) {
            throw new TypeError("Goal name is required.");
        }
        const goal = {
            goalId,
            name,
            priority,
            target,
            active: Boolean(active),
            metadata: { ...metadata }
        };
        this.goals.set(goalId, goal);
        return goal;
    }
    get(goalId) {
        return this.goals.get(goalId) ?? null;
    }
    activate(goalId) {
        const goal = this.get(goalId);
        if (!goal) return false;
        goal.active = true;
        return true;
    }
    deactivate(goalId) {
        const goal = this.get(goalId);
        if (!goal) return false;
        goal.active = false;
        return true;
    }
    active() {
        return [...this.goals.values()]
            .filter(goal => goal.active)
            .sort((a, b) => b.priority - a.priority);
    }
    remove(goalId) {
        return this.goals.delete(goalId);
    }
    clear() {
        this.goals.clear();
        return this;
    }
    get summary() {
        return {
            version: GOAL_MANAGER_VERSION,
            count: this.goals.size,
            activeCount: this.active().length
        };
    }
}
