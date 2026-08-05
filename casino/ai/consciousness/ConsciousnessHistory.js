/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/ConsciousnessHistory.js
 */

export const CONSCIOUSNESS_HISTORY_VERSION = "8.4.0";

export default class ConsciousnessHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "ConsciousnessHistory limit must be positive."
            );
        }

        this.limit =
            limit;

        this.records =
            [];
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
        return {
            version:
                CONSCIOUSNESS_HISTORY_VERSION,
            limit:
                this.limit,
            count:
                this.records.length,
            latest:
                this.latest()
        };
    }
}
