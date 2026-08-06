/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/StrategyFeedbackCalibrator.js
 * Purpose: Produces strategy score and usage updates.
 */
export const STRATEGY_FEEDBACK_CALIBRATOR_VERSION = "9.9.0";

export default class StrategyFeedbackCalibrator {
    calibrate(feedback = {}) {
        return {
            strategyId:
                feedback.strategyId ??
                null,
            scoreDelta:
                feedback.correct
                    ? 0.05
                    : -0.05,
            successful:
                Boolean(feedback.correct),
            updateRequired:
                Boolean(feedback.strategyId)
        };
    }

    get summary() {
        return {
            version: STRATEGY_FEEDBACK_CALIBRATOR_VERSION
        };
    }
}
