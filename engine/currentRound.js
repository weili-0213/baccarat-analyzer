/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * CurrentRound
 *
 * 紀錄目前這一局所有資訊
 *
 */

import Hand from "./hand.js";
import RoundResult from "./roundResult.js";

export default class CurrentRound {

    constructor() {

        this.reset();

    }

    /**
     * 重設
     */
    reset() {

        this.player = new Hand();
        this.banker = new Hand();

        this.result = null;

        this.finished = false;

        return this;

    }

    /**
     * 玩家補牌
     */
    addPlayer(card) {

        this.player.add(card);

        return this;

    }

    /**
     * 莊家補牌
     */
    addBanker(card) {

        this.banker.add(card);

        return this;

    }

    /**
     * 玩家第三張
     */
    get playerThirdCard() {

        return this.player.count >= 3
            ? this.player.lastCard
            : null;

    }

    /**
     * 莊家第三張
     */
    get bankerThirdCard() {

        return this.banker.count >= 3
            ? this.banker.lastCard
            : null;

    }

    /**
     * 是否玩家補牌
     */
    get playerDrew() {

        return this.player.count === 3;

    }

    /**
     * 是否莊家補牌
     */
    get bankerDrew() {

        return this.banker.count === 3;

    }

    /**
     * 玩家點數
     */
    get playerScore() {

        return this.player.value;

    }

    /**
     * 莊家點數
     */
    get bankerScore() {

        return this.banker.value;

    }

    /**
     * 是否 Natural
     */
    get isNatural() {

        return (
            this.player.isNatural ||
            this.banker.isNatural
        );

    }

    /**
     * 是否完成
     */
    get isFinished() {

        return this.finished;

    }

    /**
     * 建立結果
     */
    finish() {

        this.result = new RoundResult(
            this.player,
            this.banker
        );

        this.finished = true;

        return this.result;

    }

    /**
     * 勝方
     */
    get winner() {

        return this.result
            ? this.result.winner
            : null;

    }

    /**
     * 是否閒贏
     */
    get playerWin() {

        return this.result
            ? this.result.playerWin
            : false;

    }

    /**
     * 是否莊贏
     */
    get bankerWin() {

        return this.result
            ? this.result.bankerWin
            : false;

    }

    /**
     * 是否和局
     */
    get tie() {

        return this.result
            ? this.result.tie
            : false;

    }

    /**
     * 勝差
     */
    get margin() {

        return this.result
            ? this.result.margin
            : 0;

    }

    /**
     * JSON
     */
    toJSON() {

        return {

            player: this.player.toJSON(),

            banker: this.banker.toJSON(),

            finished: this.finished,

            result: this.result
                ? this.result.toJSON()
                : null

        };

    }

    /**
     * JSON Restore
     */
    static fromJSON(data) {

        const round = new CurrentRound();

        round.player = Hand.fromJSON(data.player);

        round.banker = Hand.fromJSON(data.banker);

        round.finished = data.finished;

        if (data.result) {

            round.result = RoundResult.fromJSON(
                data.result
            );

        }

        return round;

    }

}
