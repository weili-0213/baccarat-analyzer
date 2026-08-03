/**
 * Baccarat Analyzer V4.2
 * analysis/SessionReport.js
 *
 * 將 SessionAnalyzer 的分析結果整理成：
 * - UI ViewModel
 * - JSON
 * - CSV
 * - 純文字摘要
 *
 * 不重新計算統計資料。
 */

export const SESSION_REPORT_VERSION = "4.2.0";

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function finiteOr(value, fallback = 0) {
    return Number.isFinite(value)
        ? value
        : fallback;
}

function percent(value, digits = 1) {
    return `${(
        finiteOr(value) * 100
    ).toFixed(digits)}%`;
}

function number(value, digits = 2) {
    return finiteOr(value).toFixed(digits);
}

function money(value, digits = 0) {
    return finiteOr(value).toFixed(digits);
}

function csvEscape(value) {
    const text = String(
        value ?? ""
    );

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}

function clone(value) {
    if (value === undefined) {
        return undefined;
    }

    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        }
        catch {
            // Fall through.
        }
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

export default class SessionReport {
    constructor({
        locale = "zh-TW",
        currency = "TWD",
        percentDigits = 1,
        moneyDigits = 0
    } = {}) {
        if (
            typeof locale !== "string" ||
            !locale
        ) {
            throw new TypeError(
                "locale must be a non-empty string."
            );
        }

        if (
            typeof currency !== "string" ||
            !currency
        ) {
            throw new TypeError(
                "currency must be a non-empty string."
            );
        }

        this.options = {
            locale,
            currency,
            percentDigits,
            moneyDigits
        };

        this.lastReport = null;
        this.runCount = 0;
    }

    validateAnalysis(analysis) {
        if (!isObject(analysis)) {
            throw new TypeError(
                "SessionReport requires a SessionAnalyzer result."
            );
        }

        for (const key of [
            "winners",
            "winRate",
            "streak",
            "trend",
            "analysis",
            "betting",
            "summary"
        ]) {
            if (!(key in analysis)) {
                throw new Error(
                    `Session analysis is missing ${key}.`
                );
            }
        }

        return true;
    }

    buildHeader(analysis) {
        return {
            version:
                SESSION_REPORT_VERSION,

            title:
                "百家樂 Session 報告",

            shoeNumber:
                analysis.shoeNumber ?? null,

            startedAt:
                analysis.startedAt ?? null,

            endedAt:
                analysis.endedAt ?? null,

            durationMs:
                analysis.durationMs ?? null,

            generatedAt:
                analysis.generatedAt ?? null
        };
    }

    buildSummary(analysis) {
        return {
            rounds:
                analysis.rounds ?? 0,

            dominantWinner:
                analysis.summary
                    ?.dominantWinner ??
                null,

            trend:
                analysis.trend
                    ?.type ??
                null,

            longestStreak:
                analysis.summary
                    ?.longestStreak ??
                0,

            recommendationRate:
                analysis.analysis
                    ?.recommendationRate ??
                0,

            totalProfit:
                analysis.betting
                    ?.totalProfit ??
                0,

            roi:
                analysis.betting
                    ?.roi ??
                0,

            maxDrawdown:
                analysis.betting
                    ?.maxDrawdown ??
                0
        };
    }

    buildStatistics(analysis) {
        return {
            winners:
                clone(
                    analysis.winners
                ),

            winRate:
                clone(
                    analysis.winRate
                ),

            sideBets:
                clone(
                    analysis.sideBets ??
                    {}
                ),

            streak:
                clone(
                    analysis.streak
                ),

            trend:
                clone(
                    analysis.trend
                ),

            scores:
                clone(
                    analysis.scores ??
                    {}
                )
        };
    }

    buildAnalysisSection(analysis) {
        return {
            count:
                analysis.analysis
                    ?.count ??
                0,

            shouldBetCount:
                analysis.analysis
                    ?.shouldBetCount ??
                0,

            skipCount:
                analysis.analysis
                    ?.skipCount ??
                0,

            recommendationRate:
                analysis.analysis
                    ?.recommendationRate ??
                0,

            averageConfidence:
                analysis.analysis
                    ?.averageConfidence ??
                null,

            averageDurationMs:
                analysis.analysis
                    ?.averageDurationMs ??
                null,

            recommendedBets:
                clone(
                    analysis.analysis
                        ?.recommendedBets ??
                    {}
                )
        };
    }

    buildBettingSection(analysis) {
        return {
            count:
                analysis.betting
                    ?.count ??
                0,

            totalStake:
                analysis.betting
                    ?.totalStake ??
                0,

            totalProfit:
                analysis.betting
                    ?.totalProfit ??
                0,

            roi:
                analysis.betting
                    ?.roi ??
                0,

            wins:
                analysis.betting
                    ?.wins ??
                0,

            losses:
                analysis.betting
                    ?.losses ??
                0,

            pushes:
                analysis.betting
                    ?.pushes ??
                0,

            winRate:
                analysis.betting
                    ?.winRate ??
                0,

            averageStake:
                analysis.betting
                    ?.averageStake ??
                0,

            averageProfit:
                analysis.betting
                    ?.averageProfit ??
                0,

            maxDrawdown:
                analysis.betting
                    ?.maxDrawdown ??
                0,

            endingBankrollChange:
                analysis.betting
                    ?.endingBankrollChange ??
                0,

            equityCurve:
                clone(
                    analysis.betting
                        ?.equityCurve ??
                    []
                )
        };
    }

    buildCharts(analysis) {
        return {
            winnerDistribution: [
                {
                    label: "閒",
                    key: "player",
                    value:
                        analysis.winners
                            ?.player ??
                        0
                },
                {
                    label: "莊",
                    key: "banker",
                    value:
                        analysis.winners
                            ?.banker ??
                        0
                },
                {
                    label: "和",
                    key: "tie",
                    value:
                        analysis.winners
                            ?.tie ??
                        0
                }
            ],

            winnerRates: [
                {
                    label: "閒",
                    key: "player",
                    value:
                        analysis.winRate
                            ?.player ??
                        0
                },
                {
                    label: "莊",
                    key: "banker",
                    value:
                        analysis.winRate
                            ?.banker ??
                        0
                },
                {
                    label: "和",
                    key: "tie",
                    value:
                        analysis.winRate
                            ?.tie ??
                        0
                }
            ],

            equityCurve:
                clone(
                    analysis.betting
                        ?.equityCurve ??
                    []
                ),

            recentRounds:
                clone(
                    analysis.recentRounds ??
                    []
                )
        };
    }

    buildFormatted(report) {
        return {
            rounds:
                String(
                    report.summary.rounds
                ),

            playerRate:
                percent(
                    report.statistics
                        .winRate
                        .player,
                    this.options
                        .percentDigits
                ),

            bankerRate:
                percent(
                    report.statistics
                        .winRate
                        .banker,
                    this.options
                        .percentDigits
                ),

            tieRate:
                percent(
                    report.statistics
                        .winRate
                        .tie,
                    this.options
                        .percentDigits
                ),

            recommendationRate:
                percent(
                    report.analysis
                        .recommendationRate,
                    this.options
                        .percentDigits
                ),

            averageConfidence:
                report.analysis
                    .averageConfidence ===
                    null
                    ? "—"
                    : percent(
                        report.analysis
                            .averageConfidence,
                        this.options
                            .percentDigits
                    ),

            roi:
                percent(
                    report.betting.roi,
                    this.options
                        .percentDigits
                ),

            totalStake:
                money(
                    report.betting
                        .totalStake,
                    this.options
                        .moneyDigits
                ),

            totalProfit:
                money(
                    report.betting
                        .totalProfit,
                    this.options
                        .moneyDigits
                ),

            maxDrawdown:
                money(
                    report.betting
                        .maxDrawdown,
                    this.options
                        .moneyDigits
                ),

            winRate:
                percent(
                    report.betting
                        .winRate,
                    this.options
                        .percentDigits
                ),

            averageDurationMs:
                report.analysis
                    .averageDurationMs ===
                    null
                    ? "—"
                    : number(
                        report.analysis
                            .averageDurationMs,
                        1
                    )
        };
    }

    create(analysis) {
        this.validateAnalysis(
            analysis
        );

        const report = {
            version:
                SESSION_REPORT_VERSION,

            header:
                this.buildHeader(
                    analysis
                ),

            summary:
                this.buildSummary(
                    analysis
                ),

            statistics:
                this.buildStatistics(
                    analysis
                ),

            analysis:
                this.buildAnalysisSection(
                    analysis
                ),

            betting:
                this.buildBettingSection(
                    analysis
                ),

            charts:
                this.buildCharts(
                    analysis
                ),

            metadata:
                clone(
                    analysis.metadata ??
                    {}
                )
        };

        report.formatted =
            this.buildFormatted(
                report
            );

        this.lastReport =
            report;

        this.runCount++;

        return clone(
            report
        );
    }

    toJSON(report = this.lastReport, {
        pretty = true
    } = {}) {
        if (!report) {
            throw new Error(
                "No SessionReport is available."
            );
        }

        return JSON.stringify(
            report,
            null,
            pretty
                ? 2
                : 0
        );
    }

    toCSV(report = this.lastReport) {
        if (!report) {
            throw new Error(
                "No SessionReport is available."
            );
        }

        const rows = [
            [
                "section",
                "metric",
                "value"
            ],
            [
                "summary",
                "rounds",
                report.summary.rounds
            ],
            [
                "summary",
                "dominantWinner",
                report.summary.dominantWinner
            ],
            [
                "summary",
                "trend",
                report.summary.trend
            ],
            [
                "statistics",
                "playerWins",
                report.statistics
                    .winners
                    .player
            ],
            [
                "statistics",
                "bankerWins",
                report.statistics
                    .winners
                    .banker
            ],
            [
                "statistics",
                "tieWins",
                report.statistics
                    .winners
                    .tie
            ],
            [
                "analysis",
                "recommendationRate",
                report.analysis
                    .recommendationRate
            ],
            [
                "analysis",
                "averageConfidence",
                report.analysis
                    .averageConfidence
            ],
            [
                "betting",
                "totalStake",
                report.betting
                    .totalStake
            ],
            [
                "betting",
                "totalProfit",
                report.betting
                    .totalProfit
            ],
            [
                "betting",
                "roi",
                report.betting.roi
            ],
            [
                "betting",
                "maxDrawdown",
                report.betting
                    .maxDrawdown
            ]
        ];

        return rows
            .map(row =>
                row
                    .map(csvEscape)
                    .join(",")
            )
            .join("\n");
    }

    toText(report = this.lastReport) {
        if (!report) {
            throw new Error(
                "No SessionReport is available."
            );
        }

        return [
            report.header.title,
            "",
            `局數：${report.summary.rounds}`,
            `主要勝方：${report.summary.dominantWinner ?? "—"}`,
            `趨勢：${report.summary.trend ?? "—"}`,
            `最長連續：${report.summary.longestStreak}`,
            "",
            `閒勝率：${report.formatted.playerRate}`,
            `莊勝率：${report.formatted.bankerRate}`,
            `和局率：${report.formatted.tieRate}`,
            "",
            `建議下注率：${report.formatted.recommendationRate}`,
            `平均可信度：${report.formatted.averageConfidence}`,
            "",
            `總下注：${report.formatted.totalStake}`,
            `總損益：${report.formatted.totalProfit}`,
            `ROI：${report.formatted.roi}`,
            `最大回撤：${report.formatted.maxDrawdown}`
        ].join("\n");
    }

    clear() {
        this.lastReport = null;
        return this;
    }

    get summary() {
        return {
            version:
                SESSION_REPORT_VERSION,

            runCount:
                this.runCount,

            hasReport:
                Boolean(
                    this.lastReport
                ),

            lastRounds:
                this.lastReport
                    ?.summary
                    ?.rounds ??
                0,

            lastROI:
                this.lastReport
                    ?.betting
                    ?.roi ??
                0
        };
    }
}
