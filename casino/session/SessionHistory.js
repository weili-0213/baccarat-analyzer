/**
 * Baccarat Analyzer V6.4
 * casino/session/SessionHistory.js
 */

export const SESSION_HISTORY_VERSION = "6.4.0";

export default class SessionHistory {
    constructor({
        limit = 100
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "SessionHistory limit must be positive."
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

    find(sessionId) {
        return (
            this.records.find(
                record =>
                    record.sessionId ===
                    sessionId
            ) ??
            null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        const completedCount =
            this.records.filter(
                record =>
                    record.completed ===
                    true
            ).length;

        const totalRounds =
            this.records.reduce(
                (
                    total,
                    record
                ) =>
                    total +
                    (
                        record.roundCount ??
                        0
                    ),
                0
            );

        return {
            version:
                SESSION_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            completedCount,

            totalRounds,

            latest:
                this.latest()
        };
    }
}
