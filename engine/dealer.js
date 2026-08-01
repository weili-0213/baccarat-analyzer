/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dealer
 *
 * 百家樂發牌引擎（Dealer v3）
 *
 * 負責：
 * 1. 建立一局
 * 2. 發初始四張牌
 * 3. 判斷 Natural
 * 4. 執行閒家補牌
 * 5. 執行莊家補牌
 * 6. 完成牌局
 *
 * 不負責：
 * - 勝負計算細節
 * - 機率分析
 * - EV
 * - History
 */

import Card from "./card.js";
import Round from "./round.js";

import {
    playerMustDraw
} from "./rules/playerRule.js";

import {
    bankerMustDraw
} from "./rules/bankerRule.js";


export const DealerState = Object.freeze({

    READY: "READY",

    INITIAL_DEALT: "INITIAL_DEALT",

    PLAYER_THIRD: "PLAYER_THIRD",

    BANKER_THIRD: "BANKER_THIRD",

    FINISHED: "FINISHED"

});


export default class Dealer {

    constructor(shoe) {

        if (!shoe) {

            throw new Error(
                "Shoe is required."
            );

        }

        this.shoe = shoe;

        this.reset();

    }


    /**
     * 重置 Dealer
     *
     * 不會重置 Shoe。
     */
    reset() {

        this.round = null;

        this.playerThirdCard = null;

        this.bankerThirdCard = null;

        this.state =
            DealerState.READY;

        return this;

    }


    /**
     * 建立新局
     */
    newRound() {

        this.round =
            new Round();

        this.playerThirdCard =
            null;

        this.bankerThirdCard =
            null;

        this.state =
            DealerState.READY;

        return this.round;

    }


    /**
     * 驗證目前有 Round
     */
    requireRound() {

        if (!this.round) {

            throw new Error(
                "Round not found."
            );

        }

        return this.round;

    }


    /**
     * 抽一張牌
     */
    draw() {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }

        const card =
            this.shoe.draw();

        if (!(card instanceof Card)) {

            throw new Error(
                "No cards remaining in shoe."
            );

        }

        return card;

    }


    /**
     * 是否可發初始牌
     */
    canDealInitial() {

        return (
            this.state ===
            DealerState.READY
        );

    }


    /**
     * 是否可處理閒家第三張
     */
    canPlayerDraw() {

        return (
            this.state ===
            DealerState.INITIAL_DEALT
        );

    }


    /**
     * 是否可處理莊家第三張
     */
    canBankerDraw() {

        return (
            this.state ===
            DealerState.PLAYER_THIRD
        );

    }


    /**
     * 是否可完成牌局
     */
    canFinish() {

        return (
            this.state !==
            DealerState.FINISHED
        );

    }


    /**
     * 發初始四張牌
     *
     * 順序：
     * Player 1
     * Banker 1
     * Player 2
     * Banker 2
     */
    dealInitial() {

        if (!this.canDealInitial()) {

            throw new Error(
                `Invalid dealer state: ${this.state}`
            );

        }

        if (!this.round) {

            this.newRound();

        }

        this.round.deal(
            "player",
            this.draw()
        );

        this.round.deal(
            "banker",
            this.draw()
        );

        this.round.deal(
            "player",
            this.draw()
        );

        this.round.deal(
            "banker",
            this.draw()
        );

        this.state =
            DealerState.INITIAL_DEALT;

        return this.round;

    }


    /**
     * 是否 Natural
     */
    checkNatural() {

        const round =
            this.requireRound();

        return round.isNatural;

    }


    /**
     * 處理閒家第三張牌
     *
     * 回傳：
     * Card 或 null
     */
    playPlayerThirdCard() {

        if (!this.canPlayerDraw()) {

            throw new Error(
                `Invalid dealer state: ${this.state}`
            );

        }

        const round =
            this.requireRound();

        this.playerThirdCard =
            null;

        if (
            playerMustDraw(
                round.player
            )
        ) {

            this.playerThirdCard =
                this.draw();

            round.deal(
                "player",
                this.playerThirdCard
            );

        }

        this.state =
            DealerState.PLAYER_THIRD;

        return this.playerThirdCard;

    }


    /**
     * 處理莊家第三張牌
     *
     * 回傳：
     * Card 或 null
     */
    playBankerThirdCard() {

        if (!this.canBankerDraw()) {

            throw new Error(
                `Invalid dealer state: ${this.state}`
            );

        }

        const round =
            this.requireRound();

        this.bankerThirdCard =
            null;

        if (
            bankerMustDraw(
                round.banker,
                this.playerThirdCard
            )
        ) {

            this.bankerThirdCard =
                this.draw();

            round.deal(
                "banker",
                this.bankerThirdCard
            );

        }

        this.state =
            DealerState.BANKER_THIRD;

        return this.bankerThirdCard;

    }


    /**
     * 完成牌局
     *
     * 回傳 RoundResult。
     */
    finish() {

        const round =
            this.requireRound();

        if (
            this.state ===
            DealerState.FINISHED
        ) {

            return (
                round.result ??
                null
            );

        }

        if (
            this.state ===
            DealerState.READY
        ) {

            throw new Error(
                "Cannot finish before initial deal."
            );

        }

        const result =
            round.finish();

        if (!result) {

            throw new Error(
                "Round did not return a result."
            );

        }

        this.state =
            DealerState.FINISHED;

        return result;

    }


    /**
     * 一鍵完成一局
     *
     * 回傳 RoundResult。
     */
    play() {

        this.newRound();

        this.dealInitial();

        /**
         * 任一方 Natural，
         * 直接完成牌局。
         */
        if (
            this.checkNatural()
        ) {

            return this.finish();

        }

        this.playPlayerThirdCard();

        this.playBankerThirdCard();

        return this.finish();

    }


    /**
     * 是否完成
     */
    get finished() {

        return (
            this.state ===
            DealerState.FINISHED
        );

    }


    /**
     * 目前 Round
     */
    get currentRound() {

        return (
            this.round ??
            null
        );

    }


    /**
     * RoundResult
     */
    get result() {

        return (
            this.round?.result ??
            null
        );

    }


    /**
     * 玩家手牌
     */
    get playerHand() {

        return (
            this.round?.player ??
            null
        );

    }


    /**
     * 莊家手牌
     */
    get bankerHand() {

        return (
            this.round?.banker ??
            null
        );

    }


    /**
     * 玩家點數
     */
    get playerScore() {

        return (
            this.round?.playerScore ??
            null
        );

    }


    /**
     * 莊家點數
     */
    get bankerScore() {

        return (
            this.round?.bankerScore ??
            null
        );

    }


    /**
     * 勝方
     */
    get winner() {

        return (
            this.result?.winner ??
            null
        );

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            state:
                this.state,

            playerThirdCard:
                this.playerThirdCard
                    ? this.playerThirdCard
                        .toJSON()
                    : null,

            bankerThirdCard:
                this.bankerThirdCard
                    ? this.bankerThirdCard
                        .toJSON()
                    : null,

            round:
                this.round
                    ? this.round.toJSON()
                    : null

        };

    }


    /**
     * JSON 還原
     */
    static fromJSON(
        data,
        shoe
    ) {

        if (!data) {

            throw new Error(
                "Dealer data is required."
            );

        }

        if (!shoe) {

            throw new Error(
                "Shoe is required."
            );

        }

        const state =
            data.state ??
            DealerState.READY;

        if (
            !Object.values(
                DealerState
            ).includes(state)
        ) {

            throw new Error(
                `Invalid dealer state: ${state}`
            );

        }

        const dealer =
            new Dealer(shoe);

        dealer.state =
            state;

        dealer.round =
            data.round
                ? Round.fromJSON(
                    data.round
                )
                : null;

        dealer.playerThirdCard =
            data.playerThirdCard
                ? Card.fromJSON(
                    data.playerThirdCard
                )
                : null;

        dealer.bankerThirdCard =
            data.bankerThirdCard
                ? Card.fromJSON(
                    data.bankerThirdCard
                )
                : null;

        return dealer;

    }

}
