/**
 * Baccarat Analyzer V8.6
 * tests/aiEthicsEngine.test.js
 */

import EthicsEngine, {
    ETHICS_ENGINE_VERSION,
    EthicsEvent
} from "../casino/ai/ethics/EthicsEngine.js";

import {
    ETHICS_STATE_VERSION,
    EthicsState,
    EthicsDecision
} from "../casino/ai/ethics/EthicsState.js";

import EthicsContext, {
    ETHICS_CONTEXT_VERSION
} from "../casino/ai/ethics/EthicsContext.js";

import EthicalPrincipleRegistry, {
    ETHICAL_PRINCIPLE_REGISTRY_VERSION
} from "../casino/ai/ethics/EthicalPrincipleRegistry.js";

import HarmEvaluator, {
    HARM_EVALUATOR_VERSION
} from "../casino/ai/ethics/HarmEvaluator.js";

import FairnessEvaluator, {
    FAIRNESS_EVALUATOR_VERSION
} from "../casino/ai/ethics/FairnessEvaluator.js";

import ConsentEvaluator, {
    CONSENT_EVALUATOR_VERSION
} from "../casino/ai/ethics/ConsentEvaluator.js";

import ProportionalityEvaluator, {
    PROPORTIONALITY_EVALUATOR_VERSION
} from "../casino/ai/ethics/ProportionalityEvaluator.js";

import EthicsConflictResolver, {
    ETHICS_CONFLICT_RESOLVER_VERSION
} from "../casino/ai/ethics/EthicsConflictResolver.js";

import EthicsScorer, {
    ETHICS_SCORER_VERSION
} from "../casino/ai/ethics/EthicsScorer.js";

import EthicsHistory, {
    ETHICS_HISTORY_VERSION
} from "../casino/ai/ethics/EthicsHistory.js";

import EthicsRuntimeAdapter, {
    ETHICS_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/EthicsRuntimeAdapter.js";

import {
    ETHICS_ENGINE_FACTORY_VERSION
} from "../casino/ai/ethics/createEthicsEngine.js";


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


export default async function aiEthicsEngineTest() {
    const messages = [];

    assert(
        [
            ETHICS_ENGINE_VERSION,
            ETHICS_STATE_VERSION,
            ETHICS_CONTEXT_VERSION,
            ETHICAL_PRINCIPLE_REGISTRY_VERSION,
            HARM_EVALUATOR_VERSION,
            FAIRNESS_EVALUATOR_VERSION,
            CONSENT_EVALUATOR_VERSION,
            PROPORTIONALITY_EVALUATOR_VERSION,
            ETHICS_CONFLICT_RESOLVER_VERSION,
            ETHICS_SCORER_VERSION,
            ETHICS_HISTORY_VERSION,
            ETHICS_RUNTIME_ADAPTER_VERSION,
            ETHICS_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "8.6.0"
        ),
        "V8.6 AI Ethics Engine 版本錯誤"
    );

    assert(
        EthicsDecision.APPROVE ===
            "approve",
        "Ethics Decision 錯誤"
    );

    messages.push(
        "✓ V8.6 AI Ethics Engine 版本正確"
    );

    const context =
        new EthicsContext({
            subject: {
                consent:
                    true,
                informed:
                    true
            },
            stakeholders: [
                {
                    stakeholderId:
                        "player",
                    impact:
                        1
                },
                {
                    stakeholderId:
                        "system",
                    impact:
                        1
                }
            ],
            action: {
                actionId:
                    "low-risk-action",
                risk:
                    "low",
                requiresConsent:
                    true,
                expectedBenefit:
                    10,
                expectedCost:
                    2,
                financialImpact:
                    100
            },
            governance: {
                approved:
                    true
            },
            alignment: {
                aligned:
                    true
            }
        });

    assert(
        context.subject.consent ===
            true &&
        context.action.risk ===
            "low",
        "Ethics Context 錯誤"
    );

    messages.push(
        "✓ Ethics Context 正確"
    );

    const registry =
        new EthicalPrincipleRegistry();

    registry.register({
        principleId:
            "alignment",
        weight:
            1,
        evaluate:
            ({
                context
            }) => ({
                passed:
                    context.alignment
                        ?.aligned ===
                    true,
                score:
                    context.alignment
                        ?.aligned ===
                    true
                        ? 100
                        : 0
            })
    });

    registry.register({
        principleId:
            "governance",
        weight:
            1,
        evaluate:
            ({
                context
            }) => ({
                passed:
                    context.governance
                        ?.approved !==
                    false,
                score:
                    context.governance
                        ?.approved !==
                    false
                        ? 100
                        : 0
            })
    });

    assert(
        registry.summary.count ===
            2,
        "Ethical Principle Registry 錯誤"
    );

    messages.push(
        "✓ Ethical Principle Registry 正確"
    );

    const harm =
        new HarmEvaluator()
            .evaluate({
                action:
                    context.action,
                context
            });

    assert(
        harm.safe ===
            true &&
        harm.score ===
            100,
        "Harm Evaluator 錯誤"
    );

    messages.push(
        "✓ Harm Evaluator 正確"
    );

    const fairness =
        new FairnessEvaluator()
            .evaluate({
                stakeholders:
                    context.stakeholders,
                action:
                    context.action
            });

    assert(
        fairness.fair ===
            true &&
        fairness.disparity ===
            0,
        "Fairness Evaluator 錯誤"
    );

    messages.push(
        "✓ Fairness Evaluator 正確"
    );

    const consent =
        new ConsentEvaluator()
            .evaluate({
                subject:
                    context.subject,
                action:
                    context.action
            });

    assert(
        consent.valid ===
            true &&
        consent.score ===
            100,
        "Consent Evaluator 錯誤"
    );

    messages.push(
        "✓ Consent Evaluator 正確"
    );

    const proportionality =
        new ProportionalityEvaluator()
            .evaluate({
                action:
                    context.action,
                context
            });

    assert(
        proportionality
            .proportionate ===
            true &&
        proportionality
            .netBenefit ===
            8,
        "Proportionality Evaluator 錯誤"
    );

    messages.push(
        "✓ Proportionality Evaluator 正確"
    );

    const principleResults = [
        {
            principleId:
                "alignment",
            score:
                100,
            passed:
                true
        }
    ];

    const domainResults = {
        harm,
        fairness,
        consent,
        proportionality
    };

    const resolution =
        new EthicsConflictResolver()
            .resolve({
                principleResults,
                domainResults
            });

    assert(
        resolution.hasConflict ===
            false &&
        resolution.recommendation ===
            "approve",
        "Ethics Conflict Resolver 錯誤"
    );

    messages.push(
        "✓ Ethics Conflict Resolver 正確"
    );

    const scored =
        new EthicsScorer()
            .score({
                principleResults,
                domainResults
            });

    assert(
        scored.score ===
            100 &&
        scored.decision ===
            EthicsDecision.APPROVE,
        "Ethics Scorer 錯誤"
    );

    messages.push(
        "✓ Ethics Scorer 正確"
    );

    let now = 100;
    const events = [];

    const engine =
        new EthicsEngine({
            principles:
                registry,
            history:
                new EthicsHistory({
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
            EthicsState.IDLE,
        "Ethics Engine initial state 錯誤"
    );

    const result =
        await engine.evaluate({
            context
        });

    assert(
        result.ethical ===
            true &&
        result.decision ===
            EthicsDecision.APPROVE &&
        result.resolution
            .hasConflict === false &&
        engine.state ===
            EthicsState.COMPLETED &&
        engine.summary.evaluationCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Ethics Engine 錯誤"
    );

    messages.push(
        "✓ Principles → Harm → Fairness → Consent → Proportionality 正確"
    );

    const unethicalContext =
        new EthicsContext({
            subject: {
                consent:
                    false,
                informed:
                    false
            },
            stakeholders: [
                {
                    stakeholderId:
                        "a",
                    impact:
                        0
                },
                {
                    stakeholderId:
                        "b",
                    impact:
                        5
                }
            ],
            action: {
                actionId:
                    "unsafe-action",
                risk:
                    "high",
                irreversible:
                    true,
                requiresConsent:
                    true,
                expectedBenefit:
                    1,
                expectedCost:
                    10,
                financialImpact:
                    5000
            },
            governance: {
                approved:
                    false
            },
            alignment: {
                aligned:
                    false
            }
        });

    const rejected =
        await engine.evaluate({
            context:
                unethicalContext
        });

    assert(
        rejected.ethical ===
            false &&
        rejected.decision !==
            EthicsDecision.APPROVE &&
        rejected.resolution
            .hasConflict === true,
        "Ethical Rejection 錯誤"
    );

    messages.push(
        "✓ Ethical Rejection 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.evaluate({
            context
        });

    assert(
        engine.state ===
            EthicsState.PAUSED &&
        pausedResult ===
            null,
        "Ethics Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            EthicsState.IDLE &&
        engine.summary.paused ===
            false,
        "Ethics Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new EthicsRuntimeAdapter({
            ethics:
                engine
        });

    const adapterResult =
        await adapter.evaluate({
            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.ethics
            .evaluationCount ===
            3,
        "Ethics Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            EthicsEvent.STARTED,
            EthicsEvent.PRINCIPLES_LOADED,
            EthicsEvent.PRINCIPLE_EVALUATED,
            EthicsEvent.HARM_EVALUATED,
            EthicsEvent.FAIRNESS_EVALUATED,
            EthicsEvent.CONSENT_EVALUATED,
            EthicsEvent.PROPORTIONALITY_EVALUATED,
            EthicsEvent.CONFLICTS_RESOLVED,
            EthicsEvent.SCORE_CALCULATED,
            EthicsEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Ethics Events 錯誤"
    );

    messages.push(
        "✓ Ethics Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            EthicsState.IDLE &&
        engine.summary.evaluationCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Ethics Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            EthicsState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.principles
            .count === 0,
        "Ethics Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Ethics Engine V8.6 測試完成

Ethics State：通過
Ethics Context：通過
Ethical Principle Registry：通過
Harm Evaluator：通過
Fairness Evaluator：通過
Consent Evaluator：通過
Proportionality Evaluator：通過
Ethics Conflict Resolver：通過
Ethics Scorer：通過
Ethics Engine：通過
Ethical Rejection：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
