/**
 * Baccarat Analyzer V7.8
 * tests/aiAssuranceEngine.test.js
 */

import AssuranceEngine, {
    ASSURANCE_ENGINE_VERSION,
    AssuranceEvent
} from "../casino/ai/assurance/AssuranceEngine.js";

import {
    ASSURANCE_STATE_VERSION,
    AssuranceState,
    AssuranceLevel,
    AssuranceCheckType
} from "../casino/ai/assurance/AssuranceState.js";

import AssuranceContext, {
    ASSURANCE_CONTEXT_VERSION
} from "../casino/ai/assurance/AssuranceContext.js";

import AssuranceCheck, {
    ASSURANCE_CHECK_VERSION
} from "../casino/ai/assurance/AssuranceCheck.js";

import CheckRegistry, {
    CHECK_REGISTRY_VERSION
} from "../casino/ai/assurance/CheckRegistry.js";

import IntegrityValidator, {
    INTEGRITY_VALIDATOR_VERSION
} from "../casino/ai/assurance/IntegrityValidator.js";

import ConsistencyAnalyzer, {
    CONSISTENCY_ANALYZER_VERSION
} from "../casino/ai/assurance/ConsistencyAnalyzer.js";

import DriftDetector, {
    DRIFT_DETECTOR_VERSION
} from "../casino/ai/assurance/DriftDetector.js";

import AssuranceScorer, {
    ASSURANCE_SCORER_VERSION
} from "../casino/ai/assurance/AssuranceScorer.js";

import AssuranceHistory, {
    ASSURANCE_HISTORY_VERSION
} from "../casino/ai/assurance/AssuranceHistory.js";

import AssuranceRuntimeAdapter, {
    ASSURANCE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AssuranceRuntimeAdapter.js";

import {
    ASSURANCE_ENGINE_FACTORY_VERSION
} from "../casino/ai/assurance/createAssuranceEngine.js";


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


export default async function aiAssuranceEngineTest() {
    const messages = [];

    assert(
        [
            ASSURANCE_ENGINE_VERSION,
            ASSURANCE_STATE_VERSION,
            ASSURANCE_CONTEXT_VERSION,
            ASSURANCE_CHECK_VERSION,
            CHECK_REGISTRY_VERSION,
            INTEGRITY_VALIDATOR_VERSION,
            CONSISTENCY_ANALYZER_VERSION,
            DRIFT_DETECTOR_VERSION,
            ASSURANCE_SCORER_VERSION,
            ASSURANCE_HISTORY_VERSION,
            ASSURANCE_RUNTIME_ADAPTER_VERSION,
            ASSURANCE_ENGINE_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "7.8.0"
        ),
        "V7.8 AI Assurance Engine 版本錯誤"
    );

    messages.push(
        "✓ V7.8 AI Assurance Engine 版本正確"
    );

    const context =
        new AssuranceContext({
            decision: {
                bestBet:
                    "Banker",

                confidence:
                    0.8,

                score:
                    80
            },

            reasoning: {
                explanation: {
                    candidate:
                        "Banker",

                    confidence:
                        0.8
                }
            },

            planning: {
                evaluation: {
                    score:
                        80
                },

                plan: {
                    steps: [
                        {
                            action:
                                "bet",

                            payload: {
                                betType:
                                    "Banker"
                            }
                        }
                    ]
                }
            },

            governance: {
                approved:
                    true,

                blocked:
                    false
            },

            execution: {
                success:
                    true
            },

            baseline: {
                confidence:
                    0.75,

                score:
                    78
            }
        });

    assert(
        context.decision.bestBet ===
            "Banker" &&
        context.baseline.score ===
            78,
        "Assurance Context 錯誤"
    );

    messages.push(
        "✓ Assurance Context 正確"
    );

    const check =
        new AssuranceCheck({
            checkId:
                "custom",

            name:
                "Custom Check",

            type:
                AssuranceCheckType.QUALITY,

            evaluate:
                () => ({
                    passed:
                        true,

                    score:
                        90,

                    issues: []
                })
        });

    const checkResult =
        await check.run(
            context
        );

    assert(
        checkResult.passed ===
            true &&
        checkResult.score ===
            90,
        "Assurance Check 錯誤"
    );

    messages.push(
        "✓ Assurance Check 正確"
    );

    const registry =
        new CheckRegistry();

    registry.register(
        check
    );

    assert(
        registry.summary.count ===
            1 &&
        registry.get(
            "custom"
        ) === check,
        "Check Registry 錯誤"
    );

    messages.push(
        "✓ Check Registry 正確"
    );

    const integrity =
        new IntegrityValidator()
            .validate(
                context
            );

    assert(
        integrity.passed ===
            true &&
        integrity.score ===
            100,
        "Integrity Validator 錯誤"
    );

    messages.push(
        "✓ Integrity Validator 正確"
    );

    const consistency =
        new ConsistencyAnalyzer()
            .analyze(
                context
            );

    assert(
        consistency.passed ===
            true &&
        consistency.issues
            .length === 0,
        "Consistency Analyzer 錯誤"
    );

    messages.push(
        "✓ Consistency Analyzer 正確"
    );

    const drift =
        new DriftDetector()
            .detect(
                context
            );

    assert(
        drift.passed ===
            true &&
        drift.driftDetected ===
            false,
        "Drift Detector 錯誤"
    );

    messages.push(
        "✓ Drift Detector 正確"
    );

    const score =
        new AssuranceScorer()
            .score([
                {
                    score:
                        100,

                    passed:
                        true,

                    weight:
                        1
                },
                {
                    score:
                        80,

                    passed:
                        true,

                    weight:
                        1
                }
            ]);

    assert(
        score.score ===
            90 &&
        score.level ===
            AssuranceLevel.PASS,
        "Assurance Scorer 錯誤"
    );

    messages.push(
        "✓ Assurance Scorer 正確"
    );

    let now = 100;

    const events = [];

    const engine =
        new AssuranceEngine({
            checks:
                new CheckRegistry(),

            integrityValidator:
                new IntegrityValidator(),

            consistencyAnalyzer:
                new ConsistencyAnalyzer(),

            driftDetector:
                new DriftDetector(),

            scorer:
                new AssuranceScorer(),

            history:
                new AssuranceHistory({
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
            AssuranceState.IDLE &&
        engine.summary.checks
            .count === 3,
        "Assurance Engine initial state 錯誤"
    );

    const result =
        await engine.inspect({
            context
        });

    assert(
        result.passed ===
            true &&
        result.level ===
            AssuranceLevel.PASS &&
        result.results
            .length === 3 &&
        result.issues
            .length === 0 &&
        engine.state ===
            AssuranceState.COMPLETED &&
        engine.summary.assuranceCount ===
            1 &&
        engine.summary.history
            .count === 1,
        "Assurance Engine 錯誤"
    );

    messages.push(
        "✓ AI Pipeline Assurance 正確"
    );

    const warning =
        await engine.inspect({
            context: {
                decision: {
                    bestBet:
                        "Banker",

                    confidence:
                        0.3,

                    score:
                        40
                },

                reasoning: {
                    explanation: {
                        candidate:
                            "Player",

                        confidence:
                            0.3
                    }
                },

                planning: {
                    evaluation: {
                        score:
                            40
                    },

                    plan: {
                        steps: [
                            {
                                action:
                                    "bet",

                                payload: {
                                    betType:
                                        "Player"
                                }
                            }
                        ]
                    }
                },

                governance: {
                    approved:
                        true,

                    blocked:
                        false
                },

                baseline: {
                    confidence:
                        0.8,

                    score:
                        80
                }
            }
        });

    assert(
        warning.level !==
            AssuranceLevel.PASS &&
        warning.issues
            .length > 0,
        "Assurance Warning／Fail 錯誤"
    );

    messages.push(
        "✓ Warning／Fail Detection 正確"
    );

    engine.pause();

    const pausedResult =
        await engine.inspect({
            context
        });

    assert(
        engine.state ===
            AssuranceState.PAUSED &&
        pausedResult ===
            null,
        "Assurance Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state ===
            AssuranceState.IDLE &&
        engine.summary.paused ===
            false,
        "Assurance Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new AssuranceRuntimeAdapter({
            assurance:
                engine
        });

    const adapterResult =
        await adapter.inspect({
            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary.assurance
            .assuranceCount === 3,
        "Assurance Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            AssuranceEvent.STARTED,
            AssuranceEvent.CHECK_STARTED,
            AssuranceEvent.CHECK_COMPLETED,
            AssuranceEvent.SCORE_CALCULATED,
            AssuranceEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Assurance Events 錯誤"
    );

    messages.push(
        "✓ Assurance Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            AssuranceState.IDLE &&
        engine.summary.assuranceCount ===
            0 &&
        engine.summary.history
            .count === 0,
        "Assurance Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            AssuranceState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.checks
            .count === 0,
        "Assurance Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Assurance Engine V7.8 測試完成

Assurance State：通過
Assurance Context：通過
Assurance Check：通過
Check Registry：通過
Integrity Validator：通過
Consistency Analyzer：通過
Drift Detector：通過
Assurance Scorer：通過
AI Pipeline Assurance：通過
Warning／Fail Detection：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
