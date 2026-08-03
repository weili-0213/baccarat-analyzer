/**
 * Baccarat Analyzer V5.7
 * runtime/createRuntimeRecovery.js
 */

import RuntimeRecovery
    from "./recovery/RuntimeRecovery.js";


export const RUNTIME_RECOVERY_FACTORY_VERSION = "5.7.0";


export default function createRuntimeRecovery({
    runtime = null,
    controller = null,
    pipeline = null,
    scheduler = null,
    eventBus = null,
    monitor = null,
    policy = null,
    history = null,
    clock = () => Date.now(),
    delay = null
} = {}) {
    return new RuntimeRecovery({
        runtime,
        controller,
        pipeline,
        scheduler,
        eventBus,
        monitor,
        policy,
        history,
        clock,
        delay
    });
}
