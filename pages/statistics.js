/**
 * Baccarat Analyzer V4.7
 * pages/statistics.js
 *
 * Statistics page facade using DashboardLayout.
 */

import SessionAnalyzer
    from "../analysis/SessionAnalyzer.js";

import SessionReport
    from "../analysis/SessionReport.js";

import SessionStatisticsPanel
    from "../components/SessionStatisticsPanel.js";

import SessionChartsPanel
    from "../components/SessionChartsPanel.js";

import SessionReportPanel
    from "../components/SessionReportPanel.js";

import LiveStatusPanel
    from "../components/LiveStatusPanel.js";

import LiveDashboardController
    from "../dashboard/LiveDashboardController.js";

import DashboardLayout, {
    DashboardLayoutMode,
    DashboardSection
} from "../dashboard/DashboardLayout.js";


export const STATISTICS_PAGE_VERSION = "4.7.0";


export default class StatisticsPage {
    constructor({
        sessionStore = null,
        sessionAnalyzer = null,
        sessionReport = null,
        panel = null,
        chartsPanel = null,
        reportPanel = null,
        liveStatusPanel = null,
        liveController = null,
        layout = null,
        layoutMode =
            DashboardLayoutMode.FULL,
        visibleSections = null,
        liveOptions = {},
        documentRef =
            globalThis.document ?? null
    } = {}) {
        this.document =
            documentRef;

        this.sessionStore =
            sessionStore;

        this.sessionAnalyzer =
            sessionAnalyzer ??
            new SessionAnalyzer();

        this.sessionReport =
            sessionReport ??
            new SessionReport();

        this.panel =
            panel ??
            new SessionStatisticsPanel({
                documentRef:
                    this.document
            });

        this.chartsPanel =
            chartsPanel ??
            new SessionChartsPanel({
                documentRef:
                    this.document
            });

        this.reportPanel =
            reportPanel ??
            new SessionReportPanel({
                documentRef:
                    this.document
            });

        this.liveStatusPanel =
            liveStatusPanel ??
            new LiveStatusPanel({
                documentRef:
                    this.document,

                onToggle:
                    () =>
                        this.toggleLive(),

                onRefresh:
                    () =>
                        this.refreshNow(),

                onIntervalChange:
                    value =>
                        this.setRefreshInterval(
                            value
                        )
            });

        this.layout =
            layout ??
            new DashboardLayout({
                livePanel:
                    this.liveStatusPanel,

                statisticsPanel:
                    this.panel,

                chartsPanel:
                    this.chartsPanel,

                reportPanel:
                    this.reportPanel,

                documentRef:
                    this.document,

                mode:
                    layoutMode,

                visibleSections:
                    visibleSections ??
                    [
                        DashboardSection.LIVE,
                        DashboardSection.STATISTICS,
                        DashboardSection.CHARTS,
                        DashboardSection.REPORT
                    ]
            });

        this.liveController =
            liveController ??
            (
                this.sessionStore
                    ? new LiveDashboardController({
                        sessionStore:
                            this.sessionStore,

                        refreshInterval:
                            liveOptions
                                .refreshInterval ??
                            250,

                        immediate:
                            liveOptions
                                .immediate ??
                            false,

                        scheduler:
                            liveOptions.scheduler ??
                            globalThis,

                        clock:
                            liveOptions.clock ??
                            (() => Date.now()),

                        onRefresh:
                            session =>
                                this.renderSession(
                                    session
                                )
                    })
                    : null
            );

        this.root = null;
        this.report = null;
    }

    resolveSessionData(data = null) {
        if (data) {
            return data;
        }

        if (
            this.sessionStore &&
            typeof this.sessionStore.export ===
                "function"
        ) {
            return this.sessionStore.export();
        }

        return {
            rounds: [],
            analyses: [],
            bets: []
        };
    }

    buildReport(data = null) {
        const analysis =
            this.sessionAnalyzer
                .analyze(
                    this.resolveSessionData(
                        data
                    )
                );

        this.report =
            this.sessionReport
                .create(
                    analysis
                );

        return this.report;
    }

    mount(target, data = null) {
        if (!this.document) {
            throw new Error(
                "StatisticsPage requires a document."
            );
        }

        const element =
            typeof target === "string"
                ? this.document
                    .querySelector(target)
                : target;

        if (!element) {
            throw new Error(
                "StatisticsPage mount target was not found."
            );
        }

        this.root = element;

        const report =
            this.buildReport(data);

        this.layout.mount(
            element,
            {
                report,
                liveState:
                    this.liveSummary
            }
        );

        this.liveController?.start();

        this.layout.updateLive(
            this.liveSummary
        );

        return this.root;
    }

    renderSession(data = null) {
        const report =
            this.buildReport(data);

        this.layout.update(
            report,
            {
                liveState:
                    this.liveSummary
            }
        );

        return report;
    }

    refresh(data = null) {
        return this.renderSession(
            data
        );
    }

    refreshNow() {
        if (this.liveController) {
            const result =
                this.liveController
                    .refreshNow(
                        "manual"
                    );

            this.layout.updateLive(
                this.liveSummary
            );

            return result;
        }

        return this.renderSession();
    }

    pauseLive() {
        this.liveController?.pause();

        this.layout.updateLive(
            this.liveSummary
        );

        return this;
    }

    resumeLive() {
        this.liveController?.resume();

        this.layout.updateLive(
            this.liveSummary
        );

        return this;
    }

    toggleLive() {
        this.liveController?.toggle();

        this.layout.updateLive(
            this.liveSummary
        );

        return this;
    }

    setRefreshInterval(value) {
        this.liveController
            ?.setRefreshInterval(
                value
            );

        this.layout.updateLive(
            this.liveSummary
        );

        return this;
    }

    setMode(mode) {
        this.panel.setMode(mode);
        return this;
    }

    setChart(type) {
        this.chartsPanel.setChart(type);
        return this;
    }

    setLayoutMode(mode) {
        this.layout.setMode(mode);
        return this;
    }

    showSection(section) {
        this.layout.showSection(section);
        return this;
    }

    hideSection(section) {
        this.layout.hideSection(section);
        return this;
    }

    toggleSection(section) {
        this.layout.toggleSection(section);
        return this;
    }

    copyReport() {
        return this.reportPanel.copy(
            this.report
        );
    }

    exportReportHTML() {
        return this.reportPanel
            .exportHTML(
                this.report
            );
    }

    printReport() {
        return this.reportPanel.print();
    }

    exportJSON({
        pretty = true
    } = {}) {
        if (!this.report) {
            this.buildReport();
        }

        return this.sessionReport
            .toJSON(
                this.report,
                {
                    pretty
                }
            );
    }

    exportCSV() {
        if (!this.report) {
            this.buildReport();
        }

        return this.sessionReport
            .toCSV(
                this.report
            );
    }

    exportText() {
        if (!this.report) {
            this.buildReport();
        }

        return this.sessionReport
            .toText(
                this.report
            );
    }

    destroy() {
        this.liveController?.destroy();
        this.layout.destroy();

        this.root = null;
        this.report = null;

        return this;
    }

    get liveSummary() {
        return (
            this.liveController
                ?.summary ??
            {
                status:
                    "idle",

                refreshInterval:
                    0,

                refreshCount:
                    0,

                eventCount:
                    0,

                coalescedCount:
                    0,

                lastRefreshAt:
                    null
            }
        );
    }

    get summary() {
        return {
            version:
                STATISTICS_PAGE_VERSION,

            mounted:
                Boolean(this.root),

            hasReport:
                Boolean(this.report),

            rounds:
                this.report
                    ?.summary
                    ?.rounds ??
                0,

            mode:
                this.panel
                    .summary
                    .mode,

            activeChart:
                this.chartsPanel
                    .summary
                    .activeChart,

            live:
                this.liveSummary,

            layout:
                this.layout.summary
        };
    }
}
