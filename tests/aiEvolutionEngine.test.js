/**
 * Baccarat Analyzer V8.2
 * tests/aiEvolutionEngine.test.js
 */

import EvolutionEngine, {
    EVOLUTION_ENGINE_VERSION,
    EvolutionEvent
} from "../casino/ai/evolution/EvolutionEngine.js";

import {
    EVOLUTION_STATE_VERSION,
    EvolutionState,
    GenomeStatus
} from "../casino/ai/evolution/EvolutionState.js";

import EvolutionGenome, {
    EVOLUTION_GENOME_VERSION
} from "../casino/ai/evolution/EvolutionGenome.js";

import MutationEngine, {
    MUTATION_ENGINE_VERSION
} from "../casino/ai/evolution/MutationEngine.js";

import CrossoverEngine, {
    CROSSOVER_ENGINE_VERSION
} from "../casino/ai/evolution/CrossoverEngine.js";

import FitnessEvaluator, {
    FITNESS_EVALUATOR_VERSION
} from "../casino/ai/evolution/FitnessEvaluator.js";

import SelectionEngine, {
    SELECTION_ENGINE_VERSION
} from "../casino/ai/evolution/SelectionEngine.js";

import PopulationManager, {
    POPULATION_MANAGER_VERSION
} from "../casino/ai/evolution/PopulationManager.js";

import EvolutionHistory, {
    EVOLUTION_HISTORY_VERSION
} from "../casino/ai/evolution/EvolutionHistory.js";

import EvolutionRuntimeAdapter, {
    EVOLUTION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/EvolutionRuntimeAdapter.js";

import {
    EVOLUTION_ENGINE_FACTORY_VERSION
} from "../casino/ai/evolution/createEvolutionEngine.js";


function assert(
    condition,
    message
) {
    if (!condition) {
        throw new Error(
            message
        );
    }
}


export default async function aiEvolutionEngineTest() {
    const messages = [];

    assert(
        [
            EVOLUTION_ENGINE_VERSION,
            EVOLUTION_STATE_VERSION,
            EVOLUTION_GENOME_VERSION,
            MUTATION_ENGINE_VERSION,
            CROSSOVER_ENGINE_VERSION,
            FITNESS_EVALUATOR_VERSION,
            SELECTION_ENGINE_VERSION,
            POPULATION_MANAGER_VERSION,
            EVOLUTION_HISTORY_VERSION,
            EVOLUTION_RUNTIME_ADAPTER_VERSION,
            EVOLUTION_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.2.0"
        ),
        "V8.2 AI Evolution System 版本錯誤"
    );

    assert(
        GenomeStatus.ELITE ===
            "elite",
        "Genome Status 錯誤"
    );

    messages.push(
        "✓ V8.2 AI Evolution System 版本正確"
    );

    const genome =
        new EvolutionGenome({
            genomeId:
                "genome-1",
            genes: {
                confidenceThreshold:
                    0.6,
                riskLimit:
                    "medium"
            }
        });

    assert(
        genome.toJSON()
            .genes
            .confidenceThreshold ===
            0.6,
        "Evolution Genome 錯誤"
    );

    messages.push(
        "✓ Evolution Genome 正確"
    );

    const mutation =
        new MutationEngine({
            rate:
                1,
            magnitude:
                0.1,
            random:
                () => 0.9
        });

    const mutated =
        mutation.mutate(
            genome,
            {
                confidenceThreshold: {
                    min:
                        0.4,
                    max:
                        0.8,
                    step:
                        0.1
                },
                riskLimit: {
                    values: [
                        "low",
                        "medium",
                        "high"
                    ]
                }
            }
        );

    assert(
        mutated.genes
            .confidenceThreshold ===
            0.7 &&
        mutated.genes
            .riskLimit ===
            "high",
        "Mutation Engine 錯誤"
    );

    messages.push(
        "✓ Mutation Engine 正確"
    );

    const crossover =
        new CrossoverEngine({
            random:
                () => 0.25
        });

    const crossed =
        crossover.cross(
            {
                genomeId:
                    "a",
                genes: {
                    confidenceThreshold:
                        0.6,
                    riskLimit:
                        "low"
                }
            },
            {
                genomeId:
                    "b",
                genes: {
                    confidenceThreshold:
                        0.8,
                    riskLimit:
                        "high"
                }
            }
        );

    assert(
        crossed.genes
            .confidenceThreshold ===
            0.6 &&
        crossed.genes
            .riskLimit ===
            "low" &&
        crossed.parents
            .length === 2,
        "Crossover Engine 錯誤"
    );

    messages.push(
        "✓ Crossover Engine 正確"
    );

    const fitness =
        new FitnessEvaluator({
            evaluate:
                async ({
                    genome
                }) =>
                    genome.genes
                        .confidenceThreshold *
                    100
        });

    const fitnessResult =
        await fitness.evaluate({
            genome
        });

    assert(
        fitnessResult.score ===
            60,
        "Fitness Evaluator 錯誤"
    );

    messages.push(
        "✓ Fitness Evaluator 正確"
    );

    const selection =
        new SelectionEngine()
            .select({
                population: [
                    {
                        genomeId:
                            "a",
                        fitness:
                            60
                    },
                    {
                        genomeId:
                            "b",
                        fitness:
                            80
                    }
                ],
                eliteCount:
                    1,
                parentCount:
                    2
            });

    assert(
        selection.elites[0]
            .genomeId ===
            "b" &&
        selection.parents
            .length === 2,
        "Selection Engine 錯誤"
    );

    messages.push(
        "✓ Selection Engine 正確"
    );

    const population =
        new PopulationManager({
            size:
                4
        });

    population.initialize({
        seeds: [
            {
                genomeId:
                    "seed-1",
                genes: {
                    confidenceThreshold:
                        0.5,
                    riskLimit:
                        "low"
                }
            },
            {
                genomeId:
                    "seed-2",
                genes: {
                    confidenceThreshold:
                        0.6,
                    riskLimit:
                        "medium"
                }
            },
            {
                genomeId:
                    "seed-3",
                genes: {
                    confidenceThreshold:
                        0.7,
                    riskLimit:
                        "medium"
                }
            },
            {
                genomeId:
                    "seed-4",
                genes: {
                    confidenceThreshold:
                        0.8,
                    riskLimit:
                        "high"
                }
            }
        ]
    });

    assert(
        population.summary.count ===
            4 &&
        population.summary.generation ===
            0,
        "Population Manager 錯誤"
    );

    messages.push(
        "✓ Population Manager 正確"
    );

    let now = 100;
    const events = [];

    const engine =
        new EvolutionEngine({
            population,
            mutation:
                new MutationEngine({
                    rate:
                        1,
                    magnitude:
                        0.05,
                    random:
                        () => 0.9
                }),
            crossover:
                new CrossoverEngine({
                    random:
                        () => 0.25
                }),
            fitness:
                new FitnessEvaluator({
                    evaluate:
                        async ({
                            genome
                        }) => {
                            const confidence =
                                genome.genes
                                    .confidenceThreshold;

                            const riskBonus =
                                genome.genes
                                    .riskLimit ===
                                "low"
                                    ? 20
                                    : genome.genes
                                        .riskLimit ===
                                      "medium"
                                        ? 10
                                        : 0;

                            return (
                                confidence *
                                100 +
                                riskBonus
                            );
                        }
                }),
            selection:
                new SelectionEngine(),
            history:
                new EvolutionHistory({
                    limit:
                        20
                }),
            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },
            clock:
                () => now++,
            random:
                () => 0.5
        });

    assert(
        engine.state ===
            EvolutionState.IDLE,
        "Evolution Engine initial state 錯誤"
    );

    const result =
        await engine.evolve({
            context: {
                assurance: {
                    score:
                        90
                },
                learning: {
                    reward:
                        3
                }
            },
            generations:
                2,
            eliteCount:
                1,
            parentCount:
                2,
            schema: {
                confidenceThreshold: {
                    min:
                        0.4,
                    max:
                        0.9,
                    step:
                        0.05
                },
                riskLimit: {
                    values: [
                        "low",
                        "medium",
                        "high"
                    ]
                }
            }
        });

    assert(
        result.completedGenerations ===
            2 &&
        result.generations
            .length === 2 &&
        result.best !==
            null &&
        engine.state ===
            EvolutionState.COMPLETED &&
        engine.summary.runCount ===
            1 &&
        engine.summary.population
            .generation === 2 &&
        engine.summary.history
            .count === 2,
        "Evolution Engine 錯誤"
    );

    messages.push(
        "✓ Evaluate → Select → Crossover → Mutate → Advance 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.evolve({
            generations:
                1
        });

    assert(
        engine.state ===
            EvolutionState.PAUSED &&
        pausedResult ===
            null,
        "Evolution Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            EvolutionState.IDLE &&
        engine.summary.paused ===
            false,
        "Evolution Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new EvolutionRuntimeAdapter({
            evolution:
                engine
        });

    const adapterResult =
        await adapter.evolve({
            generations:
                1,
            eliteCount:
                1,
            parentCount:
                2,
            schema: {
                confidenceThreshold: {
                    min:
                        0.4,
                    max:
                        0.9,
                    step:
                        0.05
                },
                riskLimit: {
                    values: [
                        "low",
                        "medium",
                        "high"
                    ]
                }
            }
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.evolution
            .runCount ===
            2,
        "Evolution Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            EvolutionEvent.STARTED,
            EvolutionEvent.GENOME_EVALUATED,
            EvolutionEvent.SELECTION_COMPLETED,
            EvolutionEvent.CROSSOVER_COMPLETED,
            EvolutionEvent.MUTATION_COMPLETED,
            EvolutionEvent.GENERATION_COMPLETED,
            EvolutionEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Evolution Events 錯誤"
    );

    messages.push(
        "✓ Evolution Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            EvolutionState.IDLE &&
        engine.summary.runCount ===
            0 &&
        engine.summary.population
            .count === 0 &&
        engine.summary.history
            .count === 0,
        "Evolution Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            EvolutionState.DESTROYED &&
        engine.summary.destroyed ===
            true,
        "Evolution Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Evolution System V8.2 測試完成

Evolution State：通過
Evolution Genome：通過
Mutation Engine：通過
Crossover Engine：通過
Fitness Evaluator：通過
Selection Engine：通過
Population Manager：通過
Evolution Engine：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
