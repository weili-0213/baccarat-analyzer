/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Round Result
 *
 * 一局百家樂的最終結果
 *
 */

import {
    compareHands,
    scoreMargin
} from "./score.js";

export default class RoundResult {

    constructor(player, banker) {

        this.player = player;
        this.banker = banker;

        Object.freeze(this);

    }

    /**
     * 閒家點數
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
     * 勝方
     */
    get winner() {

        const result = compareHands(

            this.player.getCards(),
            this.banker.getCards()

        );

        switch (result) {

            case 1:
                return "Player";

            case -1:
                return "Banker";

            default:
                return "Tie";

        }

    }

    /**
     * 是否 Player 勝
     */
    get playerWin() {

        return this.winner === "Player";

    }

    /**
     * 是否 Banker 勝
     */
    get bankerWin() {

        return this.winner === "Banker";

    }

    /**
     * 是否 Tie
     */
    get tie() {

        return this.winner === "Tie";

    }

    /**
     * 閒對
     */
    get playerPair() {

        return this.player.isPair;

    }

    /**
     * 莊對
     */
    get bankerPair() {

        return this.banker.isPair;

    }

    /**
     * 是否任一對子
     */
    get eitherPair() {

        return this.playerPair || this.bankerPair;

    }

    /**
     * 閒天牌
     */
    get playerNatural() {

        return this.player.isNatural;

    }

    /**
     * 莊天牌
     */
    get bankerNatural() {

        return this.banker.isNatural;

    }

    /**
     * 是否 Natural
     */
    get natural() {

        return (
            this.playerNatural ||
            this.bankerNatural
        );

    }

    /**
     * Player 是否補第三張
     */
    get playerDrewThirdCard() {

        return this.player.count === 3;

    }

    /**
     * Banker 是否補第三張
     */
    get bankerDrewThirdCard() {

        return this.banker.count === 3;

    }

    /**
     * Small
     *
     * 四張牌結束
     */
    get isSmall() {

        return (

            this.player.count === 2 &&
            this.banker.count === 2

        );

    }

    /**
     * Big
     *
     * 五或六張牌
     */
    get isBig() {

        return !this.isSmall;

    }

    /**
     * Super 6
     *
     * 莊贏6點
     */
    get super6() {

        return (

            this.bankerWin &&
            this.bankerScore === 6

        );

    }

    /**
     * 勝差
     */
    get margin() {

        return scoreMargin(

            this.player.getCards(),
            this.banker.getCards()

        );

    }

    /**
     * JSON
     */
    toJSON() {

        return {

            winner: this.winner,

            playerScore: this.playerScore,
            bankerScore: this.bankerScore,

            playerWin: this.playerWin,
            bankerWin: this.bankerWin,
            tie: this.tie,

            margin: this.margin,

            playerPair: this.playerPair,
            bankerPair: this.bankerPair,
            eitherPair: this.eitherPair,

            playerNatural: this.playerNatural,
            bankerNatural: this.bankerNatural,
            natural: this.natural,

            playerDrewThirdCard:
                this.playerDrewThirdCard,

            bankerDrewThirdCard:
                this.bankerDrewThirdCard,

            isSmall: this.isSmall,
            isBig: this.isBig,

            super6: this.super6

        };

    }

}
