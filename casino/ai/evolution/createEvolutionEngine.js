/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/createEvolutionEngine.js
 */

import EvolutionEngine
    from "./EvolutionEngine.js";


export const EVOLUTION_ENGINE_FACTORY_VERSION = "8.2.0";


export default function createEvolutionEngine(options = {}) {
    return new EvolutionEngine(
        options
    );
}
