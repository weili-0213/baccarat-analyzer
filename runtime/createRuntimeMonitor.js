/**
 * Baccarat Analyzer V5.6
 * runtime/createRuntimeMonitor.js
 */

import RuntimeMonitor
    from "./monitor/RuntimeMonitor.js";


export const RUNTIME_MONITOR_FACTORY_VERSION = "5.6.0";


export default function createRuntimeMonitor({
    eventBus = null,
    runtime = null,
    scheduler = null,
    pipeline = null,
    controller = null,
    clock = () => Date.now(),
    historyLimit = 100
} = {}) {
    return new RuntimeMonitor({
        eventBus,
        runtime,
        scheduler,
        pipeline,
        controller,
        clock,
        historyLimit
    });
}
