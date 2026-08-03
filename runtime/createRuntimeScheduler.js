/**
 * Baccarat Analyzer V5.4
 * runtime/createRuntimeScheduler.js
 */

import RuntimeScheduler
    from "./scheduler/RuntimeScheduler.js";


export const RUNTIME_SCHEDULER_FACTORY_VERSION = "5.4.0";


export default function createRuntimeScheduler({
    eventBus = null,
    interval = 100,
    mode = "interval",
    scheduler = globalThis,
    clock = () => Date.now(),
    maxTasksPerTick = 10,
    contextFactory = null
} = {}) {
    return new RuntimeScheduler({
        eventBus,
        interval,
        mode,
        scheduler,
        clock,
        maxTasksPerTick,
        contextFactory
    });
}
