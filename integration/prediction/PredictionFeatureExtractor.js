/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PredictionFeatureExtractor.js
 * Purpose: Extracts simulation, trend and roadmap features for prediction.
 */

export const PREDICTION_FEATURE_EXTRACTOR_VERSION = "9.4.0";

function rate(count, total) {
    return total > 0
        ? count / total
        : 0;
}

export default class PredictionFeatureExtractor {
    extract(input = {}) {
        const recent =
            input.recentOutcomes ??
            [];

        const total =
            recent.length;

        const playerCount =
            recent.filter(
                value =>
                    value === "Player"
            ).length;

        const bankerCount =
            recent.filter(
                value =>
                    value === "Banker"
            ).length;

        const tieCount =
            recent.filter(
                value =>
                    value === "Tie"
            ).length;

        const simulationProbabilities =
            input.simulation
                ?.merged
                ?.probabilities ??
            input.simulation
                ?.probabilities ??
            {};

        const bigRoad =
            input.roadmap
                ?.bigRoad ??
            [];

        return {
            recentCount:
                total,
            recentPlayerRate:
                rate(
                    playerCount,
                    total
                ),
            recentBankerRate:
                rate(
                    bankerCount,
                    total
                ),
            recentTieRate:
                rate(
                    tieCount,
                    total
                ),
            simulationPlayer:
                simulationProbabilities
                    .Player ??
                0,
            simulationBanker:
                simulationProbabilities
                    .Banker ??
                0,
            simulationTie:
                simulationProbabilities
                    .Tie ??
                0,
            simulationConfidence:
                input.simulation
                    ?.merged
                    ?.confidence ??
                input.simulation
                    ?.confidence ??
                0,
            roadmapSize:
                Array.isArray(bigRoad)
                    ? bigRoad.length
                    : 0,
            roundCount:
                input.statistics
                    ?.roundCount ??
                total
        };
    }

    get summary() {
        return {
            version:
                PREDICTION_FEATURE_EXTRACTOR_VERSION
        };
    }
}
