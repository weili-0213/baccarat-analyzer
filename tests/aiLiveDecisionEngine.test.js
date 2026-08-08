/**
 * Baccarat Analyzer V10.5.0
 * Path: tests/aiLiveDecisionEngine.test.js
 * Test Runner: tests/main.js
 * AI Live Decision Engine classification and safety regressions.
 */

import AILiveDecisionEngine, {
    AI_LIVE_DECISION_ENGINE_VERSION,
    LiveDecisionAction,
    LiveDecisionCategory
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import LiveCasinoDecisionModel, {
    LIVE_CASINO_DECISION_MODEL_VERSION
} from "../runtime/liveCasino/LiveCasinoDecisionModel.js";

import LiveCasinoUXController, {
    AI_LIVE_DECISION_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function analysis({
    ev = {
        player: -0.0121,
        banker: -0.0145,
        tie: -0.1450
    },
    confidence = 0.72,
    risk = 0.35,
    shouldBet = false,
    key = "player",
    amount = 0,
    sampleSize = 1200
} = {}) {
    return {
        method: "monteCarlo",
        probability: {
            player: 0.4464,
            banker: 0.4585,
            tie: 0.0951
        },
        ev,
        monteCarlo: {
            sampleSize
        },
        confidence: {
            overall: confidence,
            [key]: {
                confidenceScore: confidence
            }
        },
        overallConfidence: confidence,
        risk: {
            [key]: {
                relativeRisk: risk
            }
        },
        ranking: [
            {
                key,
                ev: ev[key],
                confidence,
                risk
            }
        ],
        recommendation: {
            shouldBet,
            key,
            amount
        }
    };
}


export default async function aiLiveDecisionEngineTest() {
    const messages = [];
    const engine =
        new AILiveDecisionEngine();

    assert(
        AI_LIVE_DECISION_ENGINE_VERSION === "10.5.0" &&
        AI_LIVE_DECISION_UX_VERSION === "10.5.0" &&
        LIVE_CASINO_DECISION_MODEL_VERSION === "10.4.5" &&
        engine.summary.categories.length === 6,
        "V10.5 / compatibility version contract 錯誤"
    );

    messages.push("✓ V10.5 engine / V10.4.5 facade 版本契約正確");

    const positive = engine.decide(
        analysis({
            ev: {
                player: -0.008,
                banker: 0.006,
                tie: -0.14
            },
            confidence: 0.81,
            risk: 0.32,
            shouldBet: true,
            key: "banker",
            amount: 100
        })
    );

    assert(
        positive.category ===
            LiveDecisionCategory.POSITIVE_EV &&
        positive.action ===
            LiveDecisionAction.BET &&
        positive.strictKey === "banker" &&
        positive.recommendationLabel === "莊家" &&
        positive.amount === 100,
        "絕對正 EV 可下注分類錯誤"
    );

    const relative = engine.decide(
        analysis()
    );

    assert(
        relative.category ===
            LiveDecisionCategory.RELATIVE_BEST &&
        relative.action ===
            LiveDecisionAction.WAIT &&
        relative.relativeKey === "player" &&
        Math.abs(
            relative.relativeAdvantage - 0.0024
        ) < 1e-12 &&
        relative.amount === 0,
        "相對最佳負 EV 分類錯誤"
    );

    const weak = engine.decide(
        analysis({
            ev: {
                player: 0.003,
                banker: -0.004,
                tie: -0.14
            },
            confidence: 0.62,
            risk: 0.30,
            shouldBet: true,
            key: "player",
            amount: 100
        })
    );

    assert(
        weak.category ===
            LiveDecisionCategory.WEAK_SIGNAL &&
        weak.action ===
            LiveDecisionAction.WAIT &&
        weak.amount === 0,
        "弱勢訊號不應產生下注額"
    );

    const noEdge = engine.decide(
        analysis({
            ev: {
                player: -0.0121,
                banker: -0.0125,
                tie: -0.1450
            }
        })
    );

    assert(
        noEdge.category ===
            LiveDecisionCategory.NO_EDGE &&
        noEdge.action ===
            LiveDecisionAction.WAIT,
        "無優勢分類錯誤"
    );

    const insufficient = engine.decide({
        probability: {
            player: 0.4464
        },
        ev: {
            player: -0.01
        }
    });

    assert(
        insufficient.category ===
            LiveDecisionCategory.INSUFFICIENT_DATA &&
        insufficient.ready === false &&
        insufficient.action ===
            LiveDecisionAction.WAIT,
        "資料不足分類錯誤"
    );

    const highRisk = engine.decide(
        analysis({
            ev: {
                player: -0.006,
                banker: 0.008,
                tie: -0.14
            },
            confidence: 0.85,
            risk: 0.82,
            shouldBet: true,
            key: "banker",
            amount: 200
        })
    );

    assert(
        highRisk.category ===
            LiveDecisionCategory.RISK_TOO_HIGH &&
        highRisk.action ===
            LiveDecisionAction.WAIT &&
        highRisk.amount === 0,
        "風險過高仍不可下注"
    );

    const forcedNegative = engine.decide(
        analysis({
            shouldBet: true,
            key: "player",
            amount: 500
        })
    );

    assert(
        forcedNegative.action ===
            LiveDecisionAction.WAIT &&
        forcedNegative.amount === 0 &&
        forcedNegative.category ===
            LiveDecisionCategory.RELATIVE_BEST,
        "上游推薦不可強迫負 EV 下注"
    );

    const missingRecommendationKey =
        analysis({
            ev: {
                player: 0.006,
                banker: -0.004,
                tie: -0.14
            },
            confidence: 0.82,
            risk: 0.25,
            shouldBet: true,
            key: "player",
            amount: 100
        });

    delete missingRecommendationKey
        .recommendation.key;

    const incompleteRecommendation =
        engine.decide(
            missingRecommendationKey
        );

    assert(
        incompleteRecommendation.category ===
            LiveDecisionCategory.WEAK_SIGNAL &&
        incompleteRecommendation.action ===
            LiveDecisionAction.WAIT &&
        incompleteRecommendation.amount === 0,
        "缺少合法下注項目的上游推薦不可產生下注"
    );

    let rejectedNegativeThreshold =
        false;

    try {
        new AILiveDecisionEngine({
            minPositiveEV: -0.001
        });
    }
    catch (error) {
        rejectedNegativeThreshold =
            error instanceof RangeError;
    }

    assert(
        rejectedNegativeThreshold,
        "minPositiveEV 不可允許負值"
    );

    const incompletePositive = engine.decide({
        ...analysis({
            ev: {
                player: 0.004,
                banker: -0.006,
                tie: -0.14
            },
            shouldBet: true,
            key: "player"
        }),
        risk: {},
        ranking: [
            {
                key: "player",
                ev: 0.004,
                confidence: 0.72
            }
        ]
    });

    assert(
        incompletePositive.category ===
            LiveDecisionCategory.INSUFFICIENT_DATA &&
        incompletePositive.action ===
            LiveDecisionAction.WAIT,
        "正 EV 缺少風險資料時不可下注"
    );

    messages.push("✓ 六種決策類別與下注安全門檻正確");
    messages.push("✓ 不完整上游推薦與負門檻均不會產生下注");

    const lowSamples = engine.decide(
        analysis({
            sampleSize: 400
        })
    );

    assert(
        lowSamples.category ===
            LiveDecisionCategory.INSUFFICIENT_DATA &&
        lowSamples.reason.includes("400"),
        "Monte Carlo 樣本不足分類錯誤"
    );

    const model =
        new LiveCasinoDecisionModel();
    const compatibility =
        model.build(analysis());

    assert(
        compatibility.strictAction === "WAIT" &&
        compatibility.relativeKey === "player" &&
        compatibility.relativeLabel === "閒家" &&
        model.summary.engineVersion === "10.5.0",
        "LiveCasinoDecisionModel compatibility facade 錯誤"
    );

    messages.push("✓ 樣本防呆與舊 DecisionModel API 相容");

    const game = {
        nextAnalysis:
            analysis()
    };

    const controller =
        new LiveCasinoUXController({
            game
        });

    const html =
        controller.renderDecisionHTML();

    assert(
        html.includes(
            'data-decision-category="relative-best"'
        ) &&
        html.includes("推薦：") &&
        html.includes("策略：") &&
        html.includes("信號：") &&
        html.includes("相對優勢：") &&
        html.includes("原因："),
        "Dashboard 首屏決策資訊不完整"
    );

    const fields = new Map();
    const root = {
        querySelector(selector) {
            if (!fields.has(selector)) {
                fields.set(selector, {
                    textContent: ""
                });
            }

            return fields.get(selector);
        }
    };

    controller.updateAIPanel(root);

    assert(
        fields.get("[data-ai-stage]")
            .textContent ===
            "live-decision-engine-v10.5" &&
        fields.get("[data-ai-decision]")
            .textContent.includes("閒家") &&
        fields.get("[data-ai-strategy]")
            .textContent === "相對最佳" &&
        !fields.get("[data-ai-feedback]")
            .textContent.includes("等待 Runtime"),
        "AI Closed-Loop 尚未接入 Live Decision"
    );

    controller.destroy();

    messages.push("✓ Dashboard 首屏與 AI Closed-Loop 已接入決策結果");

    return `
${messages.join("\n")}

AI Live Decision Engine V10.5.0 測試完成

Positive EV：通過
Relative Best：通過
Weak Signal：通過
No Edge：通過
Insufficient Data：通過
Risk Too High：通過
No Forced Bet：通過
Legacy Facade：通過
Dashboard Decision UI：通過
AI Closed-Loop Bridge：通過
`;
}
