/**
 * Baccarat Analyzer V5.3
 * tests/runtimeEventBus.test.js
 */

import RuntimeEventBus, {
    RUNTIME_EVENT_BUS_VERSION
} from "../runtime/events/RuntimeEventBus.js";

import RuntimeEventBridge, {
    RUNTIME_EVENT_BRIDGE_VERSION
} from "../runtime/events/RuntimeEventBridge.js";

import {
    RUNTIME_EVENTS_VERSION,
    RuntimeEventType,
    RuntimeEventPriority
} from "../runtime/events/RuntimeEvents.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function runtimeEventBusTest() {
    const messages = [];

    assert(
        RUNTIME_EVENT_BUS_VERSION ===
            "5.3.0" &&
        RUNTIME_EVENT_BRIDGE_VERSION ===
            "5.3.0" &&
        RUNTIME_EVENTS_VERSION ===
            "5.3.0",
        "V5.3 EventBus 版本錯誤"
    );

    messages.push(
        "✓ V5.3 EventBus 版本正確"
    );

    let clock = 0;

    const errors = [];

    const bus =
        new RuntimeEventBus({
            historyLimit:
                5,

            clock:
                () =>
                    `T${clock++}`,

            onListenerError:
                error => {
                    errors.push(
                        error.message
                    );
                }
        });

    const order = [];

    bus.on(
        RuntimeEventType.ROUND_COMPLETED,
        () => {
            order.push(
                "normal"
            );
        }
    );

    bus.on(
        RuntimeEventType.ROUND_COMPLETED,
        () => {
            order.push(
                "high"
            );
        },
        {
            priority:
                RuntimeEventPriority.HIGH
        }
    );

    bus.emit(
        RuntimeEventType.ROUND_COMPLETED,
        {
            winner:
                "Player"
        }
    );

    assert(
        order.join(",") ===
            "high,normal",
        "Listener priority 錯誤"
    );

    messages.push(
        "✓ Listener Priority 正確"
    );

    let onceCount = 0;

    bus.once(
        RuntimeEventType.BET_RECORDED,
        () => {
            onceCount++;
        }
    );

    bus.emit(
        RuntimeEventType.BET_RECORDED
    );

    bus.emit(
        RuntimeEventType.BET_RECORDED
    );

    assert(
        onceCount === 1,
        "once() 錯誤"
    );

    messages.push(
        "✓ once() 正確"
    );

    const wildcard = [];

    bus.on(
        "*",
        event => {
            wildcard.push(
                event.type
            );
        }
    );

    bus.emit(
        RuntimeEventType.RUNTIME_STARTED
    );

    assert(
        wildcard.includes(
            RuntimeEventType.RUNTIME_STARTED
        ),
        "Wildcard listener 錯誤"
    );

    messages.push(
        "✓ Wildcard Listener 正確"
    );

    const middlewareEvents = [];

    bus.use(
        event => ({
            ...event,

            metadata: {
                ...event.metadata,
                middleware:
                    true
            }
        })
    );

    bus.on(
        RuntimeEventType.WARNING,
        event => {
            middlewareEvents.push(
                event.metadata.middleware
            );
        }
    );

    bus.emit(
        RuntimeEventType.WARNING,
        {
            message:
                "test"
        }
    );

    assert(
        middlewareEvents[0] ===
            true,
        "Middleware 錯誤"
    );

    messages.push(
        "✓ Middleware 正確"
    );

    bus.pause();

    bus.emit(
        RuntimeEventType.RUNTIME_PAUSED
    );

    bus.emit(
        RuntimeEventType.RUNTIME_RESUMED
    );

    assert(
        bus.summary.queuedCount ===
            2,
        "Pause queue 錯誤"
    );

    bus.resume();

    assert(
        bus.summary.queuedCount ===
            0,
        "Resume flush 錯誤"
    );

    messages.push(
        "✓ Pause／Resume Queue 正確"
    );

    let asyncValue = 0;

    bus.on(
        RuntimeEventType.ANALYSIS_COMPLETED,
        async () => {
            await Promise.resolve();

            asyncValue =
                1;
        }
    );

    await bus.emitAsync(
        RuntimeEventType.ANALYSIS_COMPLETED
    );

    assert(
        asyncValue === 1,
        "emitAsync() 錯誤"
    );

    messages.push(
        "✓ emitAsync() 正確"
    );

    bus.on(
        RuntimeEventType.ERROR,
        () => {
            throw new Error(
                "listener failed"
            );
        }
    );

    bus.emit(
        RuntimeEventType.ERROR
    );

    assert(
        errors.includes(
            "listener failed"
        ),
        "Listener error isolation 錯誤"
    );

    messages.push(
        "✓ Listener Error Isolation 正確"
    );

    const history =
        bus.getHistory({
            limit:
                5
        });

    assert(
        history.length <= 5 &&
        history.length ===
            bus.summary.historyCount,
        "History 錯誤"
    );

    messages.push(
        "✓ Event History 正確"
    );

    const bridgeBus =
        new RuntimeEventBus();

    const runtimeListeners =
        new Map();

    const runtime = {
        on(type, listener) {
            runtimeListeners.set(
                type,
                listener
            );

            return () => {
                runtimeListeners.delete(
                    type
                );
            };
        }
    };

    const bridged = [];

    bridgeBus.on(
        RuntimeEventType.ROUND_STARTED,
        event => {
            bridged.push(
                event.payload
            );
        }
    );

    const bridge =
        new RuntimeEventBridge({
            eventBus:
                bridgeBus,
            runtime
        });

    bridge.bindRuntime();

    runtimeListeners
        .get(
            "runtime:round-start"
        )({
            payload: {
                id: 1
            }
        });

    assert(
        bridged.length === 1 &&
        bridged[0].id === 1 &&
        bridge.summary.bound ===
            true,
        "Runtime Event Bridge 錯誤"
    );

    bridge.destroy();

    assert(
        runtimeListeners.size ===
            0,
        "Bridge destroy 錯誤"
    );

    messages.push(
        "✓ Runtime Event Bridge 正確"
    );

    assert(
        bus.summary.version ===
            "5.3.0" &&
        bus.summary.emittedCount >
            0 &&
        bus.summary.listenerErrorCount ===
            1,
        "EventBus summary 錯誤"
    );

    bus.destroy();

    assert(
        bus.summary.destroyed ===
            true &&
        bus.summary.listenerCount ===
            0,
        "EventBus destroy 錯誤"
    );

    messages.push(
        "✓ summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Runtime EventBus V5.3 測試完成

Events：通過
Priority：通過
Once：通過
Wildcard：通過
Middleware：通過
Pause Queue：通過
Async Emit：通過
Error Isolation：通過
History：通過
Runtime Bridge：通過
Lifecycle：通過
`;
}
