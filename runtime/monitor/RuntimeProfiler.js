/**
 * Baccarat Analyzer V5.6
 * runtime/monitor/RuntimeProfiler.js
 */

export const RUNTIME_PROFILER_VERSION = "5.6.0";

export default class RuntimeProfiler {
    constructor({
        clock = () => Date.now(),
        historyLimit = 100
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "RuntimeProfiler clock must be a function."
            );
        }

        if (
            !Number.isInteger(historyLimit) ||
            historyLimit < 1
        ) {
            throw new RangeError(
                "RuntimeProfiler historyLimit must be positive."
            );
        }

        this.clock = clock;
        this.historyLimit =
            historyLimit;
        this.active = new Map();
        this.history = [];
    }

    start(name, metadata = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "Profiler name must be a non-empty string."
            );
        }

        const token = {
            name,
            startedAt:
                this.clock(),
            metadata: {
                ...metadata
            }
        };

        this.active.set(
            name,
            token
        );

        return token;
    }

    end(name, metadata = {}) {
        const token =
            this.active.get(name);

        if (!token) {
            return null;
        }

        const endedAt =
            this.clock();

        const record = {
            name,
            startedAt:
                token.startedAt,
            endedAt,
            duration:
                Math.max(
                    0,
                    endedAt -
                    token.startedAt
                ),
            metadata: {
                ...token.metadata,
                ...metadata
            }
        };

        this.active.delete(name);
        this.history.push(record);

        if (
            this.history.length >
            this.historyLimit
        ) {
            this.history.splice(
                0,
                this.history.length -
                    this.historyLimit
            );
        }

        return record;
    }

    measure(
        name,
        handler,
        metadata = {}
    ) {
        this.start(
            name,
            metadata
        );

        try {
            const result =
                handler();

            if (
                result &&
                typeof result.then ===
                    "function"
            ) {
                return result.finally(
                    () => {
                        this.end(name);
                    }
                );
            }

            this.end(name);

            return result;
        }
        catch (error) {
            this.end(
                name,
                {
                    error:
                        error?.message ??
                        String(error)
                }
            );

            throw error;
        }
    }

    getHistory({
        name = null,
        limit = null
    } = {}) {
        let records =
            name
                ? this.history.filter(
                    record =>
                        record.name === name
                )
                : [...this.history];

        if (
            Number.isInteger(limit) &&
            limit >= 0
        ) {
            records =
                records.slice(
                    -limit
                );
        }

        return records.map(
            record => ({
                ...record,
                metadata: {
                    ...record.metadata
                }
            })
        );
    }

    clear() {
        this.active.clear();
        this.history = [];

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_PROFILER_VERSION,

            activeCount:
                this.active.size,

            historyCount:
                this.history.length,

            historyLimit:
                this.historyLimit
        };
    }
}
