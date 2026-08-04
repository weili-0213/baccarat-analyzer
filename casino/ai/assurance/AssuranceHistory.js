/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/AssuranceHistory.js
 */

export const ASSURANCE_HISTORY_VERSION = "7.8.0";

export default class AssuranceHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "AssuranceHistory limit must be positive."
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

    find(assuranceId) {
        return (
            this.records.find(
                record =>
                    record.assuranceId ===
                    assuranceId
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
            version: ASSURANCE_HISTORY_VERSION,
            limit: this.limit,
            count: this.records.length,
            latest: this.latest()
        };
    }
}
