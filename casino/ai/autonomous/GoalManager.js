/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/GoalManager.js
 */
export const AUTONOMOUS_GOAL_MANAGER_VERSION = "8.0.0";
export default class GoalManager {
    constructor() {
        this.goals = new Map();
        this.currentGoalId = null;
    }
    add({
        goalId,
        name,
        priority = 0,
        target = null,
        active = true,
        completed = false,
        metadata = {}
    } = {}) {
        if (typeof goalId !== "string" || goalId.length === 0) {
            throw new TypeError("Autonomous goalId is required.");
        }
        if (typeof name !== "string" || name.length === 0) {
            throw new TypeError("Autonomous goal name is required.");
        }
        const goal = {
            goalId,
            name,
            priority,
            target,
            active: Boolean(active),
            completed: Boolean(completed),
            metadata: { ...metadata }
        };
        this.goals.set(goalId, goal);
        return goal;
    }
    get(goalId) {
        return this.goals.get(goalId) ?? null;
    }
    select(goalId = null) {
        const selected = goalId
            ? this.get(goalId)
            : [...this.goals.values()]
                .filter(goal => goal.active && !goal.completed)
                .sort((a, b) => b.priority - a.priority)[0] ?? null;
        this.currentGoalId = selected?.goalId ?? null;
        return selected;
    }
    complete(goalId = this.currentGoalId) {
        const goal = this.get(goalId);
        if (!goal) return false;
        goal.completed = true;
        if (this.currentGoalId === goalId) {
            this.currentGoalId = null;
        }
        return true;
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
    remove(goalId) {
        if (this.currentGoalId === goalId) {
            this.currentGoalId = null;
        }
        return this.goals.delete(goalId);
    }
    clear() {
        this.goals.clear();
        this.currentGoalId = null;
        return this;
    }
    get summary() {
        return {
            version: AUTONOMOUS_GOAL_MANAGER_VERSION,
            count: this.goals.size,
            activeCount: [...this.goals.values()]
                .filter(goal => goal.active && !goal.completed).length,
            completedCount: [...this.goals.values()]
                .filter(goal => goal.completed).length,
            currentGoalId: this.currentGoalId
        };
    }
}
