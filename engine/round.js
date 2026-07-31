/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Round
 *
 * 一局百家樂
 *
 */

import Hand from "./hand.js";
import RoundResult from "./roundResult.js";

export default class Round {

    constructor() {

        this.player = new Hand();
        this.banker = new Hand();

        this.finished = false;

        this.result = null;

    }

    /**
     * 發牌
     *
     * side:
     * "player"
     * "banker"
     */
    deal(side, card) {

        if (this.finished) {

            throw new Error(
                "Round already finished"
            );

        }

        if (side === "player") {

            this.player.add(card);

        }
        else if (side === "banker") {

            this.banker.add(card);

        }
        else {

            throw new Error(
                "Unknown side"
            );

        }

        return this;

    }

    /**
     * 玩家手牌
     */
    get playerCards() {

        return this.player.getCards();

    }

    /**
     * 莊家手牌
     */
    get bankerCards() {

        return this.banker.getCards();

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
     * Player Pair
     */
    get playerPair() {

        return this.player.isPair;

    }

    /**
     * Banker Pair
     */
    get bankerPair() {

        return this.banker.isPair;

    }

    /**
     * 完成牌局
     */
    finish() {

        if (this.finished) {

            return this.result;

        }

        this.result = new RoundResult(

            this.player,

            this.banker

        );

        this.finished = true;

        return this.result;

    }

    /**
     * Winner
     */
    get winner() {

        return this.result
            ? this.result.winner
            : null;

    }

    /**
     * 是否完成
     */
    get isFinished() {

        return this.finished;

    }

    /**
     * 清除
     */
    clear() {

        this.player.clear();

        this.banker.clear();

        this.finished = false;

        this.result = null;

        return this;

    }

    /**
     * 複製
     */
    clone() {

        const round = new Round();

        round.player = this.player.clone();

        round.banker = this.banker.clone();

        round.finished = this.finished;

        round.result = this.result
            ? this.result.clone()
            : null;

        return round;

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
     * JSON還原
     */
    static fromJSON(data) {

        const round = new Round();

        round.player = Hand.fromJSON(
            data.player
        );

        round.banker = Hand.fromJSON(
            data.banker
        );

        round.finished = data.finished;

        if (data.result) {

            round.result =
                RoundResult.fromJSON(
                    data.result
                );

        }

        return round;

    }

}
