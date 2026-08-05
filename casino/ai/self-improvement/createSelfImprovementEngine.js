/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/createSelfImprovementEngine.js
 */

import SelfImprovementEngine
    from "./SelfImprovementEngine.js";


export const SELF_IMPROVEMENT_ENGINE_FACTORY_VERSION = "8.1.0";


export default function createSelfImprovementEngine(options = {}) {
    return new SelfImprovementEngine(
        options
    );
}
