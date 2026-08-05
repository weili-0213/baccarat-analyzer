/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/createAutonomousEngine.js
 */
import AutonomousEngine from "./AutonomousEngine.js";
export const AUTONOMOUS_ENGINE_FACTORY_VERSION = "8.0.0";
export default function createAutonomousEngine(options = {}) {
    return new AutonomousEngine(options);
}
