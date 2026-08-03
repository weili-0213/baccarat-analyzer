/**
 * Baccarat Analyzer V4.2
 * tests/sessionReport.test.js
 */

import SessionReport, {
    SESSION_REPORT_VERSION
} from "../analysis/SessionReport.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createAnalysis() {
    return {
        version:
            "4.0.0",

        shoeNumber:
            5,

        startedAt:
            "2026-08-03T10:00:00.000Z",

        endedAt:
            "2026-08-03T11:00:00.000Z",

        durationMs:
            3600000,

        generatedAt:
            "2026-08-03T11:00:01.000Z",

        rounds:
            10,

        winners: {
            player: 5,
            banker: 4,
            tie: 1
        },

        winRate: {
            player: 0.5,
            banker: 0.4,
            tie: 0.1
        },

        sideBets: {
            playerPair: 1,
            bankerPair: 2,
            super6: 1
        },

        streak: {
            longest: {
                player: 3,
                banker: 2,
                tie: 1
            },
            current: {
                winner: "Player",
                length: 2
            },
            sequences: []
        },

        trend: {
            type: "player",
            strength: 0.1,
            windowSize: 10
        },

        scores: {
            playerAverage: 5.2,
            bankerAverage: 4.8,
            averageMargin: 2.1,
            maxMargin: 7
        },

        analysis: {
            count: 10,
            shouldBetCount: 4,
            skipCount: 6,
            recommendationRate: 0.4,
            averageConfidence: 0.75,
            averageDurationMs: 24.5,
            recommendedBets: {
                player: 3,
                banker: 1,
                tie: 0,
                other: 0
            }
        },

        betting: {
            count: 4,
            totalStake: 1000,
            totalProfit: 200,
            roi: 0.2,
            wins: 3,
            losses: 1,
            pushes: 0,
            winRate: 0.75,
            averageStake: 250,
            averageProfit: 50,
            maxDrawdown: 100,
            endingBankrollChange: 200,
            equityCurve: [
                {
                    round: 1,
                    equity: 100,
                    profit: 100
                },
                {
                    round: 2,
                    equity: 0,
                    profit: -100
                },
                {
                    round: 3,
                    equity: 200,
                    profit: 200
                }
            ]
        },

        recentRounds: [
            {
                winner: "Player"
            },
            {
                winner: "Banker"
            }
        ],

        metadata: {
            casino: "test"
        },

        summary: {
            rounds: 10,
            dominantWinner: "player",
            trend: "player",
            longestStreak: 3,
            analyses: 10,
            recommendationRate: 0.4,
            bets: 4,
            roi: 0.2,
            totalProfit: 200
        }
    };
}


export default function sessionReportTest() {
    const messages = [];

    assert(
        SESSION_REPORT_VERSION ===
            "4.2.0",
        "SessionReport 版本錯誤"
    );

    const builder =
        new SessionReport({
            percentDigits: 1,
            moneyDigits: 0
        });

    const report =
        builder.create(
            createAnalysis()
        );

    assert(
        report.version === "4.2.0" &&
        report.header.title ===
            "百家樂 Session 報告" &&
        report.header.shoeNumber === 5,
        "Header 錯誤"
    );

    messages.push(
        "✓ V4.2 Header 正確"
    );

    assert(
        report.summary.rounds === 10 &&
        report.summary.dominantWinner ===
            "player" &&
        report.summary.longestStreak === 3,
        "Summary 錯誤"
    );

    messages.push(
        "✓ Summary 正確"
    );

    assert(
        report.statistics.winners.player === 5 &&
        report.statistics.winRate.banker === 0.4 &&
        report.statistics.trend.type === "player",
        "Statistics 錯誤"
    );

    messages.push(
        "✓ Statistics 正確"
    );

    assert(
        report.analysis.count === 10 &&
        report.analysis.shouldBetCount === 4 &&
        report.analysis.averageConfidence === 0.75,
        "Analysis section 錯誤"
    );

    messages.push(
        "✓ Analysis section 正確"
    );

    assert(
        report.betting.totalStake === 1000 &&
        report.betting.totalProfit === 200 &&
        report.betting.roi === 0.2 &&
        report.betting.equityCurve.length === 3,
        "Betting section 錯誤"
    );

    messages.push(
        "✓ Betting section 正確"
    );

    assert(
        report.charts.winnerDistribution.length === 3 &&
        report.charts.winnerRates.length === 3 &&
        report.charts.equityCurve.length === 3,
        "Chart ViewModel 錯誤"
    );

    messages.push(
        "✓ Chart ViewModel 正確"
    );

    assert(
        report.formatted.playerRate === "50.0%" &&
        report.formatted.roi === "20.0%" &&
        report.formatted.totalProfit === "200",
        "Formatted 欄位錯誤"
    );

    messages.push(
        "✓ Formatted 欄位正確"
    );

    const json =
        builder.toJSON(
            report
        );

    const parsed =
        JSON.parse(json);

    assert(
        parsed.summary.rounds === 10 &&
        parsed.betting.roi === 0.2,
        "JSON Export 錯誤"
    );

    messages.push(
        "✓ JSON Export 正確"
    );

    const csv =
        builder.toCSV(
            report
        );

    assert(
        csv.includes(
            "section,metric,value"
        ) &&
        csv.includes(
            "betting,totalProfit,200"
        ) &&
        csv.includes(
            "betting,roi,0.2"
        ),
        "CSV Export 錯誤"
    );

    messages.push(
        "✓ CSV Export 正確"
    );

    const text =
        builder.toText(
            report
        );

    assert(
        text.includes(
            "百家樂 Session 報告"
        ) &&
        text.includes(
            "局數：10"
        ) &&
        text.includes(
            "ROI：20.0%"
        ),
        "Text Export 錯誤"
    );

    messages.push(
        "✓ Text Export 正確"
    );

    const exported =
        builder.create(
            createAnalysis()
        );

    exported.statistics
        .winners
        .player = 999;

    assert(
        builder.lastReport
            .statistics
            .winners
            .player === 5,
        "create() 應回傳深拷貝"
    );

    messages.push(
        "✓ Immutable Report 正確"
    );

    assert(
        builder.summary.version === "4.2.0" &&
        builder.summary.runCount === 2 &&
        builder.summary.hasReport === true &&
        builder.summary.lastROI === 0.2,
        "SessionReport summary 錯誤"
    );

    builder.clear();

    assert(
        builder.lastReport === null,
        "clear() 錯誤"
    );

    messages.push(
        "✓ summary 與 clear() 正確"
    );

    return `
${messages.join("\n")}

Session Report V4.2 測試完成

Header：通過
Summary：通過
Statistics：通過
Analysis Section：通過
Betting Section：通過
Chart ViewModel：通過
JSON Export：通過
CSV Export：通過
Text Export：通過
`;
}

