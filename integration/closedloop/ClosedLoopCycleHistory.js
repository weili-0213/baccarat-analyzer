/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopCycleHistory.js
 * Purpose: Stores completed closed-loop intelligence cycles.
 */
export const CLOSED_LOOP_CYCLE_HISTORY_VERSION = "10.0.0";

export default class ClosedLoopCycleHistory {
    constructor({
        limit = 500
    } = {}) {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError(
                "ClosedLoopCycleHistory limit must be positive."
            );
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push(record);

        if (this.records.length > this.limit) {
            this.records.splice(
                0,
                this.records.length - this.limit
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

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        return {
            version:
                CLOSED_LOOP_CYCLE_HISTORY_VERSION,
            limit: this.limit,
            count: this.records.length,
            latest: this.latest()
        };
    }
}
