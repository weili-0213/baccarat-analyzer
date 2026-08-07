/**
 * Baccarat Analyzer V10.4.5
 * Path: analysis/ev.js
 * Purpose: Expected Value Engine for No Commission Baccarat.
 *
 * Main rules:
 *
 * Player:
 *   +1 on Player win, -1 on Banker win, 0 on Tie.
 *
 * Banker:
 *   +1 on Banker win except Banker 6,
 *   +0.5 on Banker win with 6,
 *   -1 on Player win,
 *   0 on Tie.
 *
 * Therefore Banker EV is NOT:
 *
 *     P(Banker) * 1 - P(Player)
 *
 * It must be:
 *
 *     normalBankerWin = P(Banker) - P(Super6)
 *
 *     Banker EV =
 *         normalBankerWin * 1
 *       + P(Super6) * 0.5
 *       - P(Player)
 *
 * Dragon Bonus remains unavailable until a complete margin distribution
 * is supplied.
 */
import {
    NO_COMMISSION_BACCARAT_RULES,
    NO_COMMISSION_PAYOUT
} from "../config/noCommissionBaccarat.js";

export const EV_NO_COMMISSION_VERSION = "10.4.5";

export const EV_STATUS =
    Object.freeze({
        AVAILABLE:
            "available",

        UNAVAILABLE:
            "unavailable"
    });

export const DEFAULT_PAYOUT =
    NO_COMMISSION_PAYOUT;

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

        this.ruleset = {
            ...NO_COMMISSION_BACCARAT_RULES
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

    bankerComponents(probability) {
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

        const bankerSix =
            assertProbability(
                probability.super6,
                "probability.super6"
            );

        if (
            bankerSix >
            banker + 1e-12
        ) {
            throw new RangeError(
                "probability.super6 cannot exceed probability.banker"
            );
        }

        const normalBankerWin =
            Math.max(
                0,
                banker - bankerSix
            );

        return {
            banker,
            player,
            bankerSix,
            normalBankerWin
        };
    }

    banker(probability) {
        const {
            player,
            bankerSix,
            normalBankerWin
        } =
            this.bankerComponents(
                probability
            );

        return (
            normalBankerWin *
                this.payout
                    .bankerNormal
        ) + (
            bankerSix *
                this.payout
                    .bankerSix
        ) - player;
    }

    /**
     * Existing Kelly/Risk engines use one win probability plus one netOdds.
     * For Banker, expose an EV-preserving conditional average payout:
     *
     * effectiveOdds =
     *   E[profit | Banker wins]
     *
     * This keeps the EV passed to legacy binary bet engines aligned with the
     * exact No Commission Banker EV.
     */
    effectiveBankerNetOdds(
        probability
    ) {
        const {
            banker,
            bankerSix,
            normalBankerWin
        } =
            this.bankerComponents(
                probability
            );

        if (banker <= 0) {
            return 0;
        }

        return (
            normalBankerWin *
                this.payout
                    .bankerNormal +
            bankerSix *
                this.payout
                    .bankerSix
        ) / banker;
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
            version:
                EV_NO_COMMISSION_VERSION,

            ruleset:
                {
                    ...this.ruleset
                },

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
