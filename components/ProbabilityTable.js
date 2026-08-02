/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * ProbabilityTable
 *
 * 顯示 Analyzer 產生的下一局機率。
 *
 * 支援：
 *
 * - Player
 * - Banker
 * - Tie
 * - Player Pair
 * - Banker Pair
 * - Either Pair
 * - Super 6
 * - Player Natural
 * - Banker Natural
 * - Natural
 * - Big
 * - Small
 * - Player Dragon Bonus
 * - Banker Dragon Bonus
 *
 * 元件只負責顯示，不負責計算機率。
 */

const DEFAULT_ROWS = Object.freeze([

    {
        key:
            "player",

        label:
            "閒",

        group:
            "main",

        description:
            "Player"
    },

    {
        key:
            "banker",

        label:
            "莊",

        group:
            "main",

        description:
            "Banker"
    },

    {
        key:
            "tie",

        label:
            "和",

        group:
            "main",

        description:
            "Tie"
    },

    {
        key:
            "playerPair",

        label:
            "閒對",

        group:
            "pair",

        description:
            "Player Pair"
    },

    {
        key:
            "bankerPair",

        label:
            "莊對",

        group:
            "pair",

        description:
            "Banker Pair"
    },

    {
        key:
            "eitherPair",

        label:
            "任一對子",

        group:
            "pair",

        description:
            "Either Pair"
    },

    {
        key:
            "super6",

        label:
            "幸運 6",

        group:
            "side",

        description:
            "Super 6"
    },

    {
        key:
            "playerNatural",

        label:
            "閒 Natural",

        group:
            "natural",

        description:
            "Player Natural"
    },

    {
        key:
            "bankerNatural",

        label:
            "莊 Natural",

        group:
            "natural",

        description:
            "Banker Natural"
    },

    {
        key:
            "natural",

        label:
            "任一 Natural",

        group:
            "natural",

        description:
            "Natural"
    },

    {
        key:
            "big",

        label:
            "大",

        group:
            "size",

        description:
            "Big"
    },

    {
        key:
            "small",

        label:
            "小",

        group:
            "size",

        description:
            "Small"
    },

    {
        key:
            "playerDragonBonus",

        label:
            "閒龍寶",

        group:
            "dragon",

        description:
            "Player Dragon Bonus"
    },

    {
        key:
            "bankerDragonBonus",

        label:
            "莊龍寶",

        group:
            "dragon",

        description:
            "Banker Dragon Bonus"
    }

]);


const GROUP_LABELS =
    Object.freeze({

        main:
            "主要下注",

        pair:
            "對子",

        side:
            "側注",

        natural:
            "Natural",

        size:
            "大小",

        dragon:
            "龍寶"

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


function normalizeProbability(
    value
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {

        return null;

    }

    return clamp(
        number,
        0,
        1
    );

}


export class ProbabilityTable {

    constructor({

        root = null,

        probability = {},

        rows = DEFAULT_ROWS,

        title = "下一局機率",

        subtitle = "",

        digits = 2,

        grouped = true,

        showBars = true,

        showDescriptions = true,

        compact = false,

        emptyText = "尚無機率資料。",

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
                "ProbabilityTable root must be an Element, selector, or null."
            );

        }

        if (
            !isObject(
                probability
            )
        ) {

            throw new TypeError(
                "probability must be an object."
            );

        }

        if (
            !Array.isArray(rows)
        ) {

            throw new TypeError(
                "rows must be an array."
            );

        }

        if (
            !Number.isInteger(
                digits
            ) ||
            digits < 0 ||
            digits > 6
        ) {

            throw new RangeError(
                "digits must be an integer from 0 to 6."
            );

        }


        this.root =
            this.resolveRoot(
                root
            );

        this.probability = {

            ...probability

        };

        this.rows =
            rows.map(
                row =>
                    this.normalizeRow(
                        row
                    )
            );

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

            digits,

            grouped:
                Boolean(
                    grouped
                ),

            showBars:
                Boolean(
                    showBars
                ),

            showDescriptions:
                Boolean(
                    showDescriptions
                ),

            compact:
                Boolean(
                    compact
                ),

            emptyText:
                String(
                    emptyText ??
                    ""
                )

        };

        this.state = {

            mounted:
                false,

            highlightedKey:
                null

        };

        this.boundClick =
            event =>
                this.handleClick(
                    event
                );


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


    normalizeRow(row) {

        if (!isObject(row)) {

            throw new TypeError(
                "Probability row must be an object."
            );

        }

        if (!row.key) {

            throw new Error(
                "Probability row key is required."
            );

        }

        return {

            key:
                String(
                    row.key
                ),

            label:
                String(
                    row.label ??
                    row.key
                ),

            group:
                String(
                    row.group ??
                    "other"
                ),

            description:
                String(
                    row.description ??
                    ""
                ),

            hidden:
                Boolean(
                    row.hidden
                )

        };

    }


    mount(root = this.root) {

        const resolved =
            this.resolveRoot(
                root
            );

        if (!resolved) {

            throw new Error(
                "ProbabilityTable root element was not found."
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


    setProbability(
        probability = {}
    ) {

        if (!isObject(probability)) {

            throw new TypeError(
                "probability must be an object."
            );

        }

        this.probability = {

            ...probability

        };

        this.render();

        return this;

    }


    update(
        probability = {}
    ) {

        return this.setProbability(
            probability
        );

    }


    setRows(rows = []) {

        if (!Array.isArray(rows)) {

            throw new TypeError(
                "rows must be an array."
            );

        }

        this.rows =
            rows.map(
                row =>
                    this.normalizeRow(
                        row
                    )
            );

        this.render();

        return this;

    }


    setOptions(options = {}) {

        if (!isObject(options)) {

            throw new TypeError(
                "ProbabilityTable options must be an object."
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
                "grouped",
                "showBars",
                "showDescriptions",
                "compact"
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
            options.digits !==
                undefined
        ) {

            if (
                !Number.isInteger(
                    options.digits
                ) ||
                options.digits < 0 ||
                options.digits > 6
            ) {

                throw new RangeError(
                    "digits must be an integer from 0 to 6."
                );

            }

            this.options.digits =
                options.digits;

        }

        this.render();

        return this;

    }


    clear() {

        this.probability = {};

        this.state.highlightedKey =
            null;

        this.render();

        return this;

    }


    getValue(key) {

        return normalizeProbability(
            this.probability[
                key
            ]
        );

    }


    get visibleRows() {

        return this.rows.filter(
            row =>
                !row.hidden
        );

    }


    get hasData() {

        return this.visibleRows.some(
            row =>
                this.getValue(
                    row.key
                ) !== null
        );

    }


    get mainTotal() {

        const values = [

            this.getValue(
                "player"
            ),

            this.getValue(
                "banker"
            ),

            this.getValue(
                "tie"
            )

        ];

        if (
            values.some(
                value =>
                    value === null
            )
        ) {

            return null;

        }

        return values.reduce(
            (
                total,
                value
            ) =>
                total + value,
            0
        );

    }


    get groupedRows() {

        const groups =
            new Map();

        for (
            const row of
            this.visibleRows
        ) {

            if (
                !groups.has(
                    row.group
                )
            ) {

                groups.set(
                    row.group,
                    []
                );

            }

            groups
                .get(
                    row.group
                )
                .push(
                    row
                );

        }

        return groups;

    }


    highlight(key = null) {

        this.state.highlightedKey =

            key === null

                ? null

                : String(key);

        this.render();

        return this;

    }


    handleClick(event) {

        const row =
            event.target.closest(
                "[data-probability-key]"
            );

        if (
            !row ||
            !this.root.contains(
                row
            )
        ) {

            return;

        }

        const key =
            row.dataset
                .probabilityKey;

        this.highlight(

            this.state
                .highlightedKey ===
                key

                ? null

                : key

        );

    }


    render() {

        if (!this.root) {

            return this;

        }

        this.root.innerHTML = `

            <section
                class="probabilityTable ${this.options.compact
                    ? "compact"
                    : ""}"
                data-probability-table
            >

                ${this.renderHeader()}

                ${this.hasData
                    ? this.renderContent()
                    : this.renderEmpty()}

                ${this.renderFooter()}

            </section>

        `;

        return this;

    }


    renderHeader() {

        if (
            !this.options.title &&
            !this.options.subtitle
        ) {

            return "";

        }

        return `

            <header class="probabilityTableHeader">

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

            </header>

        `;

    }


    renderContent() {

        if (
            this.options.grouped
        ) {

            return `

                <div class="probabilityGroups">

                    ${[
                        ...this.groupedRows
                            .entries()
                    ].map(
                        ([
                            group,
                            rows
                        ]) =>
                            this.renderGroup(
                                group,
                                rows
                            )
                    ).join("")}

                </div>

            `;

        }

        return `

            <div class="probabilityRows">

                ${this.visibleRows.map(
                    row =>
                        this.renderRow(
                            row
                        )
                ).join("")}

            </div>

        `;

    }


    renderGroup(
        group,
        rows
    ) {

        const hasGroupData =
            rows.some(
                row =>
                    this.getValue(
                        row.key
                    ) !== null
            );

        if (!hasGroupData) {

            return "";

        }

        return `

            <section
                class="probabilityGroup"
                data-probability-group="${escapeHTML(
                    group
                )}"
            >

                <h4 class="probabilityGroupTitle">
                    ${escapeHTML(
                        GROUP_LABELS[
                            group
                        ] ??
                        group
                    )}
                </h4>

                <div class="probabilityRows">

                    ${rows.map(
                        row =>
                            this.renderRow(
                                row
                            )
                    ).join("")}

                </div>

            </section>

        `;

    }


    renderRow(row) {

        const value =
            this.getValue(
                row.key
            );

        if (value === null) {

            return "";

        }

        const percentage =
            value * 100;

        const highlighted =

            this.state
                .highlightedKey ===
            row.key;


        return `

            <button
                type="button"
                class="probabilityRow ${highlighted
                    ? "highlighted"
                    : ""}"
                data-probability-key="${escapeHTML(
                    row.key
                )}"
                aria-pressed="${highlighted
                    ? "true"
                    : "false"}"
            >

                <span class="probabilityLabel">

                    <strong>
                        ${escapeHTML(
                            row.label
                        )}
                    </strong>

                    ${this.options
                        .showDescriptions &&
                    row.description
                        ? `
                            <small>
                                ${escapeHTML(
                                    row.description
                                )}
                            </small>
                        `
                        : ""}

                </span>

                ${this.options.showBars
                    ? `
                        <span class="probabilityBar">

                            <span
                                class="probabilityBarFill"
                                style="width: ${percentage}%"
                            ></span>

                        </span>
                    `
                    : ""}

                <span class="probabilityValue">

                    <strong>
                        ${formatPercent(
                            value,
                            this.options
                                .digits
                        )}
                    </strong>

                    <small>
                        ${value.toFixed(
                            Math.min(
                                this.options
                                    .digits +
                                2,
                                8
                            )
                        )}
                    </small>

                </span>

            </button>

        `;

    }


    renderEmpty() {

        return `

            <div class="probabilityEmpty">

                <span class="probabilityEmptyIcon">
                    %
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


    renderFooter() {

        const total =
            this.mainTotal;

        if (total === null) {

            return "";

        }

        const difference =
            Math.abs(
                1 - total
            );

        return `

            <footer class="probabilityTableFooter">

                <span>
                    Player + Banker + Tie
                </span>

                <strong class="${difference <= 1e-6
                    ? "valid"
                    : "warning"}">
                    ${formatPercent(
                        total,
                        this.options.digits
                    )}
                </strong>

            </footer>

        `;

    }


    get summary() {

        const available = {};

        for (
            const row of
            this.visibleRows
        ) {

            const value =
                this.getValue(
                    row.key
                );

            if (
                value !== null
            ) {

                available[
                    row.key
                ] = value;

            }

        }

        return {

            probability:
                available,

            rowCount:
                Object.keys(
                    available
                ).length,

            mainTotal:
                this.mainTotal,

            highlightedKey:
                this.state
                    .highlightedKey,

            mounted:
                this.state.mounted,

            hasData:
                this.hasData

        };

    }


    toJSON() {

        return {

            probability: {

                ...this.probability

            },

            rows:
                this.rows.map(
                    row => ({

                        ...row

                    })
                ),

            options: {

                ...this.options

            },

            highlightedKey:
                this.state
                    .highlightedKey

        };

    }


    static fromJSON(
        data,
        options = {}
    ) {

        if (!isObject(data)) {

            throw new Error(
                "ProbabilityTable data is required."
            );

        }

        const table =
            new ProbabilityTable({

                probability:
                    data.probability ??
                    {},

                rows:
                    data.rows ??
                    DEFAULT_ROWS,

                ...(
                    data.options ??
                    {}
                ),

                ...options

            });

        if (
            data.highlightedKey
        ) {

            table.highlight(
                data.highlightedKey
            );

        }

        return table;

    }

}


/**
 * 預設工廠函式。
 */
export default function createProbabilityTable(
    options = {}
) {

    return new ProbabilityTable(
        options
    );

}


/**
 * 供外部擴充列設定。
 */
export {

    DEFAULT_ROWS,

    GROUP_LABELS

};
