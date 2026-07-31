/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Expected Value Engine
 *
 * EV = Win × Odds - Lose
 *
 * Author:
 * Baccarat Analyzer
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

    constructor(payout = DEFAULT_PAYOUT) {

        this.payout = {

            ...DEFAULT_PAYOUT,
            ...payout

        };

    }

    /**
     * 通用EV
     */
    calculate(win, lose, odds) {

        return (win * odds) - lose;

    }

    /**
     * Player
     */
    player(prob) {

        return this.calculate(
            prob.player,
            prob.banker,
            this.payout.player
        );

    }

    /**
     * Banker
     */
    banker(prob) {

        return this.calculate(
            prob.banker,
            prob.player,
            this.payout.banker
        );

    }

    /**
     * Tie
     */
    tie(prob) {

        return this.calculate(
            prob.tie,
            1 - prob.tie,
            this.payout.tie
        );

    }

    /**
     * Player Pair
     */
    playerPair(prob) {

        return this.calculate(
            prob.playerPair,
            1 - prob.playerPair,
            this.payout.playerPair
        );

    }

    /**
     * Banker Pair
     */
    bankerPair(prob) {

        return this.calculate(
            prob.bankerPair,
            1 - prob.bankerPair,
            this.payout.bankerPair
        );

    }

    /**
     * Super 6
     */
    super6(prob) {

        return this.calculate(
            prob.super6,
            1 - prob.super6,
            this.payout.super6
        );

    }

    /**
     * Dragon Bonus Player
     */
    playerDragonBonus(prob) {

        return this.calculate(
            prob.playerDragonBonus,
            1 - prob.playerDragonBonus,
            this.payout.playerDragonBonus
        );

    }

    /**
     * Dragon Bonus Banker
     */
    bankerDragonBonus(prob) {

        return this.calculate(
            prob.bankerDragonBonus,
            1 - prob.bankerDragonBonus,
            this.payout.bankerDragonBonus
        );

    }

    /**
     * 全部EV
     */
    all(prob) {

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
     * EV排序
     */
    ranking(prob) {

        return Object.entries(
            this.all(prob)
        )

        .map(([bet, ev]) => ({

            bet,

            ev

        }))

        .sort((a, b) => b.ev - a.ev);

    }

    /**
     * 最佳下注
     */
    best(prob) {

        return this.ranking(prob)[0];

    }

    /**
     * 是否正EV
     */
    isPositive(ev) {

        return ev > 0;

    }

    /**
     * 百分比格式
     */
    format(ev) {

        return (ev * 100).toFixed(2) + "%";

    }

    /**
     * 報表
     */
    report(prob) {

        const ranking = this.ranking(prob);

        return ranking.map(item => ({

            bet: item.bet,

            ev: item.ev,

            percent: this.format(item.ev),

            positive: this.isPositive(item.ev)

        }));

    }

}
