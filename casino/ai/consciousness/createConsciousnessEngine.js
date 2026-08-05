/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/createConsciousnessEngine.js
 */

import ConsciousnessEngine
    from "./ConsciousnessEngine.js";


export const CONSCIOUSNESS_ENGINE_FACTORY_VERSION = "8.4.0";


export default function createConsciousnessEngine(options = {}) {
    return new ConsciousnessEngine(
        options
    );
}
