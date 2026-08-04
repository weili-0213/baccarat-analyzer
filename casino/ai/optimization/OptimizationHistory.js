/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/OptimizationHistory.js
 */

export const OPTIMIZATION_HISTORY_VERSION = "7.9.0";

export default class OptimizationHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "OptimizationHistory limit must be positive."
            );
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push(record);

        if (
            this.records.length >
            this.limit
        ) {
            this.records.splice(
                0,
                this.records.length -
                    this.limit
            );
        }

        return record;
    }

    latest() {
        return (
            this.records[
                this.records.length - 1
            ] ??
            null
        );
    }

    find(optimizationId) {
        return (
            this.records.find(
                record =>
                    record.optimizationId ===
                    optimizationId
            ) ??
            null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        return {
            version:
                OPTIMIZATION_HISTORY_VERSION,
            limit:
                this.limit,
            count:
                this.records.length,
            latest:
                this.latest()
        };
    }
}
