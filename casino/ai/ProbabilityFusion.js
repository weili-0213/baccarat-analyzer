/**
 * Baccarat Analyzer V7.0
 * casino/ai/ProbabilityFusion.js
 */

export const PROBABILITY_FUSION_VERSION = "7.0.0";

export default class ProbabilityFusion {
    constructor({
        analyzerWeight = 0.75,
        trendWeight = 0.25
    } = {}) {
        if (
            !Number.isFinite(
                analyzerWeight
            ) ||
            !Number.isFinite(
                trendWeight
            ) ||
            analyzerWeight < 0 ||
            trendWeight < 0 ||
            analyzerWeight +
                trendWeight <= 0
        ) {
            throw new RangeError(
                "ProbabilityFusion weights are invalid."
            );
        }

        const total =
            analyzerWeight +
            trendWeight;

        this.analyzerWeight =
            analyzerWeight /
            total;

        this.trendWeight =
            trendWeight /
            total;
    }

    fuse({
        probability = {},
        trend = {}
    } = {}) {
        const trendProbability =
            this.normalize(
                trend.scores ??
                {}
            );

        const fused = {
            Player:
                (
                    probability.Player ??
                    0
                ) *
                this.analyzerWeight +
                (
                    trendProbability.Player ??
                    0
                ) *
                this.trendWeight,

            Banker:
                (
                    probability.Banker ??
                    0
                ) *
                this.analyzerWeight +
                (
                    trendProbability.Banker ??
                    0
                ) *
                this.trendWeight,

            Tie:
                (
                    probability.Tie ??
                    0
                ) *
                this.analyzerWeight +
                (
                    trendProbability.Tie ??
                    0
                ) *
                this.trendWeight
        };

        return this.normalize(
            fused
        );
    }

    normalize(values = {}) {
        const normalized = {
            Player:
                Number.isFinite(
                    values.Player
                )
                    ? Math.max(
                        0,
                        values.Player
                    )
                    : 0,

            Banker:
                Number.isFinite(
                    values.Banker
                )
                    ? Math.max(
                        0,
                        values.Banker
                    )
                    : 0,

            Tie:
                Number.isFinite(
                    values.Tie
                )
                    ? Math.max(
                        0,
                        values.Tie
                    )
                    : 0
        };

        const total =
            normalized.Player +
            normalized.Banker +
            normalized.Tie;

        if (total <= 0) {
            return {
                Player: 0,
                Banker: 0,
                Tie: 0
            };
        }

        return {
            Player:
                normalized.Player /
                total,

            Banker:
                normalized.Banker /
                total,

            Tie:
                normalized.Tie /
                total
        };
    }

    get summary() {
        return {
            version:
                PROBABILITY_FUSION_VERSION,

            analyzerWeight:
                this.analyzerWeight,

            trendWeight:
                this.trendWeight
        };
    }
}
