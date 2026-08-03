/**
 * Baccarat Analyzer V5.4
 * tests/runtimeScheduler.test.js
 */

import RuntimeTaskQueue, {
    RUNTIME_TASK_QUEUE_VERSION,
    RuntimeTaskPriority,
    RuntimeTaskStatus
} from "../runtime/scheduler/RuntimeTaskQueue.js";

import RuntimeTicker, {
    RUNTIME_TICKER_VERSION,
    RuntimeTickerMode
} from "../runtime/scheduler/RuntimeTicker.js";

import RuntimeScheduler, {
    RUNTIME_SCHEDULER_VERSION,
    RuntimeSchedulerStatus
} from "../runtime/scheduler/RuntimeScheduler.js";

import {
    RUNTIME_SCHEDULER_FACTORY_VERSION
} from "../runtime/createRuntimeScheduler.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createTimer() {
    let nextId = 1;
    const tasks = new Map();

    return {
        setTimeout(callback) {
            const id = nextId++;
            tasks.set(id, callback);
            return id;
        },

        clearTimeout(id) {
            tasks.delete(id);
        },

        flush() {
            const current = [
                ...tasks.values()
            ];

            tasks.clear();

            for (const callback of current) {
                callback();
            }
        },

        get size() {
            return tasks.size;
        }
    };
}


export default async function runtimeSchedulerTest() {
    const messages = [];

    assert(
        RUNTIME_TASK_QUEUE_VERSION === "5.4.0" &&
        RUNTIME_TICKER_VERSION === "5.4.0" &&
        RUNTIME_SCHEDULER_VERSION === "5.4.0" &&
        RUNTIME_SCHEDULER_FACTORY_VERSION === "5.4.0",
        "V5.4 Scheduler 版本錯誤"
    );

    messages.push(
        "✓ V5.4 Scheduler 版本正確"
    );

    let now = 100;

    const queue =
        new RuntimeTaskQueue({
            clock:
                () => now
        });

    const order = [];

    queue.enqueue(
        async () => {
            order.push("normal");
        },
        {
            priority:
                RuntimeTaskPriority.NORMAL
        }
    );

    queue.enqueue(
        async () => {
            order.push("critical");
        },
        {
            priority:
                RuntimeTaskPriority.CRITICAL
        }
    );

    await queue.flush();

    assert(
        order.join(",") ===
            "critical,normal",
        "Task priority 錯誤"
    );

    messages.push(
        "✓ Task Priority 正確"
    );

    const firstId =
        queue.enqueue(
            async () => "old",
            {
                key:
                    "refresh",
                coalesce:
                    true
            }
        );

    const secondId =
        queue.enqueue(
            async () => "new",
            {
                key:
                    "refresh",
                coalesce:
                    true
            }
        );

    assert(
        firstId === secondId &&
        queue.summary
            .queuedCount ===
            1,
        "Task coalescing 錯誤"
    );

    const coalesced =
        await queue.flush();

    assert(
        coalesced[0].result ===
            "new" &&
        coalesced[0]
            .coalescedCount ===
            1,
        "Coalesced task 結果錯誤"
    );

    messages.push(
        "✓ Task Coalescing 正確"
    );

    const delayedId =
        queue.enqueue(
            async () => "delayed",
            {
                delay:
                    50
            }
        );

    assert(
        (
            await queue.executeNext()
        ) === null,
        "Delayed task 提前執行"
    );

    now = 150;

    const delayed =
        await queue.executeNext();

    assert(
        delayed.id === delayedId &&
        delayed.status ===
            RuntimeTaskStatus.COMPLETED,
        "Delayed task 錯誤"
    );

    messages.push(
        "✓ Delayed Task 正確"
    );

    const cancelId =
        queue.enqueue(
            async () => "cancel"
        );

    assert(
        queue.cancel(cancelId) ===
            true &&
        queue.getTask(cancelId)
            .status ===
            RuntimeTaskStatus.CANCELLED,
        "Task cancel 錯誤"
    );

    messages.push(
        "✓ Task Cancel 正確"
    );

    const timer =
        createTimer();

    let tickCount = 0;

    const ticker =
        new RuntimeTicker({
            mode:
                RuntimeTickerMode.INTERVAL,
            interval:
                100,
            scheduler:
                timer,
            clock:
                () => now,
            onTick:
                () => {
                    tickCount++;
                }
        });

    ticker.start();

    assert(
        timer.size === 1 &&
        ticker.summary.running ===
            true,
        "Ticker start 錯誤"
    );

    timer.flush();

    assert(
        tickCount === 1 &&
        ticker.summary.tickCount ===
            1,
        "Ticker tick 錯誤"
    );

    ticker.pause();

    assert(
        ticker.summary.paused ===
            true,
        "Ticker pause 錯誤"
    );

    ticker.resume();

    assert(
        timer.size === 1,
        "Ticker resume 錯誤"
    );

    ticker.stop();

    messages.push(
        "✓ Ticker Lifecycle 正確"
    );

    const schedulerTimer =
        createTimer();

    const events = [];

    const scheduler =
        new RuntimeScheduler({
            interval:
                100,
            scheduler:
                schedulerTimer,
            clock:
                () => now,
            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            }
        });

    const executed = [];

    scheduler.scheduleDashboardRefresh(
        async () => {
            executed.push(
                "dashboard-1"
            );
        }
    );

    scheduler.scheduleDashboardRefresh(
        async () => {
            executed.push(
                "dashboard-2"
            );
        }
    );

    scheduler.scheduleAnalysis(
        async () => {
            executed.push(
                "analysis"
            );
        }
    );

    scheduler.start();

    assert(
        scheduler.status ===
            RuntimeSchedulerStatus.RUNNING &&
        scheduler.summary.queue
            .queuedCount ===
            2,
        "Scheduler start 或 coalescing 錯誤"
    );

    await scheduler.flushNow();

    assert(
        executed.join(",") ===
            "analysis,dashboard-2" &&
        scheduler.summary
            .flushCount ===
            1 &&
        scheduler.summary.queue
            .queuedCount ===
            0 &&
        events.length ===
            1,
        "Scheduler flush 錯誤"
    );

    messages.push(
        "✓ Scheduler Queue Flush 正確"
    );

    scheduler.pause();

    assert(
        scheduler.status ===
            RuntimeSchedulerStatus.PAUSED,
        "Scheduler pause 錯誤"
    );

    scheduler.resume();

    assert(
        scheduler.status ===
            RuntimeSchedulerStatus.RUNNING,
        "Scheduler resume 錯誤"
    );

    scheduler.setInterval(250);

    assert(
        scheduler.summary.ticker
            .interval ===
            250,
        "Scheduler interval 錯誤"
    );

    messages.push(
        "✓ Scheduler Pause／Resume／Interval 正確"
    );

    assert(
        scheduler.summary.version ===
            "5.4.0" &&
        scheduler.summary.lastError ===
            null,
        "Scheduler summary 錯誤"
    );

    scheduler.destroy();

    assert(
        scheduler.status ===
            RuntimeSchedulerStatus.DESTROYED &&
        scheduler.summary.queue
            .queuedCount ===
            0,
        "Scheduler destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Runtime Scheduler V5.4 測試完成

Task Queue：通過
Priority：通過
Coalescing：通過
Delayed Task：通過
Cancel：通過
Ticker：通過
Scheduler Flush：通過
Pause／Resume：通過
Interval：通過
Lifecycle：通過
`;
}
