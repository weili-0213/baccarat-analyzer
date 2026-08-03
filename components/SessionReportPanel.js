/**
 * Baccarat Analyzer V4.5
 * components/SessionReportPanel.js
 *
 * Printable / copyable / exportable dashboard report renderer.
 * Consumes SessionReport output only.
 */

export const SESSION_REPORT_PANEL_VERSION = "4.5.0";

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function text(value, fallback = "—") {
    return (
        value === null ||
        value === undefined ||
        value === ""
    )
        ? fallback
        : String(value);
}

function winnerLabel(value) {
    return {
        player: "閒",
        banker: "莊",
        tie: "和",
        balanced: "平衡"
    }[value] ?? "—";
}

function trendLabel(value) {
    return {
        player: "閒方偏強",
        banker: "莊方偏強",
        tie: "和局偏高",
        balanced: "走勢平衡",
        empty: "尚無資料"
    }[value] ?? "尚無資料";
}

export default class SessionReportPanel {
    constructor({
        documentRef = globalThis.document ?? null,
        navigatorRef = globalThis.navigator ?? null,
        windowRef = globalThis.window ?? null,
        title = "百家樂 Session 報告"
    } = {}) {
        this.document = documentRef;
        this.navigator = navigatorRef;
        this.window = windowRef;
        this.title = title;

        this.root = null;
        this.report = null;
        this.lastCopiedText = null;
        this.lastExportHTML = null;
    }

    validateReport(report) {
        if (!isObject(report)) {
            throw new TypeError(
                "SessionReportPanel requires a SessionReport."
            );
        }

        for (const key of [
            "header",
            "summary",
            "statistics",
            "analysis",
            "betting",
            "formatted"
        ]) {
            if (!(key in report)) {
                throw new Error(
                    `SessionReport is missing ${key}.`
                );
            }
        }

        return true;
    }

    buildSummaryRows(report) {
        return [
            ["局數", report.summary.rounds],
            [
                "主要勝方",
                winnerLabel(
                    report.summary.dominantWinner
                )
            ],
            [
                "趨勢",
                trendLabel(
                    report.summary.trend
                )
            ],
            [
                "最長連續",
                report.summary.longestStreak
            ],
            [
                "建議下注率",
                report.formatted.recommendationRate
            ],
            [
                "平均可信度",
                report.formatted.averageConfidence
            ],
            [
                "總下注",
                report.formatted.totalStake
            ],
            [
                "總損益",
                report.formatted.totalProfit
            ],
            [
                "ROI",
                report.formatted.roi
            ],
            [
                "最大回撤",
                report.formatted.maxDrawdown
            ]
        ];
    }

    renderSummaryTable(report) {
        return `
            <section class="session-report-panel__section">
                <h3>Session 摘要</h3>

                <div class="session-report-table">
                    ${this.buildSummaryRows(report)
                        .map(([label, value]) => `
                            <div class="session-report-table__row">
                                <span>${escapeHTML(label)}</span>
                                <strong>${escapeHTML(value)}</strong>
                            </div>
                        `)
                        .join("")}
                </div>
            </section>
        `;
    }

    renderWinnerTable(report) {
        const rows = [
            [
                "閒",
                report.statistics.winners.player,
                report.formatted.playerRate
            ],
            [
                "莊",
                report.statistics.winners.banker,
                report.formatted.bankerRate
            ],
            [
                "和",
                report.statistics.winners.tie,
                report.formatted.tieRate
            ]
        ];

        return `
            <section class="session-report-panel__section">
                <h3>勝方統計</h3>

                <div class="session-report-grid-table">
                    <div class="session-report-grid-table__header">
                        <span>項目</span>
                        <span>局數</span>
                        <span>比例</span>
                    </div>

                    ${rows.map(row => `
                        <div class="session-report-grid-table__row">
                            <span>${escapeHTML(row[0])}</span>
                            <strong>${escapeHTML(row[1])}</strong>
                            <strong>${escapeHTML(row[2])}</strong>
                        </div>
                    `).join("")}
                </div>
            </section>
        `;
    }

    renderBettingTable(report) {
        const rows = [
            ["下注筆數", report.betting.count],
            ["勝", report.betting.wins],
            ["負", report.betting.losses],
            ["和／退回", report.betting.pushes],
            ["下注勝率", report.formatted.winRate],
            ["平均下注", report.betting.averageStake],
            ["平均損益", report.betting.averageProfit],
            ["資金變化", report.betting.endingBankrollChange]
        ];

        return `
            <section class="session-report-panel__section">
                <h3>下注結果</h3>

                <div class="session-report-table">
                    ${rows.map(([label, value]) => `
                        <div class="session-report-table__row">
                            <span>${escapeHTML(label)}</span>
                            <strong>${escapeHTML(value)}</strong>
                        </div>
                    `).join("")}
                </div>
            </section>
        `;
    }

    renderAnalysisTable(report) {
        const bets =
            report.analysis.recommendedBets ?? {};

        const rows = [
            ["分析次數", report.analysis.count],
            ["建議下注", report.analysis.shouldBetCount],
            ["略過", report.analysis.skipCount],
            ["平均分析時間", report.formatted.averageDurationMs],
            ["推薦閒", bets.player ?? 0],
            ["推薦莊", bets.banker ?? 0],
            ["推薦和", bets.tie ?? 0],
            ["其他推薦", bets.other ?? 0]
        ];

        return `
            <section class="session-report-panel__section">
                <h3>分析與推薦</h3>

                <div class="session-report-table">
                    ${rows.map(([label, value]) => `
                        <div class="session-report-table__row">
                            <span>${escapeHTML(label)}</span>
                            <strong>${escapeHTML(value)}</strong>
                        </div>
                    `).join("")}
                </div>
            </section>
        `;
    }

    renderMetadata(report) {
        const metadata =
            report.metadata ?? {};

        const entries =
            Object.entries(metadata);

        if (entries.length === 0) {
            return "";
        }

        return `
            <section class="session-report-panel__section">
                <h3>附加資訊</h3>

                <div class="session-report-table">
                    ${entries.map(([key, value]) => `
                        <div class="session-report-table__row">
                            <span>${escapeHTML(key)}</span>
                            <strong>${escapeHTML(text(value))}</strong>
                        </div>
                    `).join("")}
                </div>
            </section>
        `;
    }

    template(report) {
        this.validateReport(report);

        return `
            <article class="session-report-panel"
                data-session-report-panel>

                <header class="session-report-panel__header">
                    <div>
                        <span class="session-report-panel__eyebrow">
                            V${SESSION_REPORT_PANEL_VERSION}
                        </span>
                        <h2>${escapeHTML(this.title)}</h2>
                        <p>
                            牌靴：
                            ${escapeHTML(
                                text(
                                    report.header.shoeNumber
                                )
                            )}
                            ·
                            局數：
                            ${escapeHTML(
                                report.summary.rounds
                            )}
                        </p>
                    </div>

                    <div class="session-report-panel__actions">
                        <button type="button"
                            data-report-action="copy">
                            複製
                        </button>

                        <button type="button"
                            data-report-action="html">
                            匯出 HTML
                        </button>

                        <button type="button"
                            data-report-action="print">
                            列印
                        </button>
                    </div>
                </header>

                <div class="session-report-panel__body">
                    ${this.renderSummaryTable(report)}
                    ${this.renderWinnerTable(report)}
                    ${this.renderAnalysisTable(report)}
                    ${this.renderBettingTable(report)}
                    ${this.renderMetadata(report)}
                </div>

                <footer class="session-report-panel__footer">
                    <span>
                        產生時間：
                        ${escapeHTML(
                            text(
                                report.header.generatedAt
                            )
                        )}
                    </span>

                    <span>
                        Session Report V4.5
                    </span>
                </footer>

            </article>
        `;
    }

    buildText(report = this.report) {
        this.validateReport(report);

        const rows =
            this.buildSummaryRows(report)
                .map(([label, value]) =>
                    `${label}：${value}`
                );

        return [
            this.title,
            "",
            ...rows,
            "",
            `閒：${report.statistics.winners.player}（${report.formatted.playerRate}）`,
            `莊：${report.statistics.winners.banker}（${report.formatted.bankerRate}）`,
            `和：${report.statistics.winners.tie}（${report.formatted.tieRate}）`,
            "",
            `下注筆數：${report.betting.count}`,
            `下注勝率：${report.formatted.winRate}`,
            `資金變化：${report.betting.endingBankrollChange}`
        ].join("\n");
    }

    buildStandaloneHTML(report = this.report) {
        this.validateReport(report);

        return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1">
    <title>${escapeHTML(this.title)}</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: #172235;
            background: #f3f6fa;
        }

        .report {
            max-width: 900px;
            margin: 0 auto;
            padding: 24px;
            border-radius: 16px;
            background: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, .08);
        }

        h1, h2, h3 {
            margin-top: 0;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .section {
            padding: 16px;
            border: 1px solid #dbe3ed;
            border-radius: 12px;
        }

        .row {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 8px 0;
            border-bottom: 1px solid #edf1f6;
        }

        .row:last-child {
            border-bottom: 0;
        }

        @media print {
            body {
                padding: 0;
                background: white;
            }

            .report {
                max-width: none;
                box-shadow: none;
            }
        }

        @media (max-width: 640px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <main class="report">
        <h1>${escapeHTML(this.title)}</h1>
        <p>
            牌靴：${escapeHTML(text(report.header.shoeNumber))}
            · 局數：${escapeHTML(report.summary.rounds)}
        </p>

        <div class="grid">
            <section class="section">
                <h2>Session 摘要</h2>
                ${this.buildSummaryRows(report)
                    .map(([label, value]) => `
                        <div class="row">
                            <span>${escapeHTML(label)}</span>
                            <strong>${escapeHTML(value)}</strong>
                        </div>
                    `)
                    .join("")}
            </section>

            <section class="section">
                <h2>勝方統計</h2>
                <div class="row">
                    <span>閒</span>
                    <strong>
                        ${report.statistics.winners.player}
                        /
                        ${escapeHTML(report.formatted.playerRate)}
                    </strong>
                </div>
                <div class="row">
                    <span>莊</span>
                    <strong>
                        ${report.statistics.winners.banker}
                        /
                        ${escapeHTML(report.formatted.bankerRate)}
                    </strong>
                </div>
                <div class="row">
                    <span>和</span>
                    <strong>
                        ${report.statistics.winners.tie}
                        /
                        ${escapeHTML(report.formatted.tieRate)}
                    </strong>
                </div>
            </section>
        </div>
    </main>
</body>
</html>`;
    }

    async copy(report = this.report) {
        const content =
            this.buildText(report);

        this.lastCopiedText =
            content;

        if (
            this.navigator
                ?.clipboard
                ?.writeText
        ) {
            await this.navigator
                .clipboard
                .writeText(content);
        }

        return content;
    }

    exportHTML(report = this.report) {
        const html =
            this.buildStandaloneHTML(report);

        this.lastExportHTML =
            html;

        return html;
    }

    print() {
        this.window?.print?.();
        return true;
    }

    bind() {
        if (!this.root) {
            return;
        }

        this.root
            .querySelectorAll(
                "[data-report-action]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    async () => {
                        const action =
                            button.dataset
                                .reportAction;

                        if (action === "copy") {
                            await this.copy();
                        }
                        else if (action === "html") {
                            this.exportHTML();
                        }
                        else if (action === "print") {
                            this.print();
                        }
                    }
                );
            });
    }

    mount(target, report) {
        if (!this.document) {
            throw new Error(
                "SessionReportPanel requires a document."
            );
        }

        const element =
            typeof target === "string"
                ? this.document
                    .querySelector(target)
                : target;

        if (!element) {
            throw new Error(
                "SessionReportPanel mount target was not found."
            );
        }

        this.report =
            report;

        element.innerHTML =
            this.template(report);

        this.root =
            element.querySelector(
                "[data-session-report-panel]"
            );

        this.bind();

        return this.root;
    }

    update(report) {
        this.report =
            report;

        if (!this.root) {
            return null;
        }

        return this.mount(
            this.root.parentElement,
            report
        );
    }

    destroy() {
        if (this.root?.parentElement) {
            this.root
                .parentElement
                .innerHTML = "";
        }

        this.root =
            null;

        this.report =
            null;

        return this;
    }

    get summary() {
        return {
            version:
                SESSION_REPORT_PANEL_VERSION,

            mounted:
                Boolean(this.root),

            hasReport:
                Boolean(this.report),

            rounds:
                this.report
                    ?.summary
                    ?.rounds ??
                0,

            copied:
                Boolean(this.lastCopiedText),

            exportedHTML:
                Boolean(this.lastExportHTML)
        };
    }
}
