/**
 * Baccarat Analyzer V4.7
 * tests/dashboardLayout.test.js
 */

import DashboardLayout, {
    DASHBOARD_LAYOUT_VERSION,
    DashboardLayoutMode,
    DashboardSection
} from "../dashboard/DashboardLayout.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createPanel(name) {
    return {
        name,
        mounted: false,
        updated: 0,
        destroyed: false,
        lastValue: null,

        mount(target, value) {
            this.mounted = true;
            this.target = target;
            this.lastValue = value;
            return target;
        },

        update(value) {
            this.updated++;
            this.lastValue = value;
            return value;
        },

        destroy() {
            this.destroyed = true;
            this.mounted = false;
            return this;
        }
    };
}


function createElement() {
    const hosts = new Map();
    const sections = new Map();

    const element = {
        _innerHTML: "",

        querySelector(selector) {
            const hostMatch =
                selector.match(
                    /\[data-dashboard-host="(.+)"\]/
                );

            if (hostMatch) {
                return hosts.get(
                    hostMatch[1]
                ) ?? null;
            }

            const sectionMatch =
                selector.match(
                    /\[data-dashboard-section="(.+)"\]/
                );

            if (sectionMatch) {
                return sections.get(
                    sectionMatch[1]
                ) ?? null;
            }

            if (
                selector ===
                "[data-dashboard-layout]"
            ) {
                return this.layoutRoot ??
                    null;
            }

            return null;
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

                hosts.clear();
                sections.clear();

                this.layoutRoot = {
                    dataset: {
                        layoutMode: "full"
                    }
                };

                for (const section of [
                    "live",
                    "statistics",
                    "charts",
                    "report"
                ]) {
                    hosts.set(
                        section,
                        {
                            section
                        }
                    );

                    sections.set(
                        section,
                        {
                            hidden: false
                        }
                    );
                }
            }
        }
    );

    return element;
}


export default function dashboardLayoutTest() {
    const messages = [];

    assert(
        DASHBOARD_LAYOUT_VERSION ===
            "4.7.0",
        "DashboardLayout 版本錯誤"
    );

    const panels = {
        livePanel:
            createPanel("live"),

        statisticsPanel:
            createPanel("statistics"),

        chartsPanel:
            createPanel("charts"),

        reportPanel:
            createPanel("report")
    };

    const layout =
        new DashboardLayout({
            ...panels,

            documentRef: {
                querySelector() {
                    return null;
                }
            }
        });

    assert(
        layout.summary.mode ===
            DashboardLayoutMode.FULL &&
        layout.summary.visibleSections
            .length ===
            4,
        "初始 Layout 狀態錯誤"
    );

    messages.push(
        "✓ V4.7 建立正確"
    );

    const root =
        createElement();

    const report = {
        summary: {
            rounds: 10
        }
    };

    layout.mount(
        root,
        {
            report,
            liveState: {
                status: "running"
            }
        }
    );

    assert(
        layout.summary.mounted === true &&
        layout.summary.hostCount === 4 &&
        Object.values(panels)
            .every(panel =>
                panel.mounted
            ),
        "mount() 錯誤"
    );

    messages.push(
        "✓ 四面板 mount 正確"
    );

    const nextReport = {
        summary: {
            rounds: 11
        }
    };

    layout.update(
        nextReport,
        {
            liveState: {
                status: "paused"
            }
        }
    );

    assert(
        panels.livePanel.lastValue
            .status ===
            "paused" &&
        panels.statisticsPanel
            .lastValue ===
            nextReport &&
        panels.chartsPanel
            .lastValue ===
            nextReport &&
        panels.reportPanel
            .lastValue ===
            nextReport &&
        layout.summary.updateCount ===
            1,
        "update() 錯誤"
    );

    messages.push(
        "✓ 四面板 update 正確"
    );

    layout.hideSection(
        DashboardSection.REPORT
    );

    assert(
        layout.summary
            .visibleSections
            .includes(
                DashboardSection.REPORT
            ) === false &&
        root.querySelector(
            '[data-dashboard-section="report"]'
        ).hidden === true,
        "hideSection() 錯誤"
    );

    layout.showSection(
        DashboardSection.REPORT
    );

    assert(
        root.querySelector(
            '[data-dashboard-section="report"]'
        ).hidden === false,
        "showSection() 錯誤"
    );

    messages.push(
        "✓ Section 顯示控制正確"
    );

    layout.setMode(
        DashboardLayoutMode.COMPACT
    );

    assert(
        layout.summary.mode ===
            DashboardLayoutMode.COMPACT &&
        layout.container
            .dataset
            .layoutMode ===
            DashboardLayoutMode.COMPACT,
        "Layout Mode 錯誤"
    );

    messages.push(
        "✓ Full／Compact 模式正確"
    );

    assert(
        layout.getHost(
            DashboardSection.CHARTS
        )?.section ===
            "charts",
        "getHost() 錯誤"
    );

    layout.destroy();

    assert(
        layout.summary.mounted ===
            false &&
        layout.summary.hostCount ===
            0 &&
        Object.values(panels)
            .every(panel =>
                panel.destroyed
            ),
        "destroy() 錯誤"
    );

    messages.push(
        "✓ summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Dashboard Layout Manager V4.7 測試完成

Layout Shell：通過
Panel Mount：通過
Panel Update：通過
Section Visibility：通過
Layout Mode：通過
Lifecycle：通過
`;
}
