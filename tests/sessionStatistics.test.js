/**
 * Baccarat Analyzer V4.7
 * tests/sessionStatistics.test.js
 *
 * StatisticsPage + DashboardLayout integration test.
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

import DashboardLayout, {
    DASHBOARD_LAYOUT_VERSION,
    DashboardLayoutMode,
    DashboardSection
} from "../dashboard/DashboardLayout.js";

import SessionStore
    from "../analysis/SessionStore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


/**
 * V4.7 Fake DOM
 *
 * 支援：
 * - DashboardLayout shell
 * - data-dashboard-layout
 * - data-dashboard-section
 * - data-dashboard-host
 * - LiveStatusPanel
 * - SessionStatisticsPanel
 * - SessionChartsPanel
 * - SessionReportPanel
 */
function createElement(type = "root") {
    const element = {
        type,
        _innerHTML: "",
        parentElement: null,
        dataset: {},
        hidden: false,
        children: new Map(),

        querySelector(selector) {
            if (
                selector ===
                "[data-dashboard-layout]"
            ) {
                return this.children.get(
                    "dashboard-layout"
                ) ?? null;
            }

            const hostMatch =
                selector.match(
                    /^\[data-dashboard-host="(.+)"\]$/
                );

            if (hostMatch) {
                return this.children.get(
                    `host:${hostMatch[1]}`
                ) ?? null;
            }

            const sectionMatch =
                selector.match(
                    /^\[data-dashboard-section="(.+)"\]$/
                );

            if (sectionMatch) {
                return this.children.get(
                    `section:${sectionMatch[1]}`
                ) ?? null;
            }

            const selectorMap = {
                "[data-live-status-panel]":
                    "live-panel",

                "[data-session-statistics]":
                    "statistics-panel",

                "[data-session-charts]":
                    "charts-panel",

                "[data-session-report-panel]":
                    "report-panel"
            };

            const key =
                selectorMap[selector];

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

                if (
                    this._innerHTML.includes(
                        "data-dashboard-layout"
                    )
                ) {
                    const layoutRoot =
                        createElement(
                            "dashboard-layout"
                        );

                    layoutRoot.parentElement =
                        this;

                    layoutRoot.dataset.layoutMode =
                        this._innerHTML.includes(
                            'data-layout-mode="compact"'
                        )
                            ? "compact"
                            : "full";

                    this.children.set(
                        "dashboard-layout",
                        layoutRoot
                    );

                    for (const section of [
                        "live",
                        "statistics",
                        "charts",
                        "report"
                    ]) {
                        const sectionElement =
                            createElement(
                                `section:${section}`
                            );

                        sectionElement.parentElement =
                            this;

                        sectionElement.hidden =
                            false;

                        const hostElement =
                            createElement(
                                `host:${section}`
                            );

                        hostElement.parentElement =
                            sectionElement;

                        this.children.set(
                            `section:${section}`,
                            sectionElement
                        );

                        this.children.set(
                            `host:${section}`,
                            hostElement
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
                    if (
                        this._innerHTML.includes(
                            token
                        )
                    ) {
                        const panelRoot =
                            createElement(key);

                        panelRoot.parentElement =
                            this;

                        this.children.set(
                            key,
                            panelRoot
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
        createElement("root");

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
        STATISTICS_PAGE_VERSION ===
            "4.7.0" &&
        DASHBOARD_LAYOUT_VERSION ===
            "4.7.0" &&
        SESSION_STATISTICS_PANEL_VERSION ===
            "4.3.0" &&
        SESSION_CHARTS_PANEL_VERSION ===
            "4.4.0" &&
        SESSION_REPORT_PANEL_VERSION ===
            "4.5.0" &&
        LIVE_STATUS_PANEL_VERSION ===
            "4.6.0",
        "V4.7 Statistics 版本錯誤"
    );

    messages.push(
        "✓ V4.7 Statistics 與 Layout 版本正確"
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
                    "statistics-v47-test"
        });

    store.start({
        shoeNumber:
            1
    });

    store.addRound({
        winner:
            "Player",

        playerScore:
            8,

        bankerScore:
            4,

        margin:
            4
    });

    store.addRound({
        winner:
            "Banker",

        playerScore:
            3,

        bankerScore:
            7,

        margin:
            4
    });

    store.addAnalysis({
        shouldBet:
            true,

        recommendedBet:
            "player",

        overallConfidence:
            0.8,

        durationMs:
            20
    });

    store.addBet({
        bet:
            "player",

        amount:
            100,

        profit:
            100
    });

    const page =
        new StatisticsPage({
            sessionStore:
                store,

            documentRef,

            liveOptions: {
                immediate:
                    false,

                refreshInterval:
                    0
            }
        });

    const root =
        page.mount(
            "#statistics"
        );

    assert(
        root ===
            documentRef.root,
        "StatisticsPage mount() 錯誤"
    );

    assert(
        page.layout instanceof
            DashboardLayout &&
        page.layout.summary
            .mounted ===
            true &&
        page.layout.summary
            .hostCount ===
            4,
        "DashboardLayout 未正確建立"
    );

    messages.push(
        "✓ DashboardLayout 建立與 mount 正確"
    );

    const liveHost =
        page.layout.getHost(
            DashboardSection.LIVE
        );

    const statisticsHost =
        page.layout.getHost(
            DashboardSection.STATISTICS
        );

    const chartsHost =
        page.layout.getHost(
            DashboardSection.CHARTS
        );

    const reportHost =
        page.layout.getHost(
            DashboardSection.REPORT
        );

    assert(
        liveHost &&
        statisticsHost &&
        chartsHost &&
        reportHost,
        "DashboardLayout 四個 Host 不完整"
    );

    assert(
        liveHost.innerHTML.includes(
            "即時更新中"
        ) &&
        statisticsHost.innerHTML.includes(
            "Session Statistics"
        ) &&
        chartsHost.innerHTML.includes(
            "Statistics Visualization"
        ) &&
        reportHost.innerHTML.includes(
            "百家樂 Session 報告"
        ),
        "Live／Statistics／Charts／Report DOM 錯誤"
    );

    messages.push(
        "✓ 四面板 DOM 正確"
    );

    assert(
        page.report.summary
            .rounds ===
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
        "Store → Analyzer → Report 串接錯誤"
    );

    messages.push(
        "✓ Session Pipeline 串接正確"
    );

    page.setMode(
        "details"
    );

    page.setChart(
        SessionChartType.WINNERS
    );

    assert(
        page.panel.summary
            .mode ===
            "details" &&
        page.chartsPanel
            .summary
            .activeChart ===
            SessionChartType.WINNERS,
        "Panel Mode 或 Chart 切換錯誤"
    );

    messages.push(
        "✓ Panel Mode 與 Chart 切換正確"
    );

    page.setLayoutMode(
        DashboardLayoutMode.COMPACT
    );

    assert(
        page.layout.summary
            .mode ===
            DashboardLayoutMode.COMPACT &&
        page.layout.container
            .dataset
            .layoutMode ===
            DashboardLayoutMode.COMPACT,
        "Compact Layout 錯誤"
    );

    page.setLayoutMode(
        DashboardLayoutMode.FULL
    );

    assert(
        page.layout.summary
            .mode ===
            DashboardLayoutMode.FULL,
        "Full Layout 錯誤"
    );

    messages.push(
        "✓ Full／Compact Layout 正確"
    );

    page.hideSection(
        DashboardSection.REPORT
    );

    assert(
        page.layout.summary
            .visibleSections
            .includes(
                DashboardSection.REPORT
            ) ===
            false &&
        root.querySelector(
            '[data-dashboard-section="report"]'
        ).hidden ===
            true,
        "hideSection() 錯誤"
    );

    page.showSection(
        DashboardSection.REPORT
    );

    assert(
        root.querySelector(
            '[data-dashboard-section="report"]'
        ).hidden ===
            false,
        "showSection() 錯誤"
    );

    page.toggleSection(
        DashboardSection.CHARTS
    );

    assert(
        page.layout.summary
            .visibleSections
            .includes(
                DashboardSection.CHARTS
            ) ===
            false,
        "toggleSection() 隱藏錯誤"
    );

    page.toggleSection(
        DashboardSection.CHARTS
    );

    assert(
        page.layout.summary
            .visibleSections
            .includes(
                DashboardSection.CHARTS
            ) ===
            true,
        "toggleSection() 顯示錯誤"
    );

    messages.push(
        "✓ Section Visibility 正確"
    );

    page.pauseLive();

    assert(
        page.summary.live
            .paused ===
            true &&
        liveHost.innerHTML.includes(
            "已暫停"
        ),
        "Pause Live 錯誤"
    );

    page.resumeLive();

    assert(
        page.summary.live
            .running ===
            true &&
        liveHost.innerHTML.includes(
            "即時更新中"
        ),
        "Resume Live 錯誤"
    );

    messages.push(
        "✓ Live Pause／Resume 正確"
    );

    store.addRound({
        winner:
            "Player",

        playerScore:
            9,

        bankerScore:
            2,

        margin:
            7
    });

    assert(
        page.report.summary
            .rounds ===
            3 &&
        page.layout.summary
            .updateCount >=
            1 &&
        statisticsHost.innerHTML.includes(
            "Session Statistics"
        ) &&
        chartsHost.innerHTML.includes(
            "Statistics Visualization"
        ) &&
        reportHost.innerHTML.includes(
            "百家樂 Session 報告"
        ),
        "Store Event 未同步更新 DashboardLayout"
    );

    messages.push(
        "✓ Store Event 與 Layout Update 正確"
    );

    const json =
        page.exportJSON();

    const csv =
        page.exportCSV();

    const text =
        page.exportText();

    const html =
        page.exportReportHTML();

    assert(
        JSON.parse(json)
            .summary
            .rounds ===
            3 &&
        csv.includes(
            "summary,rounds,3"
        ) &&
        text.includes(
            "局數：3"
        ) &&
        html.startsWith(
            "<!DOCTYPE html>"
        ),
        "Export 整合錯誤"
    );

    messages.push(
        "✓ JSON／CSV／Text／HTML Export 正確"
    );

    assert(
        page.summary.version ===
            "4.7.0" &&
        page.summary.mounted ===
            true &&
        page.summary.hasReport ===
            true &&
        page.summary.rounds ===
            3 &&
        page.summary.layout
            .version ===
            "4.7.0" &&
        page.summary.layout
            .hostCount ===
            4,
        "StatisticsPage summary 錯誤"
    );

    page.destroy();

    assert(
        page.root ===
            null &&
        page.report ===
            null &&
        page.layout.summary
            .mounted ===
            false &&
        page.layout.summary
            .hostCount ===
            0,
        "destroy() 錯誤"
    );

    messages.push(
        "✓ summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Dashboard Statistics V4.7 測試完成

Dashboard Layout：通過
Live Panel：通過
Statistics Panel：通過
Charts Panel：通過
Report Panel：通過
Session Pipeline：通過
Panel Mode：通過
Layout Mode：通過
Section Visibility：通過
Live Mode：通過
Auto Update：通過
Exports：通過
`;
}
