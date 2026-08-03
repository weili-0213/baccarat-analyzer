/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyHistory.js
 */

export const STRATEGY_HISTORY_VERSION = "6.9.0";

export default class StrategyHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "StrategyHistory limit must be positive."
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
        const bets =
            this.records.filter(
                record =>
                    record.action ===
                    "bet"
            ).length;

        const skips =
            this.records.filter(
                record =>
                    record.action ===
                    "skip"
            ).length;

        return {
            version:
                STRATEGY_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            betCount:
                bets,

            skipCount:
                skips,

            latest:
                this.latest()
        };
    }
}
