/**
 * Baccarat Analyzer V4.3
 * components/SessionStatisticsPanel.js
 *
 * Pure renderer for SessionReport ViewModel.
 *
 * Does not calculate statistics.
 */

export const SESSION_STATISTICS_PANEL_VERSION = "4.3.0";

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

function signed(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return number > 0
        ? `+${number}`
        : String(number);
}

function trendLabel(type) {
    const labels = {
        player: "閒方偏強",
        banker: "莊方偏強",
        tie: "和局偏高",
        balanced: "走勢平衡",
        empty: "尚無資料"
    };

    return labels[type] ?? "尚無資料";
}

function winnerLabel(type) {
    const labels = {
        player: "閒",
        banker: "莊",
        tie: "和",
        balanced: "平衡"
    };

    return labels[type] ?? "—";
}

export default class SessionStatisticsPanel {
    constructor({
        documentRef =
            globalThis.document ?? null,
        emptyMessage =
            "尚無 Session 統計資料"
    } = {}) {
        this.document =
            documentRef;

        this.emptyMessage =
            emptyMessage;

        this.root =
            null;

        this.report =
            null;

        this.mode =
            "overview";
    }

    validateReport(report) {
        if (!isObject(report)) {
            throw new TypeError(
                "SessionStatisticsPanel requires a SessionReport."
            );
        }

        for (const key of [
            "summary",
            "statistics",
            "analysis",
            "betting",
            "charts",
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

    createCard({
        label,
        value,
        detail = "",
        className = ""
    }) {
        return `
            <article class="session-stat-card ${escapeHTML(className)}">
                <span class="session-stat-card__label">
                    ${escapeHTML(label)}
                </span>
                <strong class="session-stat-card__value">
                    ${escapeHTML(value)}
                </strong>
                <span class="session-stat-card__detail">
                    ${escapeHTML(detail)}
                </span>
            </article>
        `;
    }

    renderOverview(report) {
        return `
            <section class="session-statistics__overview"
                data-statistics-section="overview">

                ${this.createCard({
                    label: "總局數",
                    value: report.summary.rounds,
                    detail:
                        `主要勝方：${winnerLabel(
                            report.summary.dominantWinner
                        )}`
                })}

                ${this.createCard({
                    label: "目前趨勢",
                    value: trendLabel(
                        report.summary.trend
                    ),
                    detail:
                        `最長連續：${report.summary.longestStreak}`
                })}

                ${this.createCard({
                    label: "建議下注率",
                    value:
                        report.formatted.recommendationRate,
                    detail:
                        `平均可信度：${report.formatted.averageConfidence}`
                })}

                ${this.createCard({
                    label: "Session 損益",
                    value:
                        signed(
                            report.betting.totalProfit
                        ),
                    detail:
                        `ROI：${report.formatted.roi}`,
                    className:
                        report.betting.totalProfit >= 0
                            ? "is-positive"
                            : "is-negative"
                })}

            </section>
        `;
    }

    renderWinnerRates(report) {
        const values = [
            {
                key: "player",
                label: "閒",
                rate:
                    report.statistics.winRate.player,
                formatted:
                    report.formatted.playerRate,
                count:
                    report.statistics.winners.player
            },
            {
                key: "banker",
                label: "莊",
                rate:
                    report.statistics.winRate.banker,
                formatted:
                    report.formatted.bankerRate,
                count:
                    report.statistics.winners.banker
            },
            {
                key: "tie",
                label: "和",
                rate:
                    report.statistics.winRate.tie,
                formatted:
                    report.formatted.tieRate,
                count:
                    report.statistics.winners.tie
            }
        ];

        return `
            <section class="session-statistics__section"
                data-statistics-section="winner-rates">

                <header class="session-statistics__section-header">
                    <h3>勝方分布</h3>
                </header>

                <div class="session-rate-list">
                    ${values.map(item => `
                        <div class="session-rate-row"
                            data-winner="${item.key}">
                            <div class="session-rate-row__header">
                                <span>${item.label}</span>
                                <strong>${escapeHTML(item.formatted)}</strong>
                            </div>
                            <div class="session-rate-row__track">
                                <span
                                    class="session-rate-row__bar"
                                    style="--session-rate:${Math.max(
                                        0,
                                        Math.min(
                                            1,
                                            Number(item.rate) || 0
                                        )
                                    )}">
                                </span>
                            </div>
                            <small>${item.count} 局</small>
                        </div>
                    `).join("")}
                </div>

            </section>
        `;
    }

    renderBetting(report) {
        return `
            <section class="session-statistics__section"
                data-statistics-section="betting">

                <header class="session-statistics__section-header">
                    <h3>下注績效</h3>
                </header>

                <div class="session-statistics__grid">

                    ${this.createCard({
                        label: "總下注",
                        value:
                            report.formatted.totalStake,
                        detail:
                            `${report.betting.count} 筆`
                    })}

                    ${this.createCard({
                        label: "總損益",
                        value:
                            report.formatted.totalProfit,
                        detail:
                            `平均 ${report.betting.averageProfit}`,
                        className:
                            report.betting.totalProfit >= 0
                                ? "is-positive"
                                : "is-negative"
                    })}

                    ${this.createCard({
                        label: "下注勝率",
                        value:
                            report.formatted.winRate,
                        detail:
                            `${report.betting.wins} 勝 / ${report.betting.losses} 負`
                    })}

                    ${this.createCard({
                        label: "最大回撤",
                        value:
                            report.formatted.maxDrawdown,
                        detail:
                            `ROI ${report.formatted.roi}`
                    })}

                </div>

            </section>
        `;
    }

    renderSideBets(report) {
        const sideBets =
            report.statistics.sideBets ?? {};

        const rows = [
            ["playerPair", "閒對"],
            ["bankerPair", "莊對"],
            ["eitherPair", "任一對"],
            ["natural", "自然牌"],
            ["super6", "Super 6"],
            ["playerDragonBonus", "閒龍寶"],
            ["bankerDragonBonus", "莊龍寶"]
        ];

        return `
            <section class="session-statistics__section"
                data-statistics-section="side-bets">

                <header class="session-statistics__section-header">
                    <h3>特殊結果</h3>
                </header>

                <div class="session-side-bet-list">
                    ${rows.map(([key, label]) => `
                        <div class="session-side-bet-row">
                            <span>${label}</span>
                            <strong>${Number(sideBets[key]) || 0}</strong>
                        </div>
                    `).join("")}
                </div>

            </section>
        `;
    }

    renderEquity(report) {
        const points =
            report.charts.equityCurve ?? [];

        if (points.length === 0) {
            return `
                <section class="session-statistics__section"
                    data-statistics-section="equity">
                    <header class="session-statistics__section-header">
                        <h3>資金曲線</h3>
                    </header>
                    <p class="session-statistics__empty">
                        尚無下注紀錄
                    </p>
                </section>
            `;
        }

        const max = Math.max(
            1,
            ...points.map(point =>
                Math.abs(
                    Number(point.equity) || 0
                )
            )
        );

        return `
            <section class="session-statistics__section"
                data-statistics-section="equity">

                <header class="session-statistics__section-header">
                    <h3>資金曲線</h3>
                </header>

                <div class="session-equity-chart"
                    role="img"
                    aria-label="Session 資金曲線">

                    ${points.map(point => {
                        const equity =
                            Number(point.equity) || 0;

                        const height =
                            Math.max(
                                4,
                                Math.round(
                                    Math.abs(equity) /
                                    max *
                                    100
                                )
                            );

                        return `
                            <span
                                class="session-equity-chart__bar ${
                                    equity >= 0
                                        ? "is-positive"
                                        : "is-negative"
                                }"
                                style="--equity-height:${height}%"
                                title="第 ${escapeHTML(point.round)} 局：${escapeHTML(equity)}">
                            </span>
                        `;
                    }).join("")}

                </div>

            </section>
        `;
    }

    renderEmpty() {
        return `
            <section class="session-statistics is-empty"
                data-session-statistics>
                <p class="session-statistics__empty">
                    ${escapeHTML(this.emptyMessage)}
                </p>
            </section>
        `;
    }

    template(report) {
        if (!report) {
            return this.renderEmpty();
        }

        this.validateReport(report);

        return `
            <section class="session-statistics"
                data-session-statistics
                data-statistics-mode="${escapeHTML(this.mode)}">

                <header class="session-statistics__header">
                    <div>
                        <span class="session-statistics__eyebrow">
                            V${SESSION_STATISTICS_PANEL_VERSION}
                        </span>
                        <h2>Session Statistics</h2>
                    </div>

                    <div class="session-statistics__tabs"
                        role="tablist">
                        <button type="button"
                            data-statistics-tab="overview"
                            aria-selected="${this.mode === "overview"}">
                            總覽
                        </button>
                        <button type="button"
                            data-statistics-tab="details"
                            aria-selected="${this.mode === "details"}">
                            詳細
                        </button>
                    </div>
                </header>

                ${this.renderOverview(report)}
                ${this.renderWinnerRates(report)}

                <div class="session-statistics__details">
                    ${this.renderBetting(report)}
                    ${this.renderSideBets(report)}
                    ${this.renderEquity(report)}
                </div>

            </section>
        `;
    }

    bind() {
        if (!this.root) {
            return;
        }

        this.root
            .querySelectorAll(
                "[data-statistics-tab]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        this.setMode(
                            button.dataset
                                .statisticsTab
                        );
                    }
                );
            });
    }

    mount(target, report = null) {
        if (!this.document) {
            throw new Error(
                "SessionStatisticsPanel requires a document."
            );
        }

        const element =
            typeof target === "string"
                ? this.document
                    .querySelector(target)
                : target;

        if (!element) {
            throw new Error(
                "SessionStatisticsPanel mount target was not found."
            );
        }

        this.report =
            report;

        element.innerHTML =
            this.template(report);

        this.root =
            element.querySelector(
                "[data-session-statistics]"
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

        const parent =
            this.root.parentElement;

        return this.mount(
            parent,
            report
        );
    }

    setMode(mode) {
        if (
            !["overview", "details"]
                .includes(mode)
        ) {
            throw new Error(
                `Unknown statistics mode: ${mode}`
            );
        }

        this.mode =
            mode;

        if (this.report && this.root) {
            this.update(
                this.report
            );
        }

        return this;
    }

    clear() {
        this.report =
            null;

        if (this.root) {
            const parent =
                this.root.parentElement;

            this.mount(
                parent,
                null
            );
        }

        return this;
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
                SESSION_STATISTICS_PANEL_VERSION,
            mounted:
                Boolean(this.root),
            hasReport:
                Boolean(this.report),
            mode:
                this.mode,
            rounds:
                this.report
                    ?.summary
                    ?.rounds ??
                0
        };
    }
}
