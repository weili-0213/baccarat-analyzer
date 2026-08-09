/**
 * Baccarat Analyzer V10.5.3
 * Path: tests/signalTrendMonitor.test.js
 * Test Runner: tests/main.js
 * Signal trend, opportunity classification, dedupe, and shoe reset regressions.
 */

import AILiveDecisionEngine, {
    LiveDecisionAction
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import SignalTrendMonitor, {
    SIGNAL_TREND_MONITOR_VERSION,
    SignalOpportunityState,
    SignalTrendDirection
} from "../runtime/liveCasino/SignalTrendMonitor.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function analysis({
    round,
    playerEV,
    bankerEV,
    tieEV = -0.14,
    method = "hybrid",
    shouldBet = false,
    bet = "player",
    amount = 0,
    kellyAmount = amount
}) {
    const exact =
        method === "hybrid" ||
        method === "exact";

    const risk = {
        relativeRisk: 0.96,
        standardDeviation: 0.96,
        riskLabel: "中等風險"
    };

    return {
        generatedAfterRound:
            round,
        method,
        probability: {
            player: 0.45,
            banker: 0.46,
            tie: 0.09
        },
        ev: {
            player: playerEV,
            banker: bankerEV,
            tie: tieEV
        },
        monteCarlo: {
            sampleSize: 1200,
            simulations: 1200
        },
        exact:
            exact
                ? {
                    probability: {
                        player: 0.45,
                        banker: 0.46,
                        tie: 0.09
                    }
                }
                : null,
        confidence: {
            overall: 0.82,
            player: {
                confidenceScore: 0.82,
                zScore: 1.959963984540054
            },
            banker: {
                confidenceScore: 0.82,
                zScore: 1.959963984540054
            }
        },
        overallConfidence: 0.82,
        risk: {
            player: risk,
            banker: risk,
            tie: {
                relativeRisk: 0.32,
                standardDeviation: 2.56,
                riskLabel: "低風險"
            }
        },
        kelly: {
            [bet]: {
                fullKelly:
                    kellyAmount / 5000,
                appliedKelly:
                    kellyAmount / 10000,
                rawAmount:
                    kellyAmount,
                amount:
                    kellyAmount,
                bankroll: 10000
            }
        },
        amount: {
            [bet]:
                kellyAmount
        },
        ranking: [
            {
                name: "player",
                key: "player",
                ev: playerEV,
                confidence: 0.82,
                risk: 0.96,
                standardDeviation: 0.96,
                amount:
                    bet === "player"
                        ? kellyAmount
                        : 0
            },
            {
                name: "banker",
                key: "banker",
                ev: bankerEV,
                confidence: 0.82,
                risk: 0.96,
                standardDeviation: 0.96,
                amount:
                    bet === "banker"
                        ? kellyAmount
                        : 0
            },
            {
                name: "tie",
                key: "tie",
                ev: tieEV,
                confidence: 0.82,
                risk: 0.32,
                standardDeviation: 2.56,
                amount: 0
            }
        ],
        recommendation: {
            action:
                shouldBet
                    ? "bet"
                    : "skip",
            shouldBet,
            bet:
                shouldBet
                    ? bet
                    : null,
            amount:
                shouldBet
                    ? amount
                    : 0,
            confidence: 0.82,
            risk: 0.96,
            reasons:
                shouldBet
                    ? [
                        "已通過完整推薦門檻"
                    ]
                    : [
                        "目前沒有符合條件的正 EV 主注"
                    ],
            limits: {
                minBet: 100,
                maxBet: 10000,
                roundTo: 100
            }
        }
    };
}


function decide(engine, input) {
    return engine.decide(input);
}


export default async function signalTrendMonitorTest() {
    const messages = [];
    const engine =
        new AILiveDecisionEngine();
    const monitor =
        new SignalTrendMonitor();

    assert(
        SIGNAL_TREND_MONITOR_VERSION ===
            "10.5.3" &&
        monitor.summary.ready ===
            false,
        "V10.5.3 SignalTrendMonitor 版本或初始狀態錯誤"
    );

    const round1 =
        analysis({
            round: 1,
            playerEV: -0.014,
            bankerEV: -0.020
        });
    const decision1 =
        decide(engine, round1);
    const first =
        monitor.observe(
            round1,
            decision1,
            {
                shoeNumber: 1
            }
        );

    assert(
        first.ready === true &&
        first.direction ===
            SignalTrendDirection.NEW &&
        first.opportunityState ===
            SignalOpportunityState.NONE &&
        first.observedCount === 1 &&
        first.targetKey === "player" &&
        Math.abs(
            first.distanceToPositiveEV -
                0.014
        ) < 1e-12,
        "首局趨勢或距離正 EV 計算錯誤"
    );

    const round2 =
        analysis({
            round: 2,
            playerEV: -0.008,
            bankerEV: -0.018
        });
    const second =
        monitor.observe(
            round2,
            decide(engine, round2),
            {
                shoeNumber: 1
            }
        );

    assert(
        second.direction ===
            SignalTrendDirection.STRENGTHENING &&
        second.opportunityState ===
            SignalOpportunityState.WATCH &&
        Math.abs(
            second.deltaEV - 0.006
        ) < 1e-12,
        "EV 增強與觀察區分類錯誤"
    );

    const quickRound3 =
        analysis({
            round: 3,
            playerEV: -0.004,
            bankerEV: -0.013,
            method: "monteCarlo"
        });
    const approaching =
        monitor.observe(
            quickRound3,
            decide(
                engine,
                quickRound3
            ),
            {
                shoeNumber: 1
            }
        );

    assert(
        approaching.direction ===
            SignalTrendDirection.STRENGTHENING &&
        approaching.opportunityState ===
            SignalOpportunityState.WATCH &&
        approaching.trendEvidenceQualified ===
            false &&
        approaching.bestStreak === 3 &&
        approaching.observedCount === 3 &&
        approaching.series.length === 3,
        "接近正 EV 或連續最佳統計錯誤"
    );

    const refinedRound3 =
        analysis({
            round: 3,
            playerEV: -0.0035,
            bankerEV: -0.0125,
            method: "hybrid"
        });
    const refined =
        monitor.observe(
            refinedRound3,
            decide(
                engine,
                refinedRound3
            ),
            {
                shoeNumber: 1
            }
        );

    assert(
        refined.observedCount === 3 &&
        monitor.history.length === 3 &&
        refined.opportunityState ===
            SignalOpportunityState.APPROACHING &&
        refined.trendEvidenceQualified ===
            true &&
        refined.series.at(-1)
            .evidenceLabel === "Exact" &&
        Math.abs(
            refined.currentEV + 0.0035
        ) < 1e-12,
        "同局 Quick → Exact 應更新原紀錄而非重複累計"
    );

    monitor.observe(
        refinedRound3,
        decide(
            engine,
            refinedRound3
        ),
        {
            shoeNumber: 1
        }
    );

    assert(
        monitor.history.length === 3,
        "同一分析重複 render 不可增加趨勢筆數"
    );

    const flippedRound4 =
        analysis({
            round: 4,
            playerEV: -0.006,
            bankerEV: -0.002
        });
    const flipped =
        monitor.observe(
            flippedRound4,
            decide(
                engine,
                flippedRound4
            ),
            {
                shoeNumber: 1
            }
        );

    assert(
        flipped.targetKey === "banker" &&
        flipped.bestStreak === 1 &&
        flipped.series.length === 4 &&
        flipped.series[0].ev ===
            -0.020,
        "最佳主注切換後應比較同一下注項目的歷史 EV"
    );

    const newShoeRound0 =
        analysis({
            round: 0,
            playerEV: -0.012,
            bankerEV: -0.016
        });
    const newShoe =
        monitor.observe(
            newShoeRound0,
            decide(
                engine,
                newShoeRound0
            ),
            {
                shoeNumber: 2
            }
        );

    assert(
        newShoe.shoeId === "2" &&
        newShoe.observedCount === 1 &&
        newShoe.direction ===
            SignalTrendDirection.NEW &&
        monitor.history.length === 1,
        "新牌靴沒有清除舊趨勢"
    );

    messages.push(
        "✓ 同局精算去重、跨局趨勢與新牌靴重置正確"
    );

    const opportunityMonitor =
        new SignalTrendMonitor();

    const blockedAnalysis =
        analysis({
            round: 1,
            playerEV: 0.006,
            bankerEV: -0.012,
            shouldBet: false,
            kellyAmount: 30
        });
    const blockedDecision =
        decide(
            engine,
            blockedAnalysis
        );
    const blocked =
        opportunityMonitor.observe(
            blockedAnalysis,
            blockedDecision,
            {
                shoeNumber: 3
            }
        );

    assert(
        blocked.opportunityState ===
            SignalOpportunityState.POSITIVE_BLOCKED &&
        blockedDecision.action ===
            LiveDecisionAction.WAIT &&
        blocked.gates.positiveEV ===
            true &&
        blocked.gates.kelly ===
            false &&
        blocked.passedGateCount === 4 &&
        blocked.primaryBlocker
            .includes("Kelly"),
        "正 EV 但 Kelly 未達標的機會分類錯誤"
    );

    const actionableAnalysis =
        analysis({
            round: 2,
            playerEV: 0.02,
            bankerEV: -0.02,
            shouldBet: true,
            bet: "player",
            amount: 100,
            kellyAmount: 100
        });
    const actionableDecision =
        decide(
            engine,
            actionableAnalysis
        );
    const actionable =
        opportunityMonitor.observe(
            actionableAnalysis,
            actionableDecision,
            {
                shoeNumber: 3
            }
        );

    assert(
        actionable.opportunityState ===
            SignalOpportunityState.ACTIONABLE &&
        actionableDecision.action ===
            LiveDecisionAction.BET &&
        actionable.passedGateCount === 5 &&
        actionable.distanceToPositiveEV === 0,
        "真正可下注機會分類錯誤"
    );

    messages.push(
        "✓ 接近、正 EV 待放行與可執行機會分層正確"
    );

    const weakeningMonitor =
        new SignalTrendMonitor();

    for (
        const [round, playerEV] of [
            [1, -0.002],
            [2, -0.006],
            [3, -0.012]
        ]
    ) {
        const input =
            analysis({
                round,
                playerEV,
                bankerEV:
                    playerEV - 0.01
            });

        weakeningMonitor.observe(
            input,
            decide(engine, input),
            {
                shoeNumber: 4
            }
        );
    }

    assert(
        weakeningMonitor.summary
            .direction ===
            SignalTrendDirection.WEAKENING &&
        weakeningMonitor.summary
            .opportunityState ===
            SignalOpportunityState.NONE,
        "訊號減弱分類錯誤"
    );

    const bounded =
        new SignalTrendMonitor({
            maxEntries: 3,
            trendWindow: 3
        });

    for (let round = 1; round <= 4; round++) {
        const input =
            analysis({
                round,
                playerEV:
                    -0.02 +
                    round * 0.001,
                bankerEV: -0.03
            });

        bounded.observe(
            input,
            decide(engine, input),
            {
                shoeNumber: 5
            }
        );
    }

    assert(
        bounded.history.length === 3 &&
        bounded.history[0].round === 2,
        "趨勢歷史上限錯誤"
    );

    let invalidOptionsRejected =
        false;

    try {
        new SignalTrendMonitor({
            trendWindow: 20
        });
    }
    catch (error) {
        invalidOptionsRejected =
            error instanceof RangeError;
    }

    assert(
        invalidOptionsRejected,
        "無效趨勢選項應被拒絕"
    );

    messages.push(
        "✓ 減弱趨勢、歷史上限與選項防呆正確"
    );

    return `
${messages.join("\n")}

Signal Trend & Opportunity Monitor V10.5.3 測試完成

Same-Round Refinement Dedupe：通過
Cross-Round EV Trend：通過
Same-Bet Comparison：通過
Shoe Reset：通過
Approaching Opportunity：通過
Positive EV Blocked：通過
Actionable Opportunity：通過
Weakening Signal：通過
Bounded History：通過
No Forced Bet：通過
`;
}
