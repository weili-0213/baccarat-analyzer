/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/createMetaIntelligenceEngine.js
 */

import MetaIntelligenceEngine
    from "./MetaIntelligenceEngine.js";


export const META_INTELLIGENCE_ENGINE_FACTORY_VERSION = "8.8.0";


export default function createMetaIntelligenceEngine(options = {}) {
    return new MetaIntelligenceEngine(
        options
    );
}
