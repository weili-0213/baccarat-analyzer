/**
 * Baccarat Analyzer V6.5
 * casino/analyzer/AnalysisHistory.js
 */

export const ANALYSIS_HISTORY_VERSION = "6.5.0";

export default class AnalysisHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "AnalysisHistory limit must be positive."
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

    find(analysisId) {
        return (
            this.records.find(
                record =>
                    record.analysisId ===
                    analysisId
            ) ??
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

        return {
            version:
                ANALYSIS_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            successCount,

            failureCount:
                this.records.length -
                successCount,

            latest:
                this.latest()
        };
    }
}
