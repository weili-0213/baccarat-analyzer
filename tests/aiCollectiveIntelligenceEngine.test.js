/**
 * Baccarat Analyzer V8.3
 * tests/aiCollectiveIntelligenceEngine.test.js
 */

import CollectiveIntelligenceEngine, {
    COLLECTIVE_INTELLIGENCE_ENGINE_VERSION,
    CollectiveEvent
} from "../casino/ai/collective/CollectiveIntelligenceEngine.js";

import {
    COLLECTIVE_STATE_VERSION,
    CollectiveState,
    CollectiveRole
} from "../casino/ai/collective/CollectiveState.js";

import CollectiveContext, {
    COLLECTIVE_CONTEXT_VERSION
} from "../casino/ai/collective/CollectiveContext.js";

import CollectiveAgent, {
    COLLECTIVE_AGENT_VERSION
} from "../casino/ai/collective/CollectiveAgent.js";

import CollectiveRegistry, {
    COLLECTIVE_REGISTRY_VERSION
} from "../casino/ai/collective/CollectiveRegistry.js";

import ContributionCollector, {
    CONTRIBUTION_COLLECTOR_VERSION
} from "../casino/ai/collective/ContributionCollector.js";

import DeliberationEngine, {
    DELIBERATION_ENGINE_VERSION
} from "../casino/ai/collective/DeliberationEngine.js";

import ConflictMediator, {
    CONFLICT_MEDIATOR_VERSION
} from "../casino/ai/collective/ConflictMediator.js";

import CollectiveSynthesizer, {
    COLLECTIVE_SYNTHESIZER_VERSION
} from "../casino/ai/collective/CollectiveSynthesizer.js";

import CollectiveHistory, {
    COLLECTIVE_HISTORY_VERSION
} from "../casino/ai/collective/CollectiveHistory.js";

import CollectiveRuntimeAdapter, {
    COLLECTIVE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/CollectiveRuntimeAdapter.js";

import {
    COLLECTIVE_INTELLIGENCE_ENGINE_FACTORY_VERSION
} from "../casino/ai/collective/createCollectiveIntelligenceEngine.js";


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


export default async function aiCollectiveIntelligenceEngineTest() {
    const messages = [];

    assert(
        [
            COLLECTIVE_INTELLIGENCE_ENGINE_VERSION,
            COLLECTIVE_STATE_VERSION,
            COLLECTIVE_CONTEXT_VERSION,
            COLLECTIVE_AGENT_VERSION,
            COLLECTIVE_REGISTRY_VERSION,
            CONTRIBUTION_COLLECTOR_VERSION,
            DELIBERATION_ENGINE_VERSION,
            CONFLICT_MEDIATOR_VERSION,
            COLLECTIVE_SYNTHESIZER_VERSION,
            COLLECTIVE_HISTORY_VERSION,
            COLLECTIVE_RUNTIME_ADAPTER_VERSION,
            COLLECTIVE_INTELLIGENCE_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.3.0"
        ),
        "V8.3 AI Collective Intelligence System 版本錯誤"
    );

    assert(
        CollectiveRole.CRITIC ===
            "critic",
        "Collective Role 錯誤"
    );

    messages.push(
        "✓ V8.3 AI Collective Intelligence System 版本正確"
    );

    const context =
        new CollectiveContext({
            task: {
                type:
                    "bet-decision"
            },
            assurance: {
                score:
                    92
            },
            evolution: {
                generation:
                    3
            }
        });

    assert(
        context.assurance.score ===
            92 &&
        context.evolution.generation ===
            3,
        "Collective Context 錯誤"
    );

    messages.push(
        "✓ Collective Context 正確"
    );

    const analyst =
        new CollectiveAgent({
            agentId:
                "analyst",
            role:
                CollectiveRole.ANALYST,
            expertise: [
                "decision"
            ],
            weight:
                1,
            deliberate:
                async () => ({
                    opinion:
                        "Banker",
                    confidence:
                        0.8,
                    evidence: [
                        "EV"
                    ]
                })
        });

    const critic =
        new CollectiveAgent({
            agentId:
                "critic",
            role:
                CollectiveRole.CRITIC,
            expertise: [
                "decision"
            ],
            weight:
                0.8,
            deliberate:
                async () => ({
                    opinion:
                        "Player",
                    confidence:
                        0.6,
                    evidence: [
                        "Risk"
                    ]
                })
        });

    const strategist =
        new CollectiveAgent({
            agentId:
                "strategist",
            role:
                CollectiveRole.STRATEGIST,
            expertise: [
                "decision"
            ],
            weight:
                1.2,
            deliberate:
                async () => ({
                    opinion:
                        "Banker",
                    confidence:
                        0.9,
                    evidence: [
                        "Trend"
                    ]
                })
        });

    const registry =
        new CollectiveRegistry();

    registry.register(
        analyst
    );

    registry.register(
        critic
    );

    registry.register(
        strategist
    );

    assert(
        registry.summary.count ===
            3 &&
        registry.findByExpertise(
            "decision"
        )[0].agentId ===
            "strategist",
        "Collective Registry 錯誤"
    );

    messages.push(
        "✓ Collective Registry 正確"
    );

    const contributions =
        await new ContributionCollector()
            .collect({
                agents:
                    registry.all(),
                task: {
                    type:
                        "bet-decision"
                },
                context
            });

    assert(
        contributions.length ===
            3 &&
        contributions[0]
            .opinion !==
            null,
        "Contribution Collector 錯誤"
    );

    messages.push(
        "✓ Contribution Collector 正確"
    );

    const deliberation =
        new DeliberationEngine()
            .deliberate(
                contributions
            );

    assert(
        deliberation.leading
            .opinion ===
            "Banker",
        "Deliberation Engine 錯誤"
    );

    messages.push(
        "✓ Deliberation Engine 正確"
    );

    const mediation =
        new ConflictMediator()
            .mediate(
                deliberation
            );

    assert(
        mediation.recommended
            .opinion ===
            "Banker",
        "Conflict Mediator 錯誤"
    );

    messages.push(
        "✓ Conflict Mediator 正確"
    );

    const synthesis =
        new CollectiveSynthesizer()
            .synthesize({
                task: {
                    type:
                        "bet-decision"
                },
                contributions,
                deliberation,
                mediation
            });

    assert(
        synthesis.decision ===
            "Banker" &&
        synthesis.supporters
            .length === 2,
        "Collective Synthesizer 錯誤"
    );

    messages.push(
        "✓ Collective Synthesizer 正確"
    );

    let now = 100;
    const events = [];

    const engine =
        new CollectiveIntelligenceEngine({
            registry,
            history:
                new CollectiveHistory({
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
            CollectiveState.IDLE,
        "Collective Intelligence Engine initial state 錯誤"
    );

    const result =
        await engine.decide({
            task: {
                type:
                    "bet-decision"
            },
            context,
            expertise:
                "decision"
        });

    assert(
        result.synthesis
            .decision ===
            "Banker" &&
        result.agentCount ===
            3 &&
        result.contributions
            .length === 3 &&
        engine.state ===
            CollectiveState.COMPLETED &&
        engine.summary.collectiveCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Collective Intelligence Engine 錯誤"
    );

    messages.push(
        "✓ Discover → Gather → Deliberate → Synthesize 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.decide({
            task: {
                type:
                    "paused"
            }
        });

    assert(
        engine.state ===
            CollectiveState.PAUSED &&
        pausedResult ===
            null,
        "Collective Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            CollectiveState.IDLE &&
        engine.summary.paused ===
            false,
        "Collective Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new CollectiveRuntimeAdapter({
            collective:
                engine
        });

    const adapterResult =
        await adapter.decide({
            task: {
                type:
                    "adapter-decision"
            },
            context,
            expertise:
                "decision"
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.collective
            .collectiveCount ===
            2,
        "Collective Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            CollectiveEvent.STARTED,
            CollectiveEvent.AGENTS_DISCOVERED,
            CollectiveEvent.CONTRIBUTION_COLLECTED,
            CollectiveEvent.DELIBERATION_COMPLETED,
            CollectiveEvent.CONFLICT_MEDIATED,
            CollectiveEvent.SYNTHESIS_COMPLETED,
            CollectiveEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Collective Events 錯誤"
    );

    messages.push(
        "✓ Collective Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            CollectiveState.IDLE &&
        engine.summary.collectiveCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Collective Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            CollectiveState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.registry
            .count === 0,
        "Collective Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Collective Intelligence System V8.3 測試完成

Collective State：通過
Collective Context：通過
Collective Agent：通過
Collective Registry：通過
Contribution Collector：通過
Deliberation Engine：通過
Conflict Mediator：通過
Collective Synthesizer：通過
Collective Intelligence Engine：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
