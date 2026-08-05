/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/createOrchestrationEngine.js
 */
import OrchestrationEngine
    from "./OrchestrationEngine.js";

export const ORCHESTRATION_ENGINE_FACTORY_VERSION = "8.9.0";

export default function createOrchestrationEngine(options = {}) {
    return new OrchestrationEngine(
        options
    );
}
