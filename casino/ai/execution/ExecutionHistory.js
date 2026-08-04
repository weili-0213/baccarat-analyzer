/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ExecutionHistory.js
 */

export const EXECUTION_HISTORY_VERSION = "7.5.0";

export default class ExecutionHistory {
    constructor({ limit = 500 } = {}) {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError("ExecutionHistory limit must be positive.");
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push(record);

        if (this.records.length > this.limit) {
            this.records.splice(0, this.records.length - this.limit);
        }

        return record;
    }

    latest() {
        return this.records[this.records.length - 1] ?? null;
    }

    find(executionId) {
        return (
            this.records.find(
                record => record.executionId === executionId
            ) ?? null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        return {
            version: EXECUTION_HISTORY_VERSION,
            limit: this.limit,
            count: this.records.length,
            latest: this.latest()
        };
    }
}
