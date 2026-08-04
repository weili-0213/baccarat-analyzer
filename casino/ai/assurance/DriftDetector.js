/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/DriftDetector.js
 */

export const DRIFT_DETECTOR_VERSION = "7.8.0";

export default class DriftDetector {
    constructor({
        confidenceThreshold = 0.2,
        scoreThreshold = 20
    } = {}) {
        this.confidenceThreshold = confidenceThreshold;
        this.scoreThreshold = scoreThreshold;
    }

    detect(context = {}) {
        const issues = [];

        const currentConfidence =
            context.decision?.confidence ??
            context.reasoning?.explanation?.confidence ??
            null;

        const baselineConfidence =
            context.baseline?.confidence ??
            null;

        if (
            Number.isFinite(currentConfidence) &&
            Number.isFinite(baselineConfidence) &&
            Math.abs(
                currentConfidence -
                baselineConfidence
            ) > this.confidenceThreshold
        ) {
            issues.push(
                "Confidence drift exceeded threshold."
            );
        }

        const currentScore =
            context.planning?.evaluation?.score ??
            context.decision?.score ??
            null;

        const baselineScore =
            context.baseline?.score ??
            null;

        if (
            Number.isFinite(currentScore) &&
            Number.isFinite(baselineScore) &&
            Math.abs(
                currentScore -
                baselineScore
            ) > this.scoreThreshold
        ) {
            issues.push(
                "Planning or decision score drift exceeded threshold."
            );
        }

        return {
            passed: issues.length === 0,
            score: issues.length === 0 ? 100 : 60,
            issues,
            driftDetected: issues.length > 0
        };
    }

    get summary() {
        return {
            version: DRIFT_DETECTOR_VERSION,
            confidenceThreshold: this.confidenceThreshold,
            scoreThreshold: this.scoreThreshold
        };
    }
}
