/**
 * Baccarat Analyzer V7.2
 * tests/aiKnowledgeEngine.test.js
 */

import KnowledgeEngine, {
    KNOWLEDGE_ENGINE_VERSION,
    KnowledgeEvent
} from "../casino/ai/knowledge/KnowledgeEngine.js";

import {
    KNOWLEDGE_STATE_VERSION,
    KnowledgeState,
    KnowledgeType
} from "../casino/ai/knowledge/KnowledgeState.js";

import KnowledgeRecord, {
    KNOWLEDGE_RECORD_VERSION
} from "../casino/ai/knowledge/KnowledgeRecord.js";

import KnowledgeBase, {
    KNOWLEDGE_BASE_VERSION
} from "../casino/ai/knowledge/KnowledgeBase.js";

import PatternLibrary, {
    PATTERN_LIBRARY_VERSION
} from "../casino/ai/knowledge/PatternLibrary.js";

import RuleRepository, {
    RULE_REPOSITORY_VERSION
} from "../casino/ai/knowledge/RuleRepository.js";

import KnowledgeGraph, {
    KNOWLEDGE_GRAPH_VERSION
} from "../casino/ai/knowledge/KnowledgeGraph.js";

import InferenceEngine, {
    INFERENCE_ENGINE_VERSION
} from "../casino/ai/knowledge/InferenceEngine.js";

import KnowledgeRuntimeAdapter, {
    KNOWLEDGE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/KnowledgeRuntimeAdapter.js";

import {
    KNOWLEDGE_ENGINE_FACTORY_VERSION
} from "../casino/ai/knowledge/createKnowledgeEngine.js";


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


export default async function aiKnowledgeEngineTest() {
    const messages = [];

    assert(
        KNOWLEDGE_ENGINE_VERSION ===
            "7.2.0" &&
        KNOWLEDGE_STATE_VERSION ===
            "7.2.0" &&
        KNOWLEDGE_RECORD_VERSION ===
            "7.2.0" &&
        KNOWLEDGE_BASE_VERSION ===
            "7.2.0" &&
        PATTERN_LIBRARY_VERSION ===
            "7.2.0" &&
        RULE_REPOSITORY_VERSION ===
            "7.2.0" &&
        KNOWLEDGE_GRAPH_VERSION ===
            "7.2.0" &&
        INFERENCE_ENGINE_VERSION ===
            "7.2.0" &&
        KNOWLEDGE_RUNTIME_ADAPTER_VERSION ===
            "7.2.0" &&
        KNOWLEDGE_ENGINE_FACTORY_VERSION ===
            "7.2.0",
        "V7.2 AI Knowledge Engine 版本錯誤"
    );

    messages.push(
        "✓ V7.2 AI Knowledge Engine 版本正確"
    );

    const base =
        new KnowledgeBase({
            limit:
                10
        });

    const record =
        base.add(
            new KnowledgeRecord({
                knowledgeId:
                    "k1",

                type:
                    KnowledgeType.FACT,

                key:
                    "banker-low-risk",

                value:
                    "Banker",

                confidence:
                    0.8,

                tags: [
                    "banker",
                    "low-risk"
                ]
            })
        );

    assert(
        record.key ===
            "banker-low-risk" &&
        base.summary.count ===
            1 &&
        base.search(
            "banker"
        ).length ===
            1,
        "Knowledge Base 錯誤"
    );

    messages.push(
        "✓ Knowledge Record 與 Knowledge Base 正確"
    );

    const patterns =
        new PatternLibrary();

    patterns.register({
        name:
            "banker-streak",

        weight:
            1.2,

        matcher:
            context =>
                context.streak >= 3
                    ? {
                        side:
                            "Banker",

                        confidence:
                            0.8
                    }
                    : null
    });

    const patternMatches =
        patterns.match({
            streak:
                4
        });

    assert(
        patternMatches.length ===
            1 &&
        patternMatches[0]
            .name ===
            "banker-streak",
        "Pattern Library 錯誤"
    );

    messages.push(
        "✓ Pattern Library 正確"
    );

    const rules =
        new RuleRepository();

    rules.register({
        name:
            "positive-ev",

        priority:
            100,

        evaluate:
            context => ({
                matched:
                    context.ev > 0,

                value:
                    context.bestBet,

                confidence:
                    0.9
            })
    });

    const ruleResults =
        rules.evaluate({
            ev:
                0.02,

            bestBet:
                "Banker"
        });

    assert(
        ruleResults.length ===
            1 &&
        ruleResults[0]
            .result.matched ===
            true,
        "Rule Repository 錯誤"
    );

    messages.push(
        "✓ Rule Repository 正確"
    );

    const graph =
        new KnowledgeGraph();

    graph.addNode(
        "pattern",
        {
            type:
                "pattern"
        }
    );

    graph.addNode(
        "banker",
        {
            type:
                "bet"
        }
    );

    graph.addEdge(
        "pattern",
        "banker",
        "supports",
        1
    );

    assert(
        graph.summary.nodeCount ===
            2 &&
        graph.summary.edgeCount ===
            1 &&
        graph.neighbors(
            "pattern"
        ).length ===
            1,
        "Knowledge Graph 錯誤"
    );

    messages.push(
        "✓ Knowledge Graph 正確"
    );

    const inference =
        new InferenceEngine();

    const inferenceResult =
        inference.infer({
            knowledge: [
                record
            ],

            patterns:
                patternMatches,

            rules:
                ruleResults,

            minimumConfidence:
                0.5
        });

    assert(
        inferenceResult
            .candidates.length ===
            3 &&
        inferenceResult.best !==
            null,
        "Inference Engine 錯誤"
    );

    messages.push(
        "✓ Inference Engine 正確"
    );

    let now = 100;

    const events = [];

    const engine =
        new KnowledgeEngine({
            base:
                new KnowledgeBase({
                    limit:
                        20
                }),

            patterns,
            rules,
            graph,
            inference,

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
            KnowledgeState.IDLE,
        "Knowledge Engine initial state 錯誤"
    );

    const ingested =
        engine.ingestExperience({
            experienceId:
                "exp-1",

            decisionId:
                "decision-1",

            reward:
                6,

            state: {
                bestBet:
                    "Banker",

                confidence:
                    0.8,

                risk:
                    "low"
            },

            evaluation: {
                correct:
                    true
            }
        });

    assert(
        ingested !==
            null &&
        engine.state ===
            KnowledgeState.READY &&
        engine.summary.ingestCount ===
            1 &&
        engine.summary.base
            .count === 1,
        "Knowledge Experience Ingest 錯誤"
    );

    messages.push(
        "✓ Learning Experience → Knowledge 正確"
    );

    const result =
        engine.infer({
            streak:
                4,

            ev:
                0.02,

            bestBet:
                "Banker",

            minimumConfidence:
                0.5
        });

    assert(
        result !==
            null &&
        result.best !==
            null &&
        engine.summary.inferenceCount ===
            1 &&
        engine.summary.hasInference ===
            true,
        "Knowledge Engine Inference 錯誤"
    );

    messages.push(
        "✓ Knowledge Engine Inference 正確"
    );

    engine.pause();

    assert(
        engine.state ===
            KnowledgeState.PAUSED &&
        engine.ingestExperience({
            reward:
                1
        }) === null,
        "Knowledge Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            KnowledgeState.READY &&
        engine.summary.paused ===
            false,
        "Knowledge Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new KnowledgeRuntimeAdapter({
            knowledge:
                engine
        });

    const adapterResult =
        adapter.infer({
            streak:
                4,

            ev:
                0.03,

            bestBet:
                "Banker"
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.knowledge
            .inferenceCount === 2,
        "Knowledge Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                KnowledgeEvent.EXPERIENCE_INGESTED
        ) &&
        events.some(
            event =>
                event.type ===
                KnowledgeEvent.PATTERNS_MATCHED
        ) &&
        events.some(
            event =>
                event.type ===
                KnowledgeEvent.RULES_EVALUATED
        ) &&
        events.some(
            event =>
                event.type ===
                KnowledgeEvent.INFERENCE_COMPLETED
        ),
        "Knowledge Events 錯誤"
    );

    messages.push(
        "✓ Knowledge Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            KnowledgeState.IDLE &&
        engine.summary.base
            .count === 0 &&
        engine.summary.ingestCount ===
            0 &&
        engine.summary.inferenceCount ===
            0,
        "Knowledge Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            KnowledgeState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.base
            .count === 0 &&
        engine.summary.patterns
            .count === 0 &&
        engine.summary.rules
            .count === 0,
        "Knowledge Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Knowledge Engine V7.2 測試完成

Knowledge State：通過
Knowledge Record：通過
Knowledge Base：通過
Pattern Library：通過
Rule Repository：通過
Knowledge Graph：通過
Inference Engine：通過
Experience Ingest：通過
Knowledge Inference：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
