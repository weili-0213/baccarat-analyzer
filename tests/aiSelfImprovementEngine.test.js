/**
 * Baccarat Analyzer V8.1
 * tests/aiSelfImprovementEngine.test.js
 */

import SelfImprovementEngine, {
    SELF_IMPROVEMENT_ENGINE_VERSION,
    SelfImprovementEvent
} from "../casino/ai/self-improvement/SelfImprovementEngine.js";

import {
    SELF_IMPROVEMENT_STATE_VERSION,
    SelfImprovementState,
    ImprovementStatus
} from "../casino/ai/self-improvement/SelfImprovementState.js";

import SelfImprovementContext, {
    SELF_IMPROVEMENT_CONTEXT_VERSION
} from "../casino/ai/self-improvement/SelfImprovementContext.js";

import WeaknessDetector, {
    WEAKNESS_DETECTOR_VERSION
} from "../casino/ai/self-improvement/WeaknessDetector.js";

import ImprovementGoalGenerator, {
    IMPROVEMENT_GOAL_GENERATOR_VERSION
} from "../casino/ai/self-improvement/ImprovementGoalGenerator.js";

import ExperimentPlanner, {
    EXPERIMENT_PLANNER_VERSION
} from "../casino/ai/self-improvement/ExperimentPlanner.js";

import ExperimentRunner, {
    EXPERIMENT_RUNNER_VERSION
} from "../casino/ai/self-improvement/ExperimentRunner.js";

import ImprovementEvaluator, {
    IMPROVEMENT_EVALUATOR_VERSION
} from "../casino/ai/self-improvement/ImprovementEvaluator.js";

import ImprovementSelector, {
    IMPROVEMENT_SELECTOR_VERSION
} from "../casino/ai/self-improvement/ImprovementSelector.js";

import ImprovementSnapshot, {
    IMPROVEMENT_SNAPSHOT_VERSION
} from "../casino/ai/self-improvement/ImprovementSnapshot.js";

import SelfImprovementHistory, {
    SELF_IMPROVEMENT_HISTORY_VERSION
} from "../casino/ai/self-improvement/SelfImprovementHistory.js";

import SelfImprovementRuntimeAdapter, {
    SELF_IMPROVEMENT_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/SelfImprovementRuntimeAdapter.js";

import {
    SELF_IMPROVEMENT_ENGINE_FACTORY_VERSION
} from "../casino/ai/self-improvement/createSelfImprovementEngine.js";


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


export default async function aiSelfImprovementEngineTest() {
    const messages = [];

    assert(
        [
            SELF_IMPROVEMENT_ENGINE_VERSION,
            SELF_IMPROVEMENT_STATE_VERSION,
            SELF_IMPROVEMENT_CONTEXT_VERSION,
            WEAKNESS_DETECTOR_VERSION,
            IMPROVEMENT_GOAL_GENERATOR_VERSION,
            EXPERIMENT_PLANNER_VERSION,
            EXPERIMENT_RUNNER_VERSION,
            IMPROVEMENT_EVALUATOR_VERSION,
            IMPROVEMENT_SELECTOR_VERSION,
            IMPROVEMENT_SNAPSHOT_VERSION,
            SELF_IMPROVEMENT_HISTORY_VERSION,
            SELF_IMPROVEMENT_RUNTIME_ADAPTER_VERSION,
            SELF_IMPROVEMENT_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.1.0"
        ),
        "V8.1 AI Self-Improvement System 版本錯誤"
    );

    messages.push(
        "✓ V8.1 AI Self-Improvement System 版本正確"
    );

    const context =
        new SelfImprovementContext({
            autonomous: {
                successRate:
                    0.5
            },
            learning: {
                reward:
                    -4
            },
            assurance: {
                score:
                    70
            },
            baseline: {
                successRate:
                    0.5
            },
            current: {
                successRate:
                    0.5
            },
            parameters: {
                confidenceThreshold:
                    0.6
            }
        });

    assert(
        context.parameters
            .confidenceThreshold ===
            0.6 &&
        context.assurance
            .score === 70,
        "Self-Improvement Context 錯誤"
    );

    messages.push(
        "✓ Self-Improvement Context 正確"
    );

    const weaknessResult =
        new WeaknessDetector()
            .detect(
                context
            );

    assert(
        weaknessResult.detected ===
            true &&
        weaknessResult.weaknesses
            .length >= 3,
        "Weakness Detector 錯誤"
    );

    messages.push(
        "✓ Weakness Detector 正確"
    );

    const goals =
        new ImprovementGoalGenerator()
            .generate(
                weaknessResult
            );

    assert(
        goals.length >=
            3 &&
        goals[0].priority >=
            goals[1].priority,
        "Improvement Goal Generator 錯誤"
    );

    messages.push(
        "✓ Improvement Goal Generator 正確"
    );

    const experiments =
        new ExperimentPlanner()
            .plan({
                goal:
                    goals[0],
                parameters:
                    context.parameters,
                step:
                    0.05
            });

    assert(
        experiments.length ===
            2,
        "Experiment Planner 錯誤"
    );

    messages.push(
        "✓ Experiment Planner 正確"
    );

    const runner =
        new ExperimentRunner({
            runExperiment:
                async ({
                    experiment
                }) => ({
                    metrics: {
                        successRate:
                            experiment.after >
                            experiment.before
                                ? 0.7
                                : 0.4
                    }
                })
        });

    const experimentResult =
        await runner.run({
            experiment:
                experiments[0],
            context
        });

    assert(
        experimentResult.output
            .metrics
            .successRate ===
            0.7,
        "Experiment Runner 錯誤"
    );

    messages.push(
        "✓ Experiment Runner 正確"
    );

    const evaluation =
        new ImprovementEvaluator()
            .evaluate({
                goal: {
                    targetMetric:
                        "successRate",
                    direction:
                        "increase"
                },
                baseline: {
                    successRate:
                        0.5
                },
                result:
                    experimentResult
            });

    assert(
        evaluation.improved ===
            true &&
        evaluation.delta >
            0,
        "Improvement Evaluator 錯誤"
    );

    messages.push(
        "✓ Improvement Evaluator 正確"
    );

    const selection =
        new ImprovementSelector()
            .select([
                evaluation,
                {
                    ...evaluation,
                    experimentId:
                        "bad",
                    improved:
                        false,
                    score:
                        -1
                }
            ]);

    assert(
        selection.selected
            .experimentId ===
            evaluation
                .experimentId,
        "Improvement Selector 錯誤"
    );

    messages.push(
        "✓ Improvement Selector 正確"
    );

    const snapshot =
        new ImprovementSnapshot({
            snapshotId:
                "snapshot-1",
            parameters:
                context.parameters
        });

    assert(
        snapshot.toJSON()
            .parameters
            .confidenceThreshold ===
            0.6,
        "Improvement Snapshot 錯誤"
    );

    messages.push(
        "✓ Improvement Snapshot 正確"
    );

    let now = 100;

    const events = [];
    const applications = [];

    const engine =
        new SelfImprovementEngine({
            experimentRunner:
                new ExperimentRunner({
                    runExperiment:
                        async ({
                            experiment
                        }) => ({
                            metrics: {
                                assuranceScore:
                                    experiment.after >
                                    experiment.before
                                        ? 90
                                        : 60,
                                reward:
                                    experiment.after >
                                    experiment.before
                                        ? 3
                                        : -5,
                                successRate:
                                    experiment.after >
                                    experiment.before
                                        ? 0.7
                                        : 0.4,
                                confidence:
                                    experiment.after
                            }
                        })
                }),
            history:
                new SelfImprovementHistory({
                    limit:
                        20
                }),
            applyParameters:
                async parameters => {
                    applications.push({
                        ...parameters
                    });

                    return {
                        applied:
                            true,
                        parameters:
                            { ...parameters }
                    };
                },
            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },
            clock:
                () => now++
        });

    assert(
        engine.state ===
            SelfImprovementState.IDLE,
        "Self-Improvement Engine initial state 錯誤"
    );

    const result =
        await engine.improve({
            context,
            apply:
                true,
            step:
                0.05
        });

    assert(
        result.status ===
            ImprovementStatus.APPLIED &&
        result.selection.selected !==
            null &&
        result.snapshot !==
            null &&
        applications.length ===
            1 &&
        engine.state ===
            SelfImprovementState.COMPLETED &&
        engine.summary.improvementCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Self-Improvement Engine 錯誤"
    );

    messages.push(
        "✓ Weakness → Goal → Experiment → Apply 正確"
    );

    const rollback =
        await engine.rollback();

    assert(
        rollback.status ===
            ImprovementStatus.ROLLED_BACK &&
        rollback.snapshot !==
            null &&
        applications.length ===
            2,
        "Self-Improvement Rollback 錯誤"
    );

    messages.push(
        "✓ Rollback 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.improve({
            context
        });

    assert(
        engine.state ===
            SelfImprovementState.PAUSED &&
        pausedResult ===
            null,
        "Self-Improvement Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            SelfImprovementState.IDLE &&
        engine.summary.paused ===
            false,
        "Self-Improvement Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new SelfImprovementRuntimeAdapter({
            selfImprovement:
                engine
        });

    const adapterResult =
        await adapter.improve({
            context,
            apply:
                false
        });

    assert(
        adapterResult !==
            null &&
        adapterResult.status ===
            ImprovementStatus.ACCEPTED &&
        adapter.summary
            .selfImprovement
            .improvementCount ===
            2,
        "Self-Improvement Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            SelfImprovementEvent.STARTED,
            SelfImprovementEvent.WEAKNESSES_DETECTED,
            SelfImprovementEvent.GOALS_GENERATED,
            SelfImprovementEvent.EXPERIMENT_STARTED,
            SelfImprovementEvent.EXPERIMENT_COMPLETED,
            SelfImprovementEvent.IMPROVEMENT_SELECTED,
            SelfImprovementEvent.APPLIED,
            SelfImprovementEvent.ROLLED_BACK,
            SelfImprovementEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Self-Improvement Events 錯誤"
    );

    messages.push(
        "✓ Self-Improvement Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            SelfImprovementState.IDLE &&
        engine.summary.improvementCount ===
            0 &&
        engine.summary.snapshotCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Self-Improvement Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            SelfImprovementState.DESTROYED &&
        engine.summary.destroyed ===
            true,
        "Self-Improvement Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Self-Improvement System V8.1 測試完成

Self-Improvement State：通過
Self-Improvement Context：通過
Weakness Detector：通過
Improvement Goal Generator：通過
Experiment Planner：通過
Experiment Runner：通過
Improvement Evaluator：通過
Improvement Selector：通過
Improvement Snapshot：通過
Self-Improvement Engine：通過
Rollback：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
