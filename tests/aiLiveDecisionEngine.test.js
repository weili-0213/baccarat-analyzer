/**
 * Baccarat Analyzer V10.5.4
 * Path: tests/aiLiveDecisionEngine.test.js
 * Test Runner: tests/main.js
 * AI Live Decision Engine classification and safety regressions.
 */

import AILiveDecisionEngine, {
    AI_LIVE_DECISION_ENGINE_VERSION,
    AI_LIVE_DECISION_CALIBRATION_VERSION,
    EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION,
    DEFAULT_LIVE_DECISION_THRESHOLDS,
    LiveDecisionAction,
    LiveDecisionCategory
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import Risk
    from "../analysis/risk.js";

import Kelly
    from "../analysis/kelly.js";

import Recommendation
    from "../analysis/recommendation.js";

import LiveCasinoDecisionModel, {
    LIVE_CASINO_DECISION_MODEL_VERSION
} from "../runtime/liveCasino/LiveCasinoDecisionModel.js";

import LiveCasinoUXController, {
    AI_LIVE_DECISION_UX_VERSION,
    AI_LIVE_DECISION_EVIDENCE_UX_VERSION,
    SIGNAL_TREND_OPPORTUNITY_UX_VERSION,
    EXACT_OPPORTUNITY_CONFIRMATION_UX_VERSION
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
    risk = 0.95,
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
                relativeRisk: risk,
                standardDeviation: risk,
                riskLabel: "中等風險"
            }
        },
        ranking: [
            {
                key,
                ev: ev[key],
                confidence,
                risk,
                standardDeviation: risk
            }
        ],
        recommendation: {
            shouldBet,
            key,
            amount
        }
    };
}


function realisticPlayerAnalysis({
    player = 0.51,
    tie = 0,
    confidence = 0.82,
    method = "hybrid",
    sampleSize = 5000
} = {}) {
    const banker =
        1 - player - tie;

    const ev = {
        player:
            player - banker,
        banker:
            banker - player,
        tie:
            tie * 8 -
            (1 - tie)
    };

    const risk =
        new Risk().calculate({
            name: "player",
            winProbability:
                player,
            pushProbability:
                tie,
            netOdds: 1
        });

    const kelly =
        new Kelly().calculate({
            winProbability:
                player,
            pushProbability:
                tie,
            netOdds: 1
        });

    const rankingItem = {
        name: "player",
        label: "閒家",
        probability:
            player,
        ev:
            ev.player,
        kelly:
            kelly.appliedKelly,
        fullKelly:
            kelly.fullKelly,
        amount:
            kelly.amount,
        rawAmount:
            kelly.rawAmount,
        risk:
            risk.relativeRisk,
        riskLabel:
            risk.riskLabel,
        standardDeviation:
            risk.standardDeviation,
        confidence,
        confidenceProvisional:
            false,
        score: 0.8,
        eligible: true,
        recommendationEligible:
            true
    };

    const recommendation =
        new Recommendation()
            .calculate([
                rankingItem
            ]);

    return {
        method,
        probability: {
            player,
            banker,
            tie
        },
        ev,
        monteCarlo: {
            sampleSize
        },
        exact:
            method === "hybrid" ||
            method === "exact"
                ? {
                    probability: {
                        player,
                        banker,
                        tie
                    }
                }
                : null,
        confidence: {
            overall:
                confidence,
            player: {
                confidenceScore:
                    confidence,
                zScore:
                    1.959963984540054
            }
        },
        overallConfidence:
            confidence,
        risk: {
            player:
                risk
        },
        kelly: {
            player:
                kelly
        },
        amount: {
            player:
                kelly.amount
        },
        ranking: [
            rankingItem
        ],
        recommendation
    };
}


export default async function aiLiveDecisionEngineTest() {
    const messages = [];
    const engine =
        new AILiveDecisionEngine();

    assert(
        AI_LIVE_DECISION_ENGINE_VERSION === "10.5.0" &&
        AI_LIVE_DECISION_CALIBRATION_VERSION === "10.5.2" &&
        AI_LIVE_DECISION_EVIDENCE_UX_VERSION === "10.5.2" &&
        SIGNAL_TREND_OPPORTUNITY_UX_VERSION === "10.5.3" &&
        EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION === "10.5.4" &&
        EXACT_OPPORTUNITY_CONFIRMATION_UX_VERSION === "10.5.4" &&
        AI_LIVE_DECISION_UX_VERSION === "10.5.0" &&
        LIVE_CASINO_DECISION_MODEL_VERSION === "10.4.5" &&
        DEFAULT_LIVE_DECISION_THRESHOLDS
            .maxRelativeRisk === 1.05 &&
        engine.summary.categories.length === 6,
        "V10.5.4 confirmation / compatibility version contract 錯誤"
    );

    messages.push("✓ V10.5.4 confirmation / V10.4.5 facade 版本契約正確");

    const positive = engine.decide(
        realisticPlayerAnalysis()
    );

    assert(
        positive.category ===
            LiveDecisionCategory.POSITIVE_EV &&
        positive.action ===
            LiveDecisionAction.BET &&
        positive.strictKey === "player" &&
        positive.recommendationLabel === "閒家" &&
        positive.amount === 100 &&
        positive.risk > 0.95 &&
        positive.risk <= 1.05 &&
        positive.evidence.hasExact === true &&
        positive.evidence.robustPositiveEV === true &&
        positive.sizing.calculatedAmount === 100 &&
        positive.blockers.length === 0,
        "真實 Risk / Kelly / Recommendation 正 EV 鏈路錯誤"
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
        realisticPlayerAnalysis({
            method: "monteCarlo",
            sampleSize: 1200
        })
    );

    assert(
        weak.category ===
            LiveDecisionCategory.WEAK_SIGNAL &&
        weak.action ===
            LiveDecisionAction.WAIT &&
        weak.amount === 0 &&
        weak.evidence.evLowerBound < 0 &&
        weak.blockers.some(blocker =>
            blocker.code ===
                "UNCERTAINTY_CROSSES_ZERO"
        ),
        "Monte Carlo 正 EV 未跨過誤差時仍應觀望"
    );

    const belowMinimumBet =
        engine.decide(
            realisticPlayerAnalysis({
                player: 0.503
            })
        );

    assert(
        belowMinimumBet.category ===
            LiveDecisionCategory.WEAK_SIGNAL &&
        belowMinimumBet.action ===
            LiveDecisionAction.WAIT &&
        belowMinimumBet.sizing
            .calculatedAmount === 30 &&
        belowMinimumBet.sizing
            .minBet === 100 &&
        belowMinimumBet.blockers.some(blocker =>
            blocker.code ===
                "BELOW_MIN_BET"
        ),
        "Kelly 金額低於最低下注時阻擋原因錯誤"
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

    const highRisk =
        new AILiveDecisionEngine({
            maxRelativeRisk: 0.90
        }).decide(
            realisticPlayerAnalysis()
        );

    assert(
        highRisk.category ===
            LiveDecisionCategory.RISK_TOO_HIGH &&
        highRisk.action ===
            LiveDecisionAction.WAIT &&
        highRisk.amount === 0 &&
        highRisk.risk > 0.90 &&
        highRisk.blockers.some(blocker =>
            blocker.code ===
                "VOLATILITY_TOO_HIGH"
        ),
        "相對波動比超過設定上限時仍不可下注"
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
        realisticPlayerAnalysis();

    delete missingRecommendationKey
        .recommendation.bet;

    const incompleteRecommendation =
        engine.decide(
            missingRecommendationKey
        );

    assert(
        incompleteRecommendation.category ===
            LiveDecisionCategory.WEAK_SIGNAL &&
        incompleteRecommendation.action ===
            LiveDecisionAction.WAIT &&
        incompleteRecommendation.amount === 0 &&
        incompleteRecommendation.blockers
            .some(blocker =>
                blocker.code ===
                    "UPSTREAM_RECOMMENDATION_BLOCKED"
            ),
        "缺少合法下注項目的上游推薦不可產生下注"
    );

    const unboundedProvided =
        realisticPlayerAnalysis({
            method: "provided"
        });

    unboundedProvided.exact = null;

    const unboundedDecision =
        engine.decide(
            unboundedProvided
        );

    assert(
        unboundedDecision.category ===
            LiveDecisionCategory.INSUFFICIENT_DATA &&
        unboundedDecision.action ===
            LiveDecisionAction.WAIT &&
        unboundedDecision.blockers
            .some(blocker =>
                blocker.code ===
                    "UNCERTAINTY_MISSING"
            ),
        "只有外部點估計、沒有誤差界線時不可下注"
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
        ...realisticPlayerAnalysis(),
        risk: {},
        ranking: [
            {
                name: "player",
                key: "player",
                ev: 0.02,
                confidence: 0.72
            }
        ],
        recommendation: {
            shouldBet: true,
            action: "bet",
            bet: "player",
            amount: 100,
            limits: {
                minBet: 100,
                maxBet: 10000
            }
        }
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
        model.summary.engineVersion === "10.5.0" &&
        model.summary.calibrationVersion === "10.5.2",
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
        html.includes(
            'data-decision-final="false"'
        ) &&
        html.includes("暫定候選：") &&
        !html.includes("推薦：閒家") &&
        html.includes("暫定 MC") &&
        html.includes("不可作為正式下注依據") &&
        html.includes("策略：") &&
        html.includes("信號：") &&
        html.includes("證據：") &&
        html.includes("估計可靠度：") &&
        html.includes("相對優勢：") &&
        html.includes("EV 證據範圍：") &&
        html.includes("阻擋：") &&
        html.includes("機會：") &&
        html.includes("趨勢：") &&
        html.includes("距正 EV：") &&
        html.includes("安全門檻：") &&
        html.includes("data-trend-series"),
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
            "exact-opportunity-confirmation-v10.5.4" &&
        fields.get("[data-ai-decision]")
            .textContent.includes("閒家") &&
        fields.get("[data-ai-strategy]")
            .textContent === "相對最佳" &&
        !fields.get("[data-ai-feedback]")
            .textContent.includes("等待 Runtime"),
        "AI Closed-Loop 尚未接入 Exact Confirmation"
    );

    controller.destroy();

    messages.push("✓ Dashboard 首屏、趨勢監測與 AI Closed-Loop 已接入 Exact 決策結果");

    return `
${messages.join("\n")}

AI Live Decision Engine / Exact Confirmation UX V10.5.4 測試完成

Positive EV：通過
Relative Best：通過
Weak Signal：通過
Real Risk Calibration：通過
Evidence Bounds：通過
Unbounded Estimate Guard：通過
Kelly Minimum Bet Blocker：通過
No Edge：通過
Insufficient Data：通過
Risk Too High：通過
No Forced Bet：通過
Legacy Facade：通過
Dashboard Decision UI：通過
AI Closed-Loop Bridge：通過
Signal Trend UX Bridge：通過
`;
}
