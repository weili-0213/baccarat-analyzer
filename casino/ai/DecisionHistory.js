/**
 * Baccarat Analyzer V7.0
 * casino/ai/DecisionHistory.js
 */

export const DECISION_HISTORY_VERSION = "7.0.0";

export default class DecisionHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "DecisionHistory limit must be positive."
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

    find(decisionId) {
        return (
            this.records.find(
                record =>
                    record.decisionId ===
                    decisionId
            ) ??
            null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        const totals = {
            recommend: 0,
            skip: 0,
            wait: 0
        };

        for (const record of this.records) {
            if (
                record.action in totals
            ) {
                totals[
                    record.action
                ]++;
            }
        }

        return {
            version:
                DECISION_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            totals,

            latest:
                this.latest()
        };
    }
}
