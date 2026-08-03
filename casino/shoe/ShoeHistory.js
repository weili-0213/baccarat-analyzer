/**
 * Baccarat Analyzer V6.3
 * casino/shoe/ShoeHistory.js
 */

export const SHOE_HISTORY_VERSION = "6.3.0";

export default class ShoeHistory {
    constructor({
        limit = 100
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "ShoeHistory limit must be positive."
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

    find(shoeNumber) {
        return (
            this.records.find(
                record =>
                    record.shoeNumber ===
                    shoeNumber
            ) ??
            null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        const completed =
            this.records.filter(
                record =>
                    record.completed === true
            ).length;

        return {
            version:
                SHOE_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            completedCount:
                completed,

            latest:
                this.latest()
        };
    }
}
