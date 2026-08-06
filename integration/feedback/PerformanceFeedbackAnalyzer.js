/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/PerformanceFeedbackAnalyzer.js
 * Purpose: Calculates feedback quality, ROI, accuracy and severity.
 */
export const PERFORMANCE_FEEDBACK_ANALYZER_VERSION = "9.9.0";

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

export default class PerformanceFeedbackAnalyzer {
    analyze({
        executionFeedback = {},
        learning = {},
        bankroll = {},
        statistics = {}
    } = {}) {
        const reward =
            learning.reward?.reward ??
            learning.experience?.reward ??
            learning.reward ??
            0;

        const stake =
            executionFeedback.executedAmount ?? 0;

        const profit =
            executionFeedback.profit ?? 0;

        const roi =
            stake > 0
                ? profit / stake
                : 0;

        const accuracy =
            executionFeedback.correct
                ? 1
                : 0;

        const balance =
            bankroll.balance ?? 0;

        const roundCount =
            statistics.roundCount ?? 0;

        const quality =
            clamp(
                accuracy * 0.45 +
                clamp((roi + 1) / 2, 0, 1) * 0.3 +
                clamp((reward + 5) / 10, 0, 1) * 0.25,
                0,
                1
            );

        return {
            reward: Number.isFinite(reward) ? reward : 0,
            stake,
            profit,
            roi,
            accuracy,
            quality,
            balance,
            roundCount,
            severeNegative:
                profit < 0 &&
                reward <= -2,
            positive:
                profit > 0 &&
                reward > 0
        };
    }

    get summary() {
        return {
            version: PERFORMANCE_FEEDBACK_ANALYZER_VERSION
        };
    }
}
