/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PredictionFusionEngine.js
 * Purpose: Fuses trend, pattern and simulation predictions.
 */

export const PREDICTION_FUSION_ENGINE_VERSION = "9.4.0";

const OUTCOMES = [
    "Player",
    "Banker",
    "Tie"
];

function probabilityOf(
    source,
    outcome
) {
    const value =
        source
            ?.probabilities
            ?.[outcome] ??
        0;

    return Number.isFinite(value)
        ? value
        : 0;
}

export default class PredictionFusionEngine {
    fuse({
        trend = null,
        pattern = null,
        simulation = null,
        weights = {}
    } = {}) {
        const sources = [
            {
                key:
                    "trend",
                value:
                    trend,
                weight:
                    weights.trend ??
                    1
            },
            {
                key:
                    "pattern",
                value:
                    pattern,
                weight:
                    weights.pattern ??
                    1
            },
            {
                key:
                    "simulation",
                value:
                    simulation,
                weight:
                    weights.simulation ??
                    1
            }
        ].filter(
            source =>
                source.value
        );

        const probabilities = {};

        for (const outcome of OUTCOMES) {
            let weightedTotal = 0;
            let totalWeight = 0;

            for (const source of sources) {
                const confidence =
                    Number.isFinite(
                        source.value
                            ?.confidence
                    )
                        ? source.value
                            .confidence
                        : 1;

                const effectiveWeight =
                    source.weight *
                    confidence;

                weightedTotal +=
                    probabilityOf(
                        source.value,
                        outcome
                    ) *
                    effectiveWeight;

                totalWeight +=
                    effectiveWeight;
            }

            probabilities[outcome] =
                totalWeight > 0
                    ? weightedTotal /
                        totalWeight
                    : 0;
        }

        const ranking =
            Object.entries(
                probabilities
            )
                .map(
                    (
                        [
                            outcome,
                            probability
                        ]
                    ) => ({
                        outcome,
                        probability
                    })
                )
                .sort(
                    (a, b) =>
                        b.probability -
                        a.probability
                );

        const spread =
            ranking.length >= 2
                ? ranking[0]
                    .probability -
                    ranking[1]
                        .probability
                : 0;

        return {
            probabilities,
            ranking,
            predictedOutcome:
                ranking[0]
                    ?.outcome ??
                null,
            confidence:
                Math.max(
                    0,
                    Math.min(
                        1,
                        spread * 5
                    )
                ),
            sourceCount:
                sources.length,
            sources: {
                trend,
                pattern,
                simulation
            }
        };
    }

    get summary() {
        return {
            version:
                PREDICTION_FUSION_ENGINE_VERSION
        };
    }
}
