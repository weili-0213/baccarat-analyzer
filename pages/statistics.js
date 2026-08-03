/**
 * Baccarat Analyzer V4.6
 * pages/statistics.js
 *
 * Live Statistics Dashboard:
 * - Statistics
 * - Charts
 * - Report
 * - Live status and refresh control
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


export const STATISTICS_PAGE_VERSION = "4.6.0";


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
                    () => {
                        this.toggleLive();
                    },

                onRefresh:
                    () => {
                        this.refreshNow();
                    },

                onIntervalChange:
                    value => {
                        this.setRefreshInterval(
                            value
                        );
                    }
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
        this.liveHost = null;
        this.summaryHost = null;
        this.chartsHost = null;
        this.reportHost = null;
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
            this.sessionAnalyzer.analyze(
                this.resolveSessionData(data)
            );

        this.report =
            this.sessionReport.create(
                analysis
            );

        return this.report;
    }

    renderShell(element) {
        element.innerHTML = `
            <div class="statistics-page"
                data-statistics-page>

                <div data-statistics-live-host></div>

                <div data-statistics-summary-host></div>

                <div data-statistics-charts-host></div>

                <div data-statistics-report-host></div>

            </div>
        `;

        this.liveHost =
            element.querySelector(
                "[data-statistics-live-host]"
            );

        this.summaryHost =
            element.querySelector(
                "[data-statistics-summary-host]"
            );

        this.chartsHost =
            element.querySelector(
                "[data-statistics-charts-host]"
            );

        this.reportHost =
            element.querySelector(
                "[data-statistics-report-host]"
            );
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

        this.root =
            element;

        this.renderShell(
            element
        );

        const report =
            this.buildReport(
                data
            );

        this.panel.mount(
            this.summaryHost,
            report
        );

        this.chartsPanel.mount(
            this.chartsHost,
            report
        );

        this.reportPanel.mount(
            this.reportHost,
            report
        );

        this.liveStatusPanel.mount(
            this.liveHost,
            this.liveSummary
        );

        this.liveController?.start();

        this.updateLiveStatus();

        return this.root;
    }

    renderSession(data = null) {
        const report =
            this.buildReport(data);

        this.panel.update(report);
        this.chartsPanel.update(report);
        this.reportPanel.update(report);

        this.updateLiveStatus();

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

            this.updateLiveStatus();

            return result;
        }

        return this.renderSession();
    }

    pauseLive() {
        this.liveController?.pause();
        this.updateLiveStatus();

        return this;
    }

    resumeLive() {
        this.liveController?.resume();
        this.updateLiveStatus();

        return this;
    }

    toggleLive() {
        this.liveController?.toggle();
        this.updateLiveStatus();

        return this;
    }

    setRefreshInterval(value) {
        this.liveController
            ?.setRefreshInterval(
                value
            );

        this.updateLiveStatus();

        return this;
    }

    updateLiveStatus() {
        this.liveStatusPanel
            ?.update(
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

        this.panel.destroy();
        this.chartsPanel.destroy();
        this.reportPanel.destroy();
        this.liveStatusPanel.destroy();

        if (this.root) {
            this.root.innerHTML = "";
        }

        this.root = null;
        this.liveHost = null;
        this.summaryHost = null;
        this.chartsHost = null;
        this.reportHost = null;
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

            reportMounted:
                this.reportPanel
                    .summary
                    .mounted,

            live:
                this.liveSummary
        };
    }
}
