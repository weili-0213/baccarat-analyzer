/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/EvolutionEngine.js
 */

import {
    EvolutionState
} from "./EvolutionState.js";

import EvolutionGenome
    from "./EvolutionGenome.js";

import MutationEngine
    from "./MutationEngine.js";

import CrossoverEngine
    from "./CrossoverEngine.js";

import FitnessEvaluator
    from "./FitnessEvaluator.js";

import SelectionEngine
    from "./SelectionEngine.js";

import PopulationManager
    from "./PopulationManager.js";

import EvolutionHistory
    from "./EvolutionHistory.js";


export const EVOLUTION_ENGINE_VERSION = "8.2.0";

export const EvolutionEvent = Object.freeze({
    STATE_CHANGE: "evolution-engine:state-change",
    STARTED: "evolution-engine:started",
    GENOME_EVALUATED: "evolution-engine:genome-evaluated",
    SELECTION_COMPLETED: "evolution-engine:selection-completed",
    CROSSOVER_COMPLETED: "evolution-engine:crossover-completed",
    MUTATION_COMPLETED: "evolution-engine:mutation-completed",
    GENERATION_COMPLETED: "evolution-engine:generation-completed",
    COMPLETED: "evolution-engine:completed",
    PAUSED: "evolution-engine:paused",
    RESUMED: "evolution-engine:resumed",
    ERROR: "evolution-engine:error",
    DESTROYED: "evolution-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class EvolutionEngine {
    constructor({
        population = null,
        mutation = null,
        crossover = null,
        fitness = null,
        selection = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        random = Math.random
    } = {}) {
        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (!isFunction(clock)) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.population =
            population ??
            new PopulationManager();

        this.mutation =
            mutation ??
            new MutationEngine({
                random
            });

        this.crossover =
            crossover ??
            new CrossoverEngine({
                random
            });

        this.fitness =
            fitness ??
            new FitnessEvaluator();

        this.selection =
            selection ??
            new SelectionEngine();

        this.history =
            history ??
            new EvolutionHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.random =
            random;

        this.state =
            EvolutionState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.lastResult = null;
        this.lastError = null;
        this.runCount = 0;
        this.sequence = 0;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "evolution-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            EvolutionEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "EvolutionEngine has been destroyed."
            );
        }
    }

    async evolve({
        seeds = [],
        context = {},
        generations = 1,
        eliteCount = 1,
        parentCount = 2,
        schema = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        if (
            !Number.isInteger(
                generations
            ) ||
            generations < 1
        ) {
            throw new RangeError(
                "generations must be a positive integer."
            );
        }

        this.sequence++;

        const evolutionId =
            `evolution-${this.clock()}-${this.sequence}`;

        this.setState(
            EvolutionState.INITIALIZING
        );

        if (
            this.population.genomes
                .length === 0
        ) {
            this.population
                .initialize({
                    seeds
                });
        }

        if (
            this.population.genomes
                .length < 2
        ) {
            throw new Error(
                "Evolution requires at least two genomes."
            );
        }

        this.emit(
            EvolutionEvent.STARTED,
            {
                evolutionId,
                generations
            }
        );

        const generationResults = [];

        try {
            for (
                let index = 0;
                index < generations;
                index++
            ) {
                if (this.paused) {
                    break;
                }

                this.setState(
                    EvolutionState.EVALUATING
                );

                for (
                    const genome of
                    this.population.genomes
                ) {
                    const evaluation =
                        await this.fitness
                            .evaluate({
                                genome,
                                context
                            });

                    genome.fitness =
                        evaluation.score;

                    this.emit(
                        EvolutionEvent.GENOME_EVALUATED,
                        evaluation
                    );
                }

                this.setState(
                    EvolutionState.SELECTING
                );

                const selected =
                    this.selection.select({
                        population:
                            this.population.genomes,
                        eliteCount,
                        parentCount
                    });

                this.emit(
                    EvolutionEvent.SELECTION_COMPLETED,
                    selected
                );

                const nextGeneration =
                    selected.elites.map(
                        elite =>
                            elite.clone({
                                genomeId:
                                    `${elite.genomeId}-elite-${this.population.generation + 1}`,
                                generation:
                                    this.population.generation + 1
                            })
                    );

                this.setState(
                    EvolutionState.CROSSING
                );

                while (
                    nextGeneration.length <
                    this.population.size
                ) {
                    const parentA =
                        selected.parents[
                            nextGeneration.length %
                            selected.parents.length
                        ];

                    const parentB =
                        selected.parents[
                            (
                                nextGeneration.length +
                                1
                            ) %
                            selected.parents.length
                        ];

                    const crossed =
                        this.crossover.cross(
                            parentA,
                            parentB
                        );

                    this.sequence++;

                    const child =
                        new EvolutionGenome({
                            genomeId:
                                `genome-${this.population.generation + 1}-${this.sequence}`,
                            genes:
                                crossed.genes,
                            generation:
                                this.population.generation + 1,
                            parents:
                                crossed.parents
                        });

                    this.emit(
                        EvolutionEvent.CROSSOVER_COMPLETED,
                        child.toJSON()
                    );

                    this.setState(
                        EvolutionState.MUTATING
                    );

                    const mutated =
                        this.mutation.mutate(
                            child,
                            schema
                        );

                    child.genes =
                        { ...mutated.genes };

                    this.emit(
                        EvolutionEvent.MUTATION_COMPLETED,
                        child.toJSON()
                    );

                    nextGeneration.push(
                        child
                    );

                    this.setState(
                        EvolutionState.CROSSING
                    );
                }

                this.setState(
                    EvolutionState.ADVANCING
                );

                const generation =
                    this.population.generation +
                    1;

                this.population.replace({
                    genomes:
                        nextGeneration,
                    generation
                });

                const generationResult = {
                    generation,
                    population:
                        this.population.genomes
                            .map(
                                genome =>
                                    genome.toJSON()
                            ),
                    best:
                        selected.ranking[0]
                            ?.toJSON?.() ??
                        null
                };

                generationResults.push(
                    generationResult
                );

                this.history.add(
                    generationResult
                );

                this.emit(
                    EvolutionEvent.GENERATION_COMPLETED,
                    generationResult
                );
            }

            const result = {
                version:
                    EVOLUTION_ENGINE_VERSION,
                evolutionId,
                generations:
                    generationResults,
                completedGenerations:
                    generationResults.length,
                best:
                    this.population.best()
                        ?.toJSON?.() ??
                    null,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.runCount++;

            this.setState(
                EvolutionState.COMPLETED
            );

            this.emit(
                EvolutionEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "evolve"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            EvolutionState.PAUSED
        );

        this.emit(
            EvolutionEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            EvolutionState.IDLE
        );

        this.emit(
            EvolutionEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.population.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.runCount = 0;
        this.paused = false;

        this.setState(
            EvolutionState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            EvolutionState.ERROR
        );

        this.emit(
            EvolutionEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.population.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            EvolutionState.DESTROYED
        );

        this.emit(
            EvolutionEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                EVOLUTION_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            runCount:
                this.runCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            population:
                this.population.summary,
            mutation:
                this.mutation.summary,
            crossover:
                this.crossover.summary,
            fitness:
                this.fitness.summary,
            selection:
                this.selection.summary,
            history:
                this.history.summary
        };
    }
}
