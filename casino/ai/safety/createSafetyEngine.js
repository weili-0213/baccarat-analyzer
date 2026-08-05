/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/createSafetyEngine.js
 */
import SafetyEngine from "./SafetyEngine.js";
export const SAFETY_ENGINE_FACTORY_VERSION = "8.7.0";
export default function createSafetyEngine(options = {}) {
    return new SafetyEngine(options);
}
