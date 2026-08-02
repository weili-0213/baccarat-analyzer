/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * EVTable
 *
 * 顯示 Analyzer 產生的各下注選項 EV。
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
 * 元件只負責顯示，不負責計算 EV。
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


function normalizeEV(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : null;

}


function formatEV(
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


function formatPercent(
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


export class EVTable {

    constructor({

        root = null,

        ev = {},

        rows = DEFAULT_ROWS,

        title = "期望值 EV",

        subtitle = "",

        digits = 4,

        percentDigits = 2,

        grouped = true,

        showDescriptions = true,

        showPercent = true,

        showSignal = true,

        compact = false,

        emptyText = "尚無 EV 資料。",

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
                "EVTable root must be an Element, selector, or null."
            );

        }

        if (!isObject(ev)) {

            throw new TypeError(
                "ev must be an object."
            );

        }

        if (!Array.isArray(rows)) {

            throw new TypeError(
                "rows must be an array."
            );

        }

        if (
            !Number.isInteger(
                digits
            ) ||
            digits < 0 ||
            digits > 8
        ) {

            throw new RangeError(
                "digits must be an integer from 0 to 8."
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


        this.root =
            this.resolveRoot(
                root
            );

        this.ev = {

            ...ev

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

            percentDigits,

            grouped:
                Boolean(
                    grouped
                ),

            showDescriptions:
                Boolean(
                    showDescriptions
                ),

            showPercent:
                Boolean(
                    showPercent
                ),

            showSignal:
                Boolean(
                    showSignal
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
                "EV row must be an object."
            );

        }

        if (!row.key) {

            throw new Error(
                "EV row key is required."
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
                "EVTable root element was not found."
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


    setEV(ev = {}) {

        if (!isObject(ev)) {

            throw new TypeError(
                "ev must be an object."
            );

        }

        this.ev = {

            ...ev

        };

        this.render();

        return this;

    }


    update(ev = {}) {

        return this.setEV(
            ev
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
                "EVTable options must be an object."
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
                "showDescriptions",
                "showPercent",
                "showSignal",
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
                options.digits > 8
            ) {

                throw new RangeError(
                    "digits must be an integer from 0 to 8."
                );

            }

            this.options.digits =
                options.digits;

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

        this.render();

        return this;

    }


    clear() {

        this.ev = {};

        this.state.highlightedKey =
            null;

        this.render();

        return this;

    }


    getValue(key) {

        return normalizeEV(
            this.ev[
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


    get positiveCount() {

        return this.visibleRows.filter(
            row => {

                const value =
                    this.getValue(
                        row.key
                    );

                return (
                    value !== null &&
                    value > 0
                );

            }
        ).length;

    }


    get negativeCount() {

        return this.visibleRows.filter(
            row => {

                const value =
                    this.getValue(
                        row.key
                    );

                return (
                    value !== null &&
                    value < 0
                );

            }
        ).length;

    }


    get neutralCount() {

        return this.visibleRows.filter(
            row => {

                const value =
                    this.getValue(
                        row.key
                    );

                return (
                    value !== null &&
                    value === 0
                );

            }
        ).length;

    }


    get best() {

        const available =
            this.visibleRows
                .map(
                    row => ({

                        ...row,

                        value:
                            this.getValue(
                                row.key
                            )

                    })
                )
                .filter(
                    row =>
                        row.value !== null
                )
                .sort(
                    (
                        left,
                        right
                    ) =>
                        right.value -
                        left.value
                );

        return (
            available[0] ??
            null
        );

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
                "[data-ev-key]"
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
                .evKey;

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
                class="evTable ${this.options.compact
                    ? "compact"
                    : ""}"
                data-ev-table
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

            <header class="evTableHeader">

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

                <div class="evGroups">

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

            <div class="evRows">

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
                class="evGroup"
                data-ev-group="${escapeHTML(
                    group
                )}"
            >

                <h4 class="evGroupTitle">
                    ${escapeHTML(
                        GROUP_LABELS[
                            group
                        ] ??
                        group
                    )}
                </h4>

                <div class="evRows">

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

        const highlighted =

            this.state
                .highlightedKey ===
            row.key;

        const signalClass =

            value > 0

                ? "positive"

                : value < 0

                    ? "negative"

                    : "neutral";

        const signalText =

            value > 0

                ? "正 EV"

                : value < 0

                    ? "負 EV"

                    : "中性";


        return `

            <button
                type="button"
                class="evRow ${signalClass} ${highlighted
                    ? "highlighted"
                    : ""}"
                data-ev-key="${escapeHTML(
                    row.key
                )}"
                aria-pressed="${highlighted
                    ? "true"
                    : "false"}"
            >

                <span class="evLabel">

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

                ${this.options.showSignal
                    ? `
                        <span class="evSignal ${signalClass}">
                            ${signalText}
                        </span>
                    `
                    : ""}

                <span class="evValue">

                    <strong>
                        ${formatEV(
                            value,
                            this.options
                                .digits
                        )}
                    </strong>

                    ${this.options.showPercent
                        ? `
                            <small>
                                ${formatPercent(
                                    value,
                                    this.options
                                        .percentDigits
                                )}
                            </small>
                        `
                        : ""}

                </span>

            </button>

        `;

    }


    renderEmpty() {

        return `

            <div class="evEmpty">

                <span class="evEmptyIcon">
                    EV
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

        if (!this.hasData) {

            return "";

        }

        const best =
            this.best;

        return `

            <footer class="evTableFooter">

                <div>

                    <span>
                        正 EV
                    </span>

                    <strong class="positive">
                        ${this.positiveCount}
                    </strong>

                </div>

                <div>

                    <span>
                        負 EV
                    </span>

                    <strong class="negative">
                        ${this.negativeCount}
                    </strong>

                </div>

                <div>

                    <span>
                        最佳
                    </span>

                    <strong class="${best?.value > 0
                        ? "positive"
                        : best?.value < 0
                            ? "negative"
                            : "neutral"}">
                        ${best
                            ? `${escapeHTML(
                                best.label
                            )} ${formatEV(
                                best.value,
                                this.options
                                    .digits
                            )}`
                            : "—"}
                    </strong>

                </div>

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

            ev:
                available,

            rowCount:
                Object.keys(
                    available
                ).length,

            positiveCount:
                this.positiveCount,

            negativeCount:
                this.negativeCount,

            neutralCount:
                this.neutralCount,

            best:
                this.best
                    ? {

                        key:
                            this.best.key,

                        label:
                            this.best.label,

                        value:
                            this.best.value

                    }
                    : null,

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

            ev: {

                ...this.ev

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
                "EVTable data is required."
            );

        }

        const table =
            new EVTable({

                ev:
                    data.ev ??
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
export default function createEVTable(
    options = {}
) {

    return new EVTable(
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
