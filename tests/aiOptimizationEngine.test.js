/**
 * Baccarat Analyzer V7.9
 * tests/aiOptimizationEngine.test.js
 */

import OptimizationEngine, {
    OPTIMIZATION_ENGINE_VERSION,
    OptimizationEvent
} from "../casino/ai/optimization/OptimizationEngine.js";

import {
    OPTIMIZATION_STATE_VERSION,
    OptimizationState,
    OptimizationStatus,
    OptimizationDirection
} from "../casino/ai/optimization/OptimizationState.js";

import OptimizationContext, {
    OPTIMIZATION_CONTEXT_VERSION
} from "../casino/ai/optimization/OptimizationContext.js";

import MetricCollector, {
    METRIC_COLLECTOR_VERSION
} from "../casino/ai/optimization/MetricCollector.js";

import ParameterSpace, {
    PARAMETER_SPACE_VERSION
} from "../casino/ai/optimization/ParameterSpace.js";

import CandidateGenerator, {
    CANDIDATE_GENERATOR_VERSION
} from "../casino/ai/optimization/CandidateGenerator.js";

import CandidateEvaluator, {
    CANDIDATE_EVALUATOR_VERSION
} from "../casino/ai/optimization/CandidateEvaluator.js";

import OptimizationSelector, {
    OPTIMIZATION_SELECTOR_VERSION
} from "../casino/ai/optimization/OptimizationSelector.js";

import OptimizationSnapshot, {
    OPTIMIZATION_SNAPSHOT_VERSION
} from "../casino/ai/optimization/OptimizationSnapshot.js";

import OptimizationHistory, {
    OPTIMIZATION_HISTORY_VERSION
} from "../casino/ai/optimization/OptimizationHistory.js";

import OptimizationRuntimeAdapter, {
    OPTIMIZATION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/OptimizationRuntimeAdapter.js";

import {
    OPTIMIZATION_ENGINE_FACTORY_VERSION
} from "../casino/ai/optimization/createOptimizationEngine.js";


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


export default async function aiOptimizationEngineTest() {
    const messages = [];

    assert(
        [
            OPTIMIZATION_ENGINE_VERSION,
            OPTIMIZATION_STATE_VERSION,
            OPTIMIZATION_CONTEXT_VERSION,
            METRIC_COLLECTOR_VERSION,
            PARAMETER_SPACE_VERSION,
            CANDIDATE_GENERATOR_VERSION,
            CANDIDATE_EVALUATOR_VERSION,
            OPTIMIZATION_SELECTOR_VERSION,
            OPTIMIZATION_SNAPSHOT_VERSION,
            OPTIMIZATION_HISTORY_VERSION,
            OPTIMIZATION_RUNTIME_ADAPTER_VERSION,
            OPTIMIZATION_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "7.9.0"
        ),
        "V7.9 AI Optimization Engine 版本錯誤"
    );

    assert(
        OptimizationDirection.MAXIMIZE ===
            "maximize",
        "Optimization Direction 錯誤"
    );

    messages.push(
        "✓ V7.9 AI Optimization Engine 版本正確"
    );

    const context =
        new OptimizationContext({
            learning: {
                reward:
                    8
            },
            assurance: {
                score:
                    92
            },
            decision: {
                confidence:
                    0.8,
                expectedValue:
                    0.02,
                risk:
                    "low"
            },
            planning: {
                evaluation: {
                    score:
                        85
                }
            },
            execution: {
                success:
                    true
            }
        });

    assert(
        context.decision.confidence ===
            0.8 &&
        context.assurance.score ===
            92,
        "Optimization Context 錯誤"
    );

    messages.push(
        "✓ Optimization Context 正確"
    );

    const metrics =
        new MetricCollector()
            .collect(
                context
            );

    assert(
        metrics.reward ===
            8 &&
        metrics.assuranceScore ===
            92 &&
        metrics.executionSuccess ===
            1,
        "Metric Collector 錯誤"
    );

    messages.push(
        "✓ Metric Collector 正確"
    );

    const parameterSpace =
        new ParameterSpace();

    parameterSpace.define({
        name:
            "confidenceThreshold",
        current:
            0.6,
        min:
            0.4,
        max:
            0.8,
        step:
            0.1
    });

    parameterSpace.define({
        name:
            "riskLimit",
        current:
            "medium",
        values: [
            "low",
            "medium",
            "high"
        ]
    });

    assert(
        parameterSpace.summary.count ===
            2 &&
        parameterSpace.current()
            .confidenceThreshold ===
            0.6,
        "Parameter Space 錯誤"
    );

    messages.push(
        "✓ Parameter Space 正確"
    );

    const generator =
        new CandidateGenerator();

    const candidates =
        generator.generate(
            parameterSpace
        );

    assert(
        candidates.length >=
            5 &&
        candidates.some(
            item =>
                item.parameters
                    .confidenceThreshold ===
                0.7
        ) &&
        candidates.some(
            item =>
                item.parameters
                    .riskLimit ===
                "low"
        ),
        "Candidate Generator 錯誤"
    );

    messages.push(
        "✓ Candidate Generator 正確"
    );

    const evaluator =
        new CandidateEvaluator();

    const evaluation =
        evaluator.evaluate({
            candidate: {
                candidateId:
                    "test",
                parameters: {
                    confidenceThreshold:
                        0.7
                }
            },
            metrics,
            objectives: [
                {
                    name:
                        "confidence",
                    weight:
                        1,
                    evaluate:
                        ({ candidate }) =>
                            candidate.parameters
                                .confidenceThreshold *
                            100
                }
            ],
            constraints: [
                {
                    name:
                        "threshold-range",
                    evaluate:
                        ({ candidate }) =>
                            candidate.parameters
                                .confidenceThreshold <=
                            0.8
                }
            ]
        });

    assert(
        evaluation.passed ===
            true &&
        evaluation.score ===
            70,
        "Candidate Evaluator 錯誤"
    );

    messages.push(
        "✓ Candidate Evaluator 正確"
    );

    const selector =
        new OptimizationSelector();

    const selected =
        selector.select([
            {
                candidateId:
                    "a",
                score:
                    60,
                passed:
                    true
            },
            {
                candidateId:
                    "b",
                score:
                    80,
                passed:
                    true
            },
            {
                candidateId:
                    "c",
                score:
                    100,
                passed:
                    false
            }
        ]);

    assert(
        selected.selected
            .candidateId ===
            "b",
        "Optimization Selector 錯誤"
    );

    messages.push(
        "✓ Optimization Selector 正確"
    );

    const snapshot =
        new OptimizationSnapshot({
            snapshotId:
                "snapshot-1",
            parameters: {
                confidenceThreshold:
                    0.6
            },
            reason:
                "test"
        });

    assert(
        snapshot.toJSON()
            .parameters
            .confidenceThreshold ===
            0.6,
        "Optimization Snapshot 錯誤"
    );

    messages.push(
        "✓ Optimization Snapshot 正確"
    );

    let now = 100;

    const events = [];

    const applied = [];

    const engine =
        new OptimizationEngine({
            parameterSpace,
            metrics:
                new MetricCollector(),
            generator,
            evaluator,
            selector,
            history:
                new OptimizationHistory({
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
            applyParameters:
                async parameters => {
                    applied.push({
                        ...parameters
                    });

                    for (
                        const [
                            name,
                            value
                        ] of
                        Object.entries(
                            parameters
                        )
                    ) {
                        parameterSpace
                            .update(
                                name,
                                value
                            );
                    }

                    return {
                        applied:
                            true,
                        parameters:
                            { ...parameters }
                    };
                }
        });

    assert(
        engine.state ===
            OptimizationState.IDLE,
        "Optimization Engine initial state 錯誤"
    );

    const result =
        await engine.optimize({
            context,
            objectives: [
                {
                    name:
                        "confidence-threshold",
                    weight:
                        1,
                    evaluate:
                        ({ candidate }) =>
                            candidate.parameters
                                .confidenceThreshold *
                            100
                },
                {
                    name:
                        "low-risk-bonus",
                    weight:
                        0.5,
                    evaluate:
                        ({ candidate }) =>
                            candidate.parameters
                                .riskLimit ===
                            "low"
                                ? 100
                                : 50
                }
            ],
            constraints: [
                {
                    name:
                        "safe-threshold",
                    evaluate:
                        ({ candidate }) =>
                            candidate.parameters
                                .confidenceThreshold <=
                            0.8
                }
            ],
            apply:
                true
        });

    assert(
        result.status ===
            OptimizationStatus.APPLIED &&
        result.selection.selected !==
            null &&
        result.snapshot !==
            null &&
        applied.length ===
            1 &&
        engine.state ===
            OptimizationState.COMPLETED &&
        engine.summary.optimizationCount ===
            1 &&
        engine.summary.history
            .count === 1 &&
        engine.summary.snapshotCount ===
            1,
        "Optimization Engine 錯誤"
    );

    messages.push(
        "✓ Metrics → Candidates → Selection → Apply 正確"
    );

    const rollback =
        await engine.rollback();

    assert(
        rollback.status ===
            OptimizationStatus.ROLLED_BACK &&
        rollback.snapshot !==
            null &&
        applied.length ===
            2,
        "Optimization Rollback 錯誤"
    );

    messages.push(
        "✓ Rollback 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.optimize({
            context
        });

    assert(
        engine.state ===
            OptimizationState.PAUSED &&
        pausedResult ===
            null,
        "Optimization Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            OptimizationState.IDLE &&
        engine.summary.paused ===
            false,
        "Optimization Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new OptimizationRuntimeAdapter({
            optimization:
                engine
        });

    const adapterResult =
        await adapter.optimize({
            context,
            objectives: [
                {
                    name:
                        "confidence-threshold",
                    evaluate:
                        ({ candidate }) =>
                            candidate.parameters
                                .confidenceThreshold *
                            100
                }
            ],
            apply:
                false
        });

    assert(
        adapterResult !==
            null &&
        adapterResult.status ===
            OptimizationStatus.SELECTED &&
        adapter.summary.optimization
            .optimizationCount ===
            2,
        "Optimization Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            OptimizationEvent.STARTED,
            OptimizationEvent.METRICS_COLLECTED,
            OptimizationEvent.CANDIDATES_GENERATED,
            OptimizationEvent.CANDIDATE_EVALUATED,
            OptimizationEvent.CANDIDATE_SELECTED,
            OptimizationEvent.PARAMETERS_APPLIED,
            OptimizationEvent.ROLLED_BACK,
            OptimizationEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Optimization Events 錯誤"
    );

    messages.push(
        "✓ Optimization Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            OptimizationState.IDLE &&
        engine.summary.optimizationCount ===
            0 &&
        engine.summary.history
            .count === 0 &&
        engine.summary.snapshotCount ===
            0,
        "Optimization Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            OptimizationState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.parameterSpace
            .count === 0,
        "Optimization Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Optimization Engine V7.9 測試完成

Optimization State：通過
Optimization Context：通過
Metric Collector：通過
Parameter Space：通過
Candidate Generator：通過
Candidate Evaluator：通過
Optimization Selector：通過
Optimization Snapshot：通過
Optimization Engine：通過
Rollback：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
