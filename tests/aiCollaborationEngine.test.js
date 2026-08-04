/**
 * Baccarat Analyzer V7.6
 * tests/aiCollaborationEngine.test.js
 */

import CollaborationEngine, {
    COLLABORATION_ENGINE_VERSION,
    CollaborationEvent
} from "../casino/ai/collaboration/CollaborationEngine.js";

import {
    COLLABORATION_STATE_VERSION,
    CollaborationState,
    AgentStatus,
    MessageType
} from "../casino/ai/collaboration/CollaborationState.js";

import SharedContext, {
    SHARED_CONTEXT_VERSION
} from "../casino/ai/collaboration/SharedContext.js";

import AgentRegistry, {
    AGENT_REGISTRY_VERSION
} from "../casino/ai/collaboration/AgentRegistry.js";

import CollaborationMessage, {
    COLLABORATION_MESSAGE_VERSION
} from "../casino/ai/collaboration/CollaborationMessage.js";

import AgentMessageBus, {
    AGENT_MESSAGE_BUS_VERSION
} from "../casino/ai/collaboration/AgentMessageBus.js";

import TaskRouter, {
    TASK_ROUTER_VERSION
} from "../casino/ai/collaboration/TaskRouter.js";

import ConsensusEngine, {
    CONSENSUS_ENGINE_VERSION
} from "../casino/ai/collaboration/ConsensusEngine.js";

import CollaborationHistory, {
    COLLABORATION_HISTORY_VERSION
} from "../casino/ai/collaboration/CollaborationHistory.js";

import CollaborationRuntimeAdapter, {
    COLLABORATION_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/CollaborationRuntimeAdapter.js";

import {
    COLLABORATION_ENGINE_FACTORY_VERSION
} from "../casino/ai/collaboration/createCollaborationEngine.js";


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


export default async function aiCollaborationEngineTest() {
    const messages = [];

    assert(
        [
            COLLABORATION_ENGINE_VERSION,
            COLLABORATION_STATE_VERSION,
            SHARED_CONTEXT_VERSION,
            AGENT_REGISTRY_VERSION,
            COLLABORATION_MESSAGE_VERSION,
            AGENT_MESSAGE_BUS_VERSION,
            TASK_ROUTER_VERSION,
            CONSENSUS_ENGINE_VERSION,
            COLLABORATION_HISTORY_VERSION,
            COLLABORATION_RUNTIME_ADAPTER_VERSION,
            COLLABORATION_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "7.6.0"
        ),
        "V7.6 AI Collaboration Engine 版本錯誤"
    );

    messages.push(
        "✓ V7.6 AI Collaboration Engine 版本正確"
    );

    const context =
        new SharedContext({
            task: {
                capability:
                    "decision"
            },

            decision: {
                bestBet:
                    "Banker"
            },

            metadata: {
                roundId:
                    "round-1"
            }
        });

    assert(
        context.get(
            "decision"
        ).bestBet ===
            "Banker" &&
        context.metadata.roundId ===
            "round-1",
        "Shared Context 錯誤"
    );

    messages.push(
        "✓ Shared Context 正確"
    );

    const registry =
        new AgentRegistry();

    registry.register({
        agentId:
            "decision-agent",

        name:
            "Decision Agent",

        capabilities: [
            "decision"
        ],

        priority:
            100,

        handler:
            async () => ({
                value:
                    "Banker",

                confidence:
                    0.8
            })
    });

    registry.register({
        agentId:
            "reasoning-agent",

        name:
            "Reasoning Agent",

        capabilities: [
            "decision"
        ],

        priority:
            80,

        handler:
            async () => ({
                value:
                    "Banker",

                confidence:
                    0.7
            })
    });

    assert(
        registry.summary.count ===
            2 &&
        registry.findByCapability(
            "decision"
        )[0].agentId ===
            "decision-agent",
        "Agent Registry 錯誤"
    );

    messages.push(
        "✓ Agent Registry 正確"
    );

    const message =
        new CollaborationMessage({
            messageId:
                "message-1",

            type:
                MessageType.REQUEST,

            topic:
                "decision",

            payload: {
                roundId:
                    "round-1"
            }
        });

    assert(
        message.toJSON()
            .topic ===
            "decision",
        "Collaboration Message 錯誤"
    );

    messages.push(
        "✓ Collaboration Message 正確"
    );

    const bus =
        new AgentMessageBus();

    let received = null;

    bus.subscribe(
        "decision",
        current => {
            received =
                current;
        }
    );

    bus.publish(
        message
    );

    assert(
        received ===
            message &&
        bus.summary.messageCount ===
            1,
        "Agent Message Bus 錯誤"
    );

    messages.push(
        "✓ Agent Message Bus 正確"
    );

    const router =
        new TaskRouter();

    const route =
        router.route({
            task: {
                capability:
                    "decision"
            },

            registry
        });

    assert(
        route.candidates.length ===
            2 &&
        route.selected.agentId ===
            "decision-agent",
        "Task Router 錯誤"
    );

    messages.push(
        "✓ Task Router 正確"
    );

    const consensus =
        new ConsensusEngine();

    const consensusResult =
        consensus.resolve([
            {
                value:
                    "Banker",

                confidence:
                    0.8,

                weight:
                    1
            },
            {
                value:
                    "Banker",

                confidence:
                    0.7,

                weight:
                    1
            },
            {
                value:
                    "Player",

                confidence:
                    0.6,

                weight:
                    1
            }
        ]);

    assert(
        consensusResult
            .consensus
            .value ===
            "Banker",
        "Consensus Engine 錯誤"
    );

    messages.push(
        "✓ Consensus Engine 正確"
    );

    let now = 100;

    const events = [];

    const engine =
        new CollaborationEngine({
            registry,
            bus:
                new AgentMessageBus(),

            router,
            consensus,

            history:
                new CollaborationHistory({
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
            CollaborationState.IDLE,
        "Collaboration Engine initial state 錯誤"
    );

    const singleResult =
        await engine.collaborate({
            task: {
                type:
                    "decision",

                capability:
                    "decision"
            },

            context,

            requireConsensus:
                false
        });

    assert(
        singleResult.success ===
            true &&
        singleResult.output ===
            "Banker" &&
        singleResult.route
            .selectedAgentId ===
            "decision-agent" &&
        singleResult.responses
            .length === 1 &&
        engine.state ===
            CollaborationState.COMPLETED &&
        engine.summary.collaborationCount ===
            1,
        "Single Agent Collaboration 錯誤"
    );

    messages.push(
        "✓ Single Agent Collaboration 正確"
    );

    const multiResult =
        await engine.collaborate({
            task: {
                type:
                    "decision",

                capability:
                    "decision"
            },

            context,

            requireConsensus:
                true
        });

    assert(
        multiResult.success ===
            true &&
        multiResult.responses
            .length === 2 &&
        multiResult.consensus
            .consensus
            .value ===
            "Banker" &&
        engine.summary.collaborationCount ===
            2 &&
        engine.summary.history
            .count === 2,
        "Multi-Agent Consensus 錯誤"
    );

    messages.push(
        "✓ Multi-Agent Consensus 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.collaborate({
            task: {
                capability:
                    "decision"
            }
        });

    assert(
        engine.state ===
            CollaborationState.PAUSED &&
        pausedResult ===
            null,
        "Collaboration Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            CollaborationState.IDLE &&
        engine.summary.paused ===
            false,
        "Collaboration Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new CollaborationRuntimeAdapter({
            collaboration:
                engine
        });

    const adapterResult =
        await adapter.collaborate({
            task: {
                capability:
                    "decision"
            },

            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.collaboration
            .collaborationCount ===
            3,
        "Collaboration Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            CollaborationEvent.STARTED,
            CollaborationEvent.TASK_ROUTED,
            CollaborationEvent.AGENT_STARTED,
            CollaborationEvent.AGENT_COMPLETED,
            CollaborationEvent.CONSENSUS_COMPLETED,
            CollaborationEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Collaboration Events 錯誤"
    );

    messages.push(
        "✓ Collaboration Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            CollaborationState.IDLE &&
        engine.summary.collaborationCount ===
            0 &&
        engine.summary.history
            .count === 0 &&
        registry.get(
            "decision-agent"
        ).status ===
            AgentStatus.READY,
        "Collaboration Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            CollaborationState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.registry
            .count === 0,
        "Collaboration Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Collaboration Engine V7.6 測試完成

Collaboration State：通過
Shared Context：通過
Agent Registry：通過
Collaboration Message：通過
Agent Message Bus：通過
Task Router：通過
Consensus Engine：通過
Single Agent Collaboration：通過
Multi-Agent Consensus：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
