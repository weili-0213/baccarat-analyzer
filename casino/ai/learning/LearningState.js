/** Baccarat Analyzer V7.1 */
export const LEARNING_STATE_VERSION = "7.1.0";
export const LearningState = Object.freeze({
  IDLE:"idle", COLLECTING:"collecting", EVALUATING:"evaluating",
  LEARNING:"learning", PAUSED:"paused", COMPLETED:"completed",
  ERROR:"error", DESTROYED:"destroyed"
});
export const LearningAction = Object.freeze({
  KEEP:"keep", UPDATE:"update", FORGET:"forget", DECAY:"decay"
});
