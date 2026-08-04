/**
 * Baccarat Analyzer V7.3
 * tests/aiReasoningEngine.test.js
 */
import ReasoningEngine, {
    REASONING_ENGINE_VERSION,
    ReasoningEvent
} from "../casino/ai/reasoning/ReasoningEngine.js";
import {
    REASONING_STATE_VERSION,
    ReasoningState,
    ReasoningVerdict
} from "../casino/ai/reasoning/ReasoningState.js";
import ReasoningContext, {
    REASONING_CONTEXT_VERSION
} from "../casino/ai/reasoning/ReasoningContext.js";
import ReasoningChain, {
    REASONING_CHAIN_VERSION
} from "../casino/ai/reasoning/ReasoningChain.js";
import HypothesisBuilder, {
    HYPOTHESIS_BUILDER_VERSION
} from "../casino/ai/reasoning/HypothesisBuilder.js";
import EvidenceCollector, {
    EVIDENCE_COLLECTOR_VERSION
} from "../casino/ai/reasoning/EvidenceCollector.js";
import ConflictResolver, {
    CONFLICT_RESOLVER_VERSION
} from "../casino/ai/reasoning/ConflictResolver.js";
import ExplanationBuilder, {
    EXPLANATION_BUILDER_VERSION
} from "../casino/ai/reasoning/ExplanationBuilder.js";
import ReasoningHistory, {
    REASONING_HISTORY_VERSION
} from "../casino/ai/reasoning/ReasoningHistory.js";
import ReasoningRuntimeAdapter, {
    REASONING_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/ReasoningRuntimeAdapter.js";
import {
    REASONING_ENGINE_FACTORY_VERSION
} from "../casino/ai/reasoning/createReasoningEngine.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

export default async function aiReasoningEngineTest() {
    const messages = [];

    assert(
        [
            REASONING_ENGINE_VERSION,
            REASONING_STATE_VERSION,
            REASONING_CONTEXT_VERSION,
            REASONING_CHAIN_VERSION,
            HYPOTHESIS_BUILDER_VERSION,
            EVIDENCE_COLLECTOR_VERSION,
            CONFLICT_RESOLVER_VERSION,
            EXPLANATION_BUILDER_VERSION,
            REASONING_HISTORY_VERSION,
            REASONING_RUNTIME_ADAPTER_VERSION,
            REASONING_ENGINE_FACTORY_VERSION
        ].every(version => version === "7.3.0"),
        "V7.3 AI Reasoning Engine 版本錯誤"
    );
    messages.push("✓ V7.3 AI Reasoning Engine 版本正確");

    const context = new ReasoningContext({
        query: "Should bet Banker?",
        decision: {
            bestBet: "Banker",
            confidence: 0.8,
            patterns: [
                {
                    type: "streak",
                    side: "Banker",
                    strength: 0.7
                }
            ],
            trend: {
                trend: "Banker",
                confidence: 0.75
            }
        },
        analysis: {
            recommendation: {
                bestBet: "Banker",
                confidence: 0.8
            },
            ranking: [
                {
                    bet: "Banker",
                    ev: 0.02,
                    score: 0.9
                }
            ]
        }
    });

    assert(
        context.query === "Should bet Banker?" &&
        context.decision.bestBet === "Banker",
        "Reasoning Context 錯誤"
    );
    messages.push("✓ Reasoning Context 正確");

    const chain = new ReasoningChain();
    chain.add({
        type: "test",
        message: "step"
    });
    assert(
        chain.summary.count === 1 &&
        chain.latest().message === "step",
        "Reasoning Chain 錯誤"
    );
    messages.push("✓ Reasoning Chain 正確");

    const hypothesisBuilder = new HypothesisBuilder();
    const hypotheses = hypothesisBuilder.build({ context });
    assert(
        hypotheses.length >= 1 &&
        hypotheses[0].candidate === "Banker",
        "Hypothesis Builder 錯誤"
    );
    messages.push("✓ Hypothesis Builder 正確");

    const evidenceCollector = new EvidenceCollector();
    const evidence = evidenceCollector.collect({
        context,
        hypotheses
    });
    assert(
        evidence.length >= 2 &&
        evidence.some(item => item.type === "analysis"),
        "Evidence Collector 錯誤"
    );
    messages.push("✓ Evidence Collector 正確");

    const conflictResolver = new ConflictResolver();
    const resolution = conflictResolver.resolve({
        hypotheses,
        evidence
    });
    assert(
        resolution.best !== null &&
        resolution.best.candidate === "Banker" &&
        resolution.best.verdict === ReasoningVerdict.SUPPORT,
        "Conflict Resolver 錯誤"
    );
    messages.push("✓ Conflict Resolver 正確");

    const explanationBuilder = new ExplanationBuilder();
    const explanation = explanationBuilder.build({
        resolution,
        hypotheses,
        evidence
    });
    assert(
        explanation.candidate === "Banker" &&
        explanation.confidence > 0 &&
        explanation.summary.includes("Banker"),
        "Explanation Builder 錯誤"
    );
    messages.push("✓ Explanation Builder 正確");

    let now = 100;
    const events = [];

    const engine = new ReasoningEngine({
        hypothesisBuilder,
        evidenceCollector,
        conflictResolver,
        explanationBuilder,
        history: new ReasoningHistory({ limit: 20 }),
        eventBus: {
            emit(type, payload) {
                events.push({ type, payload });
            }
        },
        clock: () => now++
    });

    assert(
        engine.state === ReasoningState.IDLE,
        "Reasoning Engine initial state 錯誤"
    );

    const result = await engine.reason({
        context,
        knowledgeResult: {
            candidates: [
                {
                    value: "Banker",
                    confidence: 0.8,
                    weight: 1
                }
            ],
            best: {
                value: "Banker",
                score: 0.8
            }
        }
    });

    assert(
        result.reasoningId !== null &&
        result.hypotheses.length >= 2 &&
        result.evidence.length >= 3 &&
        result.resolution.best !== null &&
        result.explanation.candidate === "Banker" &&
        result.chain.count === 4 &&
        engine.state === ReasoningState.COMPLETED &&
        engine.summary.reasoningCount === 1 &&
        engine.summary.history.count === 1,
        "Reasoning Engine 錯誤"
    );
    messages.push("✓ Multi-step Reasoning 正確");

    engine.pause();
    const pausedResult = await engine.reason({ context });
    assert(
        engine.state === ReasoningState.PAUSED &&
        pausedResult === null,
        "Reasoning Pause 錯誤"
    );

    engine.resume();
    assert(
        engine.state === ReasoningState.IDLE &&
        engine.summary.paused === false,
        "Reasoning Resume 錯誤"
    );
    messages.push("✓ Pause／Resume 正確");

    const adapter = new ReasoningRuntimeAdapter({
        reasoning: engine
    });
    const adapterResult = await adapter.reason({ context });
    assert(
        adapterResult !== null &&
        adapter.summary.reasoning.reasoningCount === 2,
        "Reasoning Runtime Adapter 錯誤"
    );
    messages.push("✓ Runtime Adapter 正確");

    assert(
        [
            ReasoningEvent.STARTED,
            ReasoningEvent.HYPOTHESES_BUILT,
            ReasoningEvent.EVIDENCE_COLLECTED,
            ReasoningEvent.CONFLICTS_RESOLVED,
            ReasoningEvent.EXPLANATION_BUILT,
            ReasoningEvent.COMPLETED
        ].every(type => events.some(event => event.type === type)),
        "Reasoning Events 錯誤"
    );
    messages.push("✓ Reasoning Events 正確");

    engine.reset();
    assert(
        engine.state === ReasoningState.IDLE &&
        engine.summary.reasoningCount === 0 &&
        engine.summary.history.count === 0,
        "Reasoning Reset 錯誤"
    );

    engine.destroy();
    assert(
        engine.state === ReasoningState.DESTROYED &&
        engine.summary.destroyed === true &&
        engine.summary.history.count === 0,
        "Reasoning Destroy 錯誤"
    );
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Reasoning Engine V7.3 測試完成

Reasoning State：通過
Reasoning Context：通過
Reasoning Chain：通過
Hypothesis Builder：通過
Evidence Collector：通過
Conflict Resolver：通過
Explanation Builder：通過
Multi-step Reasoning：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
