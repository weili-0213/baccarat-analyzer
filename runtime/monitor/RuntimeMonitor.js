/**
 * Baccarat Analyzer V5.6
 * runtime/monitor/RuntimeMonitor.js
 */

import RuntimeMetrics
    from "./RuntimeMetrics.js";

import RuntimeHealth
    from "./RuntimeHealth.js";

import RuntimeProfiler
    from "./RuntimeProfiler.js";

import {
    RuntimeEventType
} from "../events/RuntimeEvents.js";


export const RUNTIME_MONITOR_VERSION = "5.6.0";


export default class RuntimeMonitor {
    constructor({
        eventBus = null,
        runtime = null,
        scheduler = null,
        pipeline = null,
        controller = null,
        metrics = null,
        health = null,
        profiler = null,
        clock = () => Date.now(),
        historyLimit = 100
    } = {}) {
        if (
            eventBus !== null &&
            typeof eventBus.on !==
                "function"
        ) {
            throw new TypeError(
                "RuntimeMonitor eventBus requires on()."
            );
        }

        if (
            !Number.isInteger(historyLimit) ||
            historyLimit < 1
        ) {
            throw new RangeError(
                "RuntimeMonitor historyLimit must be positive."
            );
        }

        this.eventBus = eventBus;
        this.runtime = runtime;
        this.scheduler = scheduler;
        this.pipeline = pipeline;
        this.controller = controller;
        this.clock = clock;
        this.historyLimit =
            historyLimit;

        this.metrics =
            metrics ??
            new RuntimeMetrics({
                clock
            });

        this.health =
            health ??
            new RuntimeHealth();

        this.profiler =
            profiler ??
            new RuntimeProfiler({
                clock,
                historyLimit
            });

        this.history = [];
        this.unsubscribers = [];
        this.started = false;
        this.destroyed = false;
        this.lastSnapshot = null;
    }

    start() {
        if (this.destroyed) {
            throw new Error(
                "RuntimeMonitor has been destroyed."
            );
        }

        if (this.started) {
            return this;
        }

        this.started = true;

        this.bindEvents();

        return this;
    }

    bindEvents() {
        if (!this.eventBus) {
            return this;
        }

        const bindings = [
            [
                RuntimeEventType.COMMAND_STARTED,
                () =>
                    this.metrics.increment(
                        "commandsStarted"
                    )
            ],
            [
                RuntimeEventType.COMMAND_COMPLETED,
                () =>
                    this.metrics.increment(
                        "commandsCompleted"
                    )
            ],
            [
                RuntimeEventType.ROUND_STARTED,
                () =>
                    this.metrics.increment(
                        "roundsStarted"
                    )
            ],
            [
                RuntimeEventType.ROUND_COMPLETED,
                () =>
                    this.metrics.increment(
                        "roundsCompleted"
                    )
            ],
            [
                RuntimeEventType.ANALYSIS_COMPLETED,
                () =>
                    this.metrics.increment(
                        "analysesCompleted"
                    )
            ],
            [
                RuntimeEventType.BET_RECORDED,
                () =>
                    this.metrics.increment(
                        "betsRecorded"
                    )
            ],
            [
                RuntimeEventType.DASHBOARD_UPDATED,
                () =>
                    this.metrics.increment(
                        "dashboardUpdates"
                    )
            ],
            [
                RuntimeEventType.WARNING,
                () =>
                    this.metrics.increment(
                        "warnings"
                    )
            ],
            [
                RuntimeEventType.ERROR,
                () =>
                    this.metrics.increment(
                        "errors"
                    )
            ]
        ];

        for (const [type, handler] of bindings) {
            const unsubscribe =
                this.eventBus.on(
                    type,
                    handler
                );

            if (
                typeof unsubscribe ===
                    "function"
            ) {
                this.unsubscribers.push(
                    unsubscribe
                );
            }
        }

        return this;
    }

    recordPipeline(result) {
        const duration =
            result?.duration ??
            result?.summary?.duration ??
            0;

        this.metrics.recordTiming(
            "pipeline",
            duration
        );

        if (result?.success === false) {
            this.metrics.increment(
                "pipelineFailures"
            );
        }

        return this;
    }

    recordScheduler() {
        const summary =
            this.scheduler?.summary;

        if (!summary) {
            return this;
        }

        this.metrics.setGauge(
            "schedulerQueueLength",
            summary.queue
                ?.queuedCount ??
            0
        );

        this.metrics.setGauge(
            "schedulerTickCount",
            summary.tickCount ??
            0
        );

        this.metrics.setGauge(
            "schedulerFlushCount",
            summary.flushCount ??
            0
        );

        return this;
    }

    recordEventBus() {
        const summary =
            this.eventBus?.summary;

        if (!summary) {
            return this;
        }

        this.metrics.setGauge(
            "eventCount",
            summary.emittedCount ??
            0
        );

        this.metrics.setGauge(
            "listenerCount",
            summary.listenerCount ??
            0
        );

        this.metrics.setGauge(
            "eventQueueLength",
            summary.queuedCount ??
            0
        );

        return this;
    }

    collect() {
        if (this.destroyed) {
            throw new Error(
                "RuntimeMonitor has been destroyed."
            );
        }

        this.recordScheduler();
        this.recordEventBus();

        const pipelineTiming =
            this.metrics.getTiming(
                "pipeline"
            );

        const snapshot = {
            version:
                RUNTIME_MONITOR_VERSION,

            timestamp:
                this.clock(),

            runtime:
                this.runtime
                    ?.summary ??
                null,

            controller:
                this.controller
                    ?.summary ??
                null,

            scheduler: {
                queueLength:
                    this.metrics.getGauge(
                        "schedulerQueueLength"
                    ),

                tickCount:
                    this.metrics.getGauge(
                        "schedulerTickCount"
                    ),

                flushCount:
                    this.metrics.getGauge(
                        "schedulerFlushCount"
                    )
            },

            eventBus: {
                eventCount:
                    this.metrics.getGauge(
                        "eventCount"
                    ),

                listenerCount:
                    this.metrics.getGauge(
                        "listenerCount"
                    ),

                queueLength:
                    this.metrics.getGauge(
                        "eventQueueLength"
                    )
            },

            pipeline: {
                count:
                    pipelineTiming?.count ??
                    0,

                averageDuration:
                    pipelineTiming
                        ?.average ??
                    0,

                maxDuration:
                    pipelineTiming
                        ?.max ??
                    0,

                lastDuration:
                    pipelineTiming
                        ?.last ??
                    0,

                failures:
                    this.metrics.getCounter(
                        "pipelineFailures"
                    )
            },

            warnings:
                this.metrics.getCounter(
                    "warnings"
                ),

            errors:
                this.metrics.getCounter(
                    "errors"
                ),

            metrics:
                this.metrics.snapshot(),

            profiler:
                this.profiler.summary
        };

        snapshot.health =
            this.health.evaluate(
                snapshot
            );

        this.lastSnapshot =
            snapshot;

        this.history.push(
            snapshot
        );

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

        return snapshot;
    }

    getHistory({
        limit = null
    } = {}) {
        if (
            Number.isInteger(limit) &&
            limit >= 0
        ) {
            return this.history.slice(
                -limit
            );
        }

        return [...this.history];
    }

    reset() {
        this.metrics.reset();
        this.profiler.clear();
        this.history = [];
        this.lastSnapshot = null;

        return this;
    }

    stop() {
        for (
            const unsubscribe of
            this.unsubscribers
        ) {
            unsubscribe();
        }

        this.unsubscribers = [];
        this.started = false;

        return this;
    }

    destroy() {
        this.stop();
        this.reset();
        this.destroyed = true;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_MONITOR_VERSION,

            started:
                this.started,

            destroyed:
                this.destroyed,

            subscriptionCount:
                this.unsubscribers.length,

            historyCount:
                this.history.length,

            hasSnapshot:
                Boolean(
                    this.lastSnapshot
                ),

            metrics:
                this.metrics.summary,

            profiler:
                this.profiler.summary
        };
    }
}
