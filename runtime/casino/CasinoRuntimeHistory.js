/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/CasinoRuntimeHistory.js
 * Purpose: Stores Casino-level runtime events.
 */
export const CASINO_RUNTIME_HISTORY_VERSION = "10.4.0";

export default class CasinoRuntimeHistory {
    constructor({
        limit = 2000
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "CasinoRuntimeHistory limit must be positive."
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
                CASINO_RUNTIME_HISTORY_VERSION,
            count:
                this.records.length,
            limit:
                this.limit,
            latest:
                this.latest()
        };
    }
}
