/**
 * Baccarat Analyzer V6.6
 * casino/dashboard/DashboardHistory.js
 */

export const DASHBOARD_HISTORY_VERSION = "6.6.0";

export default class DashboardHistory {
    constructor({
        limit = 200
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "DashboardHistory limit must be positive."
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
                DASHBOARD_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            latest:
                this.latest()
        };
    }
}
