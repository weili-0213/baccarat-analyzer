/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/createPlanningEngine.js
 */
import PlanningEngine from "./PlanningEngine.js";
export const PLANNING_ENGINE_FACTORY_VERSION = "7.4.0";
export default function createPlanningEngine(options = {}) {
    return new PlanningEngine(options);
}
