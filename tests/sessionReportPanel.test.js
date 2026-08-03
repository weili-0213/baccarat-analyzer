/**
 * Baccarat Analyzer V4.5
 * tests/sessionReportPanel.test.js
 */

import SessionReportPanel, {
    SESSION_REPORT_PANEL_VERSION
} from "../components/SessionReportPanel.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createReport() {
    return {
        header: {
            shoeNumber: 8,
            generatedAt:
                "2026-08-03T15:00:00.000Z"
        },

        summary: {
            rounds: 12,
            dominantWinner: "player",
            trend: "player",
            longestStreak: 4
        },

        statistics: {
            winners: {
                player: 6,
                banker: 5,
                tie: 1
            }
        },

        analysis: {
            count: 12,
            shouldBetCount: 4,
            skipCount: 8,
            recommendedBets: {
                player: 3,
                banker: 1,
                tie: 0,
                other: 0
            }
        },

        betting: {
            count: 4,
            wins: 3,
            losses: 1,
            pushes: 0,
            averageStake: 250,
            averageProfit: 50,
            endingBankrollChange: 200
        },

        formatted: {
            recommendationRate: "33.3%",
            averageConfidence: "75.0%",
            totalStake: "1000",
            totalProfit: "200",
            roi: "20.0%",
            maxDrawdown: "100",
            playerRate: "50.0%",
            bankerRate: "41.7%",
            tieRate: "8.3%",
            winRate: "75.0%",
            averageDurationMs: "24.5"
        },

        metadata: {
            casino: "test"
        }
    };
}


export default async function sessionReportPanelTest() {
    const messages = [];

    assert(
        SESSION_REPORT_PANEL_VERSION ===
            "4.5.0",
        "SessionReportPanel 版本錯誤"
    );

    const copied = [];
    let printCount = 0;

    const panel =
        new SessionReportPanel({
            navigatorRef: {
                clipboard: {
                    async writeText(value) {
                        copied.push(value);
                    }
                }
            },

            windowRef: {
                print() {
                    printCount++;
                }
            }
        });

    const report =
        createReport();

    const html =
        panel.template(report);

    assert(
        html.includes(
            "百家樂 Session 報告"
        ) &&
        html.includes(
            "Session 摘要"
        ) &&
        html.includes(
            "勝方統計"
        ) &&
        html.includes(
            "下注結果"
        ),
        "Report DOM 錯誤"
    );

    messages.push(
        "✓ V4.5 Report DOM 正確"
    );

    const text =
        panel.buildText(report);

    assert(
        text.includes(
            "局數：12"
        ) &&
        text.includes(
            "ROI：20.0%"
        ) &&
        text.includes(
            "閒：6（50.0%）"
        ),
        "Text Report 錯誤"
    );

    messages.push(
        "✓ Text Report 正確"
    );

    const copiedText =
        await panel.copy(report);

    assert(
        copied.length === 1 &&
        copied[0] === copiedText &&
        panel.lastCopiedText === copiedText,
        "Clipboard Copy 錯誤"
    );

    messages.push(
        "✓ Clipboard Copy 正確"
    );

    const standalone =
        panel.exportHTML(report);

    assert(
        standalone.startsWith(
            "<!DOCTYPE html>"
        ) &&
        standalone.includes(
            "<title>百家樂 Session 報告</title>"
        ) &&
        standalone.includes(
            "局數"
        ) &&
        panel.lastExportHTML ===
            standalone,
        "Standalone HTML Export 錯誤"
    );

    messages.push(
        "✓ HTML Export 正確"
    );

    panel.print();

    assert(
        printCount === 1,
        "Print 錯誤"
    );

    messages.push(
        "✓ Print 正確"
    );

    panel.report =
        report;

    assert(
        panel.summary.version ===
            "4.5.0" &&
        panel.summary.hasReport ===
            true &&
        panel.summary.rounds ===
            12 &&
        panel.summary.copied ===
            true &&
        panel.summary.exportedHTML ===
            true,
        "SessionReportPanel summary 錯誤"
    );

    messages.push(
        "✓ summary 正確"
    );

    return `
${messages.join("\n")}

Dashboard Reports V4.5 測試完成

Report DOM：通過
Text Report：通過
Clipboard：通過
HTML Export：通過
Print：通過
Summary：通過
`;
}
