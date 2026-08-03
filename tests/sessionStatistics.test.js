/**
 * Baccarat Analyzer V4.4
 * tests/sessionStatistics.test.js
 *
 * StatisticsPage V4.4 integration test.
 */

import StatisticsPage, {
    STATISTICS_PAGE_VERSION
} from "../pages/statistics.js";

import SessionStatisticsPanel, {
    SESSION_STATISTICS_PANEL_VERSION
} from "../components/SessionStatisticsPanel.js";

import SessionChartsPanel, {
    SESSION_CHARTS_PANEL_VERSION,
    SessionChartType
} from "../components/SessionChartsPanel.js";

import SessionStore
    from "../analysis/SessionStore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


/**
 * Minimal DOM test double supporting both:
 *
 * - SessionStatisticsPanel
 * - SessionChartsPanel
 * - StatisticsPage V4.4 shell
 */
function createHostElement(type = "root") {
    const element = {
        type,
        innerHTML: "",
        parentElement: null,
        children: new Map(),

        querySelector(selector) {
            if (
                selector ===
                "[data-statistics-summary-host]"
            ) {
                return this.children.get(
                    "summary-host"
                ) ?? null;
            }

            if (
                selector ===
                "[data-statistics-charts-host]"
            ) {
                return this.children.get(
                    "charts-host"
                ) ?? null;
            }

            if (
                selector ===
                "[data-session-statistics]"
            ) {
                return this.children.get(
                    "statistics-panel"
                ) ?? null;
            }

            if (
                selector ===
                "[data-session-charts]"
            ) {
                return this.children.get(
                    "charts-panel"
                ) ?? null;
            }

            return null;
        },

        querySelectorAll() {
            return [];
        }
    };

    Object.defineProperty(
        element,
        "innerHTML",
        {
            get() {
                return this._innerHTML ?? "";
            },

            set(value) {
                this._innerHTML =
                    String(value);

                this.children.clear();

                if (
                    this._innerHTML.includes(
                        "data-statistics-summary-host"
                    )
                ) {
                    const summaryHost =
                        createHostElement(
                            "summary-host"
                        );

                    const chartsHost =
                        createHostElement(
                            "charts-host"
                        );

                    summaryHost.parentElement =
                        this;

                    chartsHost.parentElement =
                        this;

                    this.children.set(
                        "summary-host",
                        summaryHost
                    );

                    this.children.set(
                        "charts-host",
                        chartsHost
                    );
                }

                if (
                    this._innerHTML.includes(
                        "data-session-statistics"
                    )
                ) {
                    const panelRoot = {
                        parentElement:
                            this,

                        querySelectorAll() {
                            return [];
                        }
                    };

                    this.children.set(
                        "statistics-panel",
                        panelRoot
                    );
                }

                if (
                    this._innerHTML.includes(
                        "data-session-charts"
                    )
                ) {
                    const chartRoot = {
                        parentElement:
                            this,

                        querySelectorAll() {
                            return [];
                        }
                    };

                    this.children.set(
                        "charts-panel",
                        chartRoot
                    );
                }
            }
        }
    );

    return element;
}


function createDocument() {
    const root =
        createHostElement();

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
        STATISTICS_PAGE_VERSION ===
            "4.4.0" &&
        SESSION_STATISTICS_PANEL_VERSION ===
            "4.3.0" &&
        SESSION_CHARTS_PANEL_VERSION ===
            "4.4.0",
        "V4.4 Statistics 版本錯誤"
    );

    messages.push(
        "✓ V4.4 Statistics 版本正確"
    );

    const documentRef =
        createDocument();

    const store =
        new SessionStore({
            autoSave:
                false,

            clock:
                () =>
                    "2026-08-03T10:00:00.000Z",

            idFactory:
                () =>
                    "statistics-test"
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
            sessionStore:
                store,

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
        page.summaryHost &&
        page.chartsHost,
        "V4.4 Statistics shell 建立失敗"
    );

    assert(
        page.summaryHost
            .innerHTML
            .includes(
                "Session Statistics"
            ) &&
        page.chartsHost
            .innerHTML
            .includes(
                "Statistics Visualization"
            ),
        "Statistics 或 Charts DOM 缺少必要區塊"
    );

    messages.push(
        "✓ Statistics 與 Charts DOM 正確"
    );

    assert(
        page.report.summary.rounds ===
            2 &&
        page.report.statistics
            .winners
            .player ===
            1 &&
        page.report.statistics
            .winners
            .banker ===
            1 &&
        page.report.betting
            .totalProfit ===
            100,
        "Session Report 串接錯誤"
    );

    messages.push(
        "✓ Store → Analyzer → Report 串接正確"
    );

    assert(
        page.summaryHost
            .innerHTML
            .includes(
                "50.0%"
            ) &&
        page.summaryHost
            .innerHTML
            .includes(
                "ROI：100.0%"
            ),
        "Win Rate 或 ROI 顯示錯誤"
    );

    messages.push(
        "✓ Win Rate 與 ROI 顯示正確"
    );

    page.setMode(
        "details"
    );

    assert(
        page.panel
            .summary
            .mode ===
            "details",
        "Overview／Details 切換錯誤"
    );

    page.setChart(
        SessionChartType.WINNERS
    );

    assert(
        page.chartsPanel
            .summary
            .activeChart ===
            SessionChartType.WINNERS &&
        page.chartsHost
            .innerHTML
            .includes(
                'data-chart="winners"'
            ),
        "Chart 切換錯誤"
    );

    messages.push(
        "✓ Mode 與 Chart 切換正確"
    );

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
            .rounds ===
            2 &&
        text.includes(
            "局數：2"
        ),
        "Export 整合錯誤"
    );

    messages.push(
        "✓ JSON／CSV／Text Export 正確"
    );

    store.addRound({
        winner: "Player",
        playerScore: 9,
        bankerScore: 2,
        margin: 7
    });

    assert(
        page.report.summary.rounds ===
            3 &&
        page.summaryHost
            .innerHTML
            .includes(
                "Session Statistics"
            ) &&
        page.chartsHost
            .innerHTML
            .includes(
                "Statistics Visualization"
            ),
        "SessionStore event 未自動刷新兩個面板"
    );

    messages.push(
        "✓ Store Event 自動刷新正確"
    );

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
        emptyPage.report
            .summary
            .rounds ===
            0 &&
        emptyPage.summaryHost
            .innerHTML
            .includes(
                "Session Statistics"
            ) &&
        emptyPage.chartsHost
            .innerHTML
            .includes(
                "尚無下注資金曲線"
            ),
        "空 Session 顯示錯誤"
    );

    messages.push(
        "✓ Empty Session 正確"
    );

    assert(
        page.summary.version ===
            "4.4.0" &&
        page.summary.mounted ===
            true &&
        page.summary.hasReport ===
            true &&
        page.summary.rounds ===
            3 &&
        page.summary.activeChart ===
            SessionChartType.WINNERS,
        "StatisticsPage summary 錯誤"
    );

    page.destroy();

    assert(
        page.root === null &&
        page.report === null &&
        page.summaryHost === null &&
        page.chartsHost === null,
        "destroy() 錯誤"
    );

    messages.push(
        "✓ summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Dashboard Statistics V4.4 測試完成

Statistics DOM：通過
Charts DOM：通過
Session Pipeline：通過
Win Rate：通過
ROI：通過
Mode Switch：通過
Chart Switch：通過
Auto Refresh：通過
Exports：通過
Empty Session：通過
`;
}
