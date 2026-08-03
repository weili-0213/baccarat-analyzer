/**
 * Baccarat Analyzer V4.3
 * tests/sessionStatistics.test.js
 */

import StatisticsPage, {
    STATISTICS_PAGE_VERSION
} from "../pages/statistics.js";

import SessionStatisticsPanel, {
    SESSION_STATISTICS_PANEL_VERSION
} from "../components/SessionStatisticsPanel.js";

import SessionStore
    from "../analysis/SessionStore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createDocument() {
    const root = {
        innerHTML: "",
        querySelector(selector) {
            if (
                selector ===
                "[data-session-statistics]"
            ) {
                return {
                    parentElement: root,
                    querySelectorAll() {
                        return [];
                    }
                };
            }

            return null;
        }
    };

    return {
        root,
        querySelector(selector) {
            return (
                selector === "#statistics"
                    ? root
                    : null
            );
        }
    };
}


export default function sessionStatisticsTest() {
    const messages = [];

    assert(
        STATISTICS_PAGE_VERSION === "4.3.0" &&
        SESSION_STATISTICS_PANEL_VERSION === "4.3.0",
        "V4.3 版本錯誤"
    );

    messages.push("✓ V4.3 版本正確");

    const documentRef =
        createDocument();

    const store =
        new SessionStore({
            autoSave: false,
            clock:
                () =>
                    "2026-08-03T10:00:00.000Z",
            idFactory:
                () => "statistics-test"
        });

    store.start({
        shoeNumber: 1
    });

    store.addRound({
        winner: "Player",
        playerScore: 8,
        bankerScore: 4,
        margin: 4
    });

    store.addRound({
        winner: "Banker",
        playerScore: 3,
        bankerScore: 7,
        margin: 4
    });

    store.addAnalysis({
        shouldBet: true,
        recommendedBet: "player",
        overallConfidence: 0.8,
        durationMs: 20
    });

    store.addBet({
        bet: "player",
        amount: 100,
        profit: 100
    });

    const page =
        new StatisticsPage({
            sessionStore: store,
            documentRef
        });

    const root =
        page.mount(
            "#statistics"
        );

    assert(
        root === documentRef.root,
        "StatisticsPage mount() 錯誤"
    );

    assert(
        documentRef.root.innerHTML.includes(
            "Session Statistics"
        ) &&
        documentRef.root.innerHTML.includes(
            "勝方分布"
        ) &&
        documentRef.root.innerHTML.includes(
            "下注績效"
        ),
        "Statistics DOM 缺少必要區塊"
    );

    messages.push("✓ Dashboard Statistics DOM 正確");

    assert(
        page.report.summary.rounds === 2 &&
        page.report.statistics.winners.player === 1 &&
        page.report.statistics.winners.banker === 1 &&
        page.report.betting.totalProfit === 100,
        "Session Report 串接錯誤"
    );

    messages.push("✓ Store → Analyzer → Report 串接正確");

    assert(
        documentRef.root.innerHTML.includes(
            "50.0%"
        ) &&
        documentRef.root.innerHTML.includes(
            "ROI：100.0%"
        ),
        "格式化統計值錯誤"
    );

    messages.push("✓ Win Rate 與 ROI 顯示正確");

    page.setMode("details");

    assert(
        page.panel.summary.mode === "details",
        "詳細模式切換錯誤"
    );

    messages.push("✓ Overview／Details 切換正確");

    const csv =
        page.exportCSV();

    const json =
        page.exportJSON();

    const text =
        page.exportText();

    assert(
        csv.includes(
            "betting,totalProfit,100"
        ) &&
        JSON.parse(json)
            .summary
            .rounds === 2 &&
        text.includes(
            "局數：2"
        ),
        "Export 整合錯誤"
    );

    messages.push("✓ JSON／CSV／Text Export 正確");

    store.addRound({
        winner: "Player",
        playerScore: 9,
        bankerScore: 2,
        margin: 7
    });

    assert(
        page.report.summary.rounds === 3,
        "SessionStore event 未自動刷新"
    );

    messages.push("✓ Store Event 自動刷新正確");

    const emptyDocument =
        createDocument();

    const emptyPage =
        new StatisticsPage({
            documentRef:
                emptyDocument
        });

    emptyPage.mount(
        "#statistics"
    );

    assert(
        emptyPage.report.summary.rounds === 0 &&
        emptyDocument.root.innerHTML.includes(
            "Session Statistics"
        ),
        "空 Session 顯示錯誤"
    );

    messages.push("✓ Empty Session 正確");

    assert(
        page.summary.version === "4.3.0" &&
        page.summary.mounted === true &&
        page.summary.hasReport === true &&
        page.summary.rounds === 3,
        "StatisticsPage summary 錯誤"
    );

    page.destroy();

    assert(
        page.root === null &&
        page.report === null,
        "destroy() 錯誤"
    );

    messages.push("✓ summary 與 destroy() 正確");

    return `
${messages.join("\n")}

Dashboard Statistics V4.3 測試完成

DOM：通過
Session Pipeline：通過
Win Rate：通過
ROI：通過
Mode Switch：通過
Auto Refresh：通過
Exports：通過
Empty Session：通過
`;
}
