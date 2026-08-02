/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * analysis/ev.js
 *
 * Expected Value Engine
 *
 * 主注與一般固定賠率下注：
 *
 * EV = Win × Net Odds - Lose
 *
 * Dragon Bonus 是分級賠率下注，不能用單一 30 倍賠率
 * 搭配一個總中獎機率計算。若尚未提供完整分差機率分布，
 * 本引擎將 Dragon Bonus EV 回傳為 0，並標記 unavailable，
 * 避免錯誤數值進入 Ranking 與 Recommendation。
 */

export const EV_STATUS =
    Object.freeze({

        AVAILABLE:
            "available",

        UNAVAILABLE:
            "unavailable"

    });


export const DEFAULT_PAYOUT =
    Object.freeze({

        player:
            1,

        banker:
            0.95,

        tie:
            8,

        playerPair:
            11,

        bankerPair:
            11,

        super6:
            12

    });


function assertProbability(
    value,
    name
) {

    if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    ) {

        throw new RangeError(
            `${name} must be between 0 and 1`
        );

    }

    return value;

}


export default class EV {

    constructor(
        payout = {}
    ) {

        this.payout = {

            ...DEFAULT_PAYOUT,

            ...payout

        };


        this.status = {

            player:
                EV_STATUS.AVAILABLE,

            banker:
                EV_STATUS.AVAILABLE,

            tie:
                EV_STATUS.AVAILABLE,

            playerPair:
                EV_STATUS.AVAILABLE,

            bankerPair:
                EV_STATUS.AVAILABLE,

            super6:
                EV_STATUS.AVAILABLE,

            playerDragonBonus:
                EV_STATUS.UNAVAILABLE,

            bankerDragonBonus:
                EV_STATUS.UNAVAILABLE

        };

    }


    calculate(
        win,
        lose,
        odds
    ) {

        if (
            !Number.isFinite(win) ||
            !Number.isFinite(lose) ||
            !Number.isFinite(odds)
        ) {

            throw new TypeError(
                "EV values must be finite numbers"
            );

        }

        return (
            win * odds
        ) - lose;

    }


    player(probability) {

        const player =
            assertProbability(
                probability.player,
                "probability.player"
            );

        const banker =
            assertProbability(
                probability.banker,
                "probability.banker"
            );

        return this.calculate(
            player,
            banker,
            this.payout.player
        );

    }


    banker(probability) {

        const banker =
            assertProbability(
                probability.banker,
                "probability.banker"
            );

        const player =
            assertProbability(
                probability.player,
                "probability.player"
            );

        return this.calculate(
            banker,
            player,
            this.payout.banker
        );

    }


    tie(probability) {

        const tie =
            assertProbability(
                probability.tie,
                "probability.tie"
            );

        return this.calculate(
            tie,
            1 - tie,
            this.payout.tie
        );

    }


    playerPair(probability) {

        const value =
            assertProbability(
                probability.playerPair,
                "probability.playerPair"
            );

        return this.calculate(
            value,
            1 - value,
            this.payout.playerPair
        );

    }


    bankerPair(probability) {

        const value =
            assertProbability(
                probability.bankerPair,
                "probability.bankerPair"
            );

        return this.calculate(
            value,
            1 - value,
            this.payout.bankerPair
        );

    }


    super6(probability) {

        const value =
            assertProbability(
                probability.super6,
                "probability.super6"
            );

        return this.calculate(
            value,
            1 - value,
            this.payout.super6
        );

    }


    playerDragonBonus() {

        return 0;

    }


    bankerDragonBonus() {

        return 0;

    }


    all(probability) {

        return {

            player:
                this.player(
                    probability
                ),

            banker:
                this.banker(
                    probability
                ),

            tie:
                this.tie(
                    probability
                ),

            playerPair:
                this.playerPair(
                    probability
                ),

            bankerPair:
                this.bankerPair(
                    probability
                ),

            super6:
                this.super6(
                    probability
                ),

            playerDragonBonus:
                0,

            bankerDragonBonus:
                0

        };

    }


    getStatus(name) {

        return (
            this.status[name] ??
            EV_STATUS.UNAVAILABLE
        );

    }


    isAvailable(name) {

        return (
            this.getStatus(name) ===
            EV_STATUS.AVAILABLE
        );

    }


    toJSON() {

        return {

            payout:
                {
                    ...this.payout
                },

            status:
                {
                    ...this.status
                }

        };

    }

}
