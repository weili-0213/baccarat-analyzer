/**
 * Baccarat Analyzer V10.6.0
 * Path: tests/decisionStabilityExplainability.test.js
 * Test Runner: tests/main.js
 * Decision Stability & Explainability Engine regressions.
 */

import AILiveDecisionEngine, {
    LiveDecisionAction
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import DecisionStabilityExplainabilityEngine, {
    DECISION_STABILITY_EXPLAINABILITY_VERSION,
    OPPORTUNITY_MATURITY_WEIGHTS,
    StableDecisionLifecycle,
    StableMarketState
} from "../runtime/liveCasino/DecisionStabilityExplainabilityEngine.js";

import LiveCasinoPerformancePolicy, {
    DECISION_STABILITY_EXPLAINABILITY_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";

import LiveCasinoUXController, {
    DECISION_STABILITY_EXPLAINABILITY_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import {
    DECISION_STABILITY_EXPLAINABILITY_STYLES_VERSION,
    LIVE_CASINO_UX_CSS
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";

import {
    DECISION_STABILITY_EXPLAINABILITY_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";

import {
    DASHBOARD_DECISION_STABILITY_EXPLAINABILITY_VERSION
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function analysis({
    round = 22,
    method = "hybrid",
    playerEV = -0.012418,
    bankerEV = -0.012396,
    key = "banker",
    shouldBet = false,
    amount = 0,
    confidence = 0.82,
    risk = 0.95
} = {}) {
    const exact =
        method === "hybrid" ||
        method === "exact";

    const otherKey =
        key === "banker"
            ? "player"
            : "banker";

    return {
        generatedAfterRound:
            round,
        method,
        probability: {
            player: 0.4459,
            banker: 0.4584,
            tie: 0.0957
        },
        ev: {
            player: playerEV,
            banker: bankerEV,
            tie: -0.1387
        },
        monteCarlo: {
            sampleSize: 1200
        },
        exact:
            exact
                ? {
                    probability: {
                        player: 0.4459,
                        banker: 0.4584,
                        tie: 0.0957
                    }
                }
                : null,
        confidence: {
            overall:
                confidence,
            [key]: {
                confidenceScore:
                    confidence,
                zScore:
                    1.959963984540054
            }
        },
        overallConfidence:
            confidence,
        risk: {
            [key]: {
                relativeRisk:
                    risk,
                standardDeviation:
                    0.01,
                riskLabel:
                    "中等風險"
            }
        },
        kelly: {
            [key]: {
                fullKelly: 0.02,
                appliedKelly: 0.01,
                rawAmount:
                    amount,
                amount,
                bankroll: 10000
            }
        },
        amount: {
            [key]:
                amount
        },
        ranking: [
            {
                key,
                ev:
                    key === "banker"
                        ? bankerEV
                        : playerEV,
                confidence,
                risk,
                standardDeviation: 0.01,
                amount,
                rawAmount:
                    amount
            },
            {
                key:
                    otherKey,
                ev:
                    otherKey === "banker"
                        ? bankerEV
                        : playerEV,
                confidence:
                    confidence - 0.03,
                risk,
                standardDeviation: 0.01
            }
        ],
        recommendation: {
            shouldBet,
            action:
                shouldBet
                    ? "bet"
                    : "skip",
            key,
            bet:
                key,
            amount:
                shouldBet
                    ? amount
                    : 0,
            limits: {
                minBet: 100,
                maxBet: 10000
            }
        }
    };
}


export default async function decisionStabilityExplainabilityTest() {
    const messages = [];

    assert(
        [
            DECISION_STABILITY_EXPLAINABILITY_VERSION,
            DECISION_STABILITY_EXPLAINABILITY_POLICY_VERSION,
            DECISION_STABILITY_EXPLAINABILITY_UX_VERSION,
            DECISION_STABILITY_EXPLAINABILITY_STYLES_VERSION,
            DECISION_STABILITY_EXPLAINABILITY_FACTORY_VERSION,
            DASHBOARD_DECISION_STABILITY_EXPLAINABILITY_VERSION
        ].every(version =>
            version === "10.6.0"
        ) &&
        Object.values(
            OPPORTUNITY_MATURITY_WEIGHTS
        ).reduce(
            (total, value) =>
                total + value,
            0
        ) === 100,
        "V10.6 版本或成熟度 100 分契約錯誤"
    );

    messages.push(
        "✓ V10.6 全層版本與成熟度權重契約正確"
    );

    let tick = 1000;
    const core =
        new AILiveDecisionEngine();
    const stability =
        new DecisionStabilityExplainabilityEngine({
            clock: () => ++tick
        });

    stability.start({
        sequence: 1,
        shoeId: 3
    });

    const provisionalAnalysis =
        analysis({
            method: "monteCarlo"
        });
    const provisional =
        stability.acceptProvisional(
            provisionalAnalysis,
            core.decide(
                provisionalAnalysis
            ),
            {
                sequence: 1
            }
        );

    assert(
        provisional.lifecycle ===
            StableDecisionLifecycle.EXACT_CONFIRMING &&
        provisional.action ===
            LiveDecisionAction.WAIT &&
        provisional.amount === 0 &&
        provisional.recommendationLabel ===
            "Exact 確認中" &&
        provisional.finalSnapshot === null,
        "MC 暫定結果不應成為正式決策"
    );

    const closeAnalysis =
        analysis();
    const closeDecision =
        stability.acceptFinal(
            closeAnalysis,
            core.decide(
                closeAnalysis
            ),
            {
                sequence: 1,
                durationMs: 218
            }
        );

    assert(
        closeDecision.lifecycle ===
            StableDecisionLifecycle.FINAL_WAIT &&
        closeDecision.marketState ===
            StableMarketState.CLOSE_CALL &&
        closeDecision.closeCall.active === true &&
        Math.abs(
            closeDecision.closeCall.gap -
            0.000022
        ) < 1e-12 &&
        closeDecision.headlineLabel ===
            "市場狀態" &&
        closeDecision.recommendationLabel ===
            "閒莊近似持平" &&
        closeDecision.action ===
            LiveDecisionAction.WAIT &&
        closeDecision.amount === 0 &&
        closeDecision.reason.includes(
            "-1.2418%"
        ) &&
        closeDecision.reason.includes(
            "-1.2396%"
        ) &&
        closeDecision.reason.includes(
            "0.0022%"
        ),
        "近似持平區未阻止隱藏精度硬選邊"
    );

    messages.push(
        "✓ 閒莊近似持平區會發布中立 FINAL_WAIT 與精確差距"
    );

    const snapshot =
        closeDecision.finalSnapshot;
    let mutationBlocked = false;

    try {
        snapshot.amount = 999;
    }
    catch {
        mutationBlocked = true;
    }

    assert(
        Object.isFrozen(snapshot) &&
        Object.isFrozen(
            snapshot.maturity
        ) &&
        snapshot.amount === 0 &&
        mutationBlocked &&
        snapshot.snapshotId.includes(
            "3:22:"
        ),
        "FinalDecisionSnapshot 不是深層不可變更"
    );

    const lateSameRound =
        analysis({
            round: 22,
            playerEV: -0.008,
            bankerEV: 0.01,
            shouldBet: true,
            amount: 500
        });
    const lateDecision =
        stability.acceptFinal(
            lateSameRound,
            core.decide(
                lateSameRound
            ),
            {
                sequence: 1,
                roundId: 22
            }
        );

    assert(
        lateDecision.finalSnapshot ===
            snapshot &&
        lateDecision.action ===
            LiveDecisionAction.WAIT &&
        lateDecision.amount === 0 &&
        stability.getAuditTrail()
            .length === 1,
        "同局遲到的第二份 Exact 不可改寫第一份正式快照"
    );

    const maturity =
        closeDecision
            .opportunityMaturity;

    assert(
        maturity.maximum === 100 &&
        maturity.score ===
            maturity.components
                .reduce(
                    (total, item) =>
                        total +
                        item.earned,
                    0
                ) &&
        maturity.components.length === 5 &&
        maturity.missingConditions
            .some(condition =>
                condition.includes(
                    "閒莊 EV 差距"
                )
            ) &&
        maturity.safetyNote.includes(
            "不會"
        ),
        "成熟度分解或缺少條件說明錯誤"
    );

    messages.push(
        "✓ 最終快照不可變更，成熟度 0–100 可逐項解釋"
    );

    const positiveStability =
        new DecisionStabilityExplainabilityEngine();
    const positiveAnalysis =
        analysis({
            round: 23,
            playerEV: -0.008,
            bankerEV: 0.006,
            shouldBet: true,
            amount: 100
        });

    positiveStability.start({
        sequence: 2,
        roundId: 23
    });

    const positive =
        positiveStability.acceptFinal(
            positiveAnalysis,
            core.decide(
                positiveAnalysis
            ),
            {
                sequence: 2,
                roundId: 23
            }
        );

    assert(
        positive.lifecycle ===
            StableDecisionLifecycle.FINAL_BET &&
        positive.marketState ===
            StableMarketState.ACTIONABLE &&
        positive.action ===
            LiveDecisionAction.BET &&
        positive.recommendationLabel ===
            "莊家" &&
        positive.amount === 100 &&
        positive.opportunityMaturity
            .score === 100,
        "Exact 正 EV 完整門檻未產生 FINAL_BET"
    );

    const scoredButBlockedEngine =
        new DecisionStabilityExplainabilityEngine();
    const highRiskAnalysis =
        analysis({
            round: 24,
            playerEV: -0.008,
            bankerEV: 0.006,
            shouldBet: true,
            amount: 100,
            risk: 1.2
        });

    scoredButBlockedEngine.start({
        sequence: 3,
        roundId: 24
    });

    const scoredButBlocked =
        scoredButBlockedEngine
            .acceptFinal(
                highRiskAnalysis,
                core.decide(
                    highRiskAnalysis
                ),
                {
                    sequence: 3,
                    roundId: 24
                }
            );

    assert(
        scoredButBlocked
            .opportunityMaturity
            .score > 50 &&
        scoredButBlocked.action ===
            LiveDecisionAction.WAIT &&
        scoredButBlocked.amount === 0 &&
        scoredButBlocked.marketState ===
            StableMarketState.RISK_BLOCKED,
        "成熟度分數不應越過風險門檻強迫下注"
    );

    messages.push(
        "✓ 只有 Exact 全門檻可 FINAL_BET，成熟度永不強迫下注"
    );

    const staleEngine =
        new DecisionStabilityExplainabilityEngine();
    staleEngine.start({
        sequence: 4,
        roundId: 30
    });

    const staleResult =
        staleEngine.acceptFinal(
            analysis({
                round: 31,
                playerEV: -0.01,
                bankerEV: 0.01,
                shouldBet: true,
                amount: 200
            }),
            positive,
            {
                sequence: 4,
                roundId: 31
            }
        );

    assert(
        staleResult === false &&
        staleEngine.summary
            .finalSnapshot === null &&
        staleEngine.summary.lifecycle ===
            StableDecisionLifecycle.ANALYZING,
        "跨局舊 Exact 不應覆寫目前正式決策"
    );

    const audit =
        stability.getAuditTrail()[0];

    assert(
        audit.provisional
            .evidence.includes("MC") &&
        audit.final
            .evidence.includes("Exact") &&
        audit.durationMs === 218 &&
        audit.marketState ===
            StableMarketState.CLOSE_CALL &&
        audit.finalAmount === 0 &&
        audit.finalized === true,
        "每局 MC → Exact 決策稽核資料不完整"
    );

    messages.push(
        "✓ 跨局舊結果被拒絕，MC→Exact 每局稽核完整"
    );

    const game = {
        nextAnalysis:
            closeAnalysis,
        shoeNumber: 3
    };
    const controller =
        new LiveCasinoUXController({
            game
        });
    const html =
        controller.renderDecisionHTML();
    const dock =
        controller.renderDecisionDockHTML();

    assert(
        html.includes(
            'data-stable-lifecycle="final-wait"'
        ) &&
        html.includes(
            'data-market-state="close-call"'
        ) &&
        html.includes(
            'data-close-call="true"'
        ) &&
        html.includes(
            "市場狀態"
        ) &&
        html.includes(
            "閒莊近似持平"
        ) &&
        html.includes(
            "-1.2418%"
        ) &&
        html.includes(
            "-1.2396%"
        ) &&
        html.includes(
            "機會成熟度"
        ) &&
        html.includes(
            "缺少條件"
        ) &&
        dock.includes(
            "最終觀望"
        ) &&
        dock.includes(
            "閒莊差距 0.0022%"
        ) &&
        dock.includes(
            "建議額 0"
        ),
        "Dashboard 或 Decision Dock 未接入 V10.6 正式結果"
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
            "decision-stability-explainability-v10.6" &&
        fields.get("[data-ai-decision]")
            .textContent.includes(
                "閒莊近似持平"
            ) &&
        fields.get("[data-ai-strategy]")
            .textContent ===
            "閒莊近似持平" &&
        fields.get("[data-ai-adaptive]")
            .textContent.includes(
                "機會成熟度"
            ) &&
        LIVE_CASINO_UX_CSS.includes(
            ".v106Maturity"
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            '[data-market-state="close-call"]'
        ),
        "AI Closed-Loop 或 V10.6 響應式樣式未接入"
    );

    controller.destroy();

    messages.push(
        "✓ Dashboard、Dock、AI Closed-Loop 已同步唯一最終快照"
    );

    return `
${messages.join("\n")}

Decision Stability & Explainability Engine V10.6.0 測試完成

Close-Call Neutral Band：通過
Exact-Only Formal Decision：通過
Immutable Final Snapshot：通過
Late Same-Round Snapshot Lock：通過
Opportunity Maturity 0–100：通過
Maturity Never Forces Bet：通過
Stale Result Rejection：通過
Per-Round Decision Audit：通過
Dashboard Explainability：通過
Decision Dock Sync：通過
AI Closed-Loop Bridge：通過
`;
}
