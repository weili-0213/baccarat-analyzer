/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Expected Value Calculator
 *
 * EV = p(win) × 賠率
 *      - p(lose)
 *
 * Tie 不算輸贏時：
 * EV = Win × Odds - Lose
 */

const DEFAULT_PAYOUT = {

    player: 1,
    banker: 0.95,
    tie: 8,

    playerPair: 11,
    bankerPair: 11,

    playerDragonBonus: 30,
    bankerDragonBonus: 30,

    super6: 12

};

export default class EV {

    constructor(payout = DEFAULT_PAYOUT){

        this.payout = payout;

    }

    /**
     * 通用EV
     */
    calculate(win, lose, odds){

        return win * odds - lose;

    }

    /**
     * 閒
     */
    player(prob){

        return this.calculate(
            prob.player,
            prob.banker,
            this.payout.player
        );

    }

    /**
     * 莊
     */
    banker(prob){

        return this.calculate(
            prob.banker,
            prob.player,
            this.payout.banker
        );

    }

    /**
     * 和
     */
    tie(prob){

        return this.calculate(
            prob.tie,
            1 - prob.tie,
            this.payout.tie
        );

    }

    /**
     * 閒對
     */
    playerPair(prob){

        return this.calculate(
            prob.playerPair,
            1 - prob.playerPair,
            this.payout.playerPair
        );

    }

    /**
     * 莊對
     */
    bankerPair(prob){

        return this.calculate(
            prob.bankerPair,
            1 - prob.bankerPair,
            this.payout.bankerPair
        );

    }

    /**
     * Super6
     */
    super6(prob){

        return this.calculate(
            prob.super6,
            1 - prob.super6,
            this.payout.super6
        );

    }

    /**
     * Dragon Bonus Player
     */
    playerDragonBonus(prob){

        return this.calculate(
            prob.playerDragonBonus,
            1 - prob.playerDragonBonus,
            this.payout.playerDragonBonus
        );

    }

    /**
     * Dragon Bonus Banker
     */
    bankerDragonBonus(prob){

        return this.calculate(
            prob.bankerDragonBonus,
            1 - prob.bankerDragonBonus,
            this.payout.bankerDragonBonus
        );

    }

    /**
     * 全部EV
     */
    all(prob){

        return {

            player: this.player(prob),

            banker: this.banker(prob),

            tie: this.tie(prob),

            playerPair: this.playerPair(prob),

            bankerPair: this.bankerPair(prob),

            super6: this.super6(prob),

            playerDragonBonus:
                this.playerDragonBonus(prob),

            bankerDragonBonus:
                this.bankerDragonBonus(prob)

        };

    }

    /**
     * 找最大EV
     */
    best(prob){

        const ev = this.all(prob);

        let bestKey = null;
        let bestValue = -Infinity;

        for(const key in ev){

            if(ev[key] > bestValue){

                bestValue = ev[key];
                bestKey = key;

            }

        }

        return {

            bet: bestKey,

            ev: bestValue

        };

    }

}
