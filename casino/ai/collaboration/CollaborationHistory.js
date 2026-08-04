/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/CollaborationHistory.js
 */

export const COLLABORATION_HISTORY_VERSION = "7.6.0";

export default class CollaborationHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "CollaborationHistory limit must be positive."
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

    find(collaborationId) {
        return (
            this.records.find(
                record =>
                    record.collaborationId ===
                    collaborationId
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
            version:
                COLLABORATION_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            latest:
                this.latest()
        };
    }
}
