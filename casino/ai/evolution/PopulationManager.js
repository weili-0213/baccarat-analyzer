/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/PopulationManager.js
 */

import EvolutionGenome
    from "./EvolutionGenome.js";

export const POPULATION_MANAGER_VERSION = "8.2.0";

export default class PopulationManager {
    constructor({
        size = 10
    } = {}) {
        if (
            !Number.isInteger(size) ||
            size < 2
        ) {
            throw new RangeError(
                "Population size must be at least 2."
            );
        }

        this.size =
            size;

        this.generation =
            0;

        this.genomes =
            [];
    }

    initialize({
        seeds = []
    } = {}) {
        this.generation =
            0;

        this.genomes =
            seeds.map(
                (
                    seed,
                    index
                ) =>
                    seed instanceof
                        EvolutionGenome
                        ? seed
                        : new EvolutionGenome({
                            genomeId:
                                seed.genomeId ??
                                `genome-0-${index + 1}`,
                            genes:
                                seed.genes ??
                                {},
                            generation:
                                0,
                            metadata:
                                seed.metadata ??
                                {}
                        })
            );

        if (
            this.genomes.length >
            this.size
        ) {
            this.genomes =
                this.genomes.slice(
                    0,
                    this.size
                );
        }

        return this.genomes;
    }

    replace({
        genomes,
        generation
    } = {}) {
        this.genomes =
            [...genomes]
                .slice(
                    0,
                    this.size
                );

        this.generation =
            generation;

        return this.genomes;
    }

    best() {
        return (
            [...this.genomes]
                .sort(
                    (a, b) =>
                        (
                            b.fitness ??
                            -Infinity
                        ) -
                        (
                            a.fitness ??
                            -Infinity
                        )
                )[0] ??
            null
        );
    }

    clear() {
        this.genomes = [];
        this.generation = 0;
        return this;
    }

    get summary() {
        return {
            version:
                POPULATION_MANAGER_VERSION,
            size:
                this.size,
            generation:
                this.generation,
            count:
                this.genomes.length,
            best:
                this.best()
                    ?.toJSON?.() ??
                this.best()
        };
    }
}
