/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * pages/dashboard.js
 *
 * 真人百家樂主要操作頁面。
 *
 * 目標：
 *
 * - 點數牌卡 + 四個花色牌卡快速輸入
 * - 選完花色後立即加入目前所需牌面
 * - 主注分析與邊注分析分離
 * - Recommendation 只顯示主注
 * - 保留既有 Dashboard 公開方法與測試相容性
 */

import Game, {
    GameState,
    ManualRoundState
} from "../engine/game.js";

import createQuickCardInput
    from "../components/QuickCardInput.js";


const RANKS =
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


const SUITS =
    Object.freeze([

        {
            value:
                "S",

            symbol:
                "♠",

            label:
                "黑桃"
        },

        {
            value:
                "H",

            symbol:
                "♥",

            label:
                "紅心"
        },

        {
            value:
                "D",

            symbol:
                "♦",

            label:
                "方塊"
        },

        {
            value:
                "C",

            symbol:
                "♣",

            label:
                "梅花"
        }

    ]);


const ROAD_LABELS =
    Object.freeze({

        beadRoad:
            "珠盤路",

        bigRoad:
            "大路",

        bigEyeRoad:
            "大眼仔",

        smallRoad:
            "小路",

        cockroachRoad:
            "曱甴路"

    });


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

        super6:
            "幸運 6",

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
        value *
        100
    ).toFixed(
        digits
    )}%`;

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

    return value.toFixed(
        digits
    );

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
                    0
            }
        )
        .format(value);

}


function cardText(card) {

    if (!card) {

        return "—";

    }

    if (
        typeof card.toString ===
            "function"
    ) {

        return card.toString();

    }

    const symbol =
        SUITS.find(
            item =>
                item.value ===
                card.suit
        )?.symbol ??
        card.suit ??
        "";

    return `${card.rank ?? ""}${symbol}`;

}


function getWinnerLabel(winner) {

    switch (winner) {

        case "Player":

            return "閒";

        case "Banker":

            return "莊";

        case "Tie":

            return "和";

        default:

            return "—";

    }

}


function getWinnerClass(winner) {

    switch (winner) {

        case "Player":

            return "player";

        case "Banker":

            return "banker";

        case "Tie":

            return "tie";

        default:

            return "";

    }

}


function getManualCards(game) {

    return Array.isArray(
        game?.manualCards
    )
        ? game.manualCards
        : [];

}


function getHistoryRounds(
    game,
    limit
) {

    if (
        typeof game?.history
            ?.lastRounds ===
            "function"
    ) {

        return game.history
            .lastRounds(
                limit
            );

    }

    if (
        Array.isArray(
            game?.history?.items
        )
    ) {

        return game.history.items
            .slice(
                -limit
            );

    }

    return [];

}


export class Dashboard {

    constructor({

        root = null,

        game = null,

        gameOptions = {},

        autoMount = true

    } = {}) {

        if (
            root !== null &&
            !(
                root instanceof
                    Element
            ) &&
            typeof root !==
                "string"
        ) {

            throw new TypeError(
                "Dashboard root must be an Element, selector, or null."
            );

        }

        if (
            !isObject(
                gameOptions
            )
        ) {

            throw new TypeError(
                "gameOptions must be an object."
            );

        }


        this.root =
            this.resolveRoot(
                root
            );

        this.game =
            game ??
            new Game(
                gameOptions
            );


        this.ui = {

            message:
                "",

            messageType:
                "",

            busy:
                false,

            selectedRank:
                "A",

            selectedSuit:
                "S",

            historyLimit:
                20,

            activeRoad:
                "beadRoad",

            analysisExpanded:
                false

        };


        this.components = {

            quickCardInput:
                null

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

        this.boundQuickCardSelect =
            event =>
                this.handleQuickCardSelect(
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
            root instanceof
                Element
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

        return (

            document
                .querySelector(
                    "[data-page='dashboard']"
                ) ??

            document
                .getElementById(
                    "dashboard"
                ) ??

            document
                .getElementById(
                    "app"
                ) ??

            null

        );

    }


    mount(root = this.root) {

        const resolved =
            this.resolveRoot(
                root
            );

        if (!resolved) {

            throw new Error(
                "Dashboard root element was not found."
            );

        }

        this.unbind();

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
            "quick-card:select",
            this.boundQuickCardSelect
        );

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

        this.root.removeEventListener(
            "change",
            this.boundChange
        );

        this.root.removeEventListener(
            "quick-card:select",
            this.boundQuickCardSelect
        );

        this.components
            .quickCardInput
            ?.destroy();

        this.components
            .quickCardInput =
            null;

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


    setMessage(
        message,
        type = "info"
    ) {

        this.ui.message =
            String(
                message ??
                ""
            );

        this.ui.messageType =
            type;

        return this;

    }


    clearMessage() {

        this.ui.message =
            "";

        this.ui.messageType =
            "";

        return this;

    }


    async runAction(
        callback,
        {
            successMessage = "",
            renderBefore = true
        } = {}
    ) {

        if (
            typeof callback !==
                "function"
        ) {

            throw new TypeError(
                "Dashboard action must be a function."
            );

        }

        if (
            this.ui.busy
        ) {

            return null;

        }

        this.ui.busy =
            true;

        this.clearMessage();

        if (
            renderBefore
        ) {

            this.render();

        }

        try {

            const result =
                await callback();

            if (
                successMessage
            ) {

                this.setMessage(
                    successMessage,
                    "success"
                );

            }

            return result;

        }
        catch (error) {

            console.error(
                "Dashboard action failed",
                error
            );

            this.setMessage(
                error?.message ??
                String(error),
                "error"
            );

            return null;

        }
        finally {

            this.ui.busy =
                false;

            this.render();

        }

    }


    async handleClick(event) {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (
            !button ||
            !this.root.contains(
                button
            )
        ) {

            return;

        }

        event.preventDefault();

        const action =
            button.dataset.action;


        switch (action) {

            case "new-shoe":

                await this.startNewShoe();

                break;


            case "confirm-burn":

                await this.confirmBurn();

                break;


            case "analyze":

                await this.analyze();

                break;


            case "start-round":

                await this.startRound();

                break;


            case "add-card":

                await this.addCurrentCard();

                break;


            case "undo-card":

                await this.undoCard();

                break;


            case "cancel-round":

                await this.cancelRound();

                break;


            case "finish-round":

                await this.finishRound();

                break;


            case "clear-message":

                this.clearMessage();

                this.render();

                break;


            case "select-road":

                this.ui.activeRoad =
                    button.dataset.road ??
                    "beadRoad";

                this.render();

                break;


            case "toggle-analysis":

                this.ui.analysisExpanded =
                    !this.ui
                        .analysisExpanded;

                this.render();

                break;


            default:

                console.warn(
                    `Unknown dashboard action: ${action}`
                );

        }

    }


    handleChange(event) {

        const target =
            event.target;

        if (
            !target ||
            !target.name
        ) {

            return;

        }


        switch (
            target.name
        ) {

            case "card-rank":

                this.ui.selectedRank =
                    target.value;

                break;


            case "card-suit":

                this.ui.selectedSuit =
                    target.value;

                break;


            case "history-limit":

                this.ui.historyLimit =
                    Number(
                        target.value
                    ) ||
                    20;

                this.render();

                break;

        }

    }


    async handleQuickCardSelect(event) {

        const {
            rank,
            suit
        } =
            event.detail ??
            {};

        if (
            !rank ||
            !suit
        ) {

            return;

        }

        await this.addSelectedCard({

            rank,

            suit

        });

    }


    async startNewShoe() {

        return this.runAction(
            async () => {

                this.game
                    .startNewShoe({

                        clearHistory:
                            true,

                        shuffle:
                            true

                    });

            },
            {
                successMessage:
                    "已建立新牌靴，請輸入燒牌指示牌。"
            }
        );

    }


    async confirmBurn() {

        return this.runAction(
            async () => {

                const info =
                    this.game
                        .confirmBurnIndicator({

                            rank:
                                this.ui
                                    .selectedRank,

                            suit:
                                this.ui
                                    .selectedSuit

                        });


                if (
                    !this.game
                        .isAnalyzing &&
                    !this.game
                        .hasNextAnalysis
                ) {

                    await this.game
                        .analyzeNextRound();

                }
                else {

                    await this.game
                        .waitForAnalysis();

                }

                return info;

            },
            {
                successMessage:
                    "燒牌已確認，第一局分析完成。"
            }
        );

    }


    async analyze() {

        return this.runAction(
            async () => {

                await this.game
                    .analyzeNextRound();

            },
            {
                successMessage:
                    "下一局分析完成。"
            }
        );

    }


    async startRound() {

        return this.runAction(
            async () => {

                this.game
                    .startManualRound();

            },
            {
                successMessage:
                    "已開始輸入本局牌面。"
            }
        );

    }


    async addSelectedCard({

        rank,

        suit

    }) {

        return this.runAction(
            async () => {

                const side =
                    this.game
                        .nextManualSide;

                if (!side) {

                    throw new Error(
                        "目前不需要再輸入牌。"
                    );

                }

                this.game
                    .addManualCard(

                        side,

                        {
                            rank,

                            suit
                        }

                    );

            },
            {
                renderBefore:
                    false
            }
        );

    }


    async addCurrentCard() {

        return this.addSelectedCard({

            rank:
                this.ui.selectedRank,

            suit:
                this.ui.selectedSuit

        });

    }


    async undoCard() {

        return this.runAction(
            async () => {

                const removed =
                    this.game
                        .undoManualCard();

                if (!removed) {

                    throw new Error(
                        "目前沒有可復原的牌。"
                    );

                }

            },
            {
                successMessage:
                    "已復原最後一張牌。"
            }
        );

    }


    async cancelRound() {

        return this.runAction(
            async () => {

                this.game
                    .cancelManualRound();

            },
            {
                successMessage:
                    "已取消本局輸入。"
            }
        );

    }


    async finishRound() {

        return this.runAction(
            async () => {

                await this.game
                    .finishManualRound({

                        analyze:
                            true

                    });

            },
            {
                successMessage:
                    "本局已確認，History、路單與下一局分析已更新。"
            }
        );

    }


    render() {

        if (!this.root) {

            return this;

        }

        this.components
            .quickCardInput
            ?.destroy();

        this.components
            .quickCardInput =
            null;


        this.root.innerHTML = `

            <main class="dashboardPage">

                ${this.renderHeader()}

                ${this.renderMessage()}

                ${this.renderStatusBanner()}

                <div class="dashboardGrid">

                    <section class="dashboardMain">

                        ${this.renderRoundPanel()}

                        ${this.renderAnalysisPanel()}

                    </section>

                    <aside class="dashboardSide">

                        ${this.renderRecommendationPanel()}

                        ${this.renderHistoryPanel()}

                    </aside>

                </div>

                ${this.renderRoadmapPanel()}

            </main>

        `;


        this.mountQuickCardInput();

        return this;

    }


    mountQuickCardInput() {

        const inputRoot =
            this.root?.querySelector(
                "[data-quick-card-root]"
            );

        if (!inputRoot) {

            return this;

        }

        this.components.quickCardInput =
            createQuickCardInput({

                root:
                    inputRoot,

                shoe:
                    this.game.shoe,

                disabled:
                    this.ui.busy ||
                    !this.game
                        .isManualRoundActive ||
                    this.game
                        .canFinishManualRound

            });

        return this;

    }


    renderHeader() {

        return `

            <header class="dashboardHeader">

                <div>

                    <p class="dashboardEyebrow">
                        Baccarat Analyzer
                    </p>

                    <h1>
                        百家樂分析儀
                    </h1>

                </div>

                <div class="dashboardHeaderActions">

                    <span class="stateBadge">
                        ${escapeHTML(
                            this.game.state
                        )}
                    </span>

                    <button
                        type="button"
                        class="button primary"
                        data-action="new-shoe"
                        ${this.ui.busy
                            ? "disabled"
                            : ""}
                    >
                        新牌靴
                    </button>

                </div>

            </header>

        `;

    }


    renderMessage() {

        if (
            !this.ui.message
        ) {

            return "";

        }

        return `

            <div
                class="dashboardMessage ${escapeHTML(
                    this.ui.messageType
                )}"
                role="status"
            >

                <span>
                    ${escapeHTML(
                        this.ui.message
                    )}
                </span>

                <button
                    type="button"
                    class="messageClose"
                    data-action="clear-message"
                    aria-label="關閉訊息"
                >
                    ×
                </button>

            </div>

        `;

    }


    renderStatusBanner() {

        const info =
            this.game.burnInfo;

        return `

            <section class="dashboardCard dashboardStatusBanner">

                <div class="statusBannerItem">

                    <span>
                        牌靴
                    </span>

                    <strong>
                        #${escapeHTML(
                            this.game.shoeNumber ??
                            0
                        )}
                    </strong>

                </div>

                <div class="statusBannerItem">

                    <span>
                        可觀察
                    </span>

                    <strong>
                        ${escapeHTML(
                            this.game
                                .observableRemainingCards ??
                            this.game.shoe
                                ?.observableRemaining ??
                            this.game.shoe
                                ?.remaining ??
                            0
                        )}
                    </strong>

                </div>

                <div class="statusBannerItem">

                    <span>
                        物理剩餘
                    </span>

                    <strong>
                        ${escapeHTML(
                            this.game
                                .remainingCards ??
                            this.game.shoe
                                ?.physicalRemaining ??
                            0
                        )}
                    </strong>

                </div>

                <div class="statusBannerItem">

                    <span>
                        燒牌
                    </span>

                    <strong>
                        ${escapeHTML(
                            this.game.burnConfirmed
                                ? cardText(
                                    info?.indicator
                                )
                                : "未確認"
                        )}
                    </strong>

                </div>

                <div class="statusBannerItem">

                    <span>
                        局數
                    </span>

                    <strong>
                        ${escapeHTML(
                            this.game.roundCount ??
                            0
                        )}
                    </strong>

                </div>

            </section>

        `;

    }


    renderBurnPanel() {

        const waiting =
            this.game
                .isWaitingBurnIndicator;

        const info =
            this.game.burnInfo;


        if (!waiting) {

            return `

                <section class="dashboardCard burnPanel compactPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                BURN
                            </p>

                            <h2>
                                燒牌已確認
                            </h2>

                        </div>

                        <span class="statusBadge success">
                            ${escapeHTML(
                                cardText(
                                    info?.indicator
                                )
                            )}
                        </span>

                    </div>

                </section>

            `;

        }


        return `

            <section class="dashboardCard burnPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            BURN
                        </p>

                        <h2>
                            輸入燒牌指示牌
                        </h2>

                    </div>

                    <span class="statusBadge warning">
                        等待輸入
                    </span>

                </div>

                ${this.renderCardSelector()}

                <button
                    type="button"
                    class="button primary full"
                    data-action="confirm-burn"
                    ${this.ui.busy
                        ? "disabled"
                        : ""}
                >
                    確認燒牌
                </button>

            </section>

        `;

    }


    renderCardSelector() {

        const rankOptions =
            RANKS.map(
                rank => `

                    <option
                        value="${rank}"
                        ${rank ===
                            this.ui.selectedRank
                                ? "selected"
                                : ""}
                    >
                        ${rank}
                    </option>

                `
            ).join("");


        const suitOptions =
            SUITS.map(
                suit => `

                    <option
                        value="${suit.value}"
                        ${suit.value ===
                            this.ui.selectedSuit
                                ? "selected"
                                : ""}
                    >
                        ${suit.symbol}
                        ${suit.label}
                    </option>

                `
            ).join("");


        return `

            <div class="cardSelector">

                <label>

                    <span>
                        點數
                    </span>

                    <select
                        name="card-rank"
                        ${this.ui.busy
                            ? "disabled"
                            : ""}
                    >
                        ${rankOptions}
                    </select>

                </label>

                <label>

                    <span>
                        花色
                    </span>

                    <select
                        name="card-suit"
                        ${this.ui.busy
                            ? "disabled"
                            : ""}
                    >
                        ${suitOptions}
                    </select>

                </label>

                <div class="selectedCard">

                    <span class="selectedCardRank">
                        ${escapeHTML(
                            this.ui.selectedRank
                        )}
                    </span>

                    <span class="selectedCardSuit">
                        ${escapeHTML(
                            SUITS.find(
                                suit =>
                                    suit.value ===
                                    this.ui.selectedSuit
                            )?.symbol ??
                            this.ui.selectedSuit
                        )}
                    </span>

                </div>

            </div>

        `;

    }


    renderRoundPanel() {

        if (
            !this.game.burnConfirmed
        ) {

            return `

                <section class="dashboardCard roundPanel">

                    ${this.renderBurnPanel()}

                </section>

            `;

        }


        if (
            !this.game
                .isManualRoundActive &&
            this.game.manualState !==
                ManualRoundState.FINISHED
        ) {

            return `

                <section class="dashboardCard roundPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                ROUND
                            </p>

                            <h2>
                                等待下一局
                            </h2>

                        </div>

                        <span class="statusBadge">
                            READY
                        </span>

                    </div>

                    <button
                        type="button"
                        class="button primary full"
                        data-action="start-round"
                        ${(
                            this.ui.busy ||
                            !this.game
                                .canStartManualRound
                        )
                            ? "disabled"
                            : ""}
                    >
                        開始輸入本局
                    </button>

                </section>

            `;

        }


        if (
            this.game.manualState ===
                ManualRoundState.FINISHED
        ) {

            return `

                <section class="dashboardCard roundPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                ROUND
                            </p>

                            <h2>
                                本局完成
                            </h2>

                        </div>

                        <span class="statusBadge success">
                            ${escapeHTML(
                                getWinnerLabel(
                                    this.game.winner
                                )
                            )}勝
                        </span>

                    </div>

                    ${this.renderHands()}

                    <button
                        type="button"
                        class="button primary full"
                        data-action="start-round"
                        ${(
                            this.ui.busy ||
                            !this.game
                                .canStartManualRound
                        )
                            ? "disabled"
                            : ""}
                    >
                        開始輸入下一局
                    </button>

                </section>

            `;

        }


        const next =
            this.game
                .nextManualInput;

        const ready =
            this.game
                .canFinishManualRound;


        return `

            <section class="dashboardCard roundPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            ROUND
                        </p>

                        <h2>
                            ${ready
                                ? "本局牌面完成"
                                : escapeHTML(
                                    next?.label ??
                                    "手動輸入牌面"
                                )}
                        </h2>

                    </div>

                    <span class="statusBadge ${ready
                        ? "success"
                        : "warning"}">
                        ${ready
                            ? "可確認"
                            : "輸入中"}
                    </span>

                </div>

                ${this.renderHands()}

                ${ready
                    ? ""
                    : `
                        <div
                            class="quickCardMount"
                            data-quick-card-root
                        ></div>
                    `}

                <div class="roundActions">

                    ${ready
                        ? `
                            <button
                                type="button"
                                class="button primary"
                                data-action="finish-round"
                                ${this.ui.busy
                                    ? "disabled"
                                    : ""}
                            >
                                確認本局
                            </button>
                        `
                        : ""}

                    <button
                        type="button"
                        class="button secondary"
                        data-action="undo-card"
                        ${(
                            this.ui.busy ||
                            getManualCards(
                                this.game
                            ).length ===
                                0
                        )
                            ? "disabled"
                            : ""}
                    >
                        復原一張
                    </button>

                    <button
                        type="button"
                        class="button danger"
                        data-action="cancel-round"
                        ${this.ui.busy
                            ? "disabled"
                            : ""}
                    >
                        取消本局
                    </button>

                </div>

            </section>

        `;

    }


    renderHands() {

        const progress =
            this.game
                .manualProgress ??
            {
                playerCards:
                    [],

                bankerCards:
                    [],

                playerScore:
                    0,

                bankerScore:
                    0
            };


        return `

            <div class="handsGrid">

                ${this.renderHand(
                    "Player",
                    "閒家",
                    progress.playerCards ??
                        [],
                    progress.playerScore
                )}

                ${this.renderHand(
                    "Banker",
                    "莊家",
                    progress.bankerCards ??
                        [],
                    progress.bankerScore
                )}

            </div>

        `;

    }


    renderHand(
        side,
        label,
        cards,
        score
    ) {

        const cells =
            [
                0,
                1,
                2
            ]
                .map(
                    index => {

                        const card =
                            cards[index];

                        return `

                            <div class="handCard ${card
                                ? "filled"
                                : "empty"}">

                                ${card
                                    ? escapeHTML(
                                        cardText(
                                            card
                                        )
                                    )
                                    : "—"}

                            </div>

                        `;

                    }
                )
                .join("");


        return `

            <div class="handBlock ${side.toLowerCase()}">

                <div class="handHeader">

                    <strong>
                        ${escapeHTML(
                            label
                        )}
                    </strong>

                    <span>
                        ${score ===
                            null ||
                        score ===
                            undefined
                            ? "—"
                            : `${score} 點`}
                    </span>

                </div>

                <div class="handCards">
                    ${cells}
                </div>

            </div>

        `;

    }


    renderAnalysisPanel() {

        const analysis =
            this.game.nextAnalysis;


        if (
            this.game.isAnalyzing ||
            (
                this.ui.busy &&
                this.game.state ===
                    GameState.ANALYZING
            )
        ) {

            return `

                <section class="dashboardCard analysisPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                ANALYSIS
                            </p>

                            <h2>
                                正在分析
                            </h2>

                        </div>

                        <span class="statusBadge warning">
                            計算中
                        </span>

                    </div>

                </section>

            `;

        }


        if (!analysis) {

            return `

                <section class="dashboardCard analysisPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                ANALYSIS
                            </p>

                            <h2>
                                下一局分析
                            </h2>

                        </div>

                    </div>

                    <p class="emptyText">
                        尚未產生分析。
                    </p>

                    <button
                        type="button"
                        class="button secondary full"
                        data-action="analyze"
                        ${(
                            this.ui.busy ||
                            !this.game
                                .burnConfirmed
                        )
                            ? "disabled"
                            : ""}
                    >
                        立即分析
                    </button>

                </section>

            `;

        }


        const probability =
            analysis.probability ??
            {};

        const ev =
            analysis.ev ??
            {};


        return `

            <section class="dashboardCard analysisPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            ANALYSIS
                        </p>

                        <h2>
                            下一局分析
                        </h2>

                    </div>

                    <span class="analysisMeta">
                        第 ${escapeHTML(
                            analysis
                                .generatedAfterRound ??
                            this.game.roundCount ??
                            0
                        )} 局後
                    </span>

                </div>


                <div class="analysisHorizontal">

                    ${this.renderAnalysisMetric(
                        "閒",
                        probability.player,
                        ev.player
                    )}

                    ${this.renderAnalysisMetric(
                        "莊",
                        probability.banker,
                        ev.banker
                    )}

                    ${this.renderAnalysisMetric(
                        "和",
                        probability.tie,
                        ev.tie
                    )}

                </div>


                <div class="analysisFooter">

                    <button
                        type="button"
                        class="button secondary"
                        data-action="toggle-analysis"
                    >
                        ${this.ui
                            .analysisExpanded
                                ? "收合完整分析"
                                : "展開完整分析"}
                    </button>

                    <button
                        type="button"
                        class="button secondary"
                        data-action="analyze"
                        ${this.ui.busy
                            ? "disabled"
                            : ""}
                    >
                        重新分析
                    </button>

                </div>


                ${this.ui.analysisExpanded
                    ? `
                        ${this.renderProbabilityTable(
                            probability
                        )}

                        ${this.renderEVTable(
                            ev,
                            analysis.evStatus
                        )}

                        ${this.renderSideBetTable(
                            analysis.sideBetAnalysis
                        )}
                    `
                    : ""}

            </section>

        `;

    }


    renderAnalysisMetric(
        label,
        probability,
        ev
    ) {

        return `

            <div class="analysisMetric">

                <span>
                    ${escapeHTML(
                        label
                    )}
                </span>

                <strong>
                    ${formatPercent(
                        probability
                    )}
                </strong>

                <small class="${Number(ev) >=
                    0
                    ? "positive"
                    : "negative"}">
                    EV ${formatNumber(
                        ev
                    )}
                </small>

            </div>

        `;

    }


    renderProbabilityTable(
        probability = {}
    ) {

        const rows =
            [
                [
                    "player",
                    "閒"
                ],
                [
                    "banker",
                    "莊"
                ],
                [
                    "tie",
                    "和"
                ],
                [
                    "playerPair",
                    "閒對"
                ],
                [
                    "bankerPair",
                    "莊對"
                ],
                [
                    "super6",
                    "幸運 6"
                ]
            ];


        return `

            <div class="analysisSection">

                <h3>
                    機率
                </h3>

                <div class="dataTable">

                    ${rows.map(
                        ([
                            key,
                            label
                        ]) => `

                            <div class="dataRow">

                                <span>
                                    ${escapeHTML(
                                        label
                                    )}
                                </span>

                                <strong>
                                    ${formatPercent(
                                        probability[key]
                                    )}
                                </strong>

                            </div>

                        `
                    ).join("")}

                </div>

            </div>

        `;

    }


    renderEVTable(
        ev = {},
        evStatus = {}
    ) {

        const names =
            [
                "player",
                "banker",
                "tie",
                "playerPair",
                "bankerPair",
                "super6"
            ];


        return `

            <div class="analysisSection">

                <h3>
                    期望值 EV
                </h3>

                <div class="dataTable">

                    ${names.map(
                        name => {

                            const available =
                                evStatus[name] !==
                                    "unavailable";

                            const value =
                                available
                                    ? Number(
                                        ev[name]
                                    )
                                    : NaN;

                            return `

                                <div class="dataRow">

                                    <span>
                                        ${escapeHTML(
                                            BET_LABELS[
                                                name
                                            ] ??
                                            name
                                        )}
                                    </span>

                                    <strong class="${Number.isFinite(value) &&
                                        value >= 0
                                        ? "positive"
                                        : "negative"}">
                                        ${available
                                            ? formatNumber(
                                                value
                                            )
                                            : "尚未提供"}
                                    </strong>

                                </div>

                            `;

                        }
                    ).join("")}

                </div>

            </div>

        `;

    }


    renderSideBetTable(
        sideBetAnalysis = {}
    ) {

        const entries =
            Object.values(
                sideBetAnalysis ??
                {}
            );


        if (
            entries.length ===
                0
        ) {

            return "";

        }


        return `

            <div class="analysisSection">

                <h3>
                    邊注參考
                </h3>

                <div class="dataTable">

                    ${entries.map(
                        item => `

                            <div class="dataRow">

                                <span>
                                    ${escapeHTML(
                                        item.label ??
                                        item.name
                                    )}
                                </span>

                                <strong>
                                    ${item.available
                                        ? formatNumber(
                                            item.ev
                                        )
                                        : "暫不可用"}
                                </strong>

                            </div>

                        `
                    ).join("")}

                </div>

            </div>

        `;

    }


    renderRecommendationPanel() {

        const analysis =
            this.game.nextAnalysis;

        const recommendation =
            analysis?.recommendation;


        if (!analysis) {

            return `

                <section class="dashboardCard recommendationPanel">

                    <p class="sectionEyebrow">
                        RECOMMENDATION
                    </p>

                    <h2>
                        下注建議
                    </h2>

                    <p class="emptyText">
                        尚未產生分析。
                    </p>

                </section>

            `;

        }


        const best =
            analysis.best ??
            null;

        const shouldBet =

            analysis.shouldBet ??

            recommendation?.shouldBet ??

            false;

        const betName =

            shouldBet

                ? (
                    recommendation?.label ??
                    BET_LABELS[
                        recommendation?.bet
                    ] ??
                    best?.label ??
                    BET_LABELS[
                        best?.name
                    ] ??
                    "主注"
                )

                : "不下注";

        const reason =

            recommendation?.message ??

            recommendation?.reason ??

            (
                shouldBet

                    ? "此主注通過目前的 EV、可信度與風險條件。"

                    : "目前沒有符合條件的正期望主注。"
            );


        return `

            <section class="dashboardCard recommendationPanel ${shouldBet
                ? "bet"
                : "noBet"}">

                <div class="recommendationStatus">
                    ${shouldBet
                        ? "建議下注"
                        : "建議觀望"}
                </div>

                <h2>
                    ${escapeHTML(
                        betName
                    )}
                </h2>

                <p>
                    ${escapeHTML(
                        reason
                    )}
                </p>

                ${shouldBet &&
                Number.isFinite(
                    recommendation?.amount
                )
                    ? `
                        <div class="recommendationAmount">

                            <span>
                                建議金額
                            </span>

                            <strong>
                                ${formatMoney(
                                    Math.min(
                                        10000,
                                        Math.max(
                                            100,
                                            recommendation
                                                .amount
                                        )
                                    )
                                )}
                            </strong>

                        </div>
                    `
                    : ""}

                ${Number.isFinite(
                    analysis.overallConfidence
                )
                    ? `
                        <div class="confidenceBar">

                            <div class="confidenceLabel">

                                <span>
                                    信心
                                </span>

                                <strong>
                                    ${formatPercent(
                                        analysis
                                            .overallConfidence
                                    )}
                                </strong>

                            </div>

                            <div class="confidenceTrack">

                                <div
                                    class="confidenceFill"
                                    style="width: ${Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            analysis
                                                .overallConfidence *
                                            100
                                        )
                                    )}%"
                                ></div>

                            </div>

                        </div>
                    `
                    : ""}

            </section>

        `;

    }


    renderShoeStatusPanel() {

        const analysis =
            this.game.analysisSummary ??
            {};

        const consistency =
            typeof this.game
                .validateConsistency ===
                "function"
                ? this.game
                    .validateConsistency()
                : {
                    valid:
                        true
                };


        return `

            <section class="dashboardCard statusPanel">

                <div class="statusList">

                    <div>

                        <span>
                            牌靴
                        </span>

                        <strong>
                            ${escapeHTML(
                                this.game.state
                            )}
                        </strong>

                    </div>

                    <div>

                        <span>
                            輸入
                        </span>

                        <strong>
                            ${escapeHTML(
                                this.game
                                    .manualState
                            )}
                        </strong>

                    </div>

                    <div>

                        <span>
                            分析
                        </span>

                        <strong>
                            ${escapeHTML(
                                analysis.state ??
                                this.game
                                    .analysisState ??
                                "—"
                            )}
                        </strong>

                    </div>

                    <div>

                        <span>
                            一致性
                        </span>

                        <strong class="${consistency.valid
                            ? "positive"
                            : "negative"}">
                            ${consistency.valid
                                ? "正常"
                                : "異常"}
                        </strong>

                    </div>

                </div>

            </section>

        `;

    }


    renderHistoryPanel() {

        const rounds =
            getHistoryRounds(
                this.game,
                this.ui.historyLimit
            );


        return `

            <section class="dashboardCard historyPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            HISTORY
                        </p>

                        <h2>
                            最近牌局
                        </h2>

                    </div>

                    <select
                        name="history-limit"
                    >

                        ${[
                            10,
                            20,
                            30,
                            50
                        ].map(
                            value => `

                                <option
                                    value="${value}"
                                    ${value ===
                                        this.ui.historyLimit
                                            ? "selected"
                                            : ""}
                                >
                                    ${value}
                                </option>

                            `
                        ).join("")}

                    </select>

                </div>

                ${rounds.length ===
                    0
                    ? `
                        <p class="emptyText">
                            尚無牌局紀錄。
                        </p>
                    `
                    : `
                        <div class="historyRoad">

                            ${rounds.map(
                                result => `

                                    <div
                                        class="historyItem ${getWinnerClass(
                                            result.winner
                                        )}"
                                    >

                                        <strong>
                                            ${getWinnerLabel(
                                                result.winner
                                            )}
                                        </strong>

                                        <div class="historyMarks">

                                            ${result.playerPair
                                                ? "<span>P</span>"
                                                : ""}

                                            ${result.bankerPair
                                                ? "<span>B</span>"
                                                : ""}

                                            ${result.super6 ||
                                            result.super
                                                ? "<span>6</span>"
                                                : ""}

                                        </div>

                                    </div>

                                `
                            ).join("")}

                        </div>
                    `}

            </section>

        `;

    }


    renderRoadmapPanel() {

        const roads =
            this.game.roadmapViewModel
                ?.roads ??
            this.game.roadMatrices ??
            {};

        const active =
            this.ui.activeRoad;

        const matrix =
            roads[active] ??
            [];


        return `

            <section class="dashboardCard roadmapPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            ROADMAP
                        </p>

                        <h2>
                            路單
                        </h2>

                    </div>

                </div>

                <div class="roadTabs">

                    ${Object.entries(
                        ROAD_LABELS
                    ).map(
                        ([
                            key,
                            label
                        ]) => `

                            <button
                                type="button"
                                class="roadTab ${key ===
                                    active
                                    ? "active"
                                    : ""}"
                                data-action="select-road"
                                data-road="${key}"
                            >
                                ${label}
                            </button>

                        `
                    ).join("")}

                </div>

                ${this.renderRoadMatrix(
                    matrix,
                    active
                )}

            </section>

        `;

    }


    renderRoadMatrix(
        matrix,
        roadName
    ) {

        if (
            !Array.isArray(
                matrix
            ) ||
            matrix.length ===
                0
        ) {

            return `

                <p class="emptyText">
                    ${escapeHTML(
                        ROAD_LABELS[
                            roadName
                        ] ??
                        roadName
                    )}尚無資料。
                </p>

            `;

        }


        const rows =
            matrix.length;

        const columns =
            Math.max(
                0,
                ...matrix.map(
                    row =>
                        Array.isArray(
                            row
                        )
                            ? row.length
                            : 0
                )
            );


        const cells =
            [];

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            for (
                let row = 0;
                row < rows;
                row++
            ) {

                const cell =
                    matrix[row]?.[
                        column
                    ] ??
                    null;

                cells.push(
                    this.renderRoadCell(
                        cell,
                        row,
                        column
                    )
                );

            }

        }


        return `

            <div class="roadViewport">

                <div
                    class="roadMatrix"
                    style="
                        --road-rows: ${rows};
                        --road-columns: ${columns};
                    "
                >
                    ${cells.join("")}
                </div>

            </div>

        `;

    }


    renderRoadCell(
        cell,
        row,
        column
    ) {

        if (!cell) {

            return `

                <div
                    class="roadCell empty"
                    data-row="${row}"
                    data-column="${column}"
                ></div>

            `;

        }


        const winner =
            cell.winner ??
            cell.result ??
            cell.value ??
            cell.color ??
            "";

        const normalized =
            String(
                winner
            ).toLowerCase();

        const className =
            normalized.includes(
                "player"
            ) ||
            normalized ===
                "p"
                ? "player"
                : normalized.includes(
                    "banker"
                ) ||
                normalized ===
                    "b"
                    ? "banker"
                    : normalized.includes(
                        "tie"
                    ) ||
                    normalized ===
                        "t"
                        ? "tie"
                        : "derived";


        return `

            <div
                class="roadCell ${className}"
                data-row="${row}"
                data-column="${column}"
                title="${escapeHTML(
                    getWinnerLabel(
                        winner
                    )
                )}"
            >

                <span>
                    ${className ===
                        "derived"
                        ? ""
                        : escapeHTML(
                            getWinnerLabel(
                                winner
                            )
                        )}
                </span>

            </div>

        `;

    }


    get summary() {

        return {

            mounted:
                Boolean(
                    this.root
                ),

            busy:
                this.ui.busy,

            state:
                this.game.state,

            manualState:
                this.game.manualState,

            burnConfirmed:
                Boolean(
                    this.game
                        .burnConfirmed
                ),

            roundCount:
                this.game.roundCount ??
                0,

            activeRoad:
                this.ui.activeRoad,

            historyLimit:
                this.ui.historyLimit,

            hasAnalysis:
                Boolean(
                    this.game
                        .nextAnalysis
                ),

            quickCardMounted:
                Boolean(
                    this.components
                        .quickCardInput
                )

        };

    }

}


export default function createDashboard(
    options = {}
) {

    return new Dashboard(
        options
    );

}
