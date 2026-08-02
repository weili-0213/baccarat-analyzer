/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Recommendation
 *
 * 顯示 Analyzer 產生的下注建議。
 *
 * 支援：
 *
 * - shouldBet
 * - recommendation
 * - best
 * - ranking
 * - overallConfidence
 * - 建議下注名稱
 * - 建議下注金額
 * - EV
 * - Kelly
 * - Risk
 * - 原因
 * - 建議觀望
 *
 * 元件只負責顯示，不負責產生下注建議。
 */

const BET_LABELS =
    Object.freeze({

        player:
            "閒",

        banker:
            "莊",

        tie:
            "和",

        playerPair:
            "閒對",

        bankerPair:
            "莊對",

        eitherPair:
            "任一對子",

        super6:
            "幸運 6",

        playerNatural:
            "閒 Natural",

        bankerNatural:
            "莊 Natural",

        natural:
            "任一 Natural",

        big:
            "大",

        small:
            "小",

        playerDragonBonus:
            "閒龍寶",

        bankerDragonBonus:
            "莊龍寶"

    });


function isObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


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
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function normalizeNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


function clamp(
    value,
    minimum,
    maximum
) {

    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );

}


function formatPercent(
    value,
    digits = 2
) {

    if (
        !Number.isFinite(value)
    ) {

        return "—";

    }

    return `${(
        value * 100
    ).toFixed(digits)}%`;

}


function formatSignedPercent(
    value,
    digits = 2
) {

    if (
        !Number.isFinite(value)
    ) {

        return "—";

    }

    const sign =
        value > 0
            ? "+"
            : "";

    return `${sign}${(
        value * 100
    ).toFixed(digits)}%`;

}


function formatNumber(
    value,
    digits = 4
) {

    if (
        !Number.isFinite(value)
    ) {

        return "—";

    }

    const sign =
        value > 0
            ? "+"
            : "";

    return `${sign}${value.toFixed(
        digits
    )}`;

}


function formatMoney(value) {

    if (
        !Number.isFinite(value)
    ) {

        return "—";

    }

    return new Intl
        .NumberFormat(
            "zh-TW",
            {
                maximumFractionDigits:
                    2
            }
        )
        .format(value);

}


function normalizeBetName(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;

    }

    if (
        typeof value ===
            "string"
    ) {

        return value;

    }

    if (isObject(value)) {

        return (

            value.key ??

            value.name ??

            value.bet ??

            value.id ??

            null

        );

    }

    return String(value);

}


function betLabel(value) {

    const key =
        normalizeBetName(
            value
        );

    if (!key) {

        return "不下注";

    }

    return (
        BET_LABELS[key] ??
        String(key)
    );

}


export class Recommendation {

    constructor({

        root = null,

        analysis = null,

        recommendation = null,

        shouldBet = null,

        best = null,

        ranking = [],

        overallConfidence = null,

        title = "下注建議",

        subtitle = "",

        emptyText = "尚未產生下注建議。",

        compact = false,

        showConfidence = true,

        showMetrics = true,

        showRanking = true,

        rankingLimit = 3,

        percentDigits = 2,

        numberDigits = 4,

        autoMount = true

    } = {}) {

        if (
            root !== null &&
            typeof root !==
                "string" &&
            !(
                typeof Element !==
                    "undefined" &&
                root instanceof Element
            )
        ) {

            throw new TypeError(
                "Recommendation root must be an Element, selector, or null."
            );

        }

        if (
            analysis !== null &&
            !isObject(analysis)
        ) {

            throw new TypeError(
                "analysis must be an object or null."
            );

        }

        if (
            recommendation !== null &&
            !isObject(recommendation)
        ) {

            throw new TypeError(
                "recommendation must be an object or null."
            );

        }

        if (
            !Array.isArray(ranking)
        ) {

            throw new TypeError(
                "ranking must be an array."
            );

        }

        if (
            !Number.isInteger(
                rankingLimit
            ) ||
            rankingLimit < 0
        ) {

            throw new RangeError(
                "rankingLimit must be a non-negative integer."
            );

        }

        if (
            !Number.isInteger(
                percentDigits
            ) ||
            percentDigits < 0 ||
            percentDigits > 6
        ) {

            throw new RangeError(
                "percentDigits must be an integer from 0 to 6."
            );

        }

        if (
            !Number.isInteger(
                numberDigits
            ) ||
            numberDigits < 0 ||
            numberDigits > 8
        ) {

            throw new RangeError(
                "numberDigits must be an integer from 0 to 8."
            );

        }


        this.root =
            this.resolveRoot(
                root
            );


        this.data = {

            analysis:
                null,

            recommendation:
                recommendation
                    ? {
                        ...recommendation
                    }
                    : null,

            shouldBet:
                typeof shouldBet ===
                    "boolean"
                    ? shouldBet
                    : null,

            best:
                best
                    ? {
                        ...best
                    }
                    : null,

            ranking:
                ranking.map(
                    item =>
                        isObject(item)
                            ? {
                                ...item
                            }
                            : item
                ),

            overallConfidence:
                normalizeNumber(
                    overallConfidence
                )

        };


        this.options = {

            title:
                String(
                    title ??
                    ""
                ),

            subtitle:
                String(
                    subtitle ??
                    ""
                ),

            emptyText:
                String(
                    emptyText ??
                    ""
                ),

            compact:
                Boolean(
                    compact
                ),

            showConfidence:
                Boolean(
                    showConfidence
                ),

            showMetrics:
                Boolean(
                    showMetrics
                ),

            showRanking:
                Boolean(
                    showRanking
                ),

            rankingLimit,

            percentDigits,

            numberDigits

        };


        this.state = {

            mounted:
                false,

            expanded:
                false

        };


        this.boundClick =
            event =>
                this.handleClick(
                    event
                );


        if (analysis) {

            this.setAnalysis(
                analysis,
                {
                    render:
                        false
                }
            );

        }


        if (
            autoMount &&
            this.root
        ) {

            this.mount();

        }

    }


    resolveRoot(root) {

        if (
            typeof Element !==
                "undefined" &&
            root instanceof Element
        ) {

            return root;

        }

        if (
            typeof root ===
                "string"
        ) {

            return document
                .querySelector(
                    root
                );

        }

        return null;

    }


    mount(root = this.root) {

        const resolved =
            this.resolveRoot(
                root
            );

        if (!resolved) {

            throw new Error(
                "Recommendation root element was not found."
            );

        }

        this.unbind();

        this.root =
            resolved;

        this.root.addEventListener(
            "click",
            this.boundClick
        );

        this.state.mounted =
            true;

        this.render();

        return this;

    }


    unbind() {

        if (!this.root) {

            return this;

        }

        this.root.removeEventListener(
            "click",
            this.boundClick
        );

        return this;

    }


    destroy() {

        this.unbind();

        if (this.root) {

            this.root.innerHTML =
                "";

        }

        this.state.mounted =
            false;

        return this;

    }


    setAnalysis(
        analysis,
        {
            render = true
        } = {}
    ) {

        if (!isObject(analysis)) {

            throw new TypeError(
                "analysis must be an object."
            );

        }

        this.data.analysis = {

            ...analysis

        };

        this.data.recommendation =

            isObject(
                analysis.recommendation
            )

                ? {
                    ...analysis
                        .recommendation
                }

                : null;

        this.data.shouldBet =

            typeof analysis.shouldBet ===
                "boolean"

                ? analysis.shouldBet

                : typeof analysis
                    .recommendation
                    ?.shouldBet ===
                    "boolean"

                    ? analysis
                        .recommendation
                        .shouldBet

                    : null;

        this.data.best =

            isObject(
                analysis.best
            )

                ? {
                    ...analysis.best
                }

                : Array.isArray(
                    analysis.ranking
                ) &&
                isObject(
                    analysis.ranking[0]
                )

                    ? {
                        ...analysis
                            .ranking[0]
                    }

                    : null;

        this.data.ranking =

            Array.isArray(
                analysis.ranking
            )

                ? analysis.ranking.map(
                    item =>
                        isObject(item)
                            ? {
                                ...item
                            }
                            : item
                )

                : [];

        this.data.overallConfidence =

            normalizeNumber(
                analysis
                    .overallConfidence
            ) ??

            normalizeNumber(
                analysis
                    .confidence
                    ?.overall
            ) ??

            normalizeNumber(
                analysis
                    .recommendation
                    ?.confidence
            );


        if (render) {

            this.render();

        }

        return this;

    }


    update(analysis) {

        return this.setAnalysis(
            analysis
        );

    }


    setRecommendation(
        recommendation = null
    ) {

        if (
            recommendation !== null &&
            !isObject(recommendation)
        ) {

            throw new TypeError(
                "recommendation must be an object or null."
            );

        }

        this.data.recommendation =

            recommendation
                ? {
                    ...recommendation
                }
                : null;

        if (
            typeof recommendation
                ?.shouldBet ===
                "boolean"
        ) {

            this.data.shouldBet =
                recommendation
                    .shouldBet;

        }

        this.render();

        return this;

    }


    setOptions(options = {}) {

        if (!isObject(options)) {

            throw new TypeError(
                "Recommendation options must be an object."
            );

        }

        for (
            const field of
            [
                "title",
                "subtitle",
                "emptyText"
            ]
        ) {

            if (
                options[field] !==
                    undefined
            ) {

                this.options[field] =
                    String(
                        options[field] ??
                        ""
                    );

            }

        }

        for (
            const field of
            [
                "compact",
                "showConfidence",
                "showMetrics",
                "showRanking"
            ]
        ) {

            if (
                options[field] !==
                    undefined
            ) {

                this.options[field] =
                    Boolean(
                        options[field]
                    );

            }

        }

        if (
            options.rankingLimit !==
                undefined
        ) {

            if (
                !Number.isInteger(
                    options.rankingLimit
                ) ||
                options.rankingLimit < 0
            ) {

                throw new RangeError(
                    "rankingLimit must be a non-negative integer."
                );

            }

            this.options.rankingLimit =
                options.rankingLimit;

        }

        if (
            options.percentDigits !==
                undefined
        ) {

            if (
                !Number.isInteger(
                    options.percentDigits
                ) ||
                options.percentDigits < 0 ||
                options.percentDigits > 6
            ) {

                throw new RangeError(
                    "percentDigits must be an integer from 0 to 6."
                );

            }

            this.options.percentDigits =
                options.percentDigits;

        }

        if (
            options.numberDigits !==
                undefined
        ) {

            if (
                !Number.isInteger(
                    options.numberDigits
                ) ||
                options.numberDigits < 0 ||
                options.numberDigits > 8
            ) {

                throw new RangeError(
                    "numberDigits must be an integer from 0 to 8."
                );

            }

            this.options.numberDigits =
                options.numberDigits;

        }

        this.render();

        return this;

    }


    clear() {

        this.data = {

            analysis:
                null,

            recommendation:
                null,

            shouldBet:
                null,

            best:
                null,

            ranking:
                [],

            overallConfidence:
                null

        };

        this.state.expanded =
            false;

        this.render();

        return this;

    }


    get hasData() {

        return Boolean(

            this.data.analysis ||

            this.data.recommendation ||

            this.data.best ||

            this.data.ranking.length > 0

        );

    }


    get shouldBet() {

        if (
            typeof this.data
                .shouldBet ===
                "boolean"
        ) {

            return this.data
                .shouldBet;

        }

        const recommendation =
            this.data
                .recommendation;

        if (
            typeof recommendation
                ?.shouldBet ===
                "boolean"
        ) {

            return recommendation
                .shouldBet;

        }

        const ev =
            this.recommendedEV;

        return (
            ev !== null &&
            ev > 0
        );

    }


    get recommendedKey() {

        const recommendation =
            this.data
                .recommendation;

        return (

            normalizeBetName(
                recommendation?.bet
            ) ??

            normalizeBetName(
                recommendation?.name
            ) ??

            normalizeBetName(
                recommendation?.key
            ) ??

            normalizeBetName(
                this.data.best
            ) ??

            null

        );

    }


    get recommendedLabel() {

        return betLabel(
            this.recommendedKey
        );

    }


    get recommendedAmount() {

        const recommendation =
            this.data
                .recommendation;

        return (

            normalizeNumber(
                recommendation?.amount
            ) ??

            normalizeNumber(
                recommendation?.betAmount
            ) ??

            normalizeNumber(
                recommendation
                    ?.recommendedAmount
            ) ??

            normalizeNumber(
                this.data.best
                    ?.amount
            )

        );

    }


    get recommendedEV() {

        const recommendation =
            this.data
                .recommendation;

        const key =
            this.recommendedKey;

        return (

            normalizeNumber(
                recommendation?.ev
            ) ??

            normalizeNumber(
                this.data.best?.ev
            ) ??

            normalizeNumber(
                this.data.best?.value
            ) ??

            normalizeNumber(
                this.data.analysis
                    ?.ev?.[
                        key
                    ]
            )

        );

    }


    get recommendedKelly() {

        const recommendation =
            this.data
                .recommendation;

        const key =
            this.recommendedKey;

        return (

            normalizeNumber(
                recommendation
                    ?.kelly
            ) ??

            normalizeNumber(
                recommendation
                    ?.kellyFraction
            ) ??

            normalizeNumber(
                this.data.best
                    ?.kelly
            ) ??

            normalizeNumber(
                this.data.analysis
                    ?.kelly?.[
                        key
                    ]
            )

        );

    }


    get recommendedRisk() {

        const recommendation =
            this.data
                .recommendation;

        const key =
            this.recommendedKey;

        return (

            normalizeNumber(
                recommendation
                    ?.risk
            ) ??

            normalizeNumber(
                this.data.best
                    ?.risk
            ) ??

            normalizeNumber(
                this.data.analysis
                    ?.risk?.[
                        key
                    ]
            )

        );

    }


    get confidence() {

        return (

            this.data
                .overallConfidence ??

            normalizeNumber(
                this.data
                    .recommendation
                    ?.confidence
            ) ??

            normalizeNumber(
                this.data.best
                    ?.confidence
            )

        );

    }


    get reason() {

        const recommendation =
            this.data
                .recommendation;

        return (

            recommendation?.reason ??

            recommendation?.message ??

            recommendation?.description ??

            (
                this.shouldBet

                    ? "目前排名最高且符合下注條件。"

                    : "目前沒有符合條件的正期望下注。"
            )

        );

    }


    get rankingItems() {

        return this.data.ranking
            .filter(
                item =>
                    isObject(item)
            )
            .slice(
                0,
                this.state.expanded
                    ? undefined
                    : this.options
                        .rankingLimit
            );

    }


    handleClick(event) {

        const action =
            event.target.closest(
                "[data-recommendation-action]"
            );

        if (
            !action ||
            !this.root.contains(
                action
            )
        ) {

            return;

        }

        const name =
            action.dataset
                .recommendationAction;

        if (
            name ===
                "toggle-ranking"
        ) {

            this.state.expanded =
                !this.state.expanded;

            this.render();

        }

    }


    render() {

        if (!this.root) {

            return this;

        }

        this.root.innerHTML = `

            <section
                class="recommendation ${this.options.compact
                    ? "compact"
                    : ""} ${this.hasData
                        ? this.shouldBet
                            ? "bet"
                            : "noBet"
                        : "empty"}"
                data-recommendation
            >

                ${this.renderHeader()}

                ${this.hasData
                    ? this.renderContent()
                    : this.renderEmpty()}

            </section>

        `;

        return this;

    }


    renderHeader() {

        return `

            <header class="recommendationHeader">

                <div>

                    ${this.options.title
                        ? `
                            <h3>
                                ${escapeHTML(
                                    this.options.title
                                )}
                            </h3>
                        `
                        : ""}

                    ${this.options.subtitle
                        ? `
                            <p>
                                ${escapeHTML(
                                    this.options.subtitle
                                )}
                            </p>
                        `
                        : ""}

                </div>

                ${this.hasData
                    ? `
                        <span class="recommendationStatus ${this.shouldBet
                            ? "bet"
                            : "noBet"}">
                            ${this.shouldBet
                                ? "建議下注"
                                : "建議觀望"}
                        </span>
                    `
                    : ""}

            </header>

        `;

    }


    renderContent() {

        return `

            <div class="recommendationBody">

                <div class="recommendationHero">

                    <div class="recommendationIcon">
                        ${this.shouldBet
                            ? "✓"
                            : "—"}
                    </div>

                    <div class="recommendationMain">

                        <span>
                            ${this.shouldBet
                                ? "建議選項"
                                : "目前建議"}
                        </span>

                        <strong>
                            ${escapeHTML(
                                this.shouldBet
                                    ? this.recommendedLabel
                                    : "不下注"
                            )}
                        </strong>

                    </div>

                </div>

                <p class="recommendationReason">
                    ${escapeHTML(
                        this.reason
                    )}
                </p>

                ${this.options.showMetrics
                    ? this.renderMetrics()
                    : ""}

                ${this.options.showConfidence
                    ? this.renderConfidence()
                    : ""}

                ${this.options.showRanking
                    ? this.renderRanking()
                    : ""}

            </div>

        `;

    }


    renderMetrics() {

        const metrics = [

            {
                label:
                    "建議金額",

                value:
                    this.recommendedAmount,

                formatter:
                    formatMoney,

                className:
                    ""
            },

            {
                label:
                    "EV",

                value:
                    this.recommendedEV,

                formatter:
                    value =>
                        formatNumber(
                            value,
                            this.options
                                .numberDigits
                        ),

                className:
                    this.recommendedEV > 0
                        ? "positive"
                        : this.recommendedEV < 0
                            ? "negative"
                            : ""
            },

            {
                label:
                    "Kelly",

                value:
                    this.recommendedKelly,

                formatter:
                    value =>
                        formatPercent(
                            value,
                            this.options
                                .percentDigits
                        ),

                className:
                    ""
            },

            {
                label:
                    "Risk",

                value:
                    this.recommendedRisk,

                formatter:
                    value =>
                        formatPercent(
                            value,
                            this.options
                                .percentDigits
                        ),

                className:
                    this.recommendedRisk > 0.5
                        ? "negative"
                        : ""
            }

        ].filter(
            item =>
                item.value !== null
        );


        if (
            metrics.length === 0
        ) {

            return "";

        }


        return `

            <div class="recommendationMetrics">

                ${metrics.map(
                    item => `

                        <div class="recommendationMetric">

                            <span>
                                ${escapeHTML(
                                    item.label
                                )}
                            </span>

                            <strong class="${item.className}">
                                ${escapeHTML(
                                    item.formatter(
                                        item.value
                                    )
                                )}
                            </strong>

                        </div>

                    `
                ).join("")}

            </div>

        `;

    }


    renderConfidence() {

        const confidence =
            this.confidence;

        if (
            confidence === null
        ) {

            return "";

        }

        const normalized =
            clamp(
                confidence,
                0,
                1
            );

        return `

            <div class="recommendationConfidence">

                <div class="recommendationConfidenceHeader">

                    <span>
                        整體信心
                    </span>

                    <strong>
                        ${formatPercent(
                            normalized,
                            this.options
                                .percentDigits
                        )}
                    </strong>

                </div>

                <div class="recommendationConfidenceTrack">

                    <div
                        class="recommendationConfidenceFill"
                        style="width: ${normalized * 100}%"
                    ></div>

                </div>

            </div>

        `;

    }


    renderRanking() {

        if (
            this.data.ranking.length === 0
        ) {

            return "";

        }

        const items =
            this.rankingItems;

        const canToggle =

            this.data.ranking.length >

            this.options.rankingLimit;


        return `

            <div class="recommendationRanking">

                <div class="recommendationRankingHeader">

                    <h4>
                        排名
                    </h4>

                    ${canToggle
                        ? `
                            <button
                                type="button"
                                data-recommendation-action="toggle-ranking"
                            >
                                ${this.state.expanded
                                    ? "收合"
                                    : "顯示全部"}
                            </button>
                        `
                        : ""}

                </div>

                <ol class="recommendationRankingList">

                    ${items.map(
                        (
                            item,
                            index
                        ) =>
                            this.renderRankingItem(
                                item,
                                index
                            )
                    ).join("")}

                </ol>

            </div>

        `;

    }


    renderRankingItem(
        item,
        index
    ) {

        const key =
            normalizeBetName(
                item
            );

        const score =

            normalizeNumber(
                item.score
            ) ??

            normalizeNumber(
                item.rankScore
            );

        const ev =

            normalizeNumber(
                item.ev
            ) ??

            normalizeNumber(
                item.value
            );

        const confidence =

            normalizeNumber(
                item.confidence
            );


        return `

            <li class="recommendationRankingItem">

                <span class="recommendationRankingNumber">
                    ${index + 1}
                </span>

                <span class="recommendationRankingName">
                    ${escapeHTML(
                        betLabel(key)
                    )}
                </span>

                <span class="recommendationRankingMeta">

                    ${score !== null
                        ? `
                            <small>
                                Score ${formatNumber(
                                    score,
                                    3
                                )}
                            </small>
                        `
                        : ""}

                    ${ev !== null
                        ? `
                            <strong class="${ev > 0
                                ? "positive"
                                : ev < 0
                                    ? "negative"
                                    : ""}">
                                EV ${formatSignedPercent(
                                    ev,
                                    this.options
                                        .percentDigits
                                )}
                            </strong>
                        `
                        : ""}

                    ${confidence !== null
                        ? `
                            <small>
                                信心 ${formatPercent(
                                    confidence,
                                    this.options
                                        .percentDigits
                                )}
                            </small>
                        `
                        : ""}

                </span>

            </li>

        `;

    }


    renderEmpty() {

        return `

            <div class="recommendationEmpty">

                <span class="recommendationEmptyIcon">
                    ?
                </span>

                <p>
                    ${escapeHTML(
                        this.options
                            .emptyText
                    )}
                </p>

            </div>

        `;

    }


    get summary() {

        return {

            hasData:
                this.hasData,

            shouldBet:
                this.shouldBet,

            recommendedKey:
                this.recommendedKey,

            recommendedLabel:
                this.recommendedLabel,

            amount:
                this.recommendedAmount,

            ev:
                this.recommendedEV,

            kelly:
                this.recommendedKelly,

            risk:
                this.recommendedRisk,

            confidence:
                this.confidence,

            reason:
                this.reason,

            rankingCount:
                this.data
                    .ranking
                    .length,

            mounted:
                this.state
                    .mounted,

            expanded:
                this.state
                    .expanded

        };

    }


    toJSON() {

        return {

            data: {

                analysis:
                    this.data.analysis
                        ? {
                            ...this.data
                                .analysis
                        }
                        : null,

                recommendation:
                    this.data.recommendation
                        ? {
                            ...this.data
                                .recommendation
                        }
                        : null,

                shouldBet:
                    this.data.shouldBet,

                best:
                    this.data.best
                        ? {
                            ...this.data.best
                        }
                        : null,

                ranking:
                    this.data.ranking.map(
                        item =>
                            isObject(item)
                                ? {
                                    ...item
                                }
                                : item
                    ),

                overallConfidence:
                    this.data
                        .overallConfidence

            },

            options: {

                ...this.options

            },

            expanded:
                this.state.expanded

        };

    }


    static fromJSON(
        data,
        options = {}
    ) {

        if (!isObject(data)) {

            throw new Error(
                "Recommendation data is required."
            );

        }

        const savedData =
            data.data ??
            {};


        /**
         * 建立時不要傳入 analysis。
         *
         * 避免 constructor 的 setAnalysis()
         * 覆蓋已儲存的 recommendation、
         * best、ranking 與 shouldBet。
         */
        const component =
            new Recommendation({

                analysis:
                    null,

                recommendation:
                    savedData.recommendation ??
                    null,

                shouldBet:
                    typeof savedData.shouldBet ===
                        "boolean"

                        ? savedData.shouldBet

                        : null,

                best:
                    savedData.best ??
                    null,

                ranking:
                    Array.isArray(
                        savedData.ranking
                    )

                        ? savedData.ranking

                        : [],

                overallConfidence:
                    savedData.overallConfidence ??
                    null,

                ...(
                    data.options ??
                    {}
                ),

                ...options

            });


        /**
         * Analysis 只是保存供查閱，
         * 不再透過 setAnalysis() 重新計算資料。
         */
        component.data.analysis =

            isObject(
                savedData.analysis
            )

                ? {
                    ...savedData.analysis
                }

                : null;
    

        /**
         * 明確還原 recommendation。
         */
        component.data.recommendation =

            isObject(
                savedData.recommendation
            )

                ? {
                    ...savedData.recommendation
                }

                : null;


        /**
         * 明確還原 shouldBet。
         */
        component.data.shouldBet =

            typeof savedData.shouldBet ===
                "boolean"

                ? savedData.shouldBet

                : null;


        /**
         * 明確還原 best。
         */
        component.data.best =

            isObject(
                savedData.best
            )

                ? {
                    ...savedData.best
                }

                : null;


        /**
         * 明確還原 ranking，
         * 避免與原 JSON 共用物件引用。
         */
        component.data.ranking =

            Array.isArray(
                savedData.ranking
            )

                ? savedData.ranking.map(
                    item =>
                        isObject(item)

                            ? {
                                ...item
                            }

                            : item
                )

                : [];


        /**
         * 明確還原 Confidence。
         */
        component.data.overallConfidence =

            savedData.overallConfidence ??
            null;


        /**
         * 還原 Ranking 展開狀態。
         */
        component.state.expanded =
            Boolean(
                data.expanded
            );


        component.render();

        return component;

    }

}
