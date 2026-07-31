/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dealer
 *
 * 百家樂發牌引擎 (Dealer v3)
 *
 */

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

        this.shoe = shoe;

        this.reset();

    }


    /**
     * 重置 Dealer
     */
    reset() {

        this.round = null;

        this.playerThirdCard = null;

        this.state = DealerState.READY;

        return this;

    }


    /**
     * 建立新局
     */
    newRound() {

        this.round = new Round();

        this.playerThirdCard = null;

        this.state = DealerState.READY;

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

        return this.shoe.draw();

    }


    /**
     * 是否可發初始牌
     */
    canDealInitial() {

        return this.state === DealerState.READY;

    }


    /**
     * 是否可玩家補牌
     */
    canPlayerDraw() {

        return this.state === DealerState.INITIAL_DEALT;

    }


    /**
     * 是否可莊家補牌
     */
    canBankerDraw() {

        return this.state === DealerState.PLAYER_THIRD;

    }


    /**
     * 是否可完成牌局
     */
    canFinish() {

        return this.state !== DealerState.FINISHED;

    }


    /**
     * 發初始四張
     */
    dealInitial() {

        if (!this.canDealInitial()) {

            throw new Error(
                "Invalid dealer state."
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

        return this.round.isNatural;

    }


    /**
     * 玩家第三張
     */
    playPlayerThirdCard() {

        if (!this.canPlayerDraw()) {

            throw new Error(
                "Invalid dealer state."
            );

        }

        if (

            playerMustDraw(

                this.round.playerScore

            )

        ) {

            this.playerThirdCard =
                this.draw();

            this.round.deal(

                "player",

                this.playerThirdCard

            );

        }

        this.state =
            DealerState.PLAYER_THIRD;

        return this.playerThirdCard;

    }


    /**
     * 莊家第三張
     */
    playBankerThirdCard() {

        if (!this.canBankerDraw()) {

            throw new Error(
                "Invalid dealer state."
            );

        }

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

        this.state =
            DealerState.BANKER_THIRD;

    }


    /**
     * 完成牌局
     */
    finish() {

        if (!this.canFinish()) {

            return this.round;

        }

        this.round.finish();

        this.state =
            DealerState.FINISHED;

        return this.round;

    }


    /**
     * 一鍵完成一局
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


    /**
     * 是否完成
     */
    get finished() {

        return this.state === DealerState.FINISHED;

    }


    /**
     * 目前 Round
     */
    get currentRound() {

        return this.round;

    }


    /**
     * 玩家手牌
     */
    get playerHand() {

        return this.round?.player ?? null;

    }


    /**
     * 莊家手牌
     */
    get bankerHand() {

        return this.round?.banker ?? null;

    }


    /**
     * 玩家點數
     */
    get playerScore() {

        return this.round?.playerScore ?? null;

    }


    /**
     * 莊家點數
     */
    get bankerScore() {

        return this.round?.bankerScore ?? null;

    }


    /**
     * Winner
     */
    get winner() {

        return this.round?.winner ?? null;

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            state: this.state,

            playerThirdCard:
                this.playerThirdCard
                    ? this.playerThirdCard.toJSON()
                    : null,

            round:
                this.round
                    ? this.round.toJSON()
                    : null

        };

    }


    /**
     * JSON還原
     */
    static fromJSON(data, shoe) {

        const dealer = new Dealer(shoe);

        dealer.state = data.state;

        if (data.round) {

            dealer.round =
                Round.fromJSON(
                    data.round
                );

        }

        return dealer;

    }

}
