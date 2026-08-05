/**
 * Baccarat Analyzer V8.8
 * tests/aiMetaIntelligenceEngine.test.js
 */

import MetaIntelligenceEngine, {
    META_INTELLIGENCE_ENGINE_VERSION,
    MetaIntelligenceEvent
} from "../casino/ai/meta/MetaIntelligenceEngine.js";

import {
    META_INTELLIGENCE_STATE_VERSION,
    MetaIntelligenceState,
    MetaDecision
} from "../casino/ai/meta/MetaIntelligenceState.js";

import MetaIntelligenceContext, {
    META_INTELLIGENCE_CONTEXT_VERSION
} from "../casino/ai/meta/MetaIntelligenceContext.js";

import CapabilityRegistry, {
    CAPABILITY_REGISTRY_VERSION
} from "../casino/ai/meta/CapabilityRegistry.js";

import CapabilityAssessor, {
    CAPABILITY_ASSESSOR_VERSION
} from "../casino/ai/meta/CapabilityAssessor.js";

import StrategyArbitrator, {
    STRATEGY_ARBITRATOR_VERSION
} from "../casino/ai/meta/StrategyArbitrator.js";

import CrossEngineConflictResolver, {
    CROSS_ENGINE_CONFLICT_RESOLVER_VERSION
} from "../casino/ai/meta/CrossEngineConflictResolver.js";

import MetaSynthesisEngine, {
    META_SYNTHESIS_ENGINE_VERSION
} from "../casino/ai/meta/MetaSynthesisEngine.js";

import MetaIntelligenceHistory, {
    META_INTELLIGENCE_HISTORY_VERSION
} from "../casino/ai/meta/MetaIntelligenceHistory.js";

import MetaIntelligenceRuntimeAdapter, {
    META_INTELLIGENCE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/MetaIntelligenceRuntimeAdapter.js";

import {
    META_INTELLIGENCE_ENGINE_FACTORY_VERSION
} from "../casino/ai/meta/createMetaIntelligenceEngine.js";


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


export default async function aiMetaIntelligenceEngineTest() {
    const messages = [];

    assert(
        [
            META_INTELLIGENCE_ENGINE_VERSION,
            META_INTELLIGENCE_STATE_VERSION,
            META_INTELLIGENCE_CONTEXT_VERSION,
            CAPABILITY_REGISTRY_VERSION,
            CAPABILITY_ASSESSOR_VERSION,
            STRATEGY_ARBITRATOR_VERSION,
            CROSS_ENGINE_CONFLICT_RESOLVER_VERSION,
            META_SYNTHESIS_ENGINE_VERSION,
            META_INTELLIGENCE_HISTORY_VERSION,
            META_INTELLIGENCE_RUNTIME_ADAPTER_VERSION,
            META_INTELLIGENCE_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.8.0"
        ),
        "V8.8 AI Meta Intelligence Engine 版本錯誤"
    );

    assert(
        MetaDecision.PROCEED ===
            "proceed",
        "Meta Decision 錯誤"
    );

    messages.push(
        "✓ V8.8 AI Meta Intelligence Engine 版本正確"
    );

    const context =
        new MetaIntelligenceContext({
            decision: {
                confidence:
                    0.85
            },
            assurance: {
                score:
                    92
            },
            alignment: {
                aligned:
                    true
            },
            ethics: {
                ethical:
                    true
            },
            safety: {
                safe:
                    true
            }
        });

    assert(
        context.decision.confidence ===
            0.85 &&
        context.safety.safe ===
            true,
        "Meta Intelligence Context 錯誤"
    );

    messages.push(
        "✓ Meta Intelligence Context 正確"
    );

    const registry =
        new CapabilityRegistry();

    registry.register({
        capabilityId:
            "decision",
        weight:
            2,
        assess:
            ({ context }) => ({
                score:
                    context.decision
                        .confidence *
                    100,
                healthy:
                    true,
                confidence:
                    0.9
            })
    });

    registry.register({
        capabilityId:
            "assurance",
        weight:
            1,
        assess:
            ({ context }) => ({
                score:
                    context.assurance
                        .score,
                healthy:
                    context.assurance
                        .score >= 80,
                confidence:
                    1
            })
    });

    assert(
        registry.summary.count ===
            2,
        "Capability Registry 錯誤"
    );

    messages.push(
        "✓ Capability Registry 正確"
    );

    const capabilityResults =
        await new CapabilityAssessor()
            .assess({
                capabilities:
                    registry.all(),
                context
            });

    assert(
        capabilityResults.length ===
            2 &&
        capabilityResults.every(
            result =>
                result.healthy
        ),
        "Capability Assessor 錯誤"
    );

    messages.push(
        "✓ Capability Assessor 正確"
    );

    const strategySelection =
        new StrategyArbitrator()
            .select([
                {
                    strategyId:
                        "banker",
                    score:
                        80,
                    confidence:
                        0.9,
                    weight:
                        1
                },
                {
                    strategyId:
                        "player",
                    score:
                        70,
                    confidence:
                        0.8,
                    weight:
                        1
                }
            ]);

    assert(
        strategySelection.selected
            .strategyId ===
            "banker",
        "Strategy Arbitrator 錯誤"
    );

    messages.push(
        "✓ Strategy Arbitrator 正確"
    );

    const resolution =
        new CrossEngineConflictResolver()
            .resolve({
                context,
                capabilityResults,
                strategySelection
            });

    assert(
        resolution.hasConflict ===
            false,
        "Cross-Engine Conflict Resolver 錯誤"
    );

    messages.push(
        "✓ Cross-Engine Conflict Resolver 正確"
    );

    const synthesis =
        new MetaSynthesisEngine()
            .synthesize({
                capabilityResults,
                strategySelection,
                resolution
            });

    assert(
        synthesis.decision ===
            MetaDecision.PROCEED &&
        synthesis.proceed ===
            true,
        "Meta Synthesis Engine 錯誤"
    );

    messages.push(
        "✓ Meta Synthesis Engine 正確"
    );

    let now = 100;
    const events = [];

    const engine =
        new MetaIntelligenceEngine({
            capabilities:
                registry,
            history:
                new MetaIntelligenceHistory({
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
            MetaIntelligenceState.IDLE,
        "Meta Intelligence Engine initial state 錯誤"
    );

    const result =
        await engine.analyze({
            context,
            strategies: [
                {
                    strategyId:
                        "banker",
                    score:
                        80,
                    confidence:
                        0.9,
                    weight:
                        1
                },
                {
                    strategyId:
                        "player",
                    score:
                        70,
                    confidence:
                        0.8,
                    weight:
                        1
                }
            ]
        });

    assert(
        result.proceed ===
            true &&
        result.decision ===
            MetaDecision.PROCEED &&
        result.strategySelection
            .selected
            .strategyId ===
            "banker" &&
        engine.state ===
            MetaIntelligenceState.COMPLETED &&
        engine.summary.analysisCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Meta Intelligence Engine 錯誤"
    );

    messages.push(
        "✓ Observe → Assess → Coordinate → Synthesize 正確"
    );

    const unsafeContext =
        new MetaIntelligenceContext({
            decision: {
                confidence:
                    0.9
            },
            assurance: {
                score:
                    90
            },
            alignment: {
                aligned:
                    true
            },
            ethics: {
                ethical:
                    true
            },
            safety: {
                safe:
                    false
            }
        });

    const halted =
        await engine.analyze({
            context:
                unsafeContext,
            strategies: [
                {
                    strategyId:
                        "unsafe",
                    score:
                        99,
                    confidence:
                        1
                }
            ]
        });

    assert(
        halted.decision ===
            MetaDecision.HALT &&
        halted.proceed ===
            false &&
        halted.resolution
            .hasConflict ===
            true,
        "Meta Halt Decision 錯誤"
    );

    messages.push(
        "✓ Cross-Engine Halt Decision 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.analyze({
            context
        });

    assert(
        engine.state ===
            MetaIntelligenceState.PAUSED &&
        pausedResult ===
            null,
        "Meta Intelligence Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            MetaIntelligenceState.IDLE &&
        engine.summary.paused ===
            false,
        "Meta Intelligence Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new MetaIntelligenceRuntimeAdapter({
            metaIntelligence:
                engine
        });

    const adapterResult =
        await adapter.analyze({
            context,
            strategies: [
                {
                    strategyId:
                        "adapter",
                    score:
                        85,
                    confidence:
                        0.9
                }
            ]
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary
            .metaIntelligence
            .analysisCount ===
            3,
        "Meta Intelligence Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            MetaIntelligenceEvent.STARTED,
            MetaIntelligenceEvent.CAPABILITIES_LOADED,
            MetaIntelligenceEvent.CAPABILITIES_ASSESSED,
            MetaIntelligenceEvent.STRATEGY_SELECTED,
            MetaIntelligenceEvent.CONFLICTS_RESOLVED,
            MetaIntelligenceEvent.SYNTHESIS_COMPLETED,
            MetaIntelligenceEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Meta Intelligence Events 錯誤"
    );

    messages.push(
        "✓ Meta Intelligence Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            MetaIntelligenceState.IDLE &&
        engine.summary.analysisCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Meta Intelligence Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            MetaIntelligenceState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.capabilities
            .count === 0,
        "Meta Intelligence Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Meta Intelligence Engine V8.8 測試完成

Meta Intelligence State：通過
Meta Intelligence Context：通過
Capability Registry：通過
Capability Assessor：通過
Strategy Arbitrator：通過
Cross-Engine Conflict Resolver：通過
Meta Synthesis Engine：通過
Meta Intelligence Engine：通過
Cross-Engine Halt Decision：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
