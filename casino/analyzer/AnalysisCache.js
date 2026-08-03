/**
 * Baccarat Analyzer V6.5
 * casino/analyzer/AnalysisCache.js
 */

export const ANALYSIS_CACHE_VERSION = "6.5.0";

export default class AnalysisCache {
    constructor({
        limit = 200
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "AnalysisCache limit must be positive."
            );
        }

        this.limit = limit;
        this.map = new Map();
    }

    has(key) {
        return this.map.has(key);
    }

    get(key) {
        if (!this.map.has(key)) {
            return null;
        }

        const value =
            this.map.get(key);

        this.map.delete(key);
        this.map.set(key, value);

        return value;
    }

    set(key, value) {
        if (this.map.has(key)) {
            this.map.delete(key);
        }

        this.map.set(key, value);

        if (
            this.map.size >
            this.limit
        ) {
            const oldestKey =
                this.map.keys()
                    .next()
                    .value;

            this.map.delete(
                oldestKey
            );
        }

        return value;
    }

    delete(key) {
        return this.map.delete(key);
    }

    clear() {
        this.map.clear();
        return this;
    }

    get summary() {
        return {
            version:
                ANALYSIS_CACHE_VERSION,

            limit:
                this.limit,

            size:
                this.map.size
        };
    }
}
