/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ReasoningHistory.js
 */
export const REASONING_HISTORY_VERSION = "7.3.0";
export default class ReasoningHistory {
    constructor({ limit = 500 } = {}) {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError("ReasoningHistory limit must be positive.");
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
    latest() {
        return this.records[this.records.length - 1] ?? null;
    }
    find(reasoningId) {
        return (
            this.records.find(
                record => record.reasoningId === reasoningId
            ) ?? null
        );
    }
    clear() {
        this.records = [];
        return this;
    }
    get summary() {
        return {
            version: REASONING_HISTORY_VERSION,
            limit: this.limit,
            count: this.records.length,
            latest: this.latest()
        };
    }
}
