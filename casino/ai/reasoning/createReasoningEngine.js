/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/createReasoningEngine.js
 */
import ReasoningEngine from "./ReasoningEngine.js";
export const REASONING_ENGINE_FACTORY_VERSION = "7.3.0";
export default function createReasoningEngine(options = {}) {
    return new ReasoningEngine(options);
}
