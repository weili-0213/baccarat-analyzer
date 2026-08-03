/**
 * Baccarat Analyzer V7.0
 * tests/aiDecisionEngine.test.js
 */

import AIDecisionEngine, {
    AI_DECISION_ENGINE_VERSION,
    AIEvent
} from "../casino/ai/AIDecisionEngine.js";

import {
    AI_STATE_VERSION,
    AIState,
    AIAction
} from "../casino/ai/AIState.js";

import PatternRecognizer, {
    PATTERN_RECOGNIZER_VERSION
} from "../casino/ai/PatternRecognizer.js";

import TrendPredictor, {
    TREND_PREDICTOR_VERSION
} from "../casino/ai/TrendPredictor.js";

import ProbabilityFusion, {
    PROBABILITY_FUSION_VERSION
} from "../casino/ai/ProbabilityFusion.js";

import RecommendationModel, {
    RECOMMENDATION_MODEL_VERSION
} from "../casino/ai/RecommendationModel.js";

import DecisionModel, {
    DECISION_MODEL_VERSION
} from "../casino/ai/DecisionModel.js";

import DecisionHistory, {
    DECISION_HISTORY_VERSION
} from "../casino/ai/DecisionHistory.js";

import AIDecisionEngineRuntimeAdapter, {
    AI_DECISION_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AIDecisionEngineRuntimeAdapter.js";

import {
    AI_DECISION_ENGINE_FACTORY_VERSION
} from "../casino/ai/createAIDecisionEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function aiDecisionEngineTest() {
    const messages = [];

    assert(
        AI_DECISION_ENGINE_VERSION ===
            "7.0.0" &&
        AI_STATE_VERSION ===
            "7.0.0" &&
        PATTERN_RECOGNIZER_VERSION ===
            "7.0.0" &&
        TREND_PREDICTOR_VERSION ===
            "7.0.0" &&
        PROBABILITY_FUSION_VERSION ===
            "7.0.0" &&
        RECOMMENDATION_MODEL_VERSION ===
            "7.0.0" &&
        DECISION_MODEL_VERSION ===
            "7.0.0" &&
        DECISION_HISTORY_VERSION ===
            "7.0.0" &&
        AI_DECISION_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "7.0.0" &&
        AI_DECISION_ENGINE_FACTORY_VERSION ===
            "7.0.0",
        "V7.0 AI Decision Engine 版本錯誤"
    );

    messages.push(
        "✓ V7.0 AI Decision Engine 版本正確"
    );

    const recognizer =
        new PatternRecognizer();

    const patterns =
        recognizer.recognize({
            statistics: {
                currentStreak: {
                    side:
                        "Banker",
                    length:
                        4
                }
            },

            roadmap: {
                bigRoad: [
                    "Player",
                    "Banker",
                    "Banker"
                ]
            },

            history: [
                {
                    winner:
                        "Banker"
                },
                {
                    winner:
                        "Banker"
                },
                {
                    winner:
                        "Banker"
                }
            ]
        });

    assert(
        patterns.some(
            pattern =>
                pattern.type ===
                    "streak" &&
                pattern.side ===
                    "Banker"
        ) &&
        patterns.some(
            pattern =>
                pattern.type ===
                    "road-pattern"
        ),
        "Pattern Recognizer 錯誤"
    );

    messages.push(
        "✓ Pattern Recognizer 正確"
    );

    const trend =
        new TrendPredictor()
            .predict({
                patterns,

                statistics: {
                    winners: {
                        Player: 8,
                        Banker: 12,
                        Tie: 1
                    }
                },

                history: [
                    {
                        winner:
                            "Banker"
                    },
                    {
                        winner:
                            "Banker"
                    },
                    {
                        winner:
                            "Player"
                    },
                    {
                        winner:
                            "Banker"
                    }
                ]
            });

    assert(
        trend.trend ===
            "Banker" &&
        trend.strength > 0 &&
        trend.confidence >= 0,
        "Trend Predictor 錯誤"
    );

    messages.push(
        "✓ Trend Predictor 正確"
    );

    const fusion =
        new ProbabilityFusion({
            analyzerWeight:
                0.75,
            trendWeight:
                0.25
        });

    const fused =
        fusion.fuse({
            probability: {
                Player: 0.40,
                Banker: 0.50,
                Tie: 0.10
            },

            trend
        });

    const fusedTotal =
        fused.Player +
        fused.Banker +
        fused.Tie;

    assert(
        Math.abs(
            fusedTotal - 1
        ) < 0.000001 &&
        fused.Banker >
            fused.Player,
        "Probability Fusion 錯誤"
    );

    messages.push(
        "✓ Probability Fusion 正確"
    );

    let now = 100;

    const events = [];

    const ai =
        new AIDecisionEngine({
            patternRecognizer:
                recognizer,

            trendPredictor:
                new TrendPredictor(),

            probabilityFusion:
                fusion,

            recommendationModel:
                new RecommendationModel({
                    minimumConfidence:
                        0.4,

                    minimumEV:
                        0,

                    waitConfidence:
                        0.3
                }),

            history:
                new DecisionHistory({
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
        ai.state ===
            AIState.IDLE,
        "AI initial state 錯誤"
    );

    const decision =
        await ai.evaluate({
            analysis: {
                probability: {
                    Player: 0.40,
                    Banker: 0.50,
                    Tie: 0.10
                },

                ev: {
                    Player: -0.01,
                    Banker: 0.02,
                    Tie: -0.03
                },

                kelly: {
                    Banker: 0.03
                },

                risk: {
                    level:
                        "low"
                },

                ranking: [
                    {
                        bet:
                            "Banker",
                        ev:
                            0.02
                    }
                ]
            },

            roadmap: {
                bigRoad: [
                    "Banker",
                    "Banker",
                    "Banker"
                ]
            },

            statistics: {
                currentStreak: {
                    side:
                        "Banker",
                    length:
                        4
                },

                winners: {
                    Player: 8,
                    Banker: 12,
                    Tie: 1
                }
            },

            history: [
                {
                    winner:
                        "Banker"
                },
                {
                    winner:
                        "Banker"
                },
                {
                    winner:
                        "Player"
                },
                {
                    winner:
                        "Banker"
                }
            ],

            metadata: {
                roundId:
                    "round-1"
            }
        });

    assert(
        decision instanceof
            DecisionModel &&
        decision.action ===
            AIAction.RECOMMEND &&
        decision.shouldRecommend ===
            true &&
        decision.bestBet ===
            "Banker" &&
        decision.expectedValue ===
            0.02 &&
        decision.kelly ===
            0.03 &&
        decision.risk ===
            "low" &&
        decision.score > 0 &&
        ai.state ===
            AIState.COMPLETED,
        "AI Recommend Decision 錯誤"
    );

    messages.push(
        "✓ Recommendation Model、Decision Model 與 Score 正確"
    );

    const waitDecision =
        await ai.evaluate({
            analysis: {
                probability: {
                    Player: 0.48,
                    Banker: 0.42,
                    Tie: 0.10
                },

                ev: {
                    Player: -0.002,
                    Banker: -0.003,
                    Tie: -0.02
                }
            }
        });

    assert(
        [
            AIAction.WAIT,
            AIAction.SKIP
        ].includes(
            waitDecision.action
        ),
        "AI Wait／Skip Decision 錯誤"
    );

    messages.push(
        "✓ Wait／Skip Decision 正確"
    );

    assert(
        ai.summary.evaluationCount ===
            2 &&
        ai.summary.history
            .count === 2,
        "Decision History 錯誤"
    );

    messages.push(
        "✓ Decision History 正確"
    );

    const adapter =
        new AIDecisionEngineRuntimeAdapter({
            ai
        });

    const adapterDecision =
        await adapter.recommend({
            analysis: {
                probability: {
                    Player: 0.38,
                    Banker: 0.52,
                    Tie: 0.10
                },

                ev: {
                    Banker:
                        0.03
                },

                kelly: {
                    Banker:
                        0.04
                },

                risk: {
                    level:
                        "low"
                }
            },

            statistics: {
                winners: {
                    Player: 5,
                    Banker: 10,
                    Tie: 1
                }
            }
        });

    assert(
        adapterDecision instanceof
            DecisionModel &&
        adapter.summary.ai
            .hasDecision === true,
        "AI Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                AIEvent.STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                AIEvent.PATTERNS_FOUND
        ) &&
        events.some(
            event =>
                event.type ===
                AIEvent.TREND_PREDICTED
        ) &&
        events.some(
            event =>
                event.type ===
                AIEvent.PROBABILITY_FUSED
        ) &&
        events.some(
            event =>
                event.type ===
                AIEvent.RECOMMENDATION_READY
        ) &&
        events.some(
            event =>
                event.type ===
                AIEvent.COMPLETED
        ),
        "AI Events 錯誤"
    );

    messages.push(
        "✓ AI Events 正確"
    );

    ai.reset();

    assert(
        ai.state ===
            AIState.IDLE &&
        ai.summary.hasDecision ===
            false,
        "AI Reset 錯誤"
    );

    ai.destroy();

    assert(
        ai.state ===
            AIState.DESTROYED &&
        ai.summary.destroyed ===
            true &&
        ai.summary.history
            .count === 0,
        "AI Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Decision Engine V7.0 測試完成

AI State：通過
Pattern Recognizer：通過
Trend Predictor：通過
Probability Fusion：通過
Recommendation Model：通過
Decision Model：通過
Decision Score：通過
Recommend Decision：通過
Wait／Skip Decision：通過
Decision History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
