/**
 * Baccarat Analyzer V5.5
 * runtime/pipeline/PipelineHistory.js
 */

export const PIPELINE_HISTORY_VERSION = "5.5.0";

export default class PipelineHistory {
    constructor({
        limit = 100
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "PipelineHistory limit must be a positive integer."
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
        return {
            version:
                PIPELINE_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            latest:
                this.latest()
        };
    }
}
