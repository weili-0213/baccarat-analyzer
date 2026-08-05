/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/createCollectiveIntelligenceEngine.js
 */

import CollectiveIntelligenceEngine
    from "./CollectiveIntelligenceEngine.js";


export const COLLECTIVE_INTELLIGENCE_ENGINE_FACTORY_VERSION = "8.3.0";


export default function createCollectiveIntelligenceEngine(options = {}) {
    return new CollectiveIntelligenceEngine(
        options
    );
}
