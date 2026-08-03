/**
 * Baccarat Analyzer V5.6
 * runtime/monitor/RuntimeMetrics.js
 */

export const RUNTIME_METRICS_VERSION = "5.6.0";

export default class RuntimeMetrics {
    constructor({
        clock = () => Date.now()
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "RuntimeMetrics clock must be a function."
            );
        }

        this.clock = clock;
        this.reset();
    }

    increment(name, amount = 1) {
        if (!Number.isFinite(amount)) {
            throw new TypeError(
                "Metric increment amount must be finite."
            );
        }

        this.counters[name] =
            (this.counters[name] ?? 0) +
            amount;

        return this.counters[name];
    }

    setGauge(name, value) {
        if (!Number.isFinite(value)) {
            throw new TypeError(
                "Metric gauge value must be finite."
            );
        }

        this.gauges[name] = value;

        return value;
    }

    recordTiming(name, duration) {
        if (
            !Number.isFinite(duration) ||
            duration < 0
        ) {
            throw new RangeError(
                "Metric duration must be zero or greater."
            );
        }

        if (!this.timings[name]) {
            this.timings[name] = {
                count: 0,
                total: 0,
                min: Infinity,
                max: 0,
                average: 0,
                last: 0
            };
        }

        const timing =
            this.timings[name];

        timing.count++;
        timing.total += duration;
        timing.min =
            Math.min(
                timing.min,
                duration
            );
        timing.max =
            Math.max(
                timing.max,
                duration
            );
        timing.average =
            timing.total /
            timing.count;
        timing.last =
            duration;

        return {
            ...timing
        };
    }

    getCounter(name) {
        return this.counters[name] ?? 0;
    }

    getGauge(name) {
        return this.gauges[name] ?? 0;
    }

    getTiming(name) {
        const timing =
            this.timings[name];

        if (!timing) {
            return null;
        }

        return {
            ...timing,
            min:
                timing.min === Infinity
                    ? 0
                    : timing.min
        };
    }

    snapshot() {
        return {
            version:
                RUNTIME_METRICS_VERSION,

            timestamp:
                this.clock(),

            counters: {
                ...this.counters
            },

            gauges: {
                ...this.gauges
            },

            timings:
                Object.fromEntries(
                    Object.entries(
                        this.timings
                    ).map(
                        ([name, timing]) => [
                            name,
                            {
                                ...timing,
                                min:
                                    timing.min === Infinity
                                        ? 0
                                        : timing.min
                            }
                        ]
                    )
                )
        };
    }

    reset() {
        this.counters = {};
        this.gauges = {};
        this.timings = {};

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_METRICS_VERSION,

            counterCount:
                Object.keys(
                    this.counters
                ).length,

            gaugeCount:
                Object.keys(
                    this.gauges
                ).length,

            timingCount:
                Object.keys(
                    this.timings
                ).length
        };
    }
}
