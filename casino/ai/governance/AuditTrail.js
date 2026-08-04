/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/AuditTrail.js
 */

export const AUDIT_TRAIL_VERSION = "7.7.0";

export default class AuditTrail {
    constructor({
        limit = 1000
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "AuditTrail limit must be positive."
            );
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push({
            ...record
        });

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

    find(governanceId) {
        return (
            this.records.find(
                record =>
                    record.governanceId ===
                    governanceId
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
            version: AUDIT_TRAIL_VERSION,
            limit: this.limit,
            count: this.records.length,
            latest: this.latest()
        };
    }
}
