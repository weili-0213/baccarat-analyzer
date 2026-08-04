/** Baccarat Analyzer V7.1 */
import LearningEngine from "./LearningEngine.js";
export const LEARNING_ENGINE_FACTORY_VERSION="7.1.0";
export default function createLearningEngine(options={}){ return new LearningEngine(options); }
