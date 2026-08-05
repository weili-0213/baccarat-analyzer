/**
 * Baccarat Analyzer V9.0
 * tests/aiOperatingSystem.test.js
 */
import AIOperatingSystem, {
    AI_OPERATING_SYSTEM_VERSION,
    AIOperatingEvent
} from "../casino/ai/os/AIOperatingSystem.js";

import {
    AI_OPERATING_STATE_VERSION,
    AIOperatingState,
    AIOperatingDecision
} from "../casino/ai/os/AIOperatingState.js";

import AIOperatingContext, {
    AI_OPERATING_CONTEXT_VERSION
} from "../casino/ai/os/AIOperatingContext.js";

import EngineRegistry, {
    ENGINE_REGISTRY_VERSION
} from "../casino/ai/os/EngineRegistry.js";

import RuntimeFacade, {
    RUNTIME_FACADE_VERSION
} from "../casino/ai/os/RuntimeFacade.js";

import PipelineCoordinator, {
    PIPELINE_COORDINATOR_VERSION
} from "../casino/ai/os/PipelineCoordinator.js";

import SystemHealthMonitor, {
    SYSTEM_HEALTH_MONITOR_VERSION
} from "../casino/ai/os/SystemHealthMonitor.js";

import GlobalStateStore, {
    GLOBAL_STATE_STORE_VERSION
} from "../casino/ai/os/GlobalStateStore.js";

import UIBridge, {
    UI_BRIDGE_VERSION
} from "../casino/ai/os/UIBridge.js";

import AIOperatingHistory, {
    AI_OPERATING_HISTORY_VERSION
} from "../casino/ai/os/AIOperatingHistory.js";

import AIOperatingRuntimeAdapter, {
    AI_OPERATING_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AIOperatingRuntimeAdapter.js";

import {
    AI_OPERATING_SYSTEM_FACTORY_VERSION
} from "../casino/ai/os/createAIOperatingSystem.js";


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


export default async function aiOperatingSystemTest() {
    const messages = [];

    assert(
        [
            AI_OPERATING_SYSTEM_VERSION,
            AI_OPERATING_STATE_VERSION,
            AI_OPERATING_CONTEXT_VERSION,
            ENGINE_REGISTRY_VERSION,
            RUNTIME_FACADE_VERSION,
            PIPELINE_COORDINATOR_VERSION,
            SYSTEM_HEALTH_MONITOR_VERSION,
            GLOBAL_STATE_STORE_VERSION,
            UI_BRIDGE_VERSION,
            AI_OPERATING_HISTORY_VERSION,
            AI_OPERATING_RUNTIME_ADAPTER_VERSION,
            AI_OPERATING_SYSTEM_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "9.0.0"
        ),
        "V9.0 AI Operating System 版本錯誤"
    );

    assert(
        AIOperatingDecision.PROCEED ===
            "proceed",
        "AI Operating Decision 錯誤"
    );

    messages.push(
        "✓ V9.0 AI Operating System 版本正確"
    );

    const context =
        new AIOperatingContext({
            round: {
                roundId:
                    "r1"
            },
            bankroll: {
                balance:
                    1000
            },
            globalState: {
                mode:
                    "live"
            }
        });

    assert(
        context.round.roundId ===
            "r1" &&
        context.bankroll.balance ===
            1000,
        "AI Operating Context 錯誤"
    );

    messages.push(
        "✓ AI Operating Context 正確"
    );

    const registry =
        new EngineRegistry();

    const decisionEngine = {
        async analyze(input) {
            return {
                success:
                    true,
                bestBet:
                    "Banker",
                input
            };
        },
        summary: {
            destroyed:
                false
        }
    };

    const safetyEngine = {
        async check() {
            return {
                success:
                    true,
                safe:
                    true
            };
        },
        summary: {
            destroyed:
                false
        }
    };

    registry.register({
        engineId:
            "decision",
        engine:
            decisionEngine,
        required:
            true,
        order:
            1
    });

    registry.register({
        engineId:
            "safety",
        engine:
            safetyEngine,
        required:
            true,
        order:
            2
    });

    assert(
        registry.summary.count ===
            2,
        "Engine Registry 錯誤"
    );

    messages.push(
        "✓ Engine Registry 正確"
    );

    const facade =
        new RuntimeFacade({
            registry
        });

    const facadeResult =
        await facade.invoke(
            "decision",
            "analyze",
            {
                sample:
                    true
            }
        );

    assert(
        facadeResult.bestBet ===
            "Banker",
        "Runtime Facade 錯誤"
    );

    messages.push(
        "✓ Runtime Facade 正確"
    );

    const pipeline =
        new PipelineCoordinator({
            facade
        });

    const pipelineResult =
        await pipeline.run({
            context,
            steps: [
                {
                    engineId:
                        "decision",
                    method:
                        "analyze",
                    outputKey:
                        "decision"
                },
                {
                    engineId:
                        "safety",
                    method:
                        "check",
                    outputKey:
                        "safety"
                }
            ]
        });

    assert(
        pipelineResult.timeline
            .length === 2 &&
        pipelineResult.outputs
            .safety.safe === true,
        "Pipeline Coordinator 錯誤"
    );

    messages.push(
        "✓ Pipeline Coordinator 正確"
    );

    const health =
        new SystemHealthMonitor()
            .check(
                registry
            );

    assert(
        health.healthy ===
            true &&
        health.missingRequired
            .length === 0,
        "System Health Monitor 錯誤"
    );

    messages.push(
        "✓ System Health Monitor 正確"
    );

    const stateStore =
        new GlobalStateStore({
            mode:
                "test"
        });

    stateStore.update({
        ready:
            true
    });

    assert(
        stateStore.snapshot()
            .revision === 1 &&
        stateStore.snapshot()
            .state.ready === true,
        "Global State Store 錯誤"
    );

    messages.push(
        "✓ Global State Store 正確"
    );

    let now = 100;
    const events = [];

    const operatingSystem =
        new AIOperatingSystem({
            registry,
            facade,
            pipeline,
            globalState:
                new GlobalStateStore(),
            history:
                new AIOperatingHistory({
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

    const bootResult =
        operatingSystem.boot();

    assert(
        bootResult.health
            .healthy === true &&
        operatingSystem.state ===
            AIOperatingState.READY &&
        operatingSystem.summary
            .booted === true,
        "AI Operating System Boot 錯誤"
    );

    messages.push(
        "✓ AI Operating System Boot 正確"
    );

    const result =
        await operatingSystem.process({
            context,
            steps: [
                {
                    engineId:
                        "decision",
                    method:
                        "analyze",
                    outputKey:
                        "decision"
                },
                {
                    engineId:
                        "safety",
                    method:
                        "check",
                    outputKey:
                        "safety"
                }
            ]
        });

    assert(
        result.decision ===
            AIOperatingDecision.PROCEED &&
        result.proceed === true &&
        result.pipeline.timeline
            .length === 2 &&
        operatingSystem.state ===
            AIOperatingState.READY &&
        operatingSystem.summary
            .processCount === 1 &&
        operatingSystem.summary
            .history.count === 1,
        "AI Operating System Process 錯誤"
    );

    messages.push(
        "✓ Boot → Process → Synchronize 正確"
    );

    const bridge =
        new UIBridge({
            operatingSystem
        });

    const bridgeResult =
        await bridge.analyze({
            context,
            steps: [
                {
                    engineId:
                        "decision",
                    method:
                        "analyze",
                    outputKey:
                        "decision"
                },
                {
                    engineId:
                        "safety",
                    method:
                        "check",
                    outputKey:
                        "safety"
                }
            ]
        });

    assert(
        bridgeResult.proceed === true &&
        bridge.getStatus()
            .processCount === 2 &&
        bridge.getGlobalState()
            .revision > 0,
        "UI Bridge 錯誤"
    );

    messages.push(
        "✓ UI Bridge 正確"
    );

    operatingSystem.pause();

    const pausedResult =
        await operatingSystem.process({
            context
        });

    assert(
        operatingSystem.state ===
            AIOperatingState.PAUSED &&
        pausedResult === null,
        "AI Operating Pause 錯誤"
    );

    operatingSystem.resume();

    assert(
        operatingSystem.state ===
            AIOperatingState.READY &&
        operatingSystem.summary
            .paused === false,
        "AI Operating Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new AIOperatingRuntimeAdapter({
            operatingSystem
        });

    const adapterResult =
        await adapter.process({
            context,
            steps: [
                {
                    engineId:
                        "decision",
                    method:
                        "analyze",
                    outputKey:
                        "decision"
                },
                {
                    engineId:
                        "safety",
                    method:
                        "check",
                    outputKey:
                        "safety"
                }
            ]
        });

    assert(
        adapterResult !== null &&
        adapter.summary
            .operatingSystem
            .processCount === 3,
        "AI Operating Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            AIOperatingEvent.BOOT_STARTED,
            AIOperatingEvent.BOOT_COMPLETED,
            AIOperatingEvent.PROCESS_STARTED,
            AIOperatingEvent.PIPELINE_COMPLETED,
            AIOperatingEvent.STATE_SYNCHRONIZED,
            AIOperatingEvent.PROCESS_COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "AI Operating Events 錯誤"
    );

    messages.push(
        "✓ AI Operating Events 正確"
    );

    operatingSystem.reset();

    assert(
        operatingSystem.state ===
            AIOperatingState.IDLE &&
        operatingSystem.summary
            .processCount === 0 &&
        operatingSystem.summary
            .history.count === 0,
        "AI Operating Reset 錯誤"
    );

    operatingSystem.boot();
    operatingSystem.shutdown();

    assert(
        operatingSystem.state ===
            AIOperatingState.SHUTDOWN &&
        operatingSystem.summary
            .booted === false,
        "AI Operating Shutdown 錯誤"
    );

    operatingSystem.destroy();

    assert(
        operatingSystem.state ===
            AIOperatingState.DESTROYED &&
        operatingSystem.summary
            .destroyed === true &&
        operatingSystem.summary
            .registry.count === 0,
        "AI Operating Destroy 錯誤"
    );

    messages.push(
        "✓ Shutdown、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Operating System V9.0 測試完成

AI Operating State：通過
AI Operating Context：通過
Engine Registry：通過
Runtime Facade：通過
Pipeline Coordinator：通過
System Health Monitor：通過
Global State Store：通過
AI Operating System Boot：通過
AI Operating System Process：通過
UI Bridge：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
