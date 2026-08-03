/**
 * Baccarat Analyzer V5.6
 * tests/runtimeMonitor.test.js
 */

import RuntimeMonitor, {
    RUNTIME_MONITOR_VERSION
} from "../runtime/monitor/RuntimeMonitor.js";

import RuntimeMetrics, {
    RUNTIME_METRICS_VERSION
} from "../runtime/monitor/RuntimeMetrics.js";

import RuntimeHealth, {
    RUNTIME_HEALTH_VERSION,
    RuntimeHealthStatus
} from "../runtime/monitor/RuntimeHealth.js";

import RuntimeProfiler, {
    RUNTIME_PROFILER_VERSION
} from "../runtime/monitor/RuntimeProfiler.js";

import {
    RUNTIME_MONITOR_FACTORY_VERSION
} from "../runtime/createRuntimeMonitor.js";

import {
    RuntimeEventType
} from "../runtime/events/RuntimeEvents.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createEventBus() {
    const listeners =
        new Map();

    return {
        emittedCount: 0,

        on(type, listener) {
            if (!listeners.has(type)) {
                listeners.set(
                    type,
                    new Set()
                );
            }

            listeners
                .get(type)
                .add(listener);

            return () => {
                listeners
                    .get(type)
                    ?.delete(listener);
            };
        },

        emit(type, payload = null) {
            this.emittedCount++;

            for (
                const listener of
                listeners.get(type) ??
                []
            ) {
                listener({
                    type,
                    payload
                });
            }
        },

        get summary() {
            let listenerCount = 0;

            for (
                const records of
                listeners.values()
            ) {
                listenerCount +=
                    records.size;
            }

            return {
                emittedCount:
                    this.emittedCount,

                listenerCount,

                queuedCount:
                    0
            };
        }
    };
}


export default async function runtimeMonitorTest() {
    const messages = [];

    assert(
        RUNTIME_MONITOR_VERSION ===
            "5.6.0" &&
        RUNTIME_METRICS_VERSION ===
            "5.6.0" &&
        RUNTIME_HEALTH_VERSION ===
            "5.6.0" &&
        RUNTIME_PROFILER_VERSION ===
            "5.6.0" &&
        RUNTIME_MONITOR_FACTORY_VERSION ===
            "5.6.0",
        "V5.6 Monitor 版本錯誤"
    );

    messages.push(
        "✓ V5.6 Monitor 版本正確"
    );

    let now = 0;

    const metrics =
        new RuntimeMetrics({
            clock:
                () => now
        });

    metrics.increment(
        "events"
    );

    metrics.increment(
        "events",
        2
    );

    metrics.setGauge(
        "queue",
        5
    );

    metrics.recordTiming(
        "pipeline",
        10
    );

    metrics.recordTiming(
        "pipeline",
        30
    );

    assert(
        metrics.getCounter(
            "events"
        ) === 3 &&
        metrics.getGauge(
            "queue"
        ) === 5 &&
        metrics.getTiming(
            "pipeline"
        ).average === 20,
        "RuntimeMetrics 錯誤"
    );

    messages.push(
        "✓ Metrics 收集正確"
    );

    const profiler =
        new RuntimeProfiler({
            clock:
                () => now,
            historyLimit:
                5
        });

    profiler.start(
        "analysis"
    );

    now = 25;

    const profile =
        profiler.end(
            "analysis"
        );

    assert(
        profile.duration === 25 &&
        profiler.summary
            .historyCount === 1,
        "RuntimeProfiler 錯誤"
    );

    messages.push(
        "✓ Profiler Timing 正確"
    );

    const health =
        new RuntimeHealth();

    const healthy =
        health.evaluate({
            warnings: 0,
            errors: 0,
            scheduler: {
                queueLength: 0
            },
            pipeline: {
                averageDuration: 10
            }
        });

    const critical =
        health.evaluate({
            warnings: 5,
            errors: 5,
            scheduler: {
                queueLength: 50
            },
            pipeline: {
                averageDuration: 2000
            }
        });

    assert(
        healthy.status ===
            RuntimeHealthStatus.HEALTHY &&
        critical.status ===
            RuntimeHealthStatus.CRITICAL &&
        healthy.score >
            critical.score,
        "RuntimeHealth 錯誤"
    );

    messages.push(
        "✓ Health Score 正確"
    );

    const eventBus =
        createEventBus();

    const scheduler = {
        get summary() {
            return {
                tickCount: 12,
                flushCount: 4,
                queue: {
                    queuedCount: 3
                }
            };
        }
    };

    const runtime = {
        summary: {
            status: "ready",
            roundCount: 2
        }
    };

    const controller = {
        summary: {
            commandCount: 7
        }
    };

    const monitor =
        new RuntimeMonitor({
            eventBus,
            runtime,
            scheduler,
            controller,
            clock:
                () => now,
            historyLimit:
                3
        });

    monitor.start();

    assert(
        monitor.summary.started ===
            true &&
        monitor.summary
            .subscriptionCount ===
            9,
        "RuntimeMonitor start 錯誤"
    );

    messages.push(
        "✓ Monitor Event Bind 正確"
    );

    eventBus.emit(
        RuntimeEventType.COMMAND_STARTED
    );

    eventBus.emit(
        RuntimeEventType.COMMAND_COMPLETED
    );

    eventBus.emit(
        RuntimeEventType.ROUND_COMPLETED
    );

    eventBus.emit(
        RuntimeEventType.WARNING
    );

    eventBus.emit(
        RuntimeEventType.ERROR
    );

    monitor.recordPipeline({
        duration: 40,
        success: true
    });

    monitor.recordPipeline({
        duration: 60,
        success: false
    });

    const snapshot =
        monitor.collect();

    assert(
        snapshot.runtime.status ===
            "ready" &&
        snapshot.controller
            .commandCount === 7 &&
        snapshot.scheduler
            .queueLength === 3 &&
        snapshot.eventBus
            .eventCount === 5 &&
        snapshot.pipeline
            .count === 2 &&
        snapshot.pipeline
            .averageDuration === 50 &&
        snapshot.pipeline
            .failures === 1 &&
        snapshot.warnings === 1 &&
        snapshot.errors === 1,
        "RuntimeMonitor Snapshot 錯誤"
    );

    messages.push(
        "✓ Runtime Snapshot 正確"
    );

    assert(
        snapshot.health.score <
            100 &&
        snapshot.health.status ===
            RuntimeHealthStatus.HEALTHY,
        "Monitor Health 整合錯誤"
    );

    messages.push(
        "✓ Monitor Health 整合正確"
    );

    monitor.collect();
    monitor.collect();
    monitor.collect();

    assert(
        monitor.summary
            .historyCount === 3 &&
        monitor.getHistory({
            limit: 2
        }).length === 2,
        "Monitor History 錯誤"
    );

    messages.push(
        "✓ Monitor History 正確"
    );

    assert(
        monitor.summary.version ===
            "5.6.0" &&
        monitor.summary
            .hasSnapshot === true &&
        monitor.summary
            .destroyed === false,
        "Monitor Summary 錯誤"
    );

    monitor.destroy();

    assert(
        monitor.summary.destroyed ===
            true &&
        monitor.summary.started ===
            false &&
        monitor.summary
            .subscriptionCount === 0 &&
        monitor.summary
            .historyCount === 0,
        "Monitor destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Runtime Monitor V5.6 測試完成

Metrics：通過
Profiler：通過
Health Score：通過
Event Binding：通過
Pipeline Timing：通過
Scheduler Metrics：通過
EventBus Metrics：通過
Snapshot：通過
History：通過
Lifecycle：通過
`;
}
