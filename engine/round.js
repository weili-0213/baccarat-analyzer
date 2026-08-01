/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Round
 *
 * 單局百家樂牌局
 *
 * 負責：
 * 1. 保存 Player / Banker 手牌
 * 2. 接收發牌
 * 3. 提供點數與 Natural 狀態
 * 4. 完成牌局並建立 RoundResult
 *
 * 不負責：
 * - 抽牌
 * - 補牌規則
 * - Shoe
 * - History
 * - 分析
 */

import Card from "./card.js";
import Hand from "./hand.js";
import RoundResult from "./roundResult.js";


export const RoundState = Object.freeze({

    ACTIVE: "ACTIVE",

    FINISHED: "FINISHED"

});


export default class Round {

    constructor({

        player = new Hand(),

        banker = new Hand(),

        state =
            RoundState.ACTIVE,

        result = null

    } = {}) {

        if (!(player instanceof Hand)) {

            throw new TypeError(
                "Player must be a Hand."
            );

        }

        if (!(banker instanceof Hand)) {

            throw new TypeError(
                "Banker must be a Hand."
            );

        }

        if (
            !Object.values(
                RoundState
            ).includes(state)
        ) {

            throw new Error(
                `Invalid round state: ${state}`
            );

        }

        if (
            result !== null &&
            !(result instanceof RoundResult)
        ) {

            throw new TypeError(
                "Result must be a RoundResult or null."
            );

        }

        this.player = player;

        this.banker = banker;

        this.state = state;

        this._result = result;

    }


    /**
     * 驗證牌局尚未完成
     */
    requireActive() {

        if (this.finished) {

            throw new Error(
                "Round already finished."
            );

        }

        return this;

    }


    /**
     * 驗證發牌位置
     */
    validateSide(side) {

        if (
            side !== "player" &&
            side !== "banker"
        ) {

            throw new Error(
                `Invalid round side: ${side}`
            );

        }

    }


    /**
     * 發一張牌
     */
    deal(side, card) {

        this.requireActive();

        this.validateSide(side);

        if (!(card instanceof Card)) {

            throw new TypeError(
                "Round can only deal Card instances."
            );

        }

        const hand =

            side === "player"

                ? this.player

                : this.banker;

        /**
         * 百家樂每方最多三張牌。
         */
        if (hand.count >= 3) {

            throw new Error(
                `${side} hand already has 3 cards.`
            );

        }

        hand.add(card);

        return card;

    }


    /**
     * Player 點數
     */
    get playerScore() {

        return this.player.value;

    }


    /**
     * Banker 點數
     */
    get bankerScore() {

        return this.banker.value;

    }


    /**
     * 任一方是否 Natural
     *
     * 只有初始兩張牌時才成立，
     * Hand.isNatural 已負責此判斷。
     */
    get isNatural() {

        return (

            this.player.isNatural ||

            this.banker.isNatural

        );

    }


    /**
     * 是否已完成
     */
    get finished() {

        return (
            this.state ===
            RoundState.FINISHED
        );

    }


    /**
     * RoundResult
     *
     * 未完成時回傳 null。
     */
    get result() {

        return this._result;

    }


    /**
     * 勝方
     */
    get winner() {

        return (
            this._result?.winner ??
            null
        );

    }


    /**
     * 完成牌局
     *
     * 第一次呼叫：
     * - 建立 RoundResult
     * - 保存到 this._result
     * - 狀態改為 FINISHED
     *
     * 重複呼叫：
     * - 回傳同一個 RoundResult
     */
    finish() {

        if (this.finished) {

            if (!this._result) {

                throw new Error(
                    "Finished round has no result."
                );

            }

            return this._result;

        }

        /**
         * 必須至少完成初始四張牌。
         */
        if (
            this.player.count < 2 ||
            this.banker.count < 2
        ) {

            throw new Error(
                "Cannot finish before both hands have at least 2 cards."
            );

        }

        this._result =
            new RoundResult(

                this.player,

                this.banker

            );

        this.state =
            RoundState.FINISHED;

        return this._result;

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            state:
                this.state,

            player:
                this.player.toJSON(),

            banker:
                this.banker.toJSON(),

            result:
                this._result
                    ? this._result
                        .toJSON()
                    : null

        };

    }


    /**
     * JSON 還原
     */
    static fromJSON(data) {

        if (!data) {

            throw new Error(
                "Round data is required."
            );

        }

        if (
            !data.player ||
            !data.banker
        ) {

            throw new Error(
                "Round player and banker data are required."
            );

        }

        const state =
            data.state ??
            RoundState.ACTIVE;

        if (
            !Object.values(
                RoundState
            ).includes(state)
        ) {

            throw new Error(
                `Invalid round state: ${state}`
            );

        }

        const player =
            Hand.fromJSON(
                data.player
            );

        const banker =
            Hand.fromJSON(
                data.banker
            );

        const round =
            new Round({

                player,

                banker,

                state:
                    RoundState.ACTIVE,

                result:
                    null

            });

        /**
         * RoundResult 通常保存的是衍生資料，
         * 由 Hand 重新建立最安全，
         * 不需要依賴 RoundResult.fromJSON()。
         */
        if (
            state ===
            RoundState.FINISHED
        ) {

            round._result =
                new RoundResult(

                    round.player,

                    round.banker

                );

            round.state =
                RoundState.FINISHED;

        }

        return round;

    }

}
