/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/createKnowledgeEngine.js
 */

import KnowledgeEngine
    from "./KnowledgeEngine.js";


export const KNOWLEDGE_ENGINE_FACTORY_VERSION = "7.2.0";


export default function createKnowledgeEngine(options = {}) {
    return new KnowledgeEngine(
        options
    );
}
