/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/FitnessEvaluator.js
 */

export const FITNESS_EVALUATOR_VERSION = "8.2.0";

export default class FitnessEvaluator {
    constructor({
        evaluate = null
    } = {}) {
        this.evaluateFunction =
            evaluate ??
            (async ({
                genome,
                context
            }) => {
                const assurance =
                    context.assurance?.score ??
                    0;

                const reward =
                    context.learning?.reward ??
                    0;

                const confidence =
                    genome.genes
                        ?.confidenceThreshold ??
                    context.decision?.confidence ??
                    0;

                return (
                    assurance *
                    0.5 +
                    reward *
                    5 +
                    confidence *
                    50
                );
            });
    }

    async evaluate({
        genome,
        context = {}
    } = {}) {
        if (!genome) {
            throw new TypeError(
                "FitnessEvaluator requires genome."
            );
        }

        const score =
            await this.evaluateFunction({
                genome,
                context
            });

        return {
            genomeId:
                genome.genomeId,
            score:
                Number.isFinite(score)
                    ? score
                    : 0
        };
    }

    get summary() {
        return {
            version:
                FITNESS_EVALUATOR_VERSION
        };
    }
}
