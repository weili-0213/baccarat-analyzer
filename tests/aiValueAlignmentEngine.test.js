/**
 * Baccarat Analyzer V8.5
 * tests/aiValueAlignmentEngine.test.js
 */

import ValueAlignmentEngine, {
    VALUE_ALIGNMENT_ENGINE_VERSION,
    AlignmentEvent
} from "../casino/ai/alignment/ValueAlignmentEngine.js";

import {
    ALIGNMENT_STATE_VERSION,
    AlignmentState,
    AlignmentLevel
} from "../casino/ai/alignment/AlignmentState.js";

import AlignmentContext, {
    ALIGNMENT_CONTEXT_VERSION
} from "../casino/ai/alignment/AlignmentContext.js";

import ValueRegistry, {
    VALUE_REGISTRY_VERSION
} from "../casino/ai/alignment/ValueRegistry.js";

import GoalAlignmentEvaluator, {
    GOAL_ALIGNMENT_EVALUATOR_VERSION
} from "../casino/ai/alignment/GoalAlignmentEvaluator.js";

import ActionAlignmentEvaluator, {
    ACTION_ALIGNMENT_EVALUATOR_VERSION
} from "../casino/ai/alignment/ActionAlignmentEvaluator.js";

import AlignmentConflictResolver, {
    ALIGNMENT_CONFLICT_RESOLVER_VERSION
} from "../casino/ai/alignment/AlignmentConflictResolver.js";

import AlignmentScorer, {
    ALIGNMENT_SCORER_VERSION
} from "../casino/ai/alignment/AlignmentScorer.js";

import AlignmentHistory, {
    ALIGNMENT_HISTORY_VERSION
} from "../casino/ai/alignment/AlignmentHistory.js";

import AlignmentRuntimeAdapter, {
    ALIGNMENT_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AlignmentRuntimeAdapter.js";

import {
    VALUE_ALIGNMENT_ENGINE_FACTORY_VERSION
} from "../casino/ai/alignment/createValueAlignmentEngine.js";


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


export default async function aiValueAlignmentEngineTest() {
    const messages = [];

    assert(
        [
            VALUE_ALIGNMENT_ENGINE_VERSION,
            ALIGNMENT_STATE_VERSION,
            ALIGNMENT_CONTEXT_VERSION,
            VALUE_REGISTRY_VERSION,
            GOAL_ALIGNMENT_EVALUATOR_VERSION,
            ACTION_ALIGNMENT_EVALUATOR_VERSION,
            ALIGNMENT_CONFLICT_RESOLVER_VERSION,
            ALIGNMENT_SCORER_VERSION,
            ALIGNMENT_HISTORY_VERSION,
            ALIGNMENT_RUNTIME_ADAPTER_VERSION,
            VALUE_ALIGNMENT_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.5.0"
        ),
        "V8.5 AI Value Alignment Framework 版本錯誤"
    );

    assert(
        AlignmentLevel.ALIGNED ===
            "aligned",
        "Alignment Level 錯誤"
    );

    messages.push(
        "✓ V8.5 AI Value Alignment Framework 版本正確"
    );

    const context =
        new AlignmentContext({
            goals: [
                {
                    goalId:
                        "safe-growth",
                    risk:
                        "low"
                }
            ],
            constraints: [
                {
                    constraintId:
                        "max-risk",
                    evaluate:
                        ({ action }) =>
                            action.risk !==
                            "high",
                    reason:
                        "High-risk action is not allowed."
                }
            ],
            governance: {
                approved:
                    true
            },
            assurance: {
                score:
                    95
            }
        });

    assert(
        context.goals.length ===
            1 &&
        context.constraints.length ===
            1,
        "Alignment Context 錯誤"
    );

    messages.push(
        "✓ Alignment Context 正確"
    );

    const registry =
        new ValueRegistry();

    registry.register({
        valueId:
            "safety",
        weight:
            2,
        evaluate:
            ({ goal }) => ({
                aligned:
                    goal.risk !==
                    "high",
                score:
                    goal.risk ===
                    "high"
                        ? 0
                        : 100
            })
    });

    registry.register({
        valueId:
            "governance",
        weight:
            1,
        evaluate:
            ({
                context
            }) => ({
                aligned:
                    context.governance
                        ?.approved ===
                    true,
                score:
                    context.governance
                        ?.approved ===
                    true
                        ? 100
                        : 0
            })
    });

    assert(
        registry.summary.count ===
            2,
        "Value Registry 錯誤"
    );

    messages.push(
        "✓ Value Registry 正確"
    );

    const goalResults =
        new GoalAlignmentEvaluator()
            .evaluate({
                goals:
                    context.goals,
                values:
                    registry.all(),
                context
            });

    assert(
        goalResults[0]
            .aligned === true &&
        goalResults[0]
            .score === 100,
        "Goal Alignment Evaluator 錯誤"
    );

    messages.push(
        "✓ Goal Alignment Evaluator 正確"
    );

    const actionResults =
        new ActionAlignmentEvaluator()
            .evaluate({
                actions: [
                    {
                        actionId:
                            "bet-banker",
                        risk:
                            "low"
                    }
                ],
                constraints:
                    context.constraints,
                context
            });

    assert(
        actionResults[0]
            .aligned === true &&
        actionResults[0]
            .score === 100,
        "Action Alignment Evaluator 錯誤"
    );

    messages.push(
        "✓ Action Alignment Evaluator 正確"
    );

    const resolution =
        new AlignmentConflictResolver()
            .resolve({
                goalResults,
                actionResults
            });

    assert(
        resolution.hasConflict ===
            false &&
        resolution.recommendation ===
            "proceed",
        "Alignment Conflict Resolver 錯誤"
    );

    messages.push(
        "✓ Alignment Conflict Resolver 正確"
    );

    const scored =
        new AlignmentScorer()
            .score({
                goalResults,
                actionResults
            });

    assert(
        scored.score ===
            100 &&
        scored.level ===
            AlignmentLevel.ALIGNED,
        "Alignment Scorer 錯誤"
    );

    messages.push(
        "✓ Alignment Scorer 正確"
    );

    let now = 100;
    const events = [];

    const engine =
        new ValueAlignmentEngine({
            values:
                registry,
            history:
                new AlignmentHistory({
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
                () => now++
        });

    assert(
        engine.state ===
            AlignmentState.IDLE,
        "Value Alignment Engine initial state 錯誤"
    );

    const result =
        await engine.evaluate({
            context,
            actions: [
                {
                    actionId:
                        "bet-banker",
                    risk:
                        "low"
                }
            ]
        });

    assert(
        result.aligned ===
            true &&
        result.level ===
            AlignmentLevel.ALIGNED &&
        result.resolution
            .hasConflict === false &&
        engine.state ===
            AlignmentState.COMPLETED &&
        engine.summary.alignmentCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Value Alignment Engine 錯誤"
    );

    messages.push(
        "✓ Values → Goals → Actions → Resolve → Validate 正確"
    );

    const misaligned =
        await engine.evaluate({
            context,
            actions: [
                {
                    actionId:
                        "high-risk-action",
                    risk:
                        "high"
                }
            ]
        });

    assert(
        misaligned.aligned ===
            false &&
        misaligned.resolution
            .hasConflict === true,
        "Misalignment Detection 錯誤"
    );

    messages.push(
        "✓ Misalignment Detection 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.evaluate({
            context
        });

    assert(
        engine.state ===
            AlignmentState.PAUSED &&
        pausedResult ===
            null,
        "Alignment Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            AlignmentState.IDLE &&
        engine.summary.paused ===
            false,
        "Alignment Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new AlignmentRuntimeAdapter({
            alignment:
                engine
        });

    const adapterResult =
        await adapter.evaluate({
            context,
            actions: [
                {
                    actionId:
                        "adapter-action",
                    risk:
                        "low"
                }
            ]
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.alignment
            .alignmentCount ===
            3,
        "Alignment Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            AlignmentEvent.STARTED,
            AlignmentEvent.VALUES_LOADED,
            AlignmentEvent.GOALS_EVALUATED,
            AlignmentEvent.ACTIONS_EVALUATED,
            AlignmentEvent.CONFLICTS_RESOLVED,
            AlignmentEvent.SCORE_CALCULATED,
            AlignmentEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Alignment Events 錯誤"
    );

    messages.push(
        "✓ Alignment Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            AlignmentState.IDLE &&
        engine.summary.alignmentCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Alignment Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            AlignmentState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.values
            .count === 0,
        "Alignment Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Value Alignment Framework V8.5 測試完成

Alignment State：通過
Alignment Context：通過
Value Registry：通過
Goal Alignment Evaluator：通過
Action Alignment Evaluator：通過
Alignment Conflict Resolver：通過
Alignment Scorer：通過
Value Alignment Engine：通過
Misalignment Detection：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
