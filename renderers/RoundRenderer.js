/**
 * Baccarat Analyzer V3.4.3
 * renderers/RoundRenderer.js
 *
 * 燒牌、手動牌局與牌面顯示。
 */

import {
    ManualRoundState
} from "../engine/game.js";


export const ROUND_RENDERER_VERSION =
    "3.4.3";


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
        )
            ?.symbol ??
        card.suit ??
        "";


    return `${card.rank ?? ""}${symbol}`;

}


function winnerLabel(winner) {

    return winner ===
        "Player"
        ? "閒"
        : winner ===
            "Banker"
            ? "莊"
            : winner ===
                "Tie"
                ? "和"
                : "—";

}


export default class RoundRenderer {

    render({

        game,
        ui

    }) {

        if (!game.burnConfirmed) {

            return this.renderBurnPanel({

                ui

            });

        }


        if (
            !game.isManualRoundActive &&
            game.manualState !==
                ManualRoundState.FINISHED
        ) {

            return `

                <section class="dashboardCard v3RoundPanel">

                    <header class="v3PanelHeader">

                        <div>

                            <small>
                                ROUND
                            </small>

                            <h2>
                                等待下一局
                            </h2>

                        </div>

                        <span class="v3Badge">
                            READY
                        </span>

                    </header>


                    <button
                        type="button"
                        class="button primary full"
                        data-action="start-round"
                        ${game.canStartManualRound &&
                        !ui.busy
                            ? ""
                            : "disabled"}
                    >
                        開始輸入本局
                    </button>

                </section>

            `;

        }


        if (
            game.manualState ===
            ManualRoundState.FINISHED
        ) {

            return `

                <section class="dashboardCard v3RoundPanel">

                    <header class="v3PanelHeader">

                        <div>

                            <small>
                                ROUND
                            </small>

                            <h2>
                                本局完成
                            </h2>

                        </div>

                        <span class="v3Badge success">
                            ${winnerLabel(
                                game.winner
                            )}勝
                        </span>

                    </header>


                    ${this.renderHands(
                        game
                    )}


                    <button
                        type="button"
                        class="button primary full"
                        data-action="start-round"
                        ${game.canStartManualRound &&
                        !ui.busy
                            ? ""
                            : "disabled"}
                    >
                        開始輸入下一局
                    </button>

                </section>

            `;

        }


        const ready =
            game.canFinishManualRound;

        const next =
            game.nextManualInput;

        const manualCards =
            Array.isArray(
                game.manualCards
            )
                ? game.manualCards
                : [];


        return `

            <section class="dashboardCard v3RoundPanel">

                <header class="v3PanelHeader">

                    <div>

                        <small>
                            ROUND
                        </small>

                        <h2>
                            ${ready
                                ? "本局牌面完成"
                                : escapeHTML(
                                    next?.label ??
                                    "輸入牌面"
                                )}
                        </h2>

                    </div>

                    <span class="v3Badge ${ready
                        ? "success"
                        : "warning"}">
                        ${ready
                            ? "可確認"
                            : "輸入中"}
                    </span>

                </header>


                ${this.renderHands(
                    game
                )}


                ${ready
                    ? ""
                    : `<div data-quick-card-root></div>`}


                <div class="v31ShortcutHint">

                    <span>
                        Backspace 復原
                    </span>

                    <span>
                        Esc 取消
                    </span>

                    ${ready
                        ? "<span>Enter 確認</span>"
                        : ""}

                </div>


                <div class="v3RoundActions">

                    ${ready
                        ? `
                            <button
                                type="button"
                                class="button primary"
                                data-action="finish-round"
                            >
                                確認本局
                            </button>
                        `
                        : ""}


                    <button
                        type="button"
                        class="button secondary"
                        data-action="undo-card"
                        ${manualCards.length === 0
                            ? "disabled"
                            : ""}
                    >
                        復原一張
                    </button>


                    <button
                        type="button"
                        class="button danger"
                        data-action="cancel-round"
                    >
                        取消本局
                    </button>

                </div>

            </section>

        `;

    }


    renderBurnPanel({

        ui

    }) {

        const rankOptions =
            RANKS
                .map(
                    rank => `

                        <option
                            value="${rank}"
                            ${rank ===
                            ui.selectedRank
                                ? "selected"
                                : ""}
                        >
                            ${rank}
                        </option>

                    `
                )
                .join(
                    ""
                );


        const suitOptions =
            SUITS
                .map(
                    suit => `

                        <option
                            value="${suit.value}"
                            ${suit.value ===
                            ui.selectedSuit
                                ? "selected"
                                : ""}
                        >
                            ${suit.symbol}
                            ${suit.label}
                        </option>

                    `
                )
                .join(
                    ""
                );


        const selectedSymbol =
            SUITS.find(
                item =>
                    item.value ===
                    ui.selectedSuit
            )
                ?.symbol ??
            "";


        return `

            <section class="dashboardCard v3RoundPanel">

                <header class="v3PanelHeader">

                    <div>

                        <small>
                            BURN
                        </small>

                        <h2>
                            輸入燒牌指示牌
                        </h2>

                    </div>

                    <span class="v3Badge warning">
                        等待輸入
                    </span>

                </header>


                <div class="v3BurnSelector">

                    <label>

                        <span>
                            點數
                        </span>

                        <select name="card-rank">
                            ${rankOptions}
                        </select>

                    </label>


                    <label>

                        <span>
                            花色
                        </span>

                        <select name="card-suit">
                            ${suitOptions}
                        </select>

                    </label>


                    <div class="v3BurnPreview">

                        ${escapeHTML(
                            ui.selectedRank
                        )}

                        ${selectedSymbol}

                    </div>

                </div>


                <button
                    type="button"
                    class="button primary full"
                    data-action="confirm-burn"
                >
                    確認燒牌
                </button>

            </section>

        `;

    }


    renderHands(game) {

        const progress =
            game.manualProgress ??
            {};


        return `

            <div class="v3Hands">

                ${this.renderHand({

                    side:
                        "player",

                    label:
                        "閒家",

                    cards:
                        progress.playerCards ??
                        [],

                    score:
                        progress.playerScore

                })}


                ${this.renderHand({

                    side:
                        "banker",

                    label:
                        "莊家",

                    cards:
                        progress.bankerCards ??
                        [],

                    score:
                        progress.bankerScore

                })}

            </div>

        `;

    }


    renderHand({

        side,
        label,
        cards,
        score

    }) {

        return `

            <section class="v3Hand ${side}">

                <header>

                    <strong>
                        ${label}
                    </strong>

                    <span>
                        ${Number.isFinite(
                            score
                        )
                            ? `${score} 點`
                            : "—"}
                    </span>

                </header>


                <div>

                    ${[
                        0,
                        1,
                        2
                    ]
                        .map(
                            index => `

                                <span class="${cards[index]
                                    ? "filled"
                                    : ""}">
                                    ${cards[index]
                                        ? escapeHTML(
                                            cardText(
                                                cards[index]
                                            )
                                        )
                                        : "—"}
                                </span>

                            `
                        )
                        .join(
                            ""
                        )}

                </div>

            </section>

        `;

    }


    get summary() {

        return {

            version:
                ROUND_RENDERER_VERSION

        };

    }

}
