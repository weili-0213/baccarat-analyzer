/**
 * Baccarat Analyzer V5.3
 * runtime/events/RuntimeEvents.js
 */

export const RUNTIME_EVENTS_VERSION = "5.3.0";

export const RuntimeEventType = Object.freeze({
    RUNTIME_STARTED:
        "runtime:started",

    RUNTIME_STOPPED:
        "runtime:stopped",

    RUNTIME_PAUSED:
        "runtime:paused",

    RUNTIME_RESUMED:
        "runtime:resumed",

    RUNTIME_RESET:
        "runtime:reset",

    RUNTIME_DESTROYED:
        "runtime:destroyed",

    SHOE_CHANGED:
        "shoe:changed",

    ROUND_STARTED:
        "round:started",

    ROUND_COMPLETED:
        "round:completed",

    ANALYSIS_STARTED:
        "analysis:started",

    ANALYSIS_COMPLETED:
        "analysis:completed",

    BET_RECORDED:
        "bet:recorded",

    SESSION_UPDATED:
        "session:updated",

    DASHBOARD_UPDATED:
        "dashboard:updated",

    COMMAND_STARTED:
        "command:started",

    COMMAND_COMPLETED:
        "command:completed",

    WARNING:
        "runtime:warning",

    ERROR:
        "runtime:error"
});

export const RuntimeEventPriority = Object.freeze({
    LOW: 10,
    NORMAL: 50,
    HIGH: 100,
    CRITICAL: 1000
});

export function isRuntimeEventType(type) {
    return Object.values(
        RuntimeEventType
    ).includes(type);
}
