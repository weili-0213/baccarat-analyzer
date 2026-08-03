/**
 * Baccarat Analyzer V4.4
 * components/SessionChartsPanel.js
 *
 * Dashboard chart renderer using native SVG/CSS only.
 * No external chart library is required.
 */

export const SESSION_CHARTS_PANEL_VERSION = "4.4.0";

export const SessionChartType = Object.freeze({
    EQUITY: "equity",
    WINNERS: "winners",
    RECOMMENDATIONS: "recommendations",
    SIDE_BETS: "side-bets",
    TIMELINE: "timeline"
});

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

function finiteOr(value, fallback = 0) {
    return Number.isFinite(value)
        ? value
        : fallback;
}

function clamp(value, minimum, maximum) {
    return Math.min(
        maximum,
        Math.max(minimum, value)
    );
}

function winnerLabel(name) {
    return {
        player: "閒",
        banker: "莊",
        tie: "和"
    }[name] ?? name;
}

export default class SessionChartsPanel {
    constructor({
        documentRef = globalThis.document ?? null,
        defaultChart = SessionChartType.EQUITY
    } = {}) {
        if (
            !Object.values(SessionChartType)
                .includes(defaultChart)
        ) {
            throw new Error(
                `Unknown default chart: ${defaultChart}`
            );
        }

        this.document = documentRef;
        this.activeChart = defaultChart;
        this.root = null;
        this.report = null;
    }

    validateReport(report) {
        if (!isObject(report)) {
            throw new TypeError(
                "SessionChartsPanel requires a SessionReport."
            );
        }

        for (const key of [
            "statistics",
            "analysis",
            "betting",
            "charts"
        ]) {
            if (!(key in report)) {
                throw new Error(
                    `SessionReport is missing ${key}.`
                );
            }
        }

        return true;
    }

    normalizeEquity(points) {
        if (!Array.isArray(points) || points.length === 0) {
            return [];
        }

        const values = points.map(point =>
            finiteOr(point.equity)
        );

        const minimum = Math.min(0, ...values);
        const maximum = Math.max(0, ...values);
        const range = Math.max(1, maximum - minimum);

        const width = 100;
        const height = 48;

        return points.map((point, index) => ({
            round:
                point.round ?? index + 1,
            equity:
                finiteOr(point.equity),
            profit:
                finiteOr(point.profit),
            x:
                points.length === 1
                    ? width / 2
                    : index /
                        (points.length - 1) *
                        width,
            y:
                height -
                (
                    finiteOr(point.equity) -
                    minimum
                ) /
                range *
                height
        }));
    }

    buildPolyline(points) {
        return points
            .map(point =>
                `${point.x.toFixed(2)},${point.y.toFixed(2)}`
            )
            .join(" ");
    }

    buildArea(points) {
        if (points.length === 0) {
            return "";
        }

        const first = points[0];
        const last = points[points.length - 1];

        return [
            `M ${first.x.toFixed(2)} 48`,
            ...points.map(point =>
                `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
            ),
            `L ${last.x.toFixed(2)} 48`,
            "Z"
        ].join(" ");
    }

    renderEmpty(message) {
        return `
            <div class="session-chart-empty">
                ${escapeHTML(message)}
            </div>
        `;
    }

    renderEquity(report) {
        const points = this.normalizeEquity(
            report.charts.equityCurve
        );

        if (points.length === 0) {
            return this.renderEmpty(
                "尚無下注資金曲線"
            );
        }

        const finalEquity =
            points[points.length - 1].equity;

        return `
            <div class="session-chart-card"
                data-chart="equity">

                <header class="session-chart-card__header">
                    <div>
                        <h3>資金曲線</h3>
                        <p>每筆下注後的累積損益</p>
                    </div>
                    <strong class="${
                        finalEquity >= 0
                            ? "is-positive"
                            : "is-negative"
                    }">
                        ${finalEquity > 0 ? "+" : ""}${escapeHTML(finalEquity)}
                    </strong>
                </header>

                <svg class="session-line-chart"
                    viewBox="0 0 100 52"
                    role="img"
                    aria-label="Session 資金曲線">

                    <line
                        x1="0"
                        y1="48"
                        x2="100"
                        y2="48"
                        class="session-line-chart__axis">
                    </line>

                    <path
                        d="${this.buildArea(points)}"
                        class="session-line-chart__area">
                    </path>

                    <polyline
                        points="${this.buildPolyline(points)}"
                        class="session-line-chart__line">
                    </polyline>

                    ${points.map(point => `
                        <circle
                            cx="${point.x.toFixed(2)}"
                            cy="${point.y.toFixed(2)}"
                            r="1.5"
                            class="session-line-chart__point">
                            <title>
                                第 ${escapeHTML(point.round)} 局：
                                ${escapeHTML(point.equity)}
                            </title>
                        </circle>
                    `).join("")}

                </svg>
            </div>
        `;
    }

    renderWinners(report) {
        const data = [
            {
                key: "player",
                label: "閒",
                count:
                    finiteOr(
                        report.statistics
                            .winners
                            .player
                    ),
                rate:
                    finiteOr(
                        report.statistics
                            .winRate
                            .player
                    )
            },
            {
                key: "banker",
                label: "莊",
                count:
                    finiteOr(
                        report.statistics
                            .winners
                            .banker
                    ),
                rate:
                    finiteOr(
                        report.statistics
                            .winRate
                            .banker
                    )
            },
            {
                key: "tie",
                label: "和",
                count:
                    finiteOr(
                        report.statistics
                            .winners
                            .tie
                    ),
                rate:
                    finiteOr(
                        report.statistics
                            .winRate
                            .tie
                    )
            }
        ];

        const total = data.reduce(
            (sum, item) =>
                sum + item.count,
            0
        );

        if (total === 0) {
            return this.renderEmpty(
                "尚無勝方資料"
            );
        }

        const playerDeg =
            data[0].rate * 360;

        const bankerDeg =
            playerDeg +
            data[1].rate * 360;

        return `
            <div class="session-chart-card"
                data-chart="winners">

                <header class="session-chart-card__header">
                    <div>
                        <h3>勝方分布</h3>
                        <p>${total} 局有效結果</p>
                    </div>
                </header>

                <div class="session-donut-layout">

                    <div class="session-donut-chart"
                        style="
                            --player-end:${playerDeg}deg;
                            --banker-end:${bankerDeg}deg;
                        "
                        role="img"
                        aria-label="閒莊和勝方比例">

                        <div class="session-donut-chart__center">
                            <strong>${total}</strong>
                            <span>總局數</span>
                        </div>

                    </div>

                    <div class="session-chart-legend">
                        ${data.map(item => `
                            <div class="session-chart-legend__row"
                                data-winner="${item.key}">
                                <span class="session-chart-legend__marker"></span>
                                <span>${item.label}</span>
                                <strong>
                                    ${(item.rate * 100).toFixed(1)}%
                                </strong>
                                <small>${item.count} 局</small>
                            </div>
                        `).join("")}
                    </div>

                </div>
            </div>
        `;
    }

    renderRecommendations(report) {
        const bets =
            report.analysis.recommendedBets ?? {};

        const data = [
            {
                key: "player",
                label: "閒",
                value:
                    finiteOr(bets.player)
            },
            {
                key: "banker",
                label: "莊",
                value:
                    finiteOr(bets.banker)
            },
            {
                key: "tie",
                label: "和",
                value:
                    finiteOr(bets.tie)
            },
            {
                key: "other",
                label: "其他",
                value:
                    finiteOr(bets.other)
            }
        ];

        const maximum = Math.max(
            1,
            ...data.map(item =>
                item.value
            )
        );

        return `
            <div class="session-chart-card"
                data-chart="recommendations">

                <header class="session-chart-card__header">
                    <div>
                        <h3>推薦分布</h3>
                        <p>
                            建議下注率
                            ${escapeHTML(
                                report.formatted
                                    ?.recommendationRate ??
                                "—"
                            )}
                        </p>
                    </div>
                </header>

                <div class="session-horizontal-bars">
                    ${data.map(item => `
                        <div class="session-horizontal-bar"
                            data-bet="${item.key}">
                            <span>${item.label}</span>
                            <div class="session-horizontal-bar__track">
                                <span
                                    class="session-horizontal-bar__value"
                                    style="--bar-ratio:${
                                        item.value / maximum
                                    }">
                                </span>
                            </div>
                            <strong>${item.value}</strong>
                        </div>
                    `).join("")}
                </div>

            </div>
        `;
    }

    renderSideBets(report) {
        const values =
            report.statistics.sideBets ?? {};

        const rows = [
            ["playerPair", "閒對"],
            ["bankerPair", "莊對"],
            ["natural", "自然牌"],
            ["super6", "Super 6"],
            ["playerDragonBonus", "閒龍寶"],
            ["bankerDragonBonus", "莊龍寶"]
        ].map(([key, label]) => ({
            key,
            label,
            value:
                finiteOr(values[key])
        }));

        const maximum = Math.max(
            1,
            ...rows.map(row =>
                row.value
            )
        );

        return `
            <div class="session-chart-card"
                data-chart="side-bets">

                <header class="session-chart-card__header">
                    <div>
                        <h3>特殊結果分布</h3>
                        <p>Pair、Natural、Super 6、Dragon Bonus</p>
                    </div>
                </header>

                <div class="session-column-chart">
                    ${rows.map(row => `
                        <div class="session-column-chart__item">
                            <strong>${row.value}</strong>
                            <span class="session-column-chart__bar"
                                style="--column-ratio:${
                                    row.value / maximum
                                }">
                            </span>
                            <small>${row.label}</small>
                        </div>
                    `).join("")}
                </div>

            </div>
        `;
    }

    renderTimeline(report) {
        const rounds =
            report.charts.recentRounds ?? [];

        if (rounds.length === 0) {
            return this.renderEmpty(
                "尚無近期路線資料"
            );
        }

        return `
            <div class="session-chart-card"
                data-chart="timeline">

                <header class="session-chart-card__header">
                    <div>
                        <h3>近期結果時間線</h3>
                        <p>最近 ${rounds.length} 局</p>
                    </div>
                </header>

                <div class="session-result-timeline">
                    ${rounds.map((round, index) => {
                        const winner =
                            String(
                                round.winner ??
                                ""
                            )
                                .toLowerCase();

                        return `
                            <div class="session-result-timeline__item"
                                data-winner="${escapeHTML(winner)}">
                                <span>
                                    ${escapeHTML(
                                        winnerLabel(winner)
                                    )}
                                </span>
                                <small>${index + 1}</small>
                            </div>
                        `;
                    }).join("")}
                </div>

            </div>
        `;
    }

    renderActiveChart(report) {
        switch (this.activeChart) {
            case SessionChartType.WINNERS:
                return this.renderWinners(report);

            case SessionChartType.RECOMMENDATIONS:
                return this.renderRecommendations(report);

            case SessionChartType.SIDE_BETS:
                return this.renderSideBets(report);

            case SessionChartType.TIMELINE:
                return this.renderTimeline(report);

            case SessionChartType.EQUITY:
            default:
                return this.renderEquity(report);
        }
    }

    template(report) {
        this.validateReport(report);

        const tabs = [
            [SessionChartType.EQUITY, "資金"],
            [SessionChartType.WINNERS, "勝方"],
            [SessionChartType.RECOMMENDATIONS, "推薦"],
            [SessionChartType.SIDE_BETS, "特殊"],
            [SessionChartType.TIMELINE, "時間線"]
        ];

        return `
            <section class="session-charts"
                data-session-charts
                data-active-chart="${escapeHTML(this.activeChart)}">

                <header class="session-charts__header">
                    <div>
                        <span class="session-charts__eyebrow">
                            V${SESSION_CHARTS_PANEL_VERSION}
                        </span>
                        <h2>Statistics Visualization</h2>
                    </div>

                    <div class="session-chart-tabs"
                        role="tablist">
                        ${tabs.map(([type, label]) => `
                            <button type="button"
                                data-chart-tab="${type}"
                                aria-selected="${
                                    this.activeChart === type
                                }">
                                ${label}
                            </button>
                        `).join("")}
                    </div>
                </header>

                <div class="session-charts__viewport"
                    data-chart-viewport>
                    ${this.renderActiveChart(report)}
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
                "[data-chart-tab]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        this.setChart(
                            button.dataset.chartTab
                        );
                    }
                );
            });
    }

    mount(target, report) {
        if (!this.document) {
            throw new Error(
                "SessionChartsPanel requires a document."
            );
        }

        const element =
            typeof target === "string"
                ? this.document
                    .querySelector(target)
                : target;

        if (!element) {
            throw new Error(
                "SessionChartsPanel mount target was not found."
            );
        }

        this.report = report;

        element.innerHTML =
            this.template(report);

        this.root =
            element.querySelector(
                "[data-session-charts]"
            );

        this.bind();

        return this.root;
    }

    update(report) {
        this.report = report;

        if (!this.root) {
            return null;
        }

        return this.mount(
            this.root.parentElement,
            report
        );
    }

    setChart(type) {
        if (
            !Object.values(SessionChartType)
                .includes(type)
        ) {
            throw new Error(
                `Unknown chart type: ${type}`
            );
        }

        this.activeChart = type;

        if (this.report && this.root) {
            this.update(this.report);
        }

        return this;
    }

    destroy() {
        if (this.root?.parentElement) {
            this.root.parentElement.innerHTML = "";
        }

        this.root = null;
        this.report = null;

        return this;
    }

    get summary() {
        return {
            version:
                SESSION_CHARTS_PANEL_VERSION,
            mounted:
                Boolean(this.root),
            hasReport:
                Boolean(this.report),
            activeChart:
                this.activeChart,
            equityPoints:
                this.report
                    ?.charts
                    ?.equityCurve
                    ?.length ??
                0
        };
    }
}
