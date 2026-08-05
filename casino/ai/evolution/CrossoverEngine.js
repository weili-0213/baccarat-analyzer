/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/CrossoverEngine.js
 */

export const CROSSOVER_ENGINE_VERSION = "8.2.0";

export default class CrossoverEngine {
    constructor({
        random = Math.random
    } = {}) {
        this.random =
            random;
    }

    cross(
        parentA,
        parentB
    ) {
        const genes = {};

        const keys =
            new Set([
                ...Object.keys(
                    parentA.genes ??
                    {}
                ),
                ...Object.keys(
                    parentB.genes ??
                    {}
                )
            ]);

        for (const key of keys) {
            genes[key] =
                this.random() <
                0.5
                    ? parentA.genes?.[key]
                    : parentB.genes?.[key];
        }

        return {
            genes,
            parents: [
                parentA.genomeId,
                parentB.genomeId
            ]
        };
    }

    get summary() {
        return {
            version:
                CROSSOVER_ENGINE_VERSION
        };
    }
}
