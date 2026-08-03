/**
 * Baccarat Analyzer V4.6
 * tests/sessionStatistics.test.js
 *
 * StatisticsPage V4.6 integration test.
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

import SessionReportPanel, {
    SESSION_REPORT_PANEL_VERSION
} from "../components/SessionReportPanel.js";

import LiveStatusPanel, {
    LIVE_STATUS_PANEL_VERSION
} from "../components/LiveStatusPanel.js";

import SessionStore
    from "../analysis/SessionStore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createHostElement(type = "root") {
    const element = {
        type,
        _innerHTML: "",
        parentElement: null,
        children: new Map(),

        querySelector(selector) {
            const map = {
                "[data-statistics-live-host]":
                    "live-host",

                "[data-statistics-summary-host]":
                    "summary-host",

                "[data-statistics-charts-host]":
                    "charts-host",

                "[data-statistics-report-host]":
                    "report-host",

                "[data-live-status-panel]":
                    "live-panel",

                "[data-session-statistics]":
                    "statistics-panel",

                "[data-session-charts]":
                    "charts-panel",

                "[data-session-report-panel]":
                    "report-panel"
            };

            const key = map[selector];

            return key
                ? this.children.get(key) ?? null
                : null;
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
                return this._innerHTML;
            },

            set(value) {
                this._innerHTML =
                    String(value);

                this.children.clear();

                const hostDefinitions = [
                    [
                        "data-statistics-layout-host",
                        "layout-host"
                    ],
                    [
                        "data-statistics-live-host",
                        "live-host"
                    ],
                    [
                        "data-statistics-summary-host",
                        "summary-host"
                    ],
                    [
                        "data-statistics-charts-host",
                        "charts-host"
                    ],
                    [
                        "data-statistics-report-host",
                        "report-host"
                    ]
                ];

                for (const [token, key] of hostDefinitions) {
                    if (this._innerHTML.includes(token)) {
                        const child =
                            createHostElement(key);

                        child.parentElement =
                            this;

                        this.children.set(
                            key,
                            child
                        );
                    }
                }

                const panelDefinitions = [
                    [
                        "data-live-status-panel",
                        "live-panel"
                    ],
                    [
                        "data-session-statistics",
                        "statistics-panel"
                    ],
                    [
                        "data-session-charts",
                        "charts-panel"
                    ],
                    [
                        "data-session-report-panel",
                        "report-panel"
                    ]
                ];

                for (const [token, key] of panelDefinitions) {
                    if (this._innerHTML.includes(token)) {
                        this.children.set(
                            key,
                            {
                                parentElement:
                                    this,

                                querySelectorAll() {
                                    return [];
                                },

                                querySelector() {
                                    return null;
                                }
                            }
                        );
                    }
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
            return selector === "#statistics"
                ? root
                : null;
        }
    };
}


export default function sessionStatisticsTest() {
    const messages = [];

    assert(
        STATISTICS_PAGE_VERSION === "4.7.0" &&
        SESSION_STATISTICS_PANEL_VERSION === "4.3.0" &&
        SESSION_CHARTS_PANEL_VERSION === "4.4.0" &&
        SESSION_REPORT_PANEL_VERSION === "4.5.0" &&
        LIVE_STATUS_PANEL_VERSION === "4.6.0",
        "V4.6 Statistics 版本錯誤"
    );

    messages.push(
        "✓ V4.6 Statistics 版本正確"
    );

    const documentRef =
        createDocument();

    const store =
        new SessionStore({
            autoSave: false,

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
            sessionStore: store,
            documentRef,

            liveOptions: {
                immediate: false,
                refreshInterval: 0
            }
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
        page.liveHost &&
        page.summaryHost &&
        page.chartsHost &&
        page.reportHost,
        "V4.6 Statistics shell 建立失敗"
    );

    assert(
        page.liveHost.innerHTML.includes(
            "即時更新中"
        ) &&
        page.summaryHost.innerHTML.includes(
            "Session Statistics"
        ) &&
        page.chartsHost.innerHTML.includes(
            "Statistics Visualization"
        ) &&
        page.reportHost.innerHTML.includes(
            "百家樂 Session 報告"
        ),
        "Live／Statistics／Charts／Report DOM 缺少必要區塊"
    );

    messages.push(
        "✓ Live、Statistics、Charts、Report DOM 正確"
    );

    assert(
        page.report.summary.rounds === 2 &&
        page.report.statistics.winners.player === 1 &&
        page.report.statistics.winners.banker === 1 &&
        page.report.betting.totalProfit === 100,
        "Session Report 串接錯誤"
    );

    messages.push(
        "✓ Store → Analyzer → Report 串接正確"
    );

    page.setMode(
        "details"
    );

    page.setChart(
        SessionChartType.WINNERS
    );

    assert(
        page.panel.summary.mode === "details" &&
        page.chartsPanel.summary.activeChart ===
            SessionChartType.WINNERS,
        "Mode 或 Chart 切換錯誤"
    );

    messages.push(
        "✓ Mode 與 Chart 切換正確"
    );

    page.pauseLive();

    assert(
        page.summary.live.paused === true &&
        page.liveHost.innerHTML.includes(
            "已暫停"
        ),
        "Pause Live 錯誤"
    );

    page.resumeLive();

    assert(
        page.summary.live.running === true &&
        page.liveHost.innerHTML.includes(
            "即時更新中"
        ),
        "Resume Live 錯誤"
    );

    messages.push(
        "✓ Live Pause／Resume 正確"
    );

    store.addRound({
        winner: "Player",
        playerScore: 9,
        bankerScore: 2,
        margin: 7
    });

    assert(
        page.report.summary.rounds === 3 &&
        page.summaryHost.innerHTML.includes(
            "Session Statistics"
        ) &&
        page.chartsHost.innerHTML.includes(
            "Statistics Visualization"
        ) &&
        page.reportHost.innerHTML.includes(
            "百家樂 Session 報告"
        ),
        "SessionStore event 未同步刷新 Dashboard"
    );

    messages.push(
        "✓ Store Event 即時刷新正確"
    );

    const reportHTML =
        page.exportReportHTML();

    assert(
        reportHTML.startsWith(
            "<!DOCTYPE html>"
        ),
        "Report HTML Export 錯誤"
    );

    messages.push(
        "✓ Report Export 正確"
    );

    assert(
        page.summary.version === "4.6.0" &&
        page.summary.mounted === true &&
        page.summary.hasReport === true &&
        page.summary.rounds === 3 &&
        page.summary.reportMounted === true &&
        page.summary.live.running === true,
        "StatisticsPage summary 錯誤"
    );

    page.destroy();

    assert(
        page.root === null &&
        page.report === null &&
        page.liveHost === null &&
        page.summaryHost === null &&
        page.chartsHost === null &&
        page.reportHost === null,
        "destroy() 錯誤"
    );

    messages.push(
        "✓ summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Dashboard Statistics V4.6 測試完成

Live DOM：通過
Statistics DOM：通過
Charts DOM：通過
Report DOM：通過
Session Pipeline：通過
Mode Switch：通過
Chart Switch：通過
Pause／Resume：通過
Auto Refresh：通過
Report Export：通過
`;
}
