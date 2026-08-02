/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * pages/newShoe.js
 *
 * 建立新牌靴精靈（Desktop + Mobile）
 *
 * 功能：
 *
 * - 選擇副牌數
 * - 輸入燒牌指示牌
 * - 顯示燒牌張數
 * - 顯示預估剩餘牌數
 * - 確認建立
 * - 取消返回首頁
 *
 * 本頁不直接建立 Game。
 * 它只派發：
 *
 * - new-shoe:confirm
 * - new-shoe:cancel
 */

const VALID_RANKS =
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


const VALID_SUITS =
    Object.freeze([

        "S",

        "H",

        "D",

        "C"

    ]);


const SUIT_SYMBOLS =
    Object.freeze({

        S:
            "♠",

        H:
            "♥",

        D:
            "♦",

        C:
            "♣"

    });


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function normalizeDeckCount(value) {

    const number =
        Number(value);

    if (
        !Number.isInteger(number) ||
        number < 1 ||
        number > 12
    ) {

        throw new RangeError(
            "Deck count must be an integer between 1 and 12."
        );

    }

    return number;

}


function burnAmount(rank) {

    if (rank === "A") {

        return 1;

    }

    if (
        rank === "10" ||
        rank === "J" ||
        rank === "Q" ||
        rank === "K"
    ) {

        return 10;

    }

    return Number(rank);

}


export class NewShoePage {

    constructor({

        root = null,

        deckCount = 8,

        rank = "A",

        suit = "S",

        autoMount = true

    } = {}) {

        if (
            root !== null &&
            !(root instanceof Element) &&
            typeof root !== "string"
        ) {

            throw new TypeError(
                "NewShoePage root must be an Element, selector, or null."
            );

        }

        this.root =
            this.resolveRoot(root);

        this.state = {

            deckCount:
                normalizeDeckCount(
                    deckCount
                ),

            rank:
                VALID_RANKS.includes(
                    String(rank)
                        .toUpperCase()
                )
                    ? String(rank)
                        .toUpperCase()
                    : "A",

            suit:
                VALID_SUITS.includes(
                    String(suit)
                        .toUpperCase()
                )
                    ? String(suit)
                        .toUpperCase()
                    : "S",

            submitting:
                false,

            error:
                ""

        };


        this.boundChange =
            event =>
                this.handleChange(event);

        this.boundClick =
            event =>
                this.handleClick(event);


        if (
            autoMount &&
            this.root
        ) {

            this.mount();

        }

    }


    resolveRoot(root) {

        if (root instanceof Element) {

            return root;

        }

        if (typeof root === "string") {

            return document.querySelector(root);

        }

        return (
            document.querySelector(
                "[data-page='new-shoe']"
            ) ??
            document.getElementById(
                "app"
            ) ??
            null
        );

    }


    mount(root = this.root) {

        const resolved =
            this.resolveRoot(root);

        if (!resolved) {

            throw new Error(
                "NewShoePage root element was not found."
            );

        }

        this.unbind();

        this.root =
            resolved;

        this.root.addEventListener(
            "change",
            this.boundChange
        );

        this.root.addEventListener(
            "click",
            this.boundClick
        );

        this.render();

        return this;

    }


    unbind() {

        if (!this.root) {

            return this;

        }

        this.root.removeEventListener(
            "change",
            this.boundChange
        );

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

        return this;

    }


    emit(
        name,
        detail = {}
    ) {

        this.root?.dispatchEvent(
            new CustomEvent(
                name,
                {
                    bubbles:
                        true,

                    detail

                }
            )
        );

        return this;

    }


    handleChange(event) {

        const target =
            event.target;

        if (
            !(target instanceof HTMLInputElement) &&
            !(target instanceof HTMLSelectElement)
        ) {

            return;

        }

        switch (target.name) {

            case "deck-count":

                this.state.deckCount =
                    normalizeDeckCount(
                        target.value
                    );

                break;


            case "burn-rank":

                if (
                    VALID_RANKS.includes(
                        target.value
                    )
                ) {

                    this.state.rank =
                        target.value;

                }

                break;


            case "burn-suit":

                if (
                    VALID_SUITS.includes(
                        target.value
                    )
                ) {

                    this.state.suit =
                        target.value;

                }

                break;


            default:

                return;

        }

        this.state.error =
            "";

        this.render();

    }


    handleClick(event) {

        const button =
            event.target.closest(
                "[data-new-shoe-action]"
            );

        if (
            !button ||
            !this.root?.contains(button)
        ) {

            return;

        }

        event.preventDefault();

        const action =
            button.dataset
                .newShoeAction;

        switch (action) {

            case "confirm":

                this.confirm();

                break;


            case "cancel":

                this.emit(
                    "new-shoe:cancel"
                );

                break;


            default:

                console.warn(
                    `Unknown new shoe action: ${action}`
                );

        }

    }


    confirm() {

        if (this.state.submitting) {

            return this;

        }

        try {

            const deckCount =
                normalizeDeckCount(
                    this.state.deckCount
                );

            const rank =
                this.state.rank;

            const suit =
                this.state.suit;

            if (
                !VALID_RANKS.includes(
                    rank
                )
            ) {

                throw new Error(
                    "請選擇有效的燒牌牌面。"
                );

            }

            if (
                !VALID_SUITS.includes(
                    suit
                )
            ) {

                throw new Error(
                    "請選擇有效的燒牌花色。"
                );

            }

            this.state.submitting =
                true;

            this.state.error =
                "";

            this.render();

            this.emit(
                "new-shoe:confirm",
                {
                    deckCount,

                    burnCard:
                        {
                            rank,

                            suit

                        }

                }
            );

        }
        catch (error) {

            this.state.error =
                error?.message ??
                String(error);

            this.render();

        }

        return this;

    }


    get totalCards() {

        return (
            this.state.deckCount *
            52
        );

    }


    get burnCount() {

        return burnAmount(
            this.state.rank
        );

    }


    get totalRemoved() {

        return (
            this.burnCount +
            1
        );

    }


    get physicalRemaining() {

        return Math.max(
            0,
            this.totalCards -
            this.totalRemoved
        );

    }


    get cardLabel() {

        return (
            `${this.state.rank}` +
            `${SUIT_SYMBOLS[
                this.state.suit
            ]}`
        );

    }


    render() {

        if (!this.root) {

            return this;

        }

        this.root.innerHTML = `

            <main class="newShoePage">

                <header class="newShoeHeader">

                    <button
                        type="button"
                        class="newShoeBackButton"
                        data-new-shoe-action="cancel"
                        aria-label="返回首頁"
                    >
                        ←
                    </button>

                    <div>

                        <p class="newShoeEyebrow">
                            NEW SHOE
                        </p>

                        <h1>
                            建立新牌靴
                        </h1>

                        <p>
                            設定副牌數並輸入燒牌指示牌。
                        </p>

                    </div>

                </header>


                <section class="newShoeLayout">

                    <div class="newShoeFormCard">

                        ${this.renderDeckSection()}

                        ${this.renderBurnSection()}

                        ${this.renderError()}

                    </div>


                    <aside class="newShoeSummaryCard">

                        ${this.renderSummary()}

                    </aside>

                </section>


                <footer class="newShoeActions">

                    <button
                        type="button"
                        class="newShoeButton secondary"
                        data-new-shoe-action="cancel"
                        ${this.state.submitting
                            ? "disabled"
                            : ""}
                    >
                        取消
                    </button>

                    <button
                        type="button"
                        class="newShoeButton primary"
                        data-new-shoe-action="confirm"
                        ${this.state.submitting
                            ? "disabled"
                            : ""}
                    >
                        ${this.state.submitting
                            ? "建立中…"
                            : "建立並開始分析"}
                    </button>

                </footer>

            </main>

        `;

        return this;

    }


    renderDeckSection() {

        return `

            <section class="newShoeSection">

                <div class="newShoeSectionHeader">

                    <span class="newShoeStep">
                        1
                    </span>

                    <div>

                        <h2>
                            選擇副牌數
                        </h2>

                        <p>
                            標準百家樂通常使用 8 副牌。
                        </p>

                    </div>

                </div>

                <div class="newShoeDeckOptions">

                    ${[
                        6,
                        8
                    ].map(
                        count => `

                            <label class="newShoeDeckOption">

                                <input
                                    type="radio"
                                    name="deck-count"
                                    value="${count}"
                                    ${this.state.deckCount === count
                                        ? "checked"
                                        : ""}
                                >

                                <span>
                                    <strong>
                                        ${count} 副牌
                                    </strong>

                                    <small>
                                        ${count * 52} 張
                                    </small>
                                </span>

                            </label>

                        `
                    ).join("")}

                </div>

            </section>

        `;

    }


    renderBurnSection() {

        return `

            <section class="newShoeSection">

                <div class="newShoeSectionHeader">

                    <span class="newShoeStep">
                        2
                    </span>

                    <div>

                        <h2>
                            輸入燒牌指示牌
                        </h2>

                        <p>
                            指示牌決定額外燒掉幾張牌。
                        </p>

                    </div>

                </div>

                <div class="newShoeBurnGrid">

                    <label>

                        <span>
                            牌面
                        </span>

                        <select
                            name="burn-rank"
                        >

                            ${VALID_RANKS.map(
                                rank => `

                                    <option
                                        value="${rank}"
                                        ${this.state.rank === rank
                                            ? "selected"
                                            : ""}
                                    >
                                        ${rank}
                                    </option>

                                `
                            ).join("")}

                        </select>

                    </label>


                    <label>

                        <span>
                            花色
                        </span>

                        <select
                            name="burn-suit"
                        >

                            ${VALID_SUITS.map(
                                suit => `

                                    <option
                                        value="${suit}"
                                        ${this.state.suit === suit
                                            ? "selected"
                                            : ""}
                                    >
                                        ${SUIT_SYMBOLS[suit]}
                                    </option>

                                `
                            ).join("")}

                        </select>

                    </label>

                </div>


                <div class="newShoeCardPreview">

                    <span class="${(
                        this.state.suit === "H" ||
                        this.state.suit === "D"
                    )
                        ? "red"
                        : ""}">
                        ${escapeHTML(
                            this.cardLabel
                        )}
                    </span>

                    <div>

                        <strong>
                            指示牌：${escapeHTML(
                                this.cardLabel
                            )}
                        </strong>

                        <small>
                            額外燒牌 ${this.burnCount} 張
                        </small>

                    </div>

                </div>

            </section>

        `;

    }


    renderSummary() {

        return `

            <div class="newShoeSummaryHeader">

                <p class="newShoeEyebrow">
                    SUMMARY
                </p>

                <h2>
                    建立摘要
                </h2>

            </div>


            <dl class="newShoeSummaryList">

                <div>
                    <dt>
                        副牌數
                    </dt>

                    <dd>
                        ${this.state.deckCount} 副
                    </dd>
                </div>

                <div>
                    <dt>
                        總牌數
                    </dt>

                    <dd>
                        ${this.totalCards} 張
                    </dd>
                </div>

                <div>
                    <dt>
                        指示牌
                    </dt>

                    <dd>
                        ${escapeHTML(
                            this.cardLabel
                        )}
                    </dd>
                </div>

                <div>
                    <dt>
                        額外燒牌
                    </dt>

                    <dd>
                        ${this.burnCount} 張
                    </dd>
                </div>

                <div>
                    <dt>
                        總移除
                    </dt>

                    <dd>
                        ${this.totalRemoved} 張
                    </dd>
                </div>

                <div class="emphasis">
                    <dt>
                        預估剩餘
                    </dt>

                    <dd>
                        ${this.physicalRemaining} 張
                    </dd>
                </div>

            </dl>


            <div class="newShoeNotice">

                <strong>
                    測試版提醒
                </strong>

                <p>
                    建立牌靴後，請依照實際發牌順序輸入每張牌。
                </p>

            </div>

        `;

    }


    renderError() {

        if (!this.state.error) {

            return "";

        }

        return `

            <div
                class="newShoeError"
                role="alert"
            >
                ${escapeHTML(
                    this.state.error
                )}
            </div>

        `;

    }

}


export default function createNewShoePage(
    options = {}
) {

    return new NewShoePage(
        options
    );

}
