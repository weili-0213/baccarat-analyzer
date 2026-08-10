/**
 * Baccarat Analyzer V10.5.4
 * Path: tests/exactOpportunityConfirmation.test.js
 * Test Runner: tests/main.js
 * Exact Opportunity Confirmation lifecycle and no-provisional-bet regressions.
 */

import AILiveDecisionEngine, {
    EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION,
    LiveDecisionAction,
    LiveDecisionCategory
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import ExactOpportunityConfirmation, {
    EXACT_OPPORTUNITY_CONFIRMATION_VERSION,
    ExactOpportunityState,
    isExactOpportunityAnalysis
} from "../runtime/liveCasino/ExactOpportunityConfirmation.js";

import LiveCasinoPerformancePolicy, {
    EXACT_OPPORTUNITY_CONFIRMATION_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";

import LiveCasinoUXController, {
    EXACT_OPPORTUNITY_CONFIRMATION_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import {
    EXACT_OPPORTUNITY_CONFIRMATION_STYLES_VERSION,
    LIVE_CASINO_UX_CSS
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";

import {
    EXACT_OPPORTUNITY_CONFIRMATION_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function wait(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}


function analysis({
    round = 9,
    method = "monteCarlo",
    playerEV = -0.03,
    bankerEV = 0.02,
    shouldBet = true,
    amount = 200,
    sampleSize = 1200
} = {}) {
    const exact =
        method === "hybrid" ||
        method === "exact";

    return {
        generatedAfterRound:
            round,
        method,
        probability: {
            player: 0.4367,
            banker: 0.4667,
            tie: 0.0966
        },
        ev: {
            player: playerEV,
            banker: bankerEV,
            tie: -0.13
        },
        monteCarlo: {
            sampleSize
        },
        exact:
            exact
                ? {
                    probability: {
                        player: 0.4367,
                        banker: 0.4667,
                        tie: 0.0966
                    }
                }
                : null,
        confidence: {
            overall: 0.82,
            banker: {
                confidenceScore: 0.82,
                zScore: 1.959963984540054
            }
        },
        overallConfidence: 0.82,
        risk: {
            banker: {
                relativeRisk: 0.95,
                standardDeviation: 0.01,
                riskLabel: "中等風險"
            }
        },
        kelly: {
            banker: {
                fullKelly: 0.02,
                appliedKelly: 0.01,
                rawAmount: amount,
                amount,
                bankroll: 10000
            }
        },
        amount: {
            banker:
                amount
        },
        ranking: [
            {
                key: "banker",
                ev: bankerEV,
                confidence: 0.82,
                risk: 0.95,
                standardDeviation: 0.01,
                amount,
                rawAmount: amount
            },
            {
                key: "player",
                ev: playerEV,
                confidence: 0.78,
                risk: 0.95,
                standardDeviation: 0.01
            }
        ],
        recommendation: {
            shouldBet,
            action:
                shouldBet
                    ? "bet"
                    : "skip",
            key: "banker",
            bet: "banker",
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


function exactNegative(round = 9) {
    return analysis({
        round,
        method: "hybrid",
        playerEV: -0.0139,
        bankerEV: -0.0126,
        shouldBet: false,
        amount: 0
    });
}


export default async function exactOpportunityConfirmationTest() {
    const messages = [];

    assert(
        [
            EXACT_OPPORTUNITY_CONFIRMATION_VERSION,
            EXACT_OPPORTUNITY_CONFIRMATION_ENGINE_VERSION,
            EXACT_OPPORTUNITY_CONFIRMATION_POLICY_VERSION,
            EXACT_OPPORTUNITY_CONFIRMATION_UX_VERSION,
            EXACT_OPPORTUNITY_CONFIRMATION_STYLES_VERSION,
            EXACT_OPPORTUNITY_CONFIRMATION_FACTORY_VERSION
        ].every(version =>
            version === "10.5.4"
        ),
        "V10.5.4 Exact Opportunity Confirmation 版本契約錯誤"
    );

    messages.push(
        "✓ V10.5.4 Exact Opportunity Confirmation 版本契約正確"
    );

    const engine =
        new AILiveDecisionEngine();

    const strongMC =
        engine.decide(
            analysis()
        );

    assert(
        strongMC.evidence
            .statisticallyPositiveEV === true &&
        strongMC.evidence
            .exactConfirmationPass === false &&
        strongMC.category ===
            LiveDecisionCategory.WEAK_SIGNAL &&
        strongMC.action ===
            LiveDecisionAction.WAIT &&
        strongMC.amount === 0 &&
        strongMC.blockers.some(blocker =>
            blocker.code ===
                "EXACT_CONFIRMATION_REQUIRED"
        ),
        "強勢 MC 正 EV 不得略過 Exact 直接下注"
    );

    const exactPositive =
        engine.decide(
            analysis({
                method: "hybrid"
            })
        );

    assert(
        exactPositive.evidence
            .exactConfirmationPass === true &&
        exactPositive.category ===
            LiveDecisionCategory.POSITIVE_EV &&
        exactPositive.action ===
            LiveDecisionAction.BET &&
        exactPositive.amount === 200,
        "Exact 正 EV 通過完整門檻後未產生正式決策"
    );

    messages.push(
        "✓ MC 永不直接下注，Exact 才能發布正式下注額"
    );

    let tick = 1000;
    const confirmation =
        new ExactOpportunityConfirmation({
            clock: () => ++tick
        });

    confirmation.start({
        sequence: 7
    });

    assert(
        confirmation.summary.state ===
            ExactOpportunityState.QUICK_RUNNING,
        "Quick lifecycle 起始狀態錯誤"
    );

    assert(
        confirmation.acceptProvisional(
            analysis(),
            strongMC,
            {
                sequence: 7
            }
        ) === true,
        "同局 MC 暫定結果未被接受"
    );

    const provisional =
        confirmation.decisionFor(
            strongMC
        );

    assert(
        provisional.decisionFinal === false &&
        provisional.decisionProvisional === true &&
        provisional.action ===
            LiveDecisionAction.WAIT &&
        provisional.amount === 0 &&
        provisional.headlineLabel ===
            "暫定候選",
        "暫定決策未被安全降級"
    );

    confirmation.beginExact({
        sequence: 7
    });

    assert(
        confirmation.summary.state ===
            ExactOpportunityState.CONFIRMING &&
        confirmation.acceptExact(
            analysis({
                round: 10,
                method: "hybrid"
            }),
            exactPositive,
            {
                sequence: 7
            }
        ) === false,
        "不同局 Exact 結果不應覆寫目前決策"
    );

    const finalNegativeAnalysis =
        exactNegative();
    const finalNegativeDecision =
        engine.decide(
            finalNegativeAnalysis
        );

    assert(
        confirmation.acceptExact(
            finalNegativeAnalysis,
            finalNegativeDecision,
            {
                sequence: 7
            }
        ) === true,
        "同一局 Exact 結果未被接受"
    );

    const finalDecision =
        confirmation.decisionFor(
            finalNegativeDecision
        );

    assert(
        finalDecision.decisionFinal === true &&
        finalDecision.decisionProvisional === false &&
        finalDecision.action ===
            LiveDecisionAction.WAIT &&
        confirmation.summary
            .comparison
            .replacedProvisional === true &&
        confirmation.summary
            .comparison
            .provisional.ev === 0.02 &&
        confirmation.summary
            .comparison
            .final.ev === -0.0126,
        "MC → Exact 最終取代記錄錯誤"
    );

    messages.push(
        "✓ 同局 Exact 原子取代暫定 MC，不接受跨局舊結果"
    );

    const calls = [];
    const game = {
        nextAnalysis: null,
        shoeNumber: 1,
        isManualRoundActive: false,
        async analyzeNextRound(options = {}) {
            calls.push(options.mode);
            await wait(
                options.mode === "hybrid"
                    ? 12
                    : 2
            );

            this.nextAnalysis =
                options.mode === "hybrid"
                    ? exactNegative()
                    : analysis();

            return this.nextAnalysis;
        }
    };

    const controller =
        new LiveCasinoUXController({
            game,
            policy:
                new LiveCasinoPerformancePolicy({
                    decisionDeadlineMs: 250,
                    refineDelayMs: 0
                })
        });

    const quick =
        await controller.runAnalysis({
            profile: "quick"
        });

    assert(
        quick.decision.action ===
            LiveDecisionAction.WAIT &&
        quick.decision.amount === 0 &&
        quick.decision.confirmation
            .state ===
            ExactOpportunityState.CONFIRMING &&
        calls[0] === "monteCarlo",
        "控制器發布的 Quick 結果不是安全暫定狀態"
    );

    const provisionalHTML =
        controller.renderDecisionHTML();

    assert(
        provisionalHTML.includes(
            'data-decision-final="false"'
        ) &&
        provisionalHTML.includes(
            'data-confirmation-state="confirming"'
        ) &&
        provisionalHTML.includes(
            "Exact 精算確認中"
        ) &&
        provisionalHTML.includes(
            "不可下注"
        ),
        "Dashboard 未清楚標示暫定／確認中狀態"
    );

    await wait(30);

    const summary =
        controller.summary;
    const finalHTML =
        controller.renderDecisionHTML();
    const dockHTML =
        controller.renderDecisionDockHTML();

    assert(
        calls.join(",") ===
            "monteCarlo,hybrid" &&
        summary.exactConfirmation
            .state ===
            ExactOpportunityState.CONFIRMED &&
        summary.decision.decisionFinal ===
            true &&
        summary.decision.action ===
            LiveDecisionAction.WAIT &&
        summary.signalTrend
            .observedCount === 1 &&
        finalHTML.includes(
            'data-decision-final="true"'
        ) &&
        finalHTML.includes(
            "最終 Exact"
        ) &&
        finalHTML.includes(
            "最終 Exact 已取代暫定估算"
        ) &&
        finalHTML.includes("+2.00%") &&
        finalHTML.includes("-1.26%") &&
        dockHTML.includes("Exact 唯一正式結果") &&
        dockHTML.includes("建議額 0"),
        "Exact 最終結果、單局趨勢或 Dock 同步錯誤"
    );

    messages.push(
        "✓ Dashboard 與 Dock 同步顯示暫定、確認中、最終取代結果"
    );

    const failingGame = {
        nextAnalysis: null,
        shoeNumber: 2,
        isManualRoundActive: false,
        async analyzeNextRound(options = {}) {
            if (options.mode === "hybrid") {
                throw new Error(
                    "Exact worker unavailable"
                );
            }

            this.nextAnalysis =
                analysis({
                    round: 1
                });
            return this.nextAnalysis;
        }
    };

    const failingController =
        new LiveCasinoUXController({
            game:
                failingGame,
            policy:
                new LiveCasinoPerformancePolicy({
                    decisionDeadlineMs: 250,
                    refineDelayMs: 0
                })
        });

    await failingController
        .runAnalysis();
    await wait(10);

    assert(
        failingController.summary
            .exactConfirmation
            .state ===
            ExactOpportunityState.FAILED &&
        failingController.summary
            .decision.action ===
            LiveDecisionAction.WAIT &&
        failingController.summary
            .decision.amount === 0 &&
        failingController
            .renderDecisionDockHTML()
            .includes(
                "安全規則維持觀望"
            ),
        "Exact 失敗時未維持安全觀望"
    );

    assert(
        isExactOpportunityAnalysis(
            exactNegative()
        ) === true &&
        isExactOpportunityAnalysis(
            analysis()
        ) === false &&
        LIVE_CASINO_UX_CSS.includes(
            ".v1054ConfirmationState"
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            ".v1054ResultReplacement"
        ),
        "Exact evidence 辨識或 V10.5.4 樣式契約錯誤"
    );

    controller.destroy();
    failingController.destroy();

    messages.push(
        "✓ Exact 失敗保持 WAIT，且不留下暫定下注額"
    );

    return `
${messages.join("\n")}

Exact Opportunity Confirmation V10.5.4 測試完成

Strong MC No Bet：通過
Exact-Only Action：通過
Same-Round Atomic Replacement：通過
Stale Exact Rejection：通過
Final-Only Trend History：通過
Dashboard State Labels：通過
Decision Dock Sync：通過
Exact Failure Safety：通過
`;
}
