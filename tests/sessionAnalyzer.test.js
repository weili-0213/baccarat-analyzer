/**
 * Baccarat Analyzer V4.0
 * tests/sessionAnalyzer.test.js
 */

import SessionAnalyzer, {
    SESSION_ANALYZER_VERSION,
    SessionTrend
} from "../analysis/SessionAnalyzer.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function approximatelyEqual(
    left,
    right,
    tolerance = 1e-12
) {
    return (
        Math.abs(left - right) <=
        tolerance
    );
}


function createRounds() {
    return [
        {
            winner: "Player",
            playerScore: 8,
            bankerScore: 3,
            playerNatural: true,
            bankerNatural: false,
            playerPair: false,
            bankerPair: false,
            super6: false,
            margin: 5
        },
        {
            winner: "Player",
            playerScore: 7,
            bankerScore: 4,
            playerPair: true,
            bankerPair: false,
            playerNatural: false,
            bankerNatural: false,
            super6: false,
            margin: 3
        },
        {
            winner: "Player",
            playerScore: 6,
            bankerScore: 1,
            playerPair: false,
            bankerPair: false,
            playerNatural: false,
            bankerNatural: false,
            super6: false,
            margin: 5
        },
        {
            winner: "Banker",
            playerScore: 4,
            bankerScore: 6,
            playerPair: false,
            bankerPair: true,
            playerNatural: false,
            bankerNatural: false,
            super6: true,
            margin: 2
        },
        {
            winner: "Banker",
            playerScore: 2,
            bankerScore: 8,
            playerPair: false,
            bankerPair: false,
            playerNatural: false,
            bankerNatural: true,
            super6: false,
            margin: 6
        },
        {
            winner: "Tie",
            playerScore: 7,
            bankerScore: 7,
            playerPair: false,
            bankerPair: false,
            playerNatural: false,
            bankerNatural: false,
            super6: false,
            margin: 0
        }
    ];
}


export default function sessionAnalyzerTest() {
    const messages = [];

    assert(
        SESSION_ANALYZER_VERSION ===
            "4.0.0",
        "SessionAnalyzer 版本錯誤"
    );

    const analyzer =
        new SessionAnalyzer({
            recentWindow: 6,
            trendThreshold: 0.1
        });

    messages.push(
        "✓ V4.0 建立正確"
    );

    const history = {
        getAll() {
            return createRounds();
        },
        get count() {
            return 6;
        }
    };

    const report =
        analyzer.analyze({
            history,
            shoeNumber: 3,
            startedAt:
                "2026-08-03T10:00:00.000Z",
            endedAt:
                "2026-08-03T11:00:00.000Z",
            analyses: [
                {
                    shouldBet: true,
                    recommendedBet: "player",
                    overallConfidence: 0.8,
                    durationMs: 20
                },
                {
                    shouldBet: false,
                    recommendedBet: null,
                    overallConfidence: 0.6,
                    durationMs: 30
                }
            ],
            bets: [
                {
                    round: 1,
                    bet: "player",
                    amount: 100,
                    profit: 100
                },
                {
                    round: 2,
                    bet: "banker",
                    amount: 100,
                    profit: -100
                },
                {
                    round: 3,
                    bet: "player",
                    amount: 200,
                    profit: 200
                }
            ],
            metadata: {
                casino: "test"
            }
        });

    assert(
        report.rounds === 6 &&
        report.winners.player === 3 &&
        report.winners.banker === 2 &&
        report.winners.tie === 1,
        "勝方統計錯誤"
    );

    assert(
        approximatelyEqual(
            report.winRate.player,
            0.5
        ) &&
        approximatelyEqual(
            report.winRate.banker,
            2 / 6
        ),
        "勝率統計錯誤"
    );

    messages.push(
        "✓ 勝方與勝率正確"
    );

    assert(
        report.sideBets.playerPair === 1 &&
        report.sideBets.bankerPair === 1 &&
        report.sideBets.super6 === 1 &&
        report.sideBets.playerDragonBonus === 2 &&
        report.sideBets.bankerDragonBonus === 1,
        "側注統計錯誤"
    );

    messages.push(
        "✓ Pair、Natural、Super 6、Dragon Bonus 正確"
    );

    assert(
        report.streak.longest.player === 3 &&
        report.streak.longest.banker === 2 &&
        report.streak.current.winner === "Tie" &&
        report.streak.current.length === 1,
        "連續統計錯誤"
    );

    messages.push(
        "✓ Streak 正確"
    );

    assert(
        report.trend.type ===
            SessionTrend.PLAYER &&
        report.trend.windowSize === 6,
        "Trend 判斷錯誤"
    );

    messages.push(
        "✓ Trend 正確"
    );

    assert(
        report.analysis.count === 2 &&
        report.analysis.shouldBetCount === 1 &&
        report.analysis.skipCount === 1 &&
        approximatelyEqual(
            report.analysis
                .recommendationRate,
            0.5
        ) &&
        approximatelyEqual(
            report.analysis
                .averageConfidence,
            0.7
        ),
        "分析摘要錯誤"
    );

    messages.push(
        "✓ Analysis summary 正確"
    );

    assert(
        report.betting.count === 3 &&
        report.betting.totalStake === 400 &&
        report.betting.totalProfit === 200 &&
        approximatelyEqual(
            report.betting.roi,
            0.5
        ) &&
        report.betting.maxDrawdown === 100,
        "Betting 統計錯誤"
    );

    assert(
        report.betting.equityCurve.length === 3 &&
        report.betting.equityCurve[2].equity === 200,
        "Equity Curve 錯誤"
    );

    messages.push(
        "✓ ROI、Profit、Drawdown 與 Equity Curve 正確"
    );

    assert(
        report.durationMs === 3600000 &&
        report.summary.dominantWinner === "player" &&
        report.summary.longestStreak === 3 &&
        report.summary.totalProfit === 200,
        "Session summary 錯誤"
    );

    messages.push(
        "✓ Duration 與 Summary 正確"
    );

    const empty =
        analyzer.analyze({
            rounds: []
        });

    assert(
        empty.rounds === 0 &&
        empty.trend.type ===
            SessionTrend.EMPTY &&
        empty.summary.dominantWinner === null &&
        empty.betting.roi === 0,
        "空 Session 處理錯誤"
    );

    messages.push(
        "✓ 空 Session 正確"
    );

    const comparison =
        analyzer.compare([
            {
                rounds: createRounds(),
                bets: [
                    {
                        amount: 100,
                        profit: 50
                    }
                ]
            },
            {
                rounds: [
                    {
                        winner: "Banker"
                    }
                ],
                bets: [
                    {
                        amount: 100,
                        profit: -25
                    }
                ]
            }
        ]);

    assert(
        comparison.aggregate.sessions === 2 &&
        comparison.aggregate.rounds === 7 &&
        comparison.aggregate.totalProfit === 25 &&
        comparison.aggregate.totalStake === 200 &&
        approximatelyEqual(
            comparison.aggregate.roi,
            0.125
        ),
        "Session compare 錯誤"
    );

    messages.push(
        "✓ Multi-session compare 正確"
    );

    assert(
        analyzer.summary.version === "4.0.0" &&
        analyzer.summary.runCount === 4 &&
        analyzer.summary.hasReport === true,
        "SessionAnalyzer summary 錯誤"
    );

    analyzer.clear();

    assert(
        analyzer.lastReport === null,
        "clear() 錯誤"
    );

    messages.push(
        "✓ summary 與 clear() 正確"
    );

    return `
${messages.join("\\n")}

Session Analyzer V4.0 測試完成

Winner Statistics：通過
Side Bets：通過
Streak：通過
Trend：通過
Analysis Summary：通過
Betting ROI：通過
Drawdown：通過
Session Compare：通過
`;
}
