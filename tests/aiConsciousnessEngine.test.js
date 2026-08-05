/**
 * Baccarat Analyzer V8.4
 * tests/aiConsciousnessEngine.test.js
 */

import ConsciousnessEngine, {
    CONSCIOUSNESS_ENGINE_VERSION,
    ConsciousnessEvent
} from "../casino/ai/consciousness/ConsciousnessEngine.js";

import {
    CONSCIOUSNESS_STATE_VERSION,
    ConsciousnessState,
    AwarenessLevel
} from "../casino/ai/consciousness/ConsciousnessState.js";

import ConsciousnessContext, {
    CONSCIOUSNESS_CONTEXT_VERSION
} from "../casino/ai/consciousness/ConsciousnessContext.js";

import AttentionManager, {
    ATTENTION_MANAGER_VERSION
} from "../casino/ai/consciousness/AttentionManager.js";

import SelfModel, {
    SELF_MODEL_VERSION
} from "../casino/ai/consciousness/SelfModel.js";

import IntrospectionEngine, {
    INTROSPECTION_ENGINE_VERSION
} from "../casino/ai/consciousness/IntrospectionEngine.js";

import MetaCognitionEngine, {
    META_COGNITION_ENGINE_VERSION
} from "../casino/ai/consciousness/MetaCognitionEngine.js";

import ExperienceIntegrator, {
    EXPERIENCE_INTEGRATOR_VERSION
} from "../casino/ai/consciousness/ExperienceIntegrator.js";

import AwarenessEvaluator, {
    AWARENESS_EVALUATOR_VERSION
} from "../casino/ai/consciousness/AwarenessEvaluator.js";

import ConsciousnessHistory, {
    CONSCIOUSNESS_HISTORY_VERSION
} from "../casino/ai/consciousness/ConsciousnessHistory.js";

import ConsciousnessRuntimeAdapter, {
    CONSCIOUSNESS_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/ConsciousnessRuntimeAdapter.js";

import {
    CONSCIOUSNESS_ENGINE_FACTORY_VERSION
} from "../casino/ai/consciousness/createConsciousnessEngine.js";


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


export default async function aiConsciousnessEngineTest() {
    const messages = [];

    assert(
        [
            CONSCIOUSNESS_ENGINE_VERSION,
            CONSCIOUSNESS_STATE_VERSION,
            CONSCIOUSNESS_CONTEXT_VERSION,
            ATTENTION_MANAGER_VERSION,
            SELF_MODEL_VERSION,
            INTROSPECTION_ENGINE_VERSION,
            META_COGNITION_ENGINE_VERSION,
            EXPERIENCE_INTEGRATOR_VERSION,
            AWARENESS_EVALUATOR_VERSION,
            CONSCIOUSNESS_HISTORY_VERSION,
            CONSCIOUSNESS_RUNTIME_ADAPTER_VERSION,
            CONSCIOUSNESS_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.4.0"
        ),
        "V8.4 AI Consciousness Framework 版本錯誤"
    );

    assert(
        AwarenessLevel.HIGH ===
            "high",
        "Awareness Level 錯誤"
    );

    messages.push(
        "✓ V8.4 AI Consciousness Framework 版本正確"
    );

    const context =
        new ConsciousnessContext({
            decision: {
                confidence:
                    0.8
            },
            assurance: {
                score:
                    92
            },
            governance: {
                blocked:
                    false
            },
            execution: {
                success:
                    true
            },
            metadata: {
                task:
                    "bet-decision"
            }
        });

    assert(
        context.decision.confidence ===
            0.8 &&
        context.metadata.task ===
            "bet-decision",
        "Consciousness Context 錯誤"
    );

    messages.push(
        "✓ Consciousness Context 正確"
    );

    const attention =
        new AttentionManager({
            capacity:
                2
        });

    const attentionResult =
        attention.focus([
            {
                id:
                    "a",
                salience:
                    0.2
            },
            {
                id:
                    "b",
                salience:
                    0.9
            },
            {
                id:
                    "c",
                salience:
                    0.7
            }
        ]);

    assert(
        attentionResult.focused[0]
            .id === "b" &&
        attentionResult.focused
            .length === 2,
        "Attention Manager 錯誤"
    );

    messages.push(
        "✓ Attention Manager 正確"
    );

    const selfModel =
        new SelfModel({
            identity:
                "baccarat-ai",
            capabilities: [
                "decision",
                "reasoning"
            ],
            limitations: [
                "no future certainty"
            ],
            goals: [
                "reduce risk"
            ]
        });

    selfModel.update({
        state: {
            mode:
                "analysis"
        }
    });

    assert(
        selfModel.snapshot()
            .identity ===
            "baccarat-ai" &&
        selfModel.snapshot()
            .state.mode ===
            "analysis",
        "Self Model 錯誤"
    );

    messages.push(
        "✓ Self Model 正確"
    );

    const introspection =
        new IntrospectionEngine()
            .inspect(
                context
            );

    assert(
        introspection.stable ===
            true &&
        introspection.uncertainties
            .length === 0,
        "Introspection Engine 錯誤"
    );

    messages.push(
        "✓ Introspection Engine 正確"
    );

    const metacognition =
        new MetaCognitionEngine()
            .evaluate({
                introspection,
                selfModel
            });

    assert(
        metacognition.score ===
            95 &&
        metacognition.calibrated ===
            true,
        "Meta Cognition Engine 錯誤"
    );

    messages.push(
        "✓ Meta Cognition Engine 正確"
    );

    const integrated =
        new ExperienceIntegrator()
            .integrate({
                attention:
                    attentionResult,
                introspection,
                metacognition,
                selfModel,
                context
            });

    assert(
        integrated.focus
            .length === 2 &&
        integrated.metacognitiveScore ===
            95,
        "Experience Integrator 錯誤"
    );

    messages.push(
        "✓ Experience Integrator 正確"
    );

    const awareness =
        new AwarenessEvaluator()
            .evaluate({
                integratedExperience:
                    integrated
            });

    assert(
        awareness.level ===
            AwarenessLevel.HIGH &&
        awareness.sufficient ===
            true,
        "Awareness Evaluator 錯誤"
    );

    messages.push(
        "✓ Awareness Evaluator 正確"
    );

    let now = 100;
    const events = [];

    const engine =
        new ConsciousnessEngine({
            attention:
                new AttentionManager({
                    capacity:
                        3
                }),
            selfModel:
                new SelfModel({
                    identity:
                        "baccarat-ai",
                    capabilities: [
                        "decision",
                        "planning",
                        "execution"
                    ],
                    limitations: [
                        "probabilistic predictions"
                    ],
                    goals: [
                        "improve calibrated decisions"
                    ]
                }),
            history:
                new ConsciousnessHistory({
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
            ConsciousnessState.IDLE,
        "Consciousness Engine initial state 錯誤"
    );

    const result =
        await engine.process({
            context,
            stimuli: [
                {
                    id:
                        "risk",
                    salience:
                        0.9,
                    value:
                        "low"
                },
                {
                    id:
                        "confidence",
                    salience:
                        0.8,
                    value:
                        0.8
                },
                {
                    id:
                        "trend",
                    salience:
                        0.6,
                    value:
                        "Banker"
                },
                {
                    id:
                        "noise",
                    salience:
                        0.1,
                    value:
                        null
                }
            ]
        });

    assert(
        result.attention.focused
            .length === 3 &&
        result.introspection.stable ===
            true &&
        result.metacognition.calibrated ===
            true &&
        result.awareness.level ===
            AwarenessLevel.HIGH &&
        result.selfModel.state
            .lastProcessId ===
            result.consciousnessId &&
        engine.state ===
            ConsciousnessState.COMPLETED &&
        engine.summary.processCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Consciousness Engine 錯誤"
    );

    messages.push(
        "✓ Observe → Attend → Reflect → Integrate 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.process({
            context
        });

    assert(
        engine.state ===
            ConsciousnessState.PAUSED &&
        pausedResult ===
            null,
        "Consciousness Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            ConsciousnessState.IDLE &&
        engine.summary.paused ===
            false,
        "Consciousness Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new ConsciousnessRuntimeAdapter({
            consciousness:
                engine
        });

    const adapterResult =
        await adapter.process({
            context,
            stimuli: [
                {
                    id:
                        "adapter",
                    salience:
                        1
                }
            ]
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary
            .consciousness
            .processCount ===
            2,
        "Consciousness Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            ConsciousnessEvent.STARTED,
            ConsciousnessEvent.ATTENTION_FOCUSED,
            ConsciousnessEvent.INTROSPECTION_COMPLETED,
            ConsciousnessEvent.META_COGNITION_COMPLETED,
            ConsciousnessEvent.EXPERIENCE_INTEGRATED,
            ConsciousnessEvent.AWARENESS_EVALUATED,
            ConsciousnessEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Consciousness Events 錯誤"
    );

    messages.push(
        "✓ Consciousness Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            ConsciousnessState.IDLE &&
        engine.summary.processCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Consciousness Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            ConsciousnessState.DESTROYED &&
        engine.summary.destroyed ===
            true,
        "Consciousness Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Consciousness Framework V8.4 測試完成

Consciousness State：通過
Consciousness Context：通過
Attention Manager：通過
Self Model：通過
Introspection Engine：通過
Meta Cognition Engine：通過
Experience Integrator：通過
Awareness Evaluator：通過
Consciousness Engine：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
