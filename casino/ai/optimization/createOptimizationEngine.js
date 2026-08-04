/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/createOptimizationEngine.js
 */

import OptimizationEngine
    from "./OptimizationEngine.js";


export const OPTIMIZATION_ENGINE_FACTORY_VERSION = "7.9.0";


export default function createOptimizationEngine(options = {}) {
    return new OptimizationEngine(
        options
    );
}
