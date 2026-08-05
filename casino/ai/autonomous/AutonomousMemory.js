/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/AutonomousMemory.js
 */
export const AUTONOMOUS_MEMORY_VERSION = "8.0.0";
export default class AutonomousMemory {
    constructor({ limit = 1000 } = {}) {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError(
                "AutonomousMemory limit must be positive."
            );
        }
        this.limit = limit;
        this.records = [];
    }
    add(record) {
        this.records.push({ ...record });
        if (this.records.length > this.limit) {
            this.records.splice(0, this.records.length - this.limit);
        }
        return record;
    }
    latest(type = null) {
        if (!type) {
            return this.records[this.records.length - 1] ?? null;
        }
        for (let index = this.records.length - 1; index >= 0; index--) {
            if (this.records[index].type === type) {
                return this.records[index];
            }
        }
        return null;
    }
    byGoal(goalId) {
        return this.records.filter(record => record.goalId === goalId);
    }
    clear() {
        this.records = [];
        return this;
    }
    get summary() {
        return {
            version: AUTONOMOUS_MEMORY_VERSION,
            limit: this.limit,
            count: this.records.length,
            latest: this.latest()
        };
    }
}
