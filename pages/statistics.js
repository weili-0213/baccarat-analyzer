/**
 * Baccarat Analyzer V4.3
 * pages/statistics.js
 *
 * Statistics page controller.
 *
 * Data flow:
 * SessionStore → SessionAnalyzer → SessionReport
 * → SessionStatisticsPanel
 */

import SessionAnalyzer
    from "../analysis/SessionAnalyzer.js";

import SessionReport
    from "../analysis/SessionReport.js";

import SessionStatisticsPanel
    from "../components/SessionStatisticsPanel.js";


export const STATISTICS_PAGE_VERSION = "4.3.0";


function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}


export default class StatisticsPage {
    constructor({
        sessionStore = null,
        sessionAnalyzer = null,
        sessionReport = null,
        panel = null,
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

        this.root =
            null;

        this.report =
            null;

        this.unsubscribe =
            null;
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
        const sessionData =
            this.resolveSessionData(
                data
            );

        const analysis =
            this.sessionAnalyzer
                .analyze(
                    sessionData
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

        this.root =
            element;

        const report =
            this.buildReport(
                data
            );

        this.panel.mount(
            this.root,
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
            this.sessionStore
                .subscribe(
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

        return report;
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

    setMode(mode) {
        this.panel.setMode(
            mode
        );

        return this;
    }

    clear() {
        this.report =
            null;

        this.panel.clear();

        return this;
    }

    destroy() {
        this.unsubscribe?.();
        this.unsubscribe =
            null;

        this.panel.destroy();

        this.root =
            null;

        this.report =
            null;

        return this;
    }

    get summary() {
        return {
            version:
                STATISTICS_PAGE_VERSION,
            mounted:
                Boolean(this.root),
            hasStore:
                Boolean(this.sessionStore),
            hasReport:
                Boolean(this.report),
            rounds:
                this.report
                    ?.summary
                    ?.rounds ??
                0,
            mode:
                this.panel.summary.mode
        };
    }
}
