/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/ProportionalityEvaluator.js
 */

export const PROPORTIONALITY_EVALUATOR_VERSION = "8.6.0";

export default class ProportionalityEvaluator {
    evaluate({
        action = {},
        context = {}
    } = {}) {
        const expectedBenefit =
            Number.isFinite(
                action.expectedBenefit
            )
                ? action.expectedBenefit
                : 0;

        const expectedCost =
            Number.isFinite(
                action.expectedCost
            )
                ? action.expectedCost
                : 0;

        const governanceApproved =
            context.governance
                ?.approved !==
            false;

        const netBenefit =
            expectedBenefit -
            expectedCost;

        let score =
            netBenefit >= 0
                ? 100
                : Math.max(
                    0,
                    100 +
                    netBenefit *
                        10
                );

        if (!governanceApproved) {
            score =
                Math.min(
                    score,
                    40
                );
        }

        return {
            score:
                Math.round(score),
            proportionate:
                score >= 70,
            expectedBenefit,
            expectedCost,
            netBenefit
        };
    }

    get summary() {
        return {
            version:
                PROPORTIONALITY_EVALUATOR_VERSION
        };
    }
}
