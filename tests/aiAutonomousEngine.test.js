/**
 * Baccarat Analyzer V8.0
 * tests/aiAutonomousEngine.test.js
 */
import AutonomousEngine, {
    AUTONOMOUS_ENGINE_VERSION,
    AutonomousEvent
} from "../casino/ai/autonomous/AutonomousEngine.js";
import {
    AUTONOMOUS_STATE_VERSION,
    AutonomousState,
    AutonomousTaskStatus
} from "../casino/ai/autonomous/AutonomousState.js";
import AutonomousContext, {
    AUTONOMOUS_CONTEXT_VERSION
} from "../casino/ai/autonomous/AutonomousContext.js";
import GoalManager, {
    AUTONOMOUS_GOAL_MANAGER_VERSION
} from "../casino/ai/autonomous/GoalManager.js";
import TaskScheduler, {
    AUTONOMOUS_TASK_SCHEDULER_VERSION
} from "../casino/ai/autonomous/TaskScheduler.js";
import AutonomousMemory, {
    AUTONOMOUS_MEMORY_VERSION
} from "../casino/ai/autonomous/AutonomousMemory.js";
import AutonomousMonitor, {
    AUTONOMOUS_MONITOR_VERSION
} from "../casino/ai/autonomous/AutonomousMonitor.js";
import AutonomousController, {
    AUTONOMOUS_CONTROLLER_VERSION
} from "../casino/ai/autonomous/AutonomousController.js";
import AutonomousRuntimeAdapter, {
    AUTONOMOUS_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AutonomousRuntimeAdapter.js";
import {
    AUTONOMOUS_ENGINE_FACTORY_VERSION
} from "../casino/ai/autonomous/createAutonomousEngine.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

export default async function aiAutonomousEngineTest() {
    const messages = [];

    assert(
        [
            AUTONOMOUS_ENGINE_VERSION,
            AUTONOMOUS_STATE_VERSION,
            AUTONOMOUS_CONTEXT_VERSION,
            AUTONOMOUS_GOAL_MANAGER_VERSION,
            AUTONOMOUS_TASK_SCHEDULER_VERSION,
            AUTONOMOUS_MEMORY_VERSION,
            AUTONOMOUS_MONITOR_VERSION,
            AUTONOMOUS_CONTROLLER_VERSION,
            AUTONOMOUS_RUNTIME_ADAPTER_VERSION,
            AUTONOMOUS_ENGINE_FACTORY_VERSION
        ].every(version => version === "8.0.0"),
        "V8.0 AI Autonomous System 版本錯誤"
    );
    messages.push("✓ V8.0 AI Autonomous System 版本正確");

    const context = new AutonomousContext({
        metadata: {
            roundId: "round-1"
        }
    });

    context.set("decision", {
        bestBet: "Banker"
    });

    assert(
        context.get("decision").bestBet === "Banker" &&
        context.metadata.roundId === "round-1",
        "Autonomous Context 錯誤"
    );
    messages.push("✓ Autonomous Context 正確");

    const goals = new GoalManager();

    goals.add({
        goalId: "goal-1",
        name: "Complete autonomous AI cycle",
        priority: 100,
        metadata: {
            tasks: [
                "decision",
                "reasoning",
                "planning",
                "governance",
                "execution",
                "learning",
                "assurance",
                "optimization"
            ]
        }
    });

    goals.add({
        goalId: "goal-2",
        name: "Secondary goal",
        priority: 10
    });

    assert(
        goals.summary.count === 2 &&
        goals.select().goalId === "goal-1",
        "Goal Manager 錯誤"
    );
    messages.push("✓ Goal Manager 正確");

    const scheduler = new TaskScheduler();
    const scheduled = scheduler.buildForGoal(
        goals.get("goal-1")
    );

    assert(
        scheduled.length === 8 &&
        scheduler.next().type === "decision",
        "Task Scheduler 錯誤"
    );
    messages.push("✓ Task Scheduler 正確");

    const memory = new AutonomousMemory({
        limit: 20
    });

    memory.add({
        type: "test",
        value: 1
    });

    assert(
        memory.summary.count === 1 &&
        memory.latest("test").value === 1,
        "Autonomous Memory 錯誤"
    );
    messages.push("✓ Autonomous Memory 正確");

    const monitor = new AutonomousMonitor();
    const health = monitor.inspect({
        state: AutonomousState.RUNNING,
        context,
        scheduler,
        memory,
        cycleCount: 1
    });

    assert(
        health.healthy === true &&
        health.pendingTasks === 8,
        "Autonomous Monitor 錯誤"
    );
    messages.push("✓ Autonomous Monitor 正確");

    let now = 100;
    const events = [];

    const engine = new AutonomousEngine({
        goals,
        scheduler: new TaskScheduler(),
        memory: new AutonomousMemory({
            limit: 100
        }),
        monitor,
        eventBus: {
            emit(type, payload) {
                events.push({
                    type,
                    payload
                });
            }
        },
        clock: () => now++
    });

    const handlers = {
        decision: async () => ({
            bestBet: "Banker",
            confidence: 0.8
        }),

        reasoning: async ({ context }) => ({
            explanation: {
                candidate: context.decision.bestBet
            }
        }),

        planning: async ({ context }) => ({
            plan: {
                planId: "plan-1",
                steps: [
                    {
                        action: "bet",
                        payload: {
                            betType:
                                context.decision.bestBet
                        }
                    }
                ]
            }
        }),

        governance: async () => ({
            approved: true,
            blocked: false
        }),

        execution: async ({ context }) => ({
            success: context.governance.approved,
            winner: "Banker"
        }),

        learning: async ({ context }) => ({
            reward: context.execution.success
                ? 10
                : -10
        }),

        assurance: async ({ context }) => ({
            passed:
                context.governance.approved &&
                context.execution.success,
            score: 95
        }),

        optimization: async ({ context }) => ({
            applied: context.assurance.passed,
            parameter: "confidenceThreshold"
        })
    };

    for (const [type, handler] of Object.entries(handlers)) {
        engine.registerHandler(type, handler);
    }

    assert(
        engine.state === AutonomousState.IDLE &&
        engine.summary.handlerCount === 8,
        "Autonomous Engine initial state 錯誤"
    );

    const started = await engine.start({
        context,
        goalId: "goal-1",
        autoRun: false
    });

    assert(
        started.started === true &&
        engine.state === AutonomousState.RUNNING &&
        engine.summary.scheduler.pendingCount === 8,
        "Autonomous Start 錯誤"
    );
    messages.push("✓ Autonomous Start 正確");

    const result = await engine.runCycle({
        context: started.context
    });

    assert(
        result.completed === true &&
        result.tasks.length === 8 &&
        result.tasks.every(
            item =>
                item.status ===
                AutonomousTaskStatus.COMPLETED
        ) &&
        result.context.decision.bestBet === "Banker" &&
        result.context.reasoning.explanation.candidate ===
            "Banker" &&
        result.context.planning.plan.planId === "plan-1" &&
        result.context.governance.approved === true &&
        result.context.execution.success === true &&
        result.context.learning.reward === 10 &&
        result.context.assurance.passed === true &&
        result.context.optimization.applied === true &&
        result.health.healthy === true &&
        engine.state === AutonomousState.COMPLETED &&
        engine.summary.cycleCount === 1 &&
        engine.summary.goals.completedCount === 1,
        "Autonomous Full Cycle 錯誤"
    );
    messages.push(
        "✓ Decision → Reasoning → Planning → Execution → Learning → Optimization 正確"
    );

    engine.pause();
    const pausedResult = await engine.runCycle({
        context
    });

    assert(
        engine.state === AutonomousState.PAUSED &&
        pausedResult === null,
        "Autonomous Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state === AutonomousState.RUNNING &&
        engine.summary.paused === false,
        "Autonomous Resume 錯誤"
    );
    messages.push("✓ Pause／Resume 正確");

    const controller = new AutonomousController({
        engine
    });

    controller.stop("manual-stop");

    assert(
        engine.state === AutonomousState.STOPPED &&
        engine.summary.stopped === true &&
        engine.summary.stopReason === "manual-stop",
        "Autonomous Controller Stop 錯誤"
    );
    messages.push("✓ Autonomous Controller 正確");

    engine.reset();

    goals.add({
        goalId: "goal-3",
        name: "Runtime adapter cycle",
        priority: 200,
        metadata: {
            tasks: [
                "decision"
            ]
        }
    });

    const adapter = new AutonomousRuntimeAdapter({
        autonomous: engine
    });

    const adapterResult = await adapter.start({
        context: new AutonomousContext(),
        goalId: "goal-3"
    });

    assert(
        adapterResult !== null &&
        adapterResult.completed === true &&
        adapter.summary.autonomous.cycleCount === 1,
        "Autonomous Runtime Adapter 錯誤"
    );
    messages.push("✓ Runtime Adapter 正確");

    assert(
        [
            AutonomousEvent.STARTED,
            AutonomousEvent.GOAL_SELECTED,
            AutonomousEvent.TASK_STARTED,
            AutonomousEvent.TASK_COMPLETED,
            AutonomousEvent.CYCLE_COMPLETED,
            AutonomousEvent.PAUSED,
            AutonomousEvent.RESUMED,
            AutonomousEvent.STOPPED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type === type
                )
        ),
        "Autonomous Events 錯誤"
    );
    messages.push("✓ Autonomous Events 正確");

    engine.reset();

    assert(
        engine.state === AutonomousState.IDLE &&
        engine.summary.cycleCount === 0 &&
        engine.summary.memory.count === 0 &&
        engine.summary.scheduler.count === 0,
        "Autonomous Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state === AutonomousState.DESTROYED &&
        engine.summary.destroyed === true &&
        engine.summary.goals.count === 0 &&
        engine.summary.handlerCount === 0,
        "Autonomous Destroy 錯誤"
    );
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Autonomous System V8.0 測試完成

Autonomous State：通過
Autonomous Context：通過
Goal Manager：通過
Task Scheduler：通過
Autonomous Memory：通過
Autonomous Monitor：通過
Autonomous Controller：通過
Autonomous Start：通過
Full Autonomous Cycle：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
