/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/EvolutionGenome.js
 */

export const EVOLUTION_GENOME_VERSION = "8.2.0";

export default class EvolutionGenome {
    constructor({
        genomeId,
        genes = {},
        generation = 0,
        parents = [],
        fitness = null,
        metadata = {}
    } = {}) {
        if (
            typeof genomeId !== "string" ||
            genomeId.length === 0
        ) {
            throw new TypeError(
                "EvolutionGenome genomeId is required."
            );
        }

        this.version =
            EVOLUTION_GENOME_VERSION;

        this.genomeId =
            genomeId;

        this.genes =
            { ...genes };

        this.generation =
            generation;

        this.parents =
            [...parents];

        this.fitness =
            fitness;

        this.metadata =
            { ...metadata };
    }

    clone({
        genomeId,
        generation = this.generation,
        parents = [this.genomeId]
    } = {}) {
        return new EvolutionGenome({
            genomeId,
            genes:
                { ...this.genes },
            generation,
            parents,
            fitness:
                this.fitness,
            metadata:
                { ...this.metadata }
        });
    }

    toJSON() {
        return {
            version:
                this.version,
            genomeId:
                this.genomeId,
            genes:
                { ...this.genes },
            generation:
                this.generation,
            parents:
                [...this.parents],
            fitness:
                this.fitness,
            metadata:
                { ...this.metadata }
        };
    }
}
