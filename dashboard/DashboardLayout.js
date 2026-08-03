/**
 * Baccarat Analyzer V4.7
 * dashboard/DashboardLayout.js
 *
 * Dashboard layout manager.
 *
 * Responsibilities:
 * - create and own dashboard panel hosts
 * - mount / update / destroy child panels
 * - manage visible sections
 * - manage compact / full layout mode
 *
 * Does not calculate Session statistics.
 */

export const DASHBOARD_LAYOUT_VERSION = "4.7.0";

export const DashboardLayoutMode = Object.freeze({
    FULL: "full",
    COMPACT: "compact"
});

export const DashboardSection = Object.freeze({
    LIVE: "live",
    STATISTICS: "statistics",
    CHARTS: "charts",
    REPORT: "report"
});

const SECTION_ORDER = Object.freeze([
    DashboardSection.LIVE,
    DashboardSection.STATISTICS,
    DashboardSection.CHARTS,
    DashboardSection.REPORT
]);

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function validatePanel(panel, name) {
    if (!panel) {
        throw new Error(
            `DashboardLayout requires ${name}.`
        );
    }

    for (const method of [
        "mount",
        "update",
        "destroy"
    ]) {
        if (typeof panel[method] !== "function") {
            throw new TypeError(
                `${name} requires ${method}().`
            );
        }
    }

    return panel;
}

export default class DashboardLayout {
    constructor({
        livePanel,
        statisticsPanel,
        chartsPanel,
        reportPanel,
        documentRef =
            globalThis.document ?? null,
        mode =
            DashboardLayoutMode.FULL,
        visibleSections =
            SECTION_ORDER
    } = {}) {
        this.document =
            documentRef;

        this.panels = {
            [DashboardSection.LIVE]:
                validatePanel(
                    livePanel,
                    "livePanel"
                ),

            [DashboardSection.STATISTICS]:
                validatePanel(
                    statisticsPanel,
                    "statisticsPanel"
                ),

            [DashboardSection.CHARTS]:
                validatePanel(
                    chartsPanel,
                    "chartsPanel"
                ),

            [DashboardSection.REPORT]:
                validatePanel(
                    reportPanel,
                    "reportPanel"
                )
        };

        this.setMode(mode);

        this.visibleSections =
            new Set();

        this.setVisibleSections(
            visibleSections,
            {
                render: false
            }
        );

        this.root = null;
        this.container = null;
        this.hosts = new Map();
        this.report = null;
        this.liveState = null;
        this.mountCount = 0;
        this.updateCount = 0;
    }

    validateSection(section) {
        if (!SECTION_ORDER.includes(section)) {
            throw new Error(
                `Unknown dashboard section: ${section}`
            );
        }

        return section;
    }

    setMode(mode) {
        if (
            !Object.values(DashboardLayoutMode)
                .includes(mode)
        ) {
            throw new Error(
                `Unknown dashboard layout mode: ${mode}`
            );
        }

        this.mode = mode;

        if (this.container) {
            this.container.dataset.layoutMode =
                mode;
        }

        return this;
    }

    setVisibleSections(
        sections,
        {
            render = true
        } = {}
    ) {
        if (!Array.isArray(sections)) {
            throw new TypeError(
                "visibleSections must be an array."
            );
        }

        this.visibleSections.clear();

        for (const section of sections) {
            this.visibleSections.add(
                this.validateSection(section)
            );
        }

        if (render && this.root) {
            this.refreshVisibility();
        }

        return this;
    }

    showSection(section) {
        this.visibleSections.add(
            this.validateSection(section)
        );

        this.refreshVisibility();

        return this;
    }

    hideSection(section) {
        this.visibleSections.delete(
            this.validateSection(section)
        );

        this.refreshVisibility();

        return this;
    }

    toggleSection(section) {
        this.validateSection(section);

        if (this.visibleSections.has(section)) {
            return this.hideSection(section);
        }

        return this.showSection(section);
    }

    renderShell(target) {
        target.innerHTML = `
            <div class="dashboard-layout"
                data-dashboard-layout
                data-layout-mode="${this.mode}">

                ${SECTION_ORDER.map(section => `
                    <section
                        class="dashboard-layout__section"
                        data-dashboard-section="${section}"
                        ${
                            this.visibleSections.has(section)
                                ? ""
                                : "hidden"
                        }>
                        <div
                            class="dashboard-layout__host"
                            data-dashboard-host="${section}">
                        </div>
                    </section>
                `).join("")}

            </div>
        `;

        this.container =
            target.querySelector(
                "[data-dashboard-layout]"
            );

        this.hosts.clear();

        for (const section of SECTION_ORDER) {
            const host =
                target.querySelector(
                    `[data-dashboard-host="${section}"]`
                );

            if (!host) {
                throw new Error(
                    `DashboardLayout host was not found: ${section}`
                );
            }

            this.hosts.set(
                section,
                host
            );
        }
    }

    mount(
        target,
        {
            report,
            liveState = {}
        } = {}
    ) {
        if (!this.document) {
            throw new Error(
                "DashboardLayout requires a document."
            );
        }

        const element =
            typeof target === "string"
                ? this.document
                    .querySelector(target)
                : target;

        if (!element) {
            throw new Error(
                "DashboardLayout mount target was not found."
            );
        }

        if (!isObject(report)) {
            throw new TypeError(
                "DashboardLayout requires a report."
            );
        }

        this.root = element;
        this.report = report;
        this.liveState = {
            ...liveState
        };

        this.renderShell(element);

        this.panels[DashboardSection.LIVE]
            .mount(
                this.hosts.get(
                    DashboardSection.LIVE
                ),
                this.liveState
            );

        this.panels[DashboardSection.STATISTICS]
            .mount(
                this.hosts.get(
                    DashboardSection.STATISTICS
                ),
                report
            );

        this.panels[DashboardSection.CHARTS]
            .mount(
                this.hosts.get(
                    DashboardSection.CHARTS
                ),
                report
            );

        this.panels[DashboardSection.REPORT]
            .mount(
                this.hosts.get(
                    DashboardSection.REPORT
                ),
                report
            );

        this.mountCount++;

        return this.container;
    }

    update(
        report,
        {
            liveState =
                this.liveState ??
                {}
        } = {}
    ) {
        if (!isObject(report)) {
            throw new TypeError(
                "DashboardLayout requires a report."
            );
        }

        this.report = report;
        this.liveState = {
            ...liveState
        };

        this.panels[DashboardSection.LIVE]
            .update(
                this.liveState
            );

        this.panels[DashboardSection.STATISTICS]
            .update(
                report
            );

        this.panels[DashboardSection.CHARTS]
            .update(
                report
            );

        this.panels[DashboardSection.REPORT]
            .update(
                report
            );

        this.updateCount++;

        return report;
    }

    updateLive(liveState = {}) {
        this.liveState = {
            ...liveState
        };

        this.panels[DashboardSection.LIVE]
            .update(
                this.liveState
            );

        return this;
    }

    refreshVisibility() {
        if (!this.root) {
            return this;
        }

        for (const section of SECTION_ORDER) {
            const wrapper =
                this.root.querySelector(
                    `[data-dashboard-section="${section}"]`
                );

            if (wrapper) {
                wrapper.hidden =
                    !this.visibleSections
                        .has(section);
            }
        }

        return this;
    }

    getHost(section) {
        this.validateSection(section);

        return this.hosts.get(section) ??
            null;
    }

    destroy() {
        for (const section of SECTION_ORDER) {
            this.panels[section]
                .destroy();
        }

        if (this.root) {
            this.root.innerHTML = "";
        }

        this.root = null;
        this.container = null;
        this.hosts.clear();
        this.report = null;
        this.liveState = null;

        return this;
    }

    get summary() {
        return {
            version:
                DASHBOARD_LAYOUT_VERSION,

            mounted:
                Boolean(this.root),

            mode:
                this.mode,

            visibleSections:
                SECTION_ORDER.filter(
                    section =>
                        this.visibleSections
                            .has(section)
                ),

            hostCount:
                this.hosts.size,

            hasReport:
                Boolean(this.report),

            mountCount:
                this.mountCount,

            updateCount:
                this.updateCount
        };
    }
}
