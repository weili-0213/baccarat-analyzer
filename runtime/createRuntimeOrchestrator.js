/**
 * Baccarat Analyzer V5.8
 * runtime/createRuntimeOrchestrator.js
 */

import RuntimeOrchestrator
    from "./RuntimeOrchestrator.js";


export const RUNTIME_ORCHESTRATOR_FACTORY_VERSION = "5.8.0";


export default function createRuntimeOrchestrator(options = {}) {
    return new RuntimeOrchestrator(
        options
    );
}
