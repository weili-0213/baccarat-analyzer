/**
 * Baccarat Analyzer V4.5
 * pages/statistics.js
 *
 * Statistics + Charts + Report dashboard controller.
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


export const STATISTICS_PAGE_VERSION = "4.5.0";


export default class StatisticsPage {
    constructor({
        sessionStore = null,
        sessionAnalyzer = null,
        sessionReport = null,
        panel = null,
        chartsPanel = null,
        reportPanel = null,
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

        this.root = null;
        this.summaryHost = null;
        this.chartsHost = null;
        this.reportHost = null;
        this.report = null;
        this.unsubscribe = null;
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

                <div data-statistics-summary-host></div>

                <div data-statistics-charts-host></div>

                <div data-statistics-report-host></div>

            </div>
        `;

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

        this.subscribe();

        return this.root;
    }

    subscribe() {
        if (
            !this.sessionStore ||
            typeof this.sessionStore.subscribe !==
                "function"
        ) {
            return;
        }

        this.unsubscribe?.();

        this.unsubscribe =
            this.sessionStore.subscribe(
                event => {
                    if (
                        [
                            "save",
                            "storage:remove"
                        ].includes(
                            event.type
                        )
                    ) {
                        return;
                    }

                    this.refresh(
                        event.session
                    );
                }
            );
    }

    refresh(data = null) {
        const report =
            this.buildReport(
                data
            );

        this.panel.update(
            report
        );

        this.chartsPanel.update(
            report
        );

        this.reportPanel.update(
            report
        );

        return report;
    }

    setMode(mode) {
        this.panel.setMode(
            mode
        );

        return this;
    }

    setChart(type) {
        this.chartsPanel.setChart(
            type
        );

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
        this.unsubscribe?.();
        this.unsubscribe =
            null;

        this.panel.destroy();
        this.chartsPanel.destroy();
        this.reportPanel.destroy();

        if (this.root) {
            this.root.innerHTML = "";
        }

        this.root = null;
        this.summaryHost = null;
        this.chartsHost = null;
        this.reportHost = null;
        this.report = null;

        return this;
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
                    .mounted
        };
    }
}
