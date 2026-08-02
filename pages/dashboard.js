/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dashboard
 *
 * 真人百家樂主要操作頁面。
 *
 * 流程：
 *
 * 1. 開始新牌靴
 * 2. 手動輸入燒牌指示牌
 * 3. 分析第一局
 * 4. 開始輸入荷官已發出的牌
 * 5. 依提示輸入 Player / Banker
 * 6. 確認本局
 * 7. 更新 History 與五種路單
 * 8. 分析下一局
 *
 * Dashboard 只負責：
 *
 * - UI
 * - 使用者操作
 * - 呼叫 Game
 * - 顯示 Game / Analyzer / Roadmap 結果
 *
 * 不負責：
 *
 * - 發牌規則
 * - 勝負計算
 * - 機率計算
 * - EV 計算
 * - 路單演算法
 */

import Game, {
    GameState,
    ManualRoundState,
    HandSide,
    AnalysisState
} from "../engine/game.js";

import createQuickCardInput
    from "../components/QuickCardInput.js";


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

        label:
            "♠ 黑桃"
    },

    {
        value:
            "H",

        label:
            "♥ 紅心"
    },

    {
        value:
            "D",

        label:
            "♦ 方塊"
    },

    {
        value:
            "C",

        label:
            "♣ 梅花"
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
                    2
            }
        )
        .format(value);

}


function cardText(card) {

    if (!card) {

        return "—";

    }

    return (
        card.toString?.() ??
        `${card.rank ?? ""}${card.suit ?? ""}`
    );

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
            !isObject(gameOptions)
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
                "beadRoad"

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


        if (
            autoMount &&
            this.root
        ) {

            this.mount();

        }

    }


    resolveRoot(root) {

        if (
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

        if (this.ui.busy) {

            return null;

        }

        this.ui.busy =
            true;

        this.clearMessage();

        if (renderBefore) {

            this.render();

        }

        try {

            const result =
                await callback();

            if (successMessage) {

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


        switch (target.name) {

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
                    ) || 20;

                this.render();

                break;

        }

    }


    async startNewShoe() {

        await this.runAction(
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

        await this.runAction(
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


                /**
                 * Game 可能已自動啟動分析。
                 * 若沒有，Dashboard 主動執行一次。
                 */
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

        await this.runAction(
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

        await this.runAction(
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


    async addCurrentCard() {

        await this.runAction(
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
                            rank:
                                this.ui
                                    .selectedRank,

                            suit:
                                this.ui
                                    .selectedSuit
                        }

                    );

            }
        );

    }


    async undoCard() {

        await this.runAction(
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

        await this.runAction(
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

        await this.runAction(
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

        this.root.innerHTML = `

            <main class="dashboardPage">

                ${this.renderHeader()}

                ${this.renderMessage()}

                <div class="dashboardGrid">

                    <section class="dashboardMain">

                        ${this.renderShoePanel()}

                        ${this.renderBurnPanel()}

                        ${this.renderRoundPanel()}

                        ${this.renderAnalysisPanel()}

                    </section>

                    <aside class="dashboardSide">

                        ${this.renderRecommendationPanel()}

                        ${this.renderShoeStatusPanel()}

                        ${this.renderHistoryPanel()}

                    </aside>

                </div>

                ${this.renderRoadmapPanel()}

            </main>

        `;

        return this;

    }


    renderHeader() {

        const state =
            this.game.state;

        return `

            <header class="dashboardHeader">

                <div>

                    <p class="dashboardEyebrow">
                        Baccarat Analyzer
                    </p>

                    <h1>
                        百家樂分析儀
                    </h1>

                    <p class="dashboardSubtitle">
                        手動輸入荷官已發出的牌，系統更新牌靴、路單與下一局分析。
                    </p>

                </div>

                <div class="dashboardHeaderActions">

                    <span class="stateBadge">
                        ${escapeHTML(state)}
                    </span>

                    <button
                        type="button"
                        class="button primary"
                        data-action="new-shoe"
                        ${this.ui.busy
                            ? "disabled"
                            : ""}
                    >
                        開始新牌靴
                    </button>

                </div>

            </header>

        `;

    }


    renderMessage() {

        if (!this.ui.message) {

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


    renderShoePanel() {

        const shoe =
            this.game.shoe;

        return `

            <section class="dashboardCard shoePanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            SHOE
                        </p>

                        <h2>
                            牌靴
                        </h2>

                    </div>

                    <span class="sectionValue">
                        #${this.game.shoeNumber}
                    </span>

                </div>

                <div class="metricGrid">

                    ${this.renderMetric(
                        "總牌數",
                        shoe?.total ?? 0
                    )}

                    ${this.renderMetric(
                        "可觀察牌",
                        this.game
                            .observableRemainingCards
                    )}

                    ${this.renderMetric(
                        "物理剩餘",
                        this.game.remainingCards
                    )}

                    ${this.renderMetric(
                        "未知燒牌",
                        this.game
                            .unknownBurnedCount
                    )}

                    ${this.renderMetric(
                        "已知移除",
                        this.game.usedCards
                    )}

                    ${this.renderMetric(
                        "已完成局數",
                        this.game.roundCount
                    )}

                </div>

            </section>

        `;

    }


    renderMetric(
        label,
        value
    ) {

        return `

            <div class="metric">

                <span class="metricLabel">
                    ${escapeHTML(label)}
                </span>

                <strong class="metricValue">
                    ${escapeHTML(value)}
                </strong>

            </div>

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

                <section class="dashboardCard burnPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                BURN
                            </p>

                            <h2>
                                燒牌
                            </h2>

                        </div>

                        <span class="statusBadge success">
                            已確認
                        </span>

                    </div>

                    <div class="burnSummary">

                        <div>
                            <span>指示牌</span>
                            <strong>
                                ${escapeHTML(
                                    cardText(
                                        info?.indicator
                                    )
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>隱藏燒牌</span>
                            <strong>
                                ${escapeHTML(
                                    info?.hiddenCount ??
                                    0
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>總移除</span>
                            <strong>
                                ${escapeHTML(
                                    info?.totalRemoved ??
                                    0
                                )}
                            </strong>
                        </div>

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

                <p class="helperText">
                    公開指示牌會從已知牌池移除；其餘燒牌只登記未知張數。
                </p>

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
                            )?.label.split(" ")[0] ??
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

                <section class="dashboardCard roundPanel disabledPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                ROUND
                            </p>

                            <h2>
                                本局輸入
                            </h2>

                        </div>

                    </div>

                    <p class="emptyText">
                        請先輸入燒牌指示牌。
                    </p>

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
                                荷官發牌
                            </h2>

                        </div>

                        <span class="statusBadge">
                            等待下一局
                        </span>

                    </div>

                    <p class="helperText">
                        荷官開始發牌後，按下按鈕並依序輸入已發出的牌。
                    </p>

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
                            手動輸入牌面
                        </h2>

                    </div>

                    <span class="statusBadge ${ready
                        ? "success"
                        : "warning"}">
                        ${ready
                            ? "可確認本局"
                            : escapeHTML(
                                next?.label ??
                                "等待"
                            )}
                    </span>

                </div>

                ${this.renderHands()}

                ${ready
                    ? ""
                    : this.renderCardSelector()}

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
                        : `
                            <button
                                type="button"
                                class="button primary"
                                data-action="add-card"
                                ${this.ui.busy
                                    ? "disabled"
                                    : ""}
                            >
                                加入${escapeHTML(
                                    next?.label ??
                                    "下一張"
                                )}
                            </button>
                        `}

                    <button
                        type="button"
                        class="button secondary"
                        data-action="undo-card"
                        ${(
                            this.ui.busy ||
                            this.game
                                .manualCards
                                .length === 0
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
                .manualProgress;


        return `

            <div class="handsGrid">

                ${this.renderHand(
                    "Player",
                    "閒家",
                    progress.playerCards,
                    progress.playerScore
                )}

                ${this.renderHand(
                    "Banker",
                    "莊家",
                    progress.bankerCards,
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

        const cells = [

            0,

            1,

            2

        ].map(
            index => {

                const card =
                    cards[index];

                return `

                    <div class="handCard ${card
                        ? "filled"
                        : "empty"}">

                        ${card
                            ? escapeHTML(
                                cardText(card)
                            )
                            : "—"}

                    </div>

                `;

            }
        ).join("");


        return `

            <div class="handBlock ${side.toLowerCase()}">

                <div class="handHeader">

                    <strong>
                        ${escapeHTML(label)}
                    </strong>

                    <span>
                        ${score === null
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
            this.ui.busy &&
            this.game.state ===
                GameState.ANALYZING
        ) {

            return `

                <section class="dashboardCard analysisPanel">

                    <div class="sectionHeader">

                        <div>

                            <p class="sectionEyebrow">
                                ANALYSIS
                            </p>

                            <h2>
                                正在分析下一局
                            </h2>

                        </div>

                        <span class="statusBadge warning">
                            計算中
                        </span>

                    </div>

                    <div class="analysisLoading">
                        <div class="spinner"></div>
                        <p>正在計算機率、EV 與下注建議…</p>
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
                        完成燒牌後即可分析第一局。
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


        return `

            <section class="dashboardCard analysisPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            ANALYSIS
                        </p>

                        <h2>
                            下一局下注分析
                        </h2>

                    </div>

                    <div class="analysisMeta">

                        <span>
                            ${escapeHTML(
                                analysis.method ??
                                "analysis"
                            )}
                        </span>

                        <span>
                            第 ${escapeHTML(
                                analysis
                                    .generatedAfterRound ??
                                this.game.roundCount
                            )} 局後
                        </span>

                    </div>

                </div>

                ${this.renderProbabilityTable(
                    analysis.probability
                )}

                ${this.renderEVTable(
                    analysis.ev
                )}

                <div class="analysisFooter">

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

                    <span>
                        物理剩餘：
                        ${escapeHTML(
                            analysis
                                .physicalRemaining ??
                            this.game
                                .remainingCards
                        )}
                    </span>

                </div>

            </section>

        `;

    }


    renderProbabilityTable(
        probability = {}
    ) {

        const rows = [

            [
                "Player",
                "閒",
                probability.player
            ],

            [
                "Banker",
                "莊",
                probability.banker
            ],

            [
                "Tie",
                "和",
                probability.tie
            ],

            [
                "Player Pair",
                "閒對",
                probability.playerPair
            ],

            [
                "Banker Pair",
                "莊對",
                probability.bankerPair
            ],

            [
                "Super 6",
                "幸運 6",
                probability.super6
            ],

            [
                "Player Dragon",
                "閒龍寶",
                probability
                    .playerDragonBonus
            ],

            [
                "Banker Dragon",
                "莊龍寶",
                probability
                    .bankerDragonBonus
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
                            label,
                            value
                        ]) => `

                            <div class="dataRow">

                                <span>
                                    ${escapeHTML(label)}
                                </span>

                                <strong>
                                    ${formatPercent(value)}
                                </strong>

                            </div>

                        `
                    ).join("")}

                </div>

            </div>

        `;

    }


    renderEVTable(ev = {}) {

        const entries =
            Object.entries(
                ev ??
                {}
            );


        if (
            entries.length === 0
        ) {

            return `

                <div class="analysisSection">

                    <h3>
                        EV
                    </h3>

                    <p class="emptyText">
                        暫無 EV 資料。
                    </p>

                </div>

            `;

        }


        return `

            <div class="analysisSection">

                <h3>
                    期望值 EV
                </h3>

                <div class="dataTable">

                    ${entries.map(
                        ([
                            name,
                            value
                        ]) => `

                            <div class="dataRow">

                                <span>
                                    ${escapeHTML(name)}
                                </span>

                                <strong class="${Number(value) >= 0
                                    ? "positive"
                                    : "negative"}">
                                    ${formatNumber(
                                        Number(value)
                                    )}
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
            analysis.ranking?.[0] ??
            null;

        const shouldBet =

            analysis.shouldBet ??

            recommendation?.shouldBet ??

            false;

        const betName =

            recommendation?.bet ??

            recommendation?.name ??

            best?.name ??

            "不下注";

        const reason =

            recommendation?.reason ??

            recommendation?.message ??

            (
                shouldBet

                    ? "目前排名最高的下注選項。"

                    : "目前沒有符合條件的正期望下注。"
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

                ${Number.isFinite(
                    recommendation?.amount
                )
                    ? `
                        <div class="recommendationAmount">

                            <span>
                                建議金額
                            </span>

                            <strong>
                                ${formatMoney(
                                    recommendation
                                        .amount
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
        {
            state:
                AnalysisState.IDLE
        };

    const consistency =
        this.game
            .validateConsistency?.() ??
        {
            valid:
                true
        };


    return `

        <section class="dashboardCard statusPanel">

            <div class="sectionHeader">

                <div>

                    <p class="sectionEyebrow">
                        STATUS
                    </p>

                    <h2>
                        系統狀態
                    </h2>

                </div>

            </div>

            <div class="statusList">

                <div>
                    <span>牌靴狀態</span>
                    <strong>
                        ${escapeHTML(
                            this.game.state ??
                            GameState.READY
                        )}
                    </strong>
                </div>

                <div>
                    <span>牌局輸入</span>
                    <strong>
                        ${escapeHTML(
                            this.game.manualState ??
                            ManualRoundState.IDLE
                        )}
                    </strong>
                </div>

                <div>
                    <span>分析狀態</span>
                    <strong>
                        ${escapeHTML(
                            analysis.state ??
                            AnalysisState.IDLE
                        )}
                    </strong>
                </div>

                <div>
                    <span>一致性</span>
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
            this.game.history
                .lastRounds(
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
                                    ${value} 局
                                </option>

                            `
                        ).join("")}

                    </select>

                </div>

                ${rounds.length === 0
                    ? `
                        <p class="emptyText">
                            尚無牌局紀錄。
                        </p>
                    `
                    : `
                        <div class="historyRoad">

                            ${rounds.map(
                                (
                                    result,
                                    index
                                ) => `

                                    <div
                                        class="historyItem ${getWinnerClass(
                                            result.winner
                                        )}"
                                        title="第 ${this.game.roundCount -
                                            rounds.length +
                                            index +
                                            1} 局"
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

                                            ${result.super6
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

        const viewModel =
            this.game
                .roadmapViewModel;

        const roads =
            viewModel?.roads ??
            viewModel ??
            {};


        return `

            <section class="dashboardCard roadmapPanel">

                <div class="sectionHeader">

                    <div>

                        <p class="sectionEyebrow">
                            ROADMAP
                        </p>

                        <h2>
                            五種路單
                        </h2>

                    </div>

                    <span class="sectionValue">
                        ${this.game.roundCount} 局
                    </span>

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
                                class="roadTab ${this.ui.activeRoad ===
                                    key
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

                ${this.renderRoad(
                    roads[
                        this.ui.activeRoad
                    ] ??
                    this.game
                        .roadMatrices[
                            this.ui.activeRoad
                        ] ??
                    null,
                    this.ui.activeRoad
                )}

            </section>

        `;

    }


    renderRoad(
        road,
        roadName
    ) {

        const matrix =

            road?.matrix ??

            road?.grid ??

            road;


        if (
            !Array.isArray(matrix) ||
            matrix.length === 0
        ) {

            return `

                <div class="roadEmpty">
                    尚無${escapeHTML(
                        ROAD_LABELS[
                            roadName
                        ] ??
                        "路單"
                    )}資料。
                </div>

            `;

        }


        return `

            <div class="roadViewport">

                <div
                    class="roadGrid"
                    style="
                        --road-columns: ${Math.max(
                            ...matrix.map(
                                row =>
                                    Array.isArray(row)
                                        ? row.length
                                        : 0
                            ),
                            1
                        )};
                    "
                >

                    ${matrix.map(
                        (
                            row,
                            rowIndex
                        ) => {

                            if (
                                !Array.isArray(row)
                            ) {

                                return "";

                            }

                            return row.map(
                                (
                                    cell,
                                    columnIndex
                                ) =>
                                    this.renderRoadCell(
                                        cell,
                                        rowIndex,
                                        columnIndex
                                    )
                            ).join("");

                        }
                    ).join("")}

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


        const value =

            cell.winner ??

            cell.color ??

            cell.value ??

            cell.result ??

            cell;


        const normalized =
            String(value)
                .toLowerCase();


        const cssClass =

            normalized.includes(
                "player"
            ) ||
            normalized === "p"

                ? "player"

                : normalized.includes(
                    "banker"
                ) ||
                normalized === "b"

                    ? "banker"

                    : normalized.includes(
                        "tie"
                    ) ||
                    normalized === "t"

                        ? "tie"

                        : normalized.includes(
                            "red"
                        )

                            ? "red"

                            : normalized.includes(
                                "blue"
                            )

                                ? "blue"

                                : "";


        const label =

            cssClass === "player"

                ? "閒"

                : cssClass === "banker"

                    ? "莊"

                    : cssClass === "tie"

                        ? "和"

                        : cssClass === "red"

                            ? "●"

                            : cssClass === "blue"

                                ? "●"

                                : String(value);


        return `

            <div
                class="roadCell ${cssClass}"
                data-row="${row}"
                data-column="${column}"
                title="${escapeHTML(
                    String(value)
                )}"
            >

                <span>
                    ${escapeHTML(label)}
                </span>

                ${cell.playerPair
                    ? '<i class="pairMark playerPair"></i>'
                    : ""}

                ${cell.bankerPair
                    ? '<i class="pairMark bankerPair"></i>'
                    : ""}

                ${cell.tieCount
                    ? `
                        <b class="tieCount">
                            ${escapeHTML(
                                cell.tieCount
                            )}
                        </b>
                    `
                    : ""}

            </div>

        `;

    }

}


/**
 * 預設匯出使用工廠函式。
 *
 * 可同時支援：
 *
 * dashboard({ root })
 *
 * new dashboard({ root })
 */
export default function createDashboard(
    options = {}
) {

    return new Dashboard(
        options
    );

}
