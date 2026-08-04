/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/createExecutionEngine.js
 */

import ExecutionEngine
    from "./ExecutionEngine.js";


export const EXECUTION_ENGINE_FACTORY_VERSION = "7.5.0";


export default function createExecutionEngine(options = {}) {
    return new ExecutionEngine(
        options
    );
}
