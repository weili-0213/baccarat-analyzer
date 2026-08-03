/**
 * Baccarat Analyzer V5.7
 * runtime/recovery/RecoveryHistory.js
 */

export const RECOVERY_HISTORY_VERSION = "5.7.0";

export default class RecoveryHistory {
    constructor({
        limit = 100
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "RecoveryHistory limit must be positive."
            );
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push(
            record
        );

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
        const successCount =
            this.records.filter(
                record =>
                    record.success === true
            ).length;

        const failureCount =
            this.records.filter(
                record =>
                    record.success === false
            ).length;

        return {
            version:
                RECOVERY_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            successCount,

            failureCount,

            successRate:
                this.records.length > 0
                    ? successCount /
                        this.records.length
                    : 0,

            latest:
                this.latest()
        };
    }
}
