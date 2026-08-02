/**
 * Baccarat Analyzer V3.4
 * components/RecommendationPanel.js
 *
 * 顯示：
 *
 * - 最佳建議
 * - EV / Kelly / Confidence
 * - Top 3 候選
 * - 不下注策略
 */

export const RECOMMENDATION_PANEL_VERSION =
    "3.4.0";


const LABELS =
    Object.freeze({

        player:
            "閒",

        banker:
            "莊",

        tie:
            "和"

    });


function escapeHTML(value) {

    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );

}


function money(value) {

    if (
        !Number.isFinite(
            value
        )
    ) {

        return "—";

    }


    return new Intl.NumberFormat(
        "zh-TW",
        {

            maximumFractionDigits:
                0

        }
    )
        .format(
            value
        );

}


function percent(value, digits = 1) {

    return Number.isFinite(
        value
    )
        ? `${(
            value *
            100
        ).toFixed(
            digits
        )}%`
        : "—";

}


function normalizeCandidate(
    item,
    index
) {

    return {

        name:
            item?.name ??
            null,

        label:
            item?.label ??
            LABELS[
                item?.name
            ] ??
            item?.name ??
            "—",

        amount:
            Number.isFinite(
                item?.amount
            )
                ? item.amount
                : 0,

        ev:
            Number.isFinite(
                item?.ev
            )
                ? item.ev
                : null,

        kelly:
            Number.isFinite(
                item?.kelly
            )
                ? item.kelly
                : null,

        confidence:
            Number.isFinite(
                item?.confidence
            )
                ? item.confidence
                : null,

        rank:
            item?.recommendationRank ??
            item?.rank ??
            index +
            1

    };

}


export default class RecommendationPanel {

    constructor({

        analysis = null,

        mode = "quick",

        minBet = 100,

        maxBet = 10000

    } = {}) {

        this.analysis =
            analysis;

        this.mode =
            mode;

        this.minBet =
            minBet;

        this.maxBet =
            maxBet;

    }


    setData(
        options = {}
    ) {

        Object.assign(
            this,
            options
        );

        return this;

    }


    getRecommendation() {

        return (
            this.analysis
                ?.recommendation ??
            {}
        );

    }


    getCandidates() {

        const recommendation =
            this.getRecommendation();

        const source =
            Array.isArray(
                recommendation
                    .candidates
            )
                ? recommendation
                    .candidates
                : (
                    Array.isArray(
                        this.analysis
                            ?.ranking
                    )
                        ? this.analysis
                            .ranking
                        : []
                );


        return source
            .filter(
                item =>
                    item &&
                    item.recommendationEligible !==
                        false &&
                    item.eligible !==
                        false &&
                    Number.isFinite(
                        item.ev
                    ) &&
                    item.ev >
                        0
            )
            .sort(
                (
                    left,
                    right
                ) =>
                    right.ev -
                    left.ev
            )
            .slice(
                0,
                3
            )
            .map(
                normalizeCandidate
            );

    }


    render() {

        if (
            !this.analysis
        ) {

            return `

                <section class="dashboardCard v3RecommendationPanel empty">

                    <small>
                        RECOMMENDATION
                    </small>

                    <h2>
                        等待分析
                    </h2>

                    <p>
                        完成燒牌後會產生下一局建議。
                    </p>

                </section>

            `;

        }


        const recommendation =
            this.getRecommendation();

        const best =
            this.analysis.best ??
            null;

        const shouldBet =
            this.analysis.shouldBet ??
            recommendation
                .shouldBet ??
            false;

        const betKey =
            recommendation.bet ??
            best?.name ??
            null;

        const label =
            shouldBet
                ? (
                    recommendation
                        .label ??
                    LABELS[
                        betKey
                    ] ??
                    "主注"
                )
                : "不下注";


        const amount =
            shouldBet &&
            Number.isFinite(
                recommendation
                    .amount
            )
                ? Math.min(
                    this.maxBet,
                    Math.max(
                        this.minBet,
                        recommendation
                            .amount
                    )
                )
                : 0;


        const recommendationEV =
            Number.isFinite(
                recommendation.ev
            )
                ? recommendation.ev
                : best?.ev;


        const recommendationKelly =
            Number.isFinite(
                recommendation.kelly
            )
                ? recommendation
                    .kelly
                : best?.kelly;


        const recommendationConfidence =
            Number.isFinite(
                recommendation
                    .confidence
            )
                ? recommendation
                    .confidence
                : this.analysis
                    .overallConfidence;


        const candidates =
            this.getCandidates();


        const message =
            recommendation.message ??
            (
                shouldBet
                    ? "此主注通過目前的 EV、可信度與風險條件。"
                    : "目前沒有符合條件的正期望主注。"
            );


        return `

            <section class="dashboardCard v3RecommendationPanel ${shouldBet
                ? "bet"
                : "skip"}">

                <small>
                    RECOMMENDATION V3.4
                </small>

                <div class="v3RecommendationHeadline">

                    <div>

                        <span>
                            ${shouldBet
                                ? "最高 EV 建議"
                                : "建議觀望"}
                        </span>

                        <h2>
                            ${escapeHTML(
                                label
                            )}
                        </h2>

                    </div>

                    ${shouldBet
                        ? `
                            <strong class="v3BetAmount">
                                ${money(
                                    amount
                                )}
                            </strong>
                        `
                        : ""}

                </div>


                <div class="v34RecommendationStats">

                    <div>
                        <span>EV</span>
                        <strong class="${Number(
                            recommendationEV
                        ) > 0
                            ? "positive"
                            : "negative"}">
                            ${percent(
                                recommendationEV,
                                2
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Kelly</span>
                        <strong>
                            ${percent(
                                recommendationKelly,
                                2
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>信心</span>
                        <strong>
                            ${percent(
                                recommendationConfidence,
                                1
                            )}
                        </strong>
                    </div>

                </div>


                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>


                ${candidates.length > 0
                    ? this.renderCandidates(
                        candidates
                    )
                    : this.renderSkipDetail(
                        recommendation
                    )}


                ${this.mode ===
                    "full"
                    ? `
                        <div class="v3RecommendationMeta">

                            <span>
                                最低 ${money(
                                    this.minBet
                                )}
                            </span>

                            <span>
                                最高 ${money(
                                    this.maxBet
                                )}
                            </span>

                            <span>
                                候選 ${candidates.length}
                            </span>

                        </div>
                    `
                    : ""}

            </section>

        `;

    }


    renderCandidates(
        candidates
    ) {

        return `

            <div class="v34CandidateList">

                <div class="v34CandidateHeader">

                    <strong>
                        Top ${candidates.length}
                    </strong>

                    <span>
                        依 EV 排序
                    </span>

                </div>

                ${candidates
                    .map(
                        candidate => `

                            <div
                                class="v34CandidateItem ${candidate.rank === 1
                                    ? "best"
                                    : ""}"
                            >

                                <span class="v34CandidateRank">
                                    ${candidate.rank}
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        candidate.label
                                    )}
                                </strong>

                                <span class="v34CandidateEV">
                                    ${percent(
                                        candidate.ev,
                                        2
                                    )}
                                </span>

                                <span class="v34CandidateAmount">
                                    ${candidate.amount > 0
                                        ? money(
                                            candidate.amount
                                        )
                                        : "—"}
                                </span>

                            </div>

                        `
                    )
                    .join(
                        ""
                    )}

            </div>

        `;

    }


    renderSkipDetail(
        recommendation
    ) {

        const reason =
            recommendation
                .reasons?.[0] ??
            "所有主注皆未通過下注條件";


        return `

            <div class="v34SkipStrategy">

                <strong>
                    不下注也是策略
                </strong>

                <span>
                    ${escapeHTML(
                        reason
                    )}
                </span>

            </div>

        `;

    }

}
