/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Expected Value Engine
 *
 * 將各下注機率轉換成 EV
 *
 * EV = Win × Odds - Lose
 */

const DEFAULT_PAYOUT = {

    player: 1,

    banker: 0.95,

    tie: 8,

    playerPair: 11,

    bankerPair: 11,

    super6: 12,

    playerDragonBonus: 30,

    bankerDragonBonus: 30

};

export default class EV {

    constructor(payout = DEFAULT_PAYOUT) {

        this.payout = {

            ...DEFAULT_PAYOUT,

            ...payout

        };

    }

    /**
     * 通用EV公式
     */
    calculate(win, lose, odds) {

        return (win * odds) - lose;

    }

    /**
     * 閒
     */
    player(probability) {

        return this.calculate(

            probability.player,

            probability.banker,

            this.payout.player

        );

    }

    /**
     * 莊
     */
    banker(probability) {

        return this.calculate(

            probability.banker,

            probability.player,

            this.payout.banker

        );

    }

    /**
     * 和
     */
    tie(probability) {

        return this.calculate(

            probability.tie,

            1 - probability.tie,

            this.payout.tie

        );

    }

    /**
     * 閒對
     */
    playerPair(probability) {

        return this.calculate(

            probability.playerPair,

            1 - probability.playerPair,

            this.payout.playerPair

        );

    }

    /**
     * 莊對
     */
    bankerPair(probability) {

        return this.calculate(

            probability.bankerPair,

            1 - probability.bankerPair,

            this.payout.bankerPair

        );

    }

    /**
     * Super 6
     */
    super6(probability) {

        return this.calculate(

            probability.super6,

            1 - probability.super6,

            this.payout.super6

        );

    }

    /**
     * 閒龍寶
     */
    playerDragonBonus(probability) {

        return this.calculate(

            probability.playerDragonBonus,

            1 - probability.playerDragonBonus,

            this.payout.playerDragonBonus

        );

    }

    /**
     * 莊龍寶
     */
    bankerDragonBonus(probability) {

        return this.calculate(

            probability.bankerDragonBonus,

            1 - probability.bankerDragonBonus,

            this.payout.bankerDragonBonus

        );

    }

    /**
     * 計算全部EV
     */
    all(probability) {

        return {

            player:
                this.player(probability),

            banker:
                this.banker(probability),

            tie:
                this.tie(probability),

            playerPair:
                this.playerPair(probability),

            bankerPair:
                this.bankerPair(probability),

            super6:
                this.super6(probability),

            playerDragonBonus:
                this.playerDragonBonus(probability),

            bankerDragonBonus:
                this.bankerDragonBonus(probability)

        };

    }

}
