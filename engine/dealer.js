/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dealer
 *
 * 百家樂發牌引擎
 *
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

    }

    /**
     * 抽一張牌
     */
    draw() {

        return this.shoe.draw();

    }

    /**
     * 發一局牌
     */
    play() {

        const round = new Round();

        //-------------------------
        // 初始四張牌
        //-------------------------

        round.deal(
            "player",
            this.draw()
        );

        round.deal(
            "banker",
            this.draw()
        );

        round.deal(
            "player",
            this.draw()
        );

        round.deal(
            "banker",
            this.draw()
        );

        //-------------------------
        // Natural
        //-------------------------

        if (round.isNatural) {

            round.finish();

            return round;

        }

        //-------------------------
        // Player 第三張
        //-------------------------

        let playerThird = null;

        if (
            playerMustDraw(
                round.playerScore
            )
        ) {

            playerThird = this.draw();

            round.deal(
                "player",
                playerThird
            );

        }

        //-------------------------
        // Banker 第三張
        //-------------------------

        if (
            bankerMustDraw(
                round.bankerScore,
                playerThird
            )
        ) {

            round.deal(
                "banker",
                this.draw()
            );

        }

        //-------------------------
        // 完成
        //-------------------------

        round.finish();

        return round;

    }

}
