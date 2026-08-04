/**
 * Baccarat Analyzer V7.4
 * tests/aiPlanningEngine.test.js
 */
import PlanningEngine, {
    PLANNING_ENGINE_VERSION,
    PlanningEvent
} from "../casino/ai/planning/PlanningEngine.js";
import {
    PLANNING_STATE_VERSION,
    PlanningState,
    PlanStatus,
    PlanActionType
} from "../casino/ai/planning/PlanningState.js";
import PlanningContext, {
    PLANNING_CONTEXT_VERSION
} from "../casino/ai/planning/PlanningContext.js";
import GoalManager, {
    GOAL_MANAGER_VERSION
} from "../casino/ai/planning/GoalManager.js";
import ConstraintEvaluator, {
    CONSTRAINT_EVALUATOR_VERSION
} from "../casino/ai/planning/ConstraintEvaluator.js";
import PlanStep, {
    PLAN_STEP_VERSION
} from "../casino/ai/planning/PlanStep.js";
import ActionPlanner, {
    ACTION_PLANNER_VERSION
} from "../casino/ai/planning/ActionPlanner.js";
import PlanModel, {
    PLAN_MODEL_VERSION
} from "../casino/ai/planning/PlanModel.js";
import PlanEvaluator, {
    PLAN_EVALUATOR_VERSION
} from "../casino/ai/planning/PlanEvaluator.js";
import PlanningHistory, {
    PLANNING_HISTORY_VERSION
} from "../casino/ai/planning/PlanningHistory.js";
import PlanningRuntimeAdapter, {
    PLANNING_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/PlanningRuntimeAdapter.js";
import {
    PLANNING_ENGINE_FACTORY_VERSION
} from "../casino/ai/planning/createPlanningEngine.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

export default async function aiPlanningEngineTest() {
    const messages = [];

    assert(
        [
            PLANNING_ENGINE_VERSION,
            PLANNING_STATE_VERSION,
            PLANNING_CONTEXT_VERSION,
            GOAL_MANAGER_VERSION,
            CONSTRAINT_EVALUATOR_VERSION,
            PLAN_STEP_VERSION,
            ACTION_PLANNER_VERSION,
            PLAN_MODEL_VERSION,
            PLAN_EVALUATOR_VERSION,
            PLANNING_HISTORY_VERSION,
            PLANNING_RUNTIME_ADAPTER_VERSION,
            PLANNING_ENGINE_FACTORY_VERSION
        ].every(version => version === "7.4.0"),
        "V7.4 AI Planning Engine 版本錯誤"
    );
    messages.push("✓ V7.4 AI Planning Engine 版本正確");

    const context = new PlanningContext({
        decision: {
            action: "recommend",
            bestBet: "Banker",
            confidence: 0.8,
            expectedValue: 0.02,
            risk: "low"
        },
        strategy: {
            action: "bet",
            betType: "Banker",
            amount: 25
        },
        bankroll: {
            balance: 1000
        },
        constraints: [
            {
                name: "bankroll-positive",
                required: true,
                evaluate: current => current.bankroll.balance > 0
            }
        ],
        metadata: {
            roundId: "round-1"
        }
    });

    assert(
        context.decision.bestBet === "Banker" &&
        context.bankroll.balance === 1000,
        "Planning Context 錯誤"
    );
    messages.push("✓ Planning Context 正確");

    const goals = new GoalManager();
    goals.define({
        goalId: "protect-bankroll",
        name: "Protect bankroll",
        priority: 100
    });
    goals.define({
        goalId: "execute-edge",
        name: "Execute positive edge",
        priority: 80
    });

    assert(
        goals.summary.count === 2 &&
        goals.active()[0].goalId === "protect-bankroll",
        "Goal Manager 錯誤"
    );
    messages.push("✓ Goal Manager 正確");

    const constraintEvaluator = new ConstraintEvaluator();
    const constraintResult = constraintEvaluator.evaluate({
        context,
        constraints: context.constraints
    });

    assert(
        constraintResult.passed === true &&
        constraintResult.blocking.length === 0,
        "Constraint Evaluator 錯誤"
    );
    messages.push("✓ Constraint Evaluator 正確");

    const step = new PlanStep({
        stepId: "test-step",
        order: 1,
        action: PlanActionType.REVIEW,
        label: "Test Step"
    });

    assert(
        step.canExecute(context) === true &&
        step.toJSON().stepId === "test-step",
        "Plan Step 錯誤"
    );
    messages.push("✓ Plan Step 正確");

    const actionPlanner = new ActionPlanner();
    const steps = actionPlanner.build({
        context,
        goal: goals.get("protect-bankroll"),
        constraintResult
    });

    assert(
        steps.length === 4 &&
        steps.some(item => item.action === PlanActionType.BET),
        "Action Planner 錯誤"
    );
    messages.push("✓ Action Planner 正確");

    const plan = new PlanModel({
        planId: "plan-test",
        goal: goals.get("protect-bankroll"),
        steps,
        constraints: constraintResult,
        status: PlanStatus.READY
    });

    const evaluation = new PlanEvaluator().evaluate({
        plan,
        context
    });

    assert(
        plan.isReady === true &&
        evaluation.score > 50 &&
        evaluation.acceptable === true,
        "Plan Model／Evaluator 錯誤"
    );
    messages.push("✓ Plan Model 與 Plan Evaluator 正確");

    let now = 100;
    const events = [];

    const engine = new PlanningEngine({
        goals,
        constraintEvaluator,
        actionPlanner,
        planEvaluator: new PlanEvaluator(),
        history: new PlanningHistory({ limit: 20 }),
        eventBus: {
            emit(type, payload) {
                events.push({ type, payload });
            }
        },
        clock: () => now++
    });

    assert(
        engine.state === PlanningState.IDLE,
        "Planning Engine initial state 錯誤"
    );

    const result = await engine.plan({
        context,
        goalId: "protect-bankroll"
    });

    assert(
        result.plan.planId !== null &&
        result.plan.steps.length === 4 &&
        result.plan.status === PlanStatus.READY &&
        result.evaluation.acceptable === true &&
        engine.state === PlanningState.COMPLETED &&
        engine.summary.planCount === 1 &&
        engine.summary.history.count === 1,
        "Planning Engine 錯誤"
    );
    messages.push("✓ Goal → Constraint → Action Plan 正確");

    const blocked = await engine.plan({
        context: {
            ...context.toJSON(),
            constraints: [
                {
                    name: "blocked",
                    required: true,
                    evaluate: () => false,
                    reason: "Testing block."
                }
            ]
        }
    });

    assert(
        blocked.plan.status === PlanStatus.BLOCKED &&
        blocked.plan.steps.some(
            item => item.action === PlanActionType.STOP
        ),
        "Blocked Plan 錯誤"
    );
    messages.push("✓ Blocked Plan 正確");

    engine.pause();
    const pausedResult = await engine.plan({ context });

    assert(
        engine.state === PlanningState.PAUSED &&
        pausedResult === null,
        "Planning Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state === PlanningState.IDLE &&
        engine.summary.paused === false,
        "Planning Resume 錯誤"
    );
    messages.push("✓ Pause／Resume 正確");

    const adapter = new PlanningRuntimeAdapter({
        planning: engine
    });
    const adapterResult = await adapter.plan({ context });

    assert(
        adapterResult !== null &&
        adapter.summary.planning.planCount === 3,
        "Planning Runtime Adapter 錯誤"
    );
    messages.push("✓ Runtime Adapter 正確");

    assert(
        [
            PlanningEvent.STARTED,
            PlanningEvent.GOAL_SELECTED,
            PlanningEvent.CONSTRAINTS_EVALUATED,
            PlanningEvent.STEPS_BUILT,
            PlanningEvent.PLAN_EVALUATED,
            PlanningEvent.COMPLETED
        ].every(type => events.some(event => event.type === type)),
        "Planning Events 錯誤"
    );
    messages.push("✓ Planning Events 正確");

    engine.reset();

    assert(
        engine.state === PlanningState.IDLE &&
        engine.summary.planCount === 0 &&
        engine.summary.history.count === 0,
        "Planning Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state === PlanningState.DESTROYED &&
        engine.summary.destroyed === true &&
        engine.summary.goals.count === 0,
        "Planning Destroy 錯誤"
    );
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Planning Engine V7.4 測試完成

Planning State：通過
Planning Context：通過
Goal Manager：通過
Constraint Evaluator：通過
Plan Step：通過
Action Planner：通過
Plan Model：通過
Plan Evaluator：通過
Planning Engine：通過
Blocked Plan：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
