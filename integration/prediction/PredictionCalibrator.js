/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PredictionCalibrator.js
 * Purpose: Calibrates prediction probabilities and confidence.
 */

export const PREDICTION_CALIBRATOR_VERSION = "9.4.0";

const OUTCOMES = [
    "Player",
    "Banker",
    "Tie"
];

export default class PredictionCalibrator {
    calibrate({
        prediction = {},
        minimumProbability = 0
    } = {}) {
        const probabilities = {};

        for (const outcome of OUTCOMES) {
            probabilities[outcome] =
                Math.max(
                    minimumProbability,
                    Number.isFinite(
                        prediction
                            ?.probabilities
                            ?.[outcome]
                    )
                        ? prediction
                            .probabilities[
                                outcome
                            ]
                        : 0
                );
        }

        const total =
            Object.values(
                probabilities
            ).reduce(
                (
                    sum,
                    value
                ) =>
                    sum +
                    value,
                0
            );

        if (total > 0) {
            for (const outcome of OUTCOMES) {
                probabilities[outcome] =
                    probabilities[
                        outcome
                    ] /
                    total;
            }
        }

        return {
            ...prediction,
            probabilities,
            confidence:
                Math.max(
                    0,
                    Math.min(
                        1,
                        prediction
                            ?.confidence ??
                        0
                    )
                )
        };
    }

    get summary() {
        return {
            version:
                PREDICTION_CALIBRATOR_VERSION
        };
    }
}
