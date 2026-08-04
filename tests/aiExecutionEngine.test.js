/**
 * Baccarat Analyzer V7.5
 * tests/aiExecutionEngine.test.js
 */

import ExecutionEngine, {
    EXECUTION_ENGINE_VERSION,
    ExecutionEvent
} from "../casino/ai/execution/ExecutionEngine.js";

import {
    EXECUTION_STATE_VERSION,
    ExecutionState,
    ExecutionStatus
} from "../casino/ai/execution/ExecutionState.js";

import ExecutionContext, {
    EXECUTION_CONTEXT_VERSION
} from "../casino/ai/execution/ExecutionContext.js";

import ExecutionResult, {
    EXECUTION_RESULT_VERSION
} from "../casino/ai/execution/ExecutionResult.js";

import StepValidator, {
    STEP_VALIDATOR_VERSION
} from "../casino/ai/execution/StepValidator.js";

import ActionDispatcher, {
    ACTION_DISPATCHER_VERSION
} from "../casino/ai/execution/ActionDispatcher.js";

import ExecutionQueue, {
    EXECUTION_QUEUE_VERSION
} from "../casino/ai/execution/ExecutionQueue.js";

import ExecutionHistory, {
    EXECUTION_HISTORY_VERSION
} from "../casino/ai/execution/ExecutionHistory.js";

import ExecutionRuntimeAdapter, {
    EXECUTION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/ExecutionRuntimeAdapter.js";

import {
    EXECUTION_ENGINE_FACTORY_VERSION
} from "../casino/ai/execution/createExecutionEngine.js";


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


export default async function aiExecutionEngineTest() {
    const messages = [];

    assert(
        [
            EXECUTION_ENGINE_VERSION,
            EXECUTION_STATE_VERSION,
            EXECUTION_CONTEXT_VERSION,
            EXECUTION_RESULT_VERSION,
            STEP_VALIDATOR_VERSION,
            ACTION_DISPATCHER_VERSION,
            EXECUTION_QUEUE_VERSION,
            EXECUTION_HISTORY_VERSION,
            EXECUTION_RUNTIME_ADAPTER_VERSION,
            EXECUTION_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "7.5.0"
        ),
        "V7.5 AI Execution Engine 版本錯誤"
    );

    messages.push(
        "✓ V7.5 AI Execution Engine 版本正確"
    );

    const context =
        new ExecutionContext({
            metadata: {
                roundId:
                    "round-1"
            }
        });

    assert(
        context.metadata.roundId ===
            "round-1",
        "Execution Context 錯誤"
    );

    messages.push(
        "✓ Execution Context 正確"
    );

    const validator =
        new StepValidator();

    const validation =
        validator.validate({
            stepId:
                "step-1",

            action:
                "review"
        });

    assert(
        validation.valid ===
            true,
        "Step Validator 錯誤"
    );

    messages.push(
        "✓ Step Validator 正確"
    );

    const dispatcher =
        new ActionDispatcher();

    dispatcher.register(
        "review",
        async payload => ({
            reviewed:
                true,

            payload
        })
    );

    const dispatched =
        await dispatcher.dispatch(
            "review",
            {
                source:
                    "test"
            }
        );

    assert(
        dispatched.reviewed ===
            true,
        "Action Dispatcher 錯誤"
    );

    messages.push(
        "✓ Action Dispatcher 正確"
    );

    const queue =
        new ExecutionQueue();

    queue.enqueue({
        stepId:
            "second",

        order:
            2
    });

    queue.enqueue({
        stepId:
            "first",

        order:
            1
    });

    assert(
        queue.dequeue()
            .stepId ===
            "first",
        "Execution Queue 錯誤"
    );

    messages.push(
        "✓ Execution Queue 正確"
    );

    let now = 100;

    const events = [];

    const engine =
        new ExecutionEngine({
            validator,
            dispatcher:
                new ActionDispatcher(),

            queue:
                new ExecutionQueue(),

            history:
                new ExecutionHistory({
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

    engine
        .register(
            "review",
            async () => ({
                reviewed:
                    true
            })
        )
        .register(
            "analyze",
            async () => ({
                analyzed:
                    true
            })
        )
        .register(
            "bet",
            async payload => ({
                placed:
                    true,

                betType:
                    payload.betType,

                amount:
                    payload.amount
            })
        );

    const plan = {
        planId:
            "plan-1",

        steps: [
            {
                stepId:
                    "review-context",

                order:
                    1,

                action:
                    "review",

                payload: {}
            },
            {
                stepId:
                    "confirm-analysis",

                order:
                    2,

                action:
                    "analyze",

                payload: {}
            },
            {
                stepId:
                    "execute-bet",

                order:
                    3,

                action:
                    "bet",

                payload: {
                    betType:
                        "Banker",

                    amount:
                        25
                }
            }
        ]
    };

    const result =
        await engine.execute({
            plan,
            context
        });

    assert(
        result instanceof
            ExecutionResult &&
        result.success ===
            true &&
        result.status ===
            ExecutionStatus.SUCCESS &&
        result.steps.length ===
            3 &&
        result.steps.every(
            item =>
                item.status ===
                ExecutionStatus.SUCCESS
        ) &&
        engine.state ===
            ExecutionState.COMPLETED &&
        engine.summary.executionCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Execution Engine 錯誤"
    );

    messages.push(
        "✓ Plan → Step Validation → Dispatch 正確"
    );

    const blocked =
        await engine.execute({
            plan: {
                planId:
                    "plan-blocked",

                steps: [
                    {
                        order:
                            1,

                        action:
                            "review"
                    }
                ]
            },

            context
        });

    assert(
        blocked.status ===
            ExecutionStatus.FAILED &&
        blocked.steps[0]
            .status ===
            ExecutionStatus.BLOCKED,
        "Blocked Execution 錯誤"
    );

    messages.push(
        "✓ Blocked Execution 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.execute({
            plan,
            context
        });

    assert(
        engine.state ===
            ExecutionState.PAUSED &&
        pausedResult ===
            null,
        "Execution Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            ExecutionState.IDLE &&
        engine.summary.paused ===
            false,
        "Execution Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new ExecutionRuntimeAdapter({
            execution:
                engine
        });

    const adapterResult =
        await adapter.execute({
            plan,
            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.execution
            .executionCount ===
            3,
        "Execution Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            ExecutionEvent.STARTED,
            ExecutionEvent.STEP_VALIDATED,
            ExecutionEvent.STEP_STARTED,
            ExecutionEvent.STEP_COMPLETED,
            ExecutionEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Execution Events 錯誤"
    );

    messages.push(
        "✓ Execution Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            ExecutionState.IDLE &&
        engine.summary.executionCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Execution Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            ExecutionState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.dispatcher
            .handlerCount === 0,
        "Execution Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Execution Engine V7.5 測試完成

Execution State：通過
Execution Context：通過
Execution Result：通過
Step Validator：通過
Action Dispatcher：通過
Execution Queue：通過
Execution History：通過
Execution Engine：通過
Blocked Execution：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
