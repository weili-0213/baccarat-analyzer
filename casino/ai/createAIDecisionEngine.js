/**
 * Baccarat Analyzer V7.0
 * casino/ai/createAIDecisionEngine.js
 */

import AIDecisionEngine
    from "./AIDecisionEngine.js";


export const AI_DECISION_ENGINE_FACTORY_VERSION = "7.0.0";


export default function createAIDecisionEngine(options = {}) {
    return new AIDecisionEngine(
        options
    );
}
