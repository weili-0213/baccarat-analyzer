/**
 * Baccarat Analyzer V6.7
 * casino/coordinator/CoordinatorHistory.js
 */

export const COORDINATOR_HISTORY_VERSION = "6.7.0";

export default class CoordinatorHistory {
    constructor({
        limit = 300
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "CoordinatorHistory limit must be positive."
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

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        return {
            version:
                COORDINATOR_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            latest:
                this.latest()
        };
    }
}
