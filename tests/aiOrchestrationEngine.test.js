/**
 * Baccarat Analyzer V8.9
 * tests/aiOrchestrationEngine.test.js
 */
import OrchestrationEngine, {
    ORCHESTRATION_ENGINE_VERSION,
    OrchestrationEvent
} from "../casino/ai/orchestration/OrchestrationEngine.js";

import {
    ORCHESTRATION_STATE_VERSION,
    OrchestrationState,
    OrchestrationDecision
} from "../casino/ai/orchestration/OrchestrationState.js";

import OrchestrationContext, {
    ORCHESTRATION_CONTEXT_VERSION
} from "../casino/ai/orchestration/OrchestrationContext.js";

import TaskRegistry, {
    TASK_REGISTRY_VERSION
} from "../casino/ai/orchestration/TaskRegistry.js";

import TaskPrioritizer, {
    TASK_PRIORITIZER_VERSION
} from "../casino/ai/orchestration/TaskPrioritizer.js";

import DependencyResolver, {
    DEPENDENCY_RESOLVER_VERSION
} from "../casino/ai/orchestration/DependencyResolver.js";

import ResourceAllocator, {
    RESOURCE_ALLOCATOR_VERSION
} from "../casino/ai/orchestration/ResourceAllocator.js";

import EngineScheduler, {
    ENGINE_SCHEDULER_VERSION
} from "../casino/ai/orchestration/EngineScheduler.js";

import ExecutionCoordinator, {
    EXECUTION_COORDINATOR_VERSION
} from "../casino/ai/orchestration/ExecutionCoordinator.js";

import GlobalStateSynchronizer, {
    GLOBAL_STATE_SYNCHRONIZER_VERSION
} from "../casino/ai/orchestration/GlobalStateSynchronizer.js";

import OrchestrationHistory, {
    ORCHESTRATION_HISTORY_VERSION
} from "../casino/ai/orchestration/OrchestrationHistory.js";

import OrchestrationRuntimeAdapter, {
    ORCHESTRATION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/OrchestrationRuntimeAdapter.js";

import {
    ORCHESTRATION_ENGINE_FACTORY_VERSION
} from "../casino/ai/orchestration/createOrchestrationEngine.js";


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


export default async function aiOrchestrationEngineTest() {
    const messages = [];

    assert(
        [
            ORCHESTRATION_ENGINE_VERSION,
            ORCHESTRATION_STATE_VERSION,
            ORCHESTRATION_CONTEXT_VERSION,
            TASK_REGISTRY_VERSION,
            TASK_PRIORITIZER_VERSION,
            DEPENDENCY_RESOLVER_VERSION,
            RESOURCE_ALLOCATOR_VERSION,
            ENGINE_SCHEDULER_VERSION,
            EXECUTION_COORDINATOR_VERSION,
            GLOBAL_STATE_SYNCHRONIZER_VERSION,
            ORCHESTRATION_HISTORY_VERSION,
            ORCHESTRATION_RUNTIME_ADAPTER_VERSION,
            ORCHESTRATION_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.9.0"
        ),
        "V8.9 AI Orchestration Engine 版本錯誤"
    );

    assert(
        OrchestrationDecision.RUN ===
            "run",
        "Orchestration Decision 錯誤"
    );

    messages.push(
        "✓ V8.9 AI Orchestration Engine 版本正確"
    );

    const registry =
        new TaskRegistry();

    registry.register({
        taskId:
            "reason",
        engineId:
            "reasoning",
        priority:
            10,
        dependencies: [],
        resourceCost:
            1
    });

    registry.register({
        taskId:
            "plan",
        engineId:
            "planning",
        priority:
            9,
        dependencies: [
            "reason"
        ],
        resourceCost:
            1
    });

    assert(
        registry.summary.count ===
            2,
        "Task Registry 錯誤"
    );

    messages.push(
        "✓ Task Registry 正確"
    );

    const prioritized =
        new TaskPrioritizer()
            .prioritize(
                registry.all()
            );

    assert(
        prioritized.highest
            .taskId ===
            "reason",
        "Task Prioritizer 錯誤"
    );

    messages.push(
        "✓ Task Prioritizer 正確"
    );

    const resolved =
        new DependencyResolver()
            .resolve(
                prioritized.ranking
            );

    assert(
        resolved.ordered[0]
            .taskId ===
            "reason" &&
        resolved.ordered[1]
            .taskId ===
            "plan",
        "Dependency Resolver 錯誤"
    );

    messages.push(
        "✓ Dependency Resolver 正確"
    );

    const allocation =
        new ResourceAllocator()
            .allocate({
                tasks:
                    resolved.ordered,
                capacity:
                    2
            });

    assert(
        allocation.allocated
            .length === 2 &&
        allocation.deferred
            .length === 0,
        "Resource Allocator 錯誤"
    );

    messages.push(
        "✓ Resource Allocator 正確"
    );

    const schedule =
        new EngineScheduler()
            .schedule(
                allocation.allocated
            );

    assert(
        schedule[0].sequence ===
            1 &&
        schedule[1].sequence ===
            2,
        "Engine Scheduler 錯誤"
    );

    messages.push(
        "✓ Engine Scheduler 正確"
    );

    const engines = {
        reasoning: {
            async execute() {
                return {
                    success:
                        true,
                    value:
                        "reasoned"
                };
            }
        },
        planning: {
            async execute() {
                return {
                    success:
                        true,
                    value:
                        "planned"
                };
            }
        }
    };

    const executionResults =
        await new ExecutionCoordinator()
            .execute({
                schedule,
                engines
            });

    assert(
        executionResults.length ===
            2 &&
        executionResults.every(
            result =>
                result.success
        ),
        "Execution Coordinator 錯誤"
    );

    messages.push(
        "✓ Execution Coordinator 正確"
    );

    const synchronized =
        new GlobalStateSynchronizer()
            .synchronize({
                globalState: {
                    phase:
                        "test"
                },
                results:
                    executionResults
            });

    assert(
        synchronized
            .lastExecutionCount ===
            2 &&
        synchronized
            .successfulTasks
            .length === 2,
        "Global State Synchronizer 錯誤"
    );

    messages.push(
        "✓ Global State Synchronizer 正確"
    );

    let now = 100;
    const events = [];

    const context =
        new OrchestrationContext({
            tasks: [
                {
                    taskId:
                        "reason",
                    engineId:
                        "reasoning",
                    priority:
                        10,
                    dependencies: [],
                    resourceCost:
                        1
                },
                {
                    taskId:
                        "plan",
                    engineId:
                        "planning",
                    priority:
                        9,
                    dependencies: [
                        "reason"
                    ],
                    resourceCost:
                        1
                }
            ],
            engines,
            resources: {
                capacity:
                    2
            },
            globalState: {
                phase:
                    "initial"
            }
        });

    const engine =
        new OrchestrationEngine({
            history:
                new OrchestrationHistory({
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
            OrchestrationState.IDLE,
        "Orchestration Engine initial state 錯誤"
    );

    const result =
        await engine.orchestrate({
            context
        });

    assert(
        result.decision ===
            OrchestrationDecision.RUN &&
        result.completed ===
            true &&
        result.executionResults
            .length === 2 &&
        engine.state ===
            OrchestrationState.COMPLETED &&
        engine.summary.runCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Orchestration Engine 錯誤"
    );

    messages.push(
        "✓ Plan → Resolve → Allocate → Execute → Synchronize 正確"
    );

    const deferred =
        await engine.orchestrate({
            context:
                new OrchestrationContext({
                    tasks:
                        context.tasks,
                    engines,
                    resources: {
                        capacity:
                            1
                    }
                })
        });

    assert(
        deferred.decision ===
            OrchestrationDecision.DEFER &&
        deferred.allocation
            .deferred.length ===
            1,
        "Resource Deferral 錯誤"
    );

    messages.push(
        "✓ Resource Deferral 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.orchestrate({
            context
        });

    assert(
        engine.state ===
            OrchestrationState.PAUSED &&
        pausedResult ===
            null,
        "Orchestration Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            OrchestrationState.IDLE &&
        engine.summary.paused ===
            false,
        "Orchestration Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new OrchestrationRuntimeAdapter({
            orchestration:
                engine
        });

    const adapterResult =
        await adapter.orchestrate({
            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary
            .orchestration
            .runCount ===
            3,
        "Orchestration Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            OrchestrationEvent.STARTED,
            OrchestrationEvent.TASKS_REGISTERED,
            OrchestrationEvent.TASKS_PRIORITIZED,
            OrchestrationEvent.DEPENDENCIES_RESOLVED,
            OrchestrationEvent.RESOURCES_ALLOCATED,
            OrchestrationEvent.SCHEDULE_CREATED,
            OrchestrationEvent.EXECUTION_COMPLETED,
            OrchestrationEvent.STATE_SYNCHRONIZED,
            OrchestrationEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Orchestration Events 錯誤"
    );

    messages.push(
        "✓ Orchestration Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            OrchestrationState.IDLE &&
        engine.summary.runCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Orchestration Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            OrchestrationState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.registry
            .count === 0,
        "Orchestration Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Orchestration Engine V8.9 測試完成

Orchestration State：通過
Orchestration Context：通過
Task Registry：通過
Task Prioritizer：通過
Dependency Resolver：通過
Resource Allocator：通過
Engine Scheduler：通過
Execution Coordinator：通過
Global State Synchronizer：通過
Orchestration Engine：通過
Resource Deferral：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
