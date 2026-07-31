/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Dealer v2
 */

import Round from "./round.js";

import {
    playerMustDraw
} from "./rules/playerRule.js";

import {
    bankerMustDraw
} from "./rules/bankerRule.js";

export default class Dealer {

    constructor(shoe) {

        this.shoe = shoe;

        this.round = null;

        this.playerThirdCard = null;

    }

    /**
     * 開始新局
     */
    newRound() {

        this.round = new Round();

        this.playerThirdCard = null;

        return this.round;

    }

    /**
     * 抽牌
     */
    draw() {

        return this.shoe.draw();

    }

    /**
     * 初始四張牌
     */
    dealInitial() {

        if (!this.round) {

            this.newRound();

        }

        this.round.deal("player", this.draw());

        this.round.deal("banker", this.draw());

        this.round.deal("player", this.draw());

        this.round.deal("banker", this.draw());

        return this.round;

    }

    /**
     * 是否 Natural
     */
    checkNatural() {

        return this.round.isNatural;

    }

    /**
     * Player 第三張
     */
    playPlayerThirdCard() {

        if (

            playerMustDraw(

                this.round.playerScore

            )

        ) {

            this.playerThirdCard = this.draw();

            this.round.deal(

                "player",

                this.playerThirdCard

            );

        }

        return this.playerThirdCard;

    }

    /**
     * Banker 第三張
     */
    playBankerThirdCard() {

        if (

            bankerMustDraw(

                this.round.bankerScore,

                this.playerThirdCard

            )

        ) {

            this.round.deal(

                "banker",

                this.draw()

            );

        }

    }

    /**
     * 完成牌局
     */
    finish() {

        this.round.finish();

        return this.round;

    }

    /**
     * 一鍵完成整局
     */
    play() {

        this.newRound();

        this.dealInitial();

        if (

            this.checkNatural()

        ) {

            return this.finish();

        }

        this.playPlayerThirdCard();

        this.playBankerThirdCard();

        return this.finish();

    }

}
