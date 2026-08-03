/**
 * Baccarat Analyzer V4.4
 * tests/sessionCharts.test.js
 */

import SessionChartsPanel, {
    SESSION_CHARTS_PANEL_VERSION,
    SessionChartType
} from "../components/SessionChartsPanel.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createReport() {
    return {
        summary: {
            rounds: 6
        },

        statistics: {
            winners: {
                player: 3,
                banker: 2,
                tie: 1
            },

            winRate: {
                player: 0.5,
                banker: 1 / 3,
                tie: 1 / 6
            },

            sideBets: {
                playerPair: 1,
                bankerPair: 2,
                natural: 2,
                super6: 1,
                playerDragonBonus: 2,
                bankerDragonBonus: 1
            }
        },

        analysis: {
            recommendationRate: 0.5,
            recommendedBets: {
                player: 3,
                banker: 1,
                tie: 0,
                other: 0
            }
        },

        betting: {
            totalProfit: 200
        },

        formatted: {
            recommendationRate: "50.0%"
        },

        charts: {
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
            ],

            recentRounds: [
                {
                    winner: "Player"
                },
                {
                    winner: "Banker"
                },
                {
                    winner: "Tie"
                }
            ]
        }
    };
}


export default function sessionChartsTest() {
    const messages = [];

    assert(
        SESSION_CHARTS_PANEL_VERSION ===
            "4.4.0",
        "SessionChartsPanel 版本錯誤"
    );

    const panel =
        new SessionChartsPanel();

    const report =
        createReport();

    messages.push("✓ V4.4 版本正確");

    const equity =
        panel.template(report);

    assert(
        equity.includes(
            'data-chart="equity"'
        ) &&
        equity.includes(
            "<polyline"
        ) &&
        equity.includes(
            "200"
        ),
        "Equity Chart 錯誤"
    );

    messages.push("✓ Equity Line Chart 正確");

    panel.setChart(
        SessionChartType.WINNERS
    );

    const winners =
        panel.template(report);

    assert(
        winners.includes(
            'data-chart="winners"'
        ) &&
        winners.includes(
            "session-donut-chart"
        ) &&
        winners.includes(
            "50.0%"
        ),
        "Winner Donut Chart 錯誤"
    );

    messages.push("✓ Winner Donut Chart 正確");

    panel.setChart(
        SessionChartType.RECOMMENDATIONS
    );

    const recommendations =
        panel.template(report);

    assert(
        recommendations.includes(
            'data-chart="recommendations"'
        ) &&
        recommendations.includes(
            'data-bet="player"'
        ) &&
        recommendations.includes(
            "50.0%"
        ),
        "Recommendation Chart 錯誤"
    );

    messages.push("✓ Recommendation Bar Chart 正確");

    panel.setChart(
        SessionChartType.SIDE_BETS
    );

    const sideBets =
        panel.template(report);

    assert(
        sideBets.includes(
            'data-chart="side-bets"'
        ) &&
        sideBets.includes(
            "Super 6"
        ) &&
        sideBets.includes(
            "閒龍寶"
        ),
        "Side Bet Chart 錯誤"
    );

    messages.push("✓ Side Bet Column Chart 正確");

    panel.setChart(
        SessionChartType.TIMELINE
    );

    const timeline =
        panel.template(report);

    assert(
        timeline.includes(
            'data-chart="timeline"'
        ) &&
        timeline.includes(
            'data-winner="player"'
        ) &&
        timeline.includes(
            'data-winner="banker"'
        ) &&
        timeline.includes(
            'data-winner="tie"'
        ),
        "Timeline Chart 錯誤"
    );

    messages.push("✓ Result Timeline 正確");

    const normalized =
        panel.normalizeEquity(
            report.charts
                .equityCurve
        );

    assert(
        normalized.length === 3 &&
        normalized[0].x === 0 &&
        normalized[2].x === 100 &&
        normalized.every(point =>
            Number.isFinite(point.y)
        ),
        "Equity normalization 錯誤"
    );

    messages.push("✓ Chart Data normalization 正確");

    const emptyReport =
        createReport();

    emptyReport.charts.equityCurve = [];

    panel.setChart(
        SessionChartType.EQUITY
    );

    assert(
        panel.template(emptyReport)
            .includes(
                "尚無下注資金曲線"
            ),
        "Empty Chart 錯誤"
    );

    messages.push("✓ Empty Chart 正確");

    assert(
        panel.summary.version === "4.4.0" &&
        panel.summary.activeChart ===
            SessionChartType.EQUITY &&
        panel.summary.mounted === false,
        "SessionChartsPanel summary 錯誤"
    );

    messages.push("✓ summary 正確");

    return `
${messages.join("\n")}

Dashboard Charts V4.4 測試完成

Equity Line Chart：通過
Winner Donut Chart：通過
Recommendation Bars：通過
Side Bet Columns：通過
Result Timeline：通過
Data Normalization：通過
Empty Chart：通過
`;
}
