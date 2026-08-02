/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * CardInput
 *
 * 手動輸入荷官已發出的牌。
 *
 * 職責：
 *
 * 1. 選擇 Rank
 * 2. 選擇 Suit
 * 3. 顯示目前選中的牌
 * 4. 顯示下一張應輸入 Player / Banker
 * 5. 送出牌面
 * 6. disabled / loading / error 狀態
 * 7. 提供 mount() / render() / destroy()
 * 8. 提供 getValue() / setValue() / clear()
 *
 * 不負責：
 *
 * - 修改 Shoe
 * - 發牌規則
 * - 判斷 Player / Banker 第三張
 * - 完成 Round
 *
 * 這些由 Game 控制。
 */

const RANKS = Object.freeze([

    "A",

    "2",

    "3",

    "4",

    "5",

    "6",

    "7",

    "8",

    "9",

    "10",

    "J",

    "Q",

    "K"

]);


const SUITS = Object.freeze([

    {
        value:
            "S",

        symbol:
            "♠",

        label:
            "黑桃",

        color:
            "black"
    },

    {
        value:
            "H",

        symbol:
            "♥",

        label:
            "紅心",

        color:
            "red"
    },

    {
        value:
            "D",

        symbol:
            "♦",

        label:
            "方塊",

        color:
            "red"
    },

    {
        value:
            "C",

        symbol:
            "♣",

        label:
            "梅花",

        color:
            "black"
    }

]);


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


function normalizeSide(side) {

    if (
        side === null ||
        side === undefined ||
        side === ""
    ) {

        return null;

    }

    const normalized =
        String(side)
            .trim()
            .toLowerCase();

    if (
        normalized === "player" ||
        normalized === "p" ||
        normalized === "閒" ||
        normalized === "閒家"
    ) {

        return "player";

    }

    if (
        normalized === "banker" ||
        normalized === "b" ||
        normalized === "莊" ||
        normalized === "莊家"
    ) {

        return "banker";

    }

    throw new Error(
        `Invalid card input side: ${side}`
    );

}


function sideLabel(side) {

    switch (side) {

        case "player":

            return "Player／閒家";

        case "banker":

            return "Banker／莊家";

        default:

            return "未指定";

    }

}


export class CardInput {

    constructor({

        root = null,

        rank = "A",

        suit = "S",

        side = null,

        cardNumber = 1,

        label = "",

        disabled = false,

        loading = false,

        compact = false,

        showQuickRanks = true,

        showPreview = true,

        submitText = "加入牌面",

        onSubmit = null,

        onChange = null,

        onError = null,

        autoMount = true

    } = {}) {

        if (
            root !== null &&
            typeof root !== "string" &&
            !(
                typeof Element !==
                    "undefined" &&
                root instanceof Element
            )
        ) {

            throw new TypeError(
                "CardInput root must be an Element, selector, or null."
            );

        }

        if (
            onSubmit !== null &&
            typeof onSubmit !==
                "function"
        ) {

            throw new TypeError(
                "onSubmit must be a function or null."
            );

        }

        if (
            onChange !== null &&
            typeof onChange !==
                "function"
        ) {

            throw new TypeError(
                "onChange must be a function or null."
            );

        }

        if (
            onError !== null &&
            typeof onError !==
                "function"
        ) {

            throw new TypeError(
                "onError must be a function or null."
            );

        }


        this.root =
            this.resolveRoot(
                root
            );


        this.value = {

            rank:
                this.validateRank(
                    rank
                ),

            suit:
                this.validateSuit(
                    suit
                )

        };


        this.options = {

            side:
                normalizeSide(side),

            cardNumber:
                this.validateCardNumber(
                    cardNumber
                ),

            label:
                String(
                    label ??
                    ""
                ),

            disabled:
                Boolean(
                    disabled
                ),

            loading:
                Boolean(
                    loading
                ),

            compact:
                Boolean(
                    compact
                ),

            showQuickRanks:
                Boolean(
                    showQuickRanks
                ),

            showPreview:
                Boolean(
                    showPreview
                ),

            submitText:
                String(
                    submitText ??
                    "加入牌面"
                )

        };


        this.callbacks = {

            onSubmit,

            onChange,

            onError

        };


        this.state = {

            mounted:
                false,

            submitting:
                false,

            error:
                ""

        };


        this.boundClick =
            event =>
                this.handleClick(
                    event
                );

        this.boundChange =
            event =>
                this.handleChange(
                    event
                );

        this.boundKeydown =
            event =>
                this.handleKeydown(
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


    validateRank(rank) {

        const normalized =
            String(rank ?? "")
                .trim()
                .toUpperCase();

        if (
            !RANKS.includes(
                normalized
            )
        ) {

            throw new Error(
                `Invalid card rank: ${rank}`
            );

        }

        return normalized;

    }


    validateSuit(suit) {

        const normalized =
            String(suit ?? "")
                .trim()
                .toUpperCase();

        if (
            !SUITS.some(
                item =>
                    item.value ===
                    normalized
            )
        ) {

            throw new Error(
                `Invalid card suit: ${suit}`
            );

        }

        return normalized;

    }


    validateCardNumber(value) {

        const number =
            Number(value);

        if (
            !Number.isInteger(number) ||
            number < 1 ||
            number > 3
        ) {

            throw new RangeError(
                "cardNumber must be an integer from 1 to 3."
            );

        }

        return number;

    }


    mount(root = this.root) {

        const resolved =
            this.resolveRoot(
                root
            );

        if (!resolved) {

            throw new Error(
                "CardInput root element was not found."
            );

        }

        this.destroyListeners();

        this.root =
            resolved;

        this.root.addEventListener(
            "click",
            this.boundClick
        );

        this.root.addEventListener(
            "change",
            this.boundChange
        );

        this.root.addEventListener(
            "keydown",
            this.boundKeydown
        );

        this.state.mounted =
            true;

        this.render();

        return this;

    }


    destroyListeners() {

        if (!this.root) {

            return this;

        }

        this.root.removeEventListener(
            "click",
            this.boundClick
        );

        this.root.removeEventListener(
            "change",
            this.boundChange
        );

        this.root.removeEventListener(
            "keydown",
            this.boundKeydown
        );

        return this;

    }


    destroy() {

        this.destroyListeners();

        if (this.root) {

            this.root.innerHTML =
                "";

        }

        this.state.mounted =
            false;

        return this;

    }


    get isDisabled() {

        return (

            this.options.disabled ||

            this.options.loading ||

            this.state.submitting

        );

    }


    get selectedSuit() {

        return (
            SUITS.find(
                item =>
                    item.value ===
                    this.value.suit
            ) ??
            SUITS[0]
        );

    }


    get displayLabel() {

        if (this.options.label) {

            return this.options.label;

        }

        if (this.options.side) {

            return `${sideLabel(
                this.options.side
            )} 第 ${this.options.cardNumber} 張`;

        }

        return `第 ${this.options.cardNumber} 張牌`;

    }


    getValue() {

        return {

            rank:
                this.value.rank,

            suit:
                this.value.suit

        };

    }


    setValue(input = {}) {

        if (!isObject(input)) {

            throw new TypeError(
                "CardInput value must be an object."
            );

        }

        const next = {

            rank:
                input.rank !==
                    undefined

                    ? this.validateRank(
                        input.rank
                    )

                    : this.value.rank,

            suit:
                input.suit !==
                    undefined

                    ? this.validateSuit(
                        input.suit
                    )

                    : this.value.suit

        };


        this.value =
            next;

        this.clearError();

        this.emitChange();

        this.render();

        return this;

    }


    setRank(rank) {

        return this.setValue({
            rank
        });

    }


    setSuit(suit) {

        return this.setValue({
            suit
        });

    }


    setSide(
        side,
        cardNumber =
            this.options.cardNumber
    ) {

        this.options.side =
            normalizeSide(
                side
            );

        this.options.cardNumber =
            this.validateCardNumber(
                cardNumber
            );

        this.render();

        return this;

    }


    setLabel(label = "") {

        this.options.label =
            String(
                label ??
                ""
            );

        this.render();

        return this;

    }


    setDisabled(disabled = true) {

        this.options.disabled =
            Boolean(
                disabled
            );

        this.render();

        return this;

    }


    setLoading(loading = true) {

        this.options.loading =
            Boolean(
                loading
            );

        this.render();

        return this;

    }


    setSubmitText(text) {

        this.options.submitText =
            String(
                text ??
                ""
            );

        this.render();

        return this;

    }


    setOptions(options = {}) {

        if (!isObject(options)) {

            throw new TypeError(
                "CardInput options must be an object."
            );

        }

        if (
            options.side !==
                undefined
        ) {

            this.options.side =
                normalizeSide(
                    options.side
                );

        }

        if (
            options.cardNumber !==
                undefined
        ) {

            this.options.cardNumber =
                this.validateCardNumber(
                    options.cardNumber
                );

        }

        for (
            const field of
            [
                "label",
                "submitText"
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
                "disabled",
                "loading",
                "compact",
                "showQuickRanks",
                "showPreview"
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

        this.render();

        return this;

    }


    clear({

        rank = "A",

        suit = "S",

        keepSide = true

    } = {}) {

        this.value = {

            rank:
                this.validateRank(
                    rank
                ),

            suit:
                this.validateSuit(
                    suit
                )

        };

        if (!keepSide) {

            this.options.side =
                null;

            this.options.cardNumber =
                1;

            this.options.label =
                "";

        }

        this.clearError();

        this.emitChange();

        this.render();

        return this;

    }


    focus() {

        const target =
            this.root
                ?.querySelector(
                    "[data-card-input-rank]"
                );

        target?.focus();

        return this;

    }


    emitChange() {

        if (
            typeof this.callbacks
                .onChange !==
                "function"
        ) {

            return;

        }

        this.callbacks.onChange(
            this.getValue(),
            this
        );

    }


    setError(message) {

        this.state.error =
            String(
                message ??
                ""
            );

        if (
            typeof this.callbacks
                .onError ===
                "function"
        ) {

            this.callbacks.onError(
                this.state.error,
                this
            );

        }

        return this;

    }


    clearError() {

        this.state.error =
            "";

        return this;

    }


    async submit() {

        if (this.isDisabled) {

            return null;

        }

        if (
            typeof this.callbacks
                .onSubmit !==
                "function"
        ) {

            return this.getValue();

        }

        this.state.submitting =
            true;

        this.clearError();

        this.render();

        try {

            const result =
                await this.callbacks
                    .onSubmit(

                        this.getValue(),

                        {

                            side:
                                this.options.side,

                            cardNumber:
                                this.options
                                    .cardNumber,

                            label:
                                this.displayLabel

                        },

                        this

                    );

            return result;

        }
        catch (error) {

            this.setError(
                error?.message ??
                String(error)
            );

            throw error;

        }
        finally {

            this.state.submitting =
                false;

            this.render();

        }

    }


    async handleClick(event) {

        const target =
            event.target.closest(
                "[data-card-input-action]"
            );

        if (
            !target ||
            !this.root.contains(
                target
            )
        ) {

            return;

        }

        event.preventDefault();

        const action =
            target.dataset
                .cardInputAction;


        switch (action) {

            case "select-rank":

                if (this.isDisabled) {

                    return;

                }

                this.setRank(
                    target.dataset.rank
                );

                break;


            case "select-suit":

                if (this.isDisabled) {

                    return;

                }

                this.setSuit(
                    target.dataset.suit
                );

                break;


            case "submit":

                try {

                    await this.submit();

                }
                catch (error) {

                    console.error(
                        "CardInput submit failed",
                        error
                    );

                }

                break;


            case "clear-error":

                this.clearError();

                this.render();

                break;

        }

    }


    handleChange(event) {

        const target =
            event.target;

        if (!target) {

            return;

        }

        if (
            target.matches(
                "[data-card-input-rank]"
            )
        ) {

            this.setRank(
                target.value
            );

            return;

        }

        if (
            target.matches(
                "[data-card-input-suit]"
            )
        ) {

            this.setSuit(
                target.value
            );

        }

    }


    async handleKeydown(event) {

        if (
            this.isDisabled
        ) {

            return;

        }

        if (
            event.key ===
                "Enter" &&
            !event.shiftKey
        ) {

            const target =
                event.target;

            if (
                target.matches(
                    "select, button"
                )
            ) {

                event.preventDefault();

                try {

                    await this.submit();

                }
                catch (error) {

                    console.error(
                        "CardInput keyboard submit failed",
                        error
                    );

                }

            }

        }

    }


    render() {

        if (!this.root) {

            return this;

        }

        const disabled =
            this.isDisabled;

        const suit =
            this.selectedSuit;


        this.root.innerHTML = `

            <section
                class="cardInput ${this.options.compact
                    ? "compact"
                    : ""} ${disabled
                        ? "disabled"
                        : ""}"
                data-card-input
            >

                <header class="cardInputHeader">

                    <div>

                        <p class="cardInputEyebrow">
                            CARD INPUT
                        </p>

                        <h3 class="cardInputTitle">
                            ${escapeHTML(
                                this.displayLabel
                            )}
                        </h3>

                    </div>

                    ${this.options.side
                        ? `
                            <span class="cardInputSide ${escapeHTML(
                                this.options.side
                            )}">
                                ${escapeHTML(
                                    sideLabel(
                                        this.options.side
                                    )
                                )}
                            </span>
                        `
                        : ""}

                </header>

                <div class="cardInputBody">

                    ${this.options.showPreview
                        ? this.renderPreview(
                            suit
                        )
                        : ""}

                    <div class="cardInputControls">

                        <label class="cardInputField">

                            <span>
                                點數
                            </span>

                            <select
                                data-card-input-rank
                                ${disabled
                                    ? "disabled"
                                    : ""}
                            >

                                ${RANKS.map(
                                    rank => `

                                        <option
                                            value="${rank}"
                                            ${rank ===
                                                this.value.rank
                                                    ? "selected"
                                                    : ""}
                                        >
                                            ${rank}
                                        </option>

                                    `
                                ).join("")}

                            </select>

                        </label>

                        <label class="cardInputField">

                            <span>
                                花色
                            </span>

                            <select
                                data-card-input-suit
                                ${disabled
                                    ? "disabled"
                                    : ""}
                            >

                                ${SUITS.map(
                                    item => `

                                        <option
                                            value="${item.value}"
                                            ${item.value ===
                                                this.value.suit
                                                    ? "selected"
                                                    : ""}
                                        >
                                            ${item.symbol} ${item.label}
                                        </option>

                                    `
                                ).join("")}

                            </select>

                        </label>

                    </div>

                    ${this.options.showQuickRanks
                        ? this.renderQuickRanks()
                        : ""}

                    ${this.renderSuitButtons()}

                    ${this.renderError()}

                    <button
                        type="button"
                        class="cardInputSubmit"
                        data-card-input-action="submit"
                        ${disabled
                            ? "disabled"
                            : ""}
                    >

                        ${this.state.submitting ||
                        this.options.loading
                            ? `
                                <span class="cardInputSpinner"></span>
                                處理中…
                            `
                            : escapeHTML(
                                this.options.submitText
                            )}

                    </button>

                </div>

            </section>

        `;

        return this;

    }


    renderPreview(suit) {

        return `

            <div
                class="cardInputPreview ${escapeHTML(
                    suit.color
                )}"
                aria-label="${escapeHTML(
                    this.value.rank
                )}${escapeHTML(
                    suit.symbol
                )}"
            >

                <span class="cardInputPreviewRank">
                    ${escapeHTML(
                        this.value.rank
                    )}
                </span>

                <span class="cardInputPreviewSuit">
                    ${escapeHTML(
                        suit.symbol
                    )}
                </span>

                <span class="cardInputPreviewName">
                    ${escapeHTML(
                        suit.label
                    )}
                </span>

            </div>

        `;

    }


    renderQuickRanks() {

        return `

            <div class="cardInputQuickRanks">

                ${RANKS.map(
                    rank => `

                        <button
                            type="button"
                            class="cardInputRankButton ${rank ===
                                this.value.rank
                                    ? "active"
                                    : ""}"
                            data-card-input-action="select-rank"
                            data-rank="${rank}"
                            ${this.isDisabled
                                ? "disabled"
                                : ""}
                        >
                            ${rank}
                        </button>

                    `
                ).join("")}

            </div>

        `;

    }


    renderSuitButtons() {

        return `

            <div class="cardInputSuitButtons">

                ${SUITS.map(
                    suit => `

                        <button
                            type="button"
                            class="cardInputSuitButton ${suit.color} ${suit.value ===
                                this.value.suit
                                    ? "active"
                                    : ""}"
                            data-card-input-action="select-suit"
                            data-suit="${suit.value}"
                            ${this.isDisabled
                                ? "disabled"
                                : ""}
                        >

                            <span class="cardInputSuitSymbol">
                                ${suit.symbol}
                            </span>

                            <span class="cardInputSuitLabel">
                                ${suit.label}
                            </span>

                        </button>

                    `
                ).join("")}

            </div>

        `;

    }


    renderError() {

        if (!this.state.error) {

            return "";

        }

        return `

            <div
                class="cardInputError"
                role="alert"
            >

                <span>
                    ${escapeHTML(
                        this.state.error
                    )}
                </span>

                <button
                    type="button"
                    data-card-input-action="clear-error"
                    aria-label="關閉錯誤訊息"
                >
                    ×
                </button>

            </div>

        `;

    }


    get summary() {

        return {

            value:
                this.getValue(),

            side:
                this.options.side,

            cardNumber:
                this.options.cardNumber,

            label:
                this.displayLabel,

            disabled:
                this.options.disabled,

            loading:
                this.options.loading,

            submitting:
                this.state.submitting,

            mounted:
                this.state.mounted,

            error:
                this.state.error

        };

    }


    toJSON() {

        return {

            rank:
                this.value.rank,

            suit:
                this.value.suit,

            side:
                this.options.side,

            cardNumber:
                this.options.cardNumber,

            label:
                this.options.label,

            disabled:
                this.options.disabled,

            loading:
                this.options.loading,

            compact:
                this.options.compact,

            showQuickRanks:
                this.options
                    .showQuickRanks,

            showPreview:
                this.options
                    .showPreview,

            submitText:
                this.options
                    .submitText

        };

    }


    static fromJSON(
        data,
        options = {}
    ) {

        if (!isObject(data)) {

            throw new Error(
                "CardInput data is required."
            );

        }

        return new CardInput({

            ...data,

            ...options

        });

    }

}


/**
 * 預設匯出工廠函式。
 */
export default function createCardInput(
    options = {}
) {

    return new CardInput(
        options
    );

}


/**
 * 供外部元件使用。
 */
export {

    RANKS,

    SUITS

};
