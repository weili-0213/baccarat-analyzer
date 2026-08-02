/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * components/QuickCardInput.js
 *
 * 快速牌面輸入元件。
 *
 * 操作：
 *
 * 1. 按點數牌卡
 * 2. 按花色牌卡
 * 3. 自動派發 quick-card:select
 *
 * 事件：
 *
 * quick-card:select
 *
 * {
 *   rank: "8",
 *   suit: "H"
 * }
 */

export const QUICK_CARD_RANKS =
    Object.freeze([

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


export const QUICK_CARD_SUITS =
    Object.freeze([

        {
            key:
                "S",

            symbol:
                "♠",

            label:
                "黑桃",

            color:
                "black"

        },

        {
            key:
                "H",

            symbol:
                "♥",

            label:
                "紅心",

            color:
                "red"

        },

        {
            key:
                "D",

            symbol:
                "♦",

            label:
                "方塊",

            color:
                "red"

        },

        {
            key:
                "C",

            symbol:
                "♣",

            label:
                "梅花",

            color:
                "black"

        }

    ]);


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


export class QuickCardInput {

    constructor({

        root = null,

        shoe = null,

        disabled = false,

        autoMount = true

    } = {}) {

        this.root =
            typeof root ===
                "string"

                ? document.querySelector(
                    root
                )

                : root;

        this.shoe =
            shoe;

        this.disabled =
            Boolean(
                disabled
            );

        this.selectedRank =
            null;

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


    mount(root = this.root) {

        if (
            !(root instanceof Element)
        ) {

            throw new Error(
                "QuickCardInput root is required."
            );

        }

        this.unbind();

        this.root =
            root;

        this.root.addEventListener(
            "click",
            this.boundClick
        );

        this.render();

        return this;

    }


    unbind() {

        this.root?.removeEventListener(
            "click",
            this.boundClick
        );

        return this;

    }


    destroy() {

        this.unbind();

        if (
            this.root
        ) {

            this.root.innerHTML =
                "";

        }

        return this;

    }


    setShoe(shoe) {

        this.shoe =
            shoe;

        this.render();

        return this;

    }


    setDisabled(value) {

        this.disabled =
            Boolean(value);

        this.render();

        return this;

    }


    selectRank(rank) {

        if (
            !QUICK_CARD_RANKS.includes(
                rank
            )
        ) {

            throw new Error(
                `Invalid rank: ${rank}`
            );

        }

        const remaining =
            this.getRankCount(
                rank
            );

        /*
         * 沒有提供 Shoe 計數 API 時，
         * getRankCount() 會回傳 null。
         *
         * null <= 0 在 JavaScript 會被判定為 true，
         * 因此必須先確認 remaining 不是 null，
         * 否則測試 Mock 與簡化 Game 會無法選取點數。
         */
        if (
            remaining !== null &&
            remaining <= 0
        ) {

            return this;

        }

        this.selectedRank =
            rank;

        this.render();

        return this;

    }


    clearSelection() {

        this.selectedRank =
            null;

        this.render();

        return this;

    }


    getRankCount(rank) {

        if (
            typeof this.shoe
                ?.countByRank ===
                "function"
        ) {

            return this.shoe
                .countByRank(
                    rank
                );

        }

        return null;

    }


    getSuitCount(
        rank,
        suit
    ) {

        if (
            typeof this.shoe
                ?.countByRankAndSuit ===
                "function"
        ) {

            return this.shoe
                .countByRankAndSuit(
                    rank,
                    suit
                );

        }

        return null;

    }


    handleClick(event) {

        if (
            this.disabled
        ) {

            return;

        }

        const rankButton =
            event.target.closest(
                "[data-quick-rank]"
            );

        if (
            rankButton &&
            this.root.contains(
                rankButton
            )
        ) {

            this.selectRank(
                rankButton.dataset
                    .quickRank
            );

            return;

        }


        const suitButton =
            event.target.closest(
                "[data-quick-suit]"
            );

        if (
            !suitButton ||
            !this.root.contains(
                suitButton
            ) ||
            !this.selectedRank
        ) {

            return;

        }


        const suit =
            suitButton.dataset
                .quickSuit;

        const remaining =
            this.getSuitCount(
                this.selectedRank,
                suit
            );

        if (
            remaining !== null &&
            remaining <= 0
        ) {

            return;

        }


        const detail = {

            rank:
                this.selectedRank,

            suit

        };


        this.root.dispatchEvent(
            new CustomEvent(
                "quick-card:select",
                {
                    bubbles:
                        true,

                    detail

                }
            )
        );


        this.selectedRank =
            null;

        this.render();

    }


    render() {

        if (
            !this.root
        ) {

            return this;

        }


        this.root.innerHTML = `

            <section class="quickCardInput">

                <header class="quickCardHeader">

                    <div>

                        <strong>
                            快速輸入牌面
                        </strong>

                        <small>
                            ${this.selectedRank
                                ? `已選 ${escapeHTML(this.selectedRank)}，請選花色`
                                : "先選點數，再選花色"}
                        </small>

                    </div>

                    ${this.selectedRank
                        ? `
                            <button
                                type="button"
                                class="quickCardClear"
                                data-quick-clear
                            >
                                清除
                            </button>
                        `
                        : ""}

                </header>


                <div class="quickRankGrid">

                    ${QUICK_CARD_RANKS.map(
                        rank => {

                            const count =
                                this.getRankCount(
                                    rank
                                );

                            const unavailable =
                                count !== null &&
                                count <= 0;

                            return `

                                <button
                                    type="button"
                                    class="quickRankCard ${this.selectedRank === rank
                                        ? "selected"
                                        : ""}"
                                    data-quick-rank="${rank}"
                                    ${this.disabled || unavailable
                                        ? "disabled"
                                        : ""}
                                >

                                    <strong>
                                        ${rank}
                                    </strong>

                                    ${count !== null
                                        ? `
                                            <small>
                                                ${count}
                                            </small>
                                        `
                                        : ""}

                                </button>

                            `;

                        }
                    ).join("")}

                </div>


                <div class="quickSuitGrid">

                    ${QUICK_CARD_SUITS.map(
                        suit => {

                            const count =
                                this.selectedRank
                                    ? this.getSuitCount(
                                        this.selectedRank,
                                        suit.key
                                    )
                                    : null;

                            const unavailable =
                                !this.selectedRank ||
                                (
                                    count !== null &&
                                    count <= 0
                                );

                            return `

                                <button
                                    type="button"
                                    class="quickSuitCard ${suit.color}"
                                    data-quick-suit="${suit.key}"
                                    ${this.disabled || unavailable
                                        ? "disabled"
                                        : ""}
                                >

                                    <strong>
                                        ${suit.symbol}
                                    </strong>

                                    <span>
                                        ${suit.label}
                                    </span>

                                    ${count !== null
                                        ? `
                                            <small>
                                                ${count}
                                            </small>
                                        `
                                        : ""}

                                </button>

                            `;

                        }
                    ).join("")}

                </div>

            </section>

        `;


        this.root
            .querySelector(
                "[data-quick-clear]"
            )
            ?.addEventListener(
                "click",
                () =>
                    this.clearSelection(),
                {
                    once:
                        true
                }
            );


        return this;

    }

}


export default function createQuickCardInput(
    options = {}
) {

    return new QuickCardInput(
        options
    );

}
