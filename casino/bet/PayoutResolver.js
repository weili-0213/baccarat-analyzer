/**
 * Baccarat Analyzer V6.8
 * casino/bet/PayoutResolver.js
 */

import {
    BetStatus,
    BetType
} from "./BetState.js";


export const PAYOUT_RESOLVER_VERSION = "6.8.0";

const DEFAULT_PAYOUTS = Object.freeze({
    [BetType.PLAYER]: 1,
    [BetType.BANKER]: 0.95,
    [BetType.TIE]: 8,
    [BetType.PLAYER_PAIR]: 11,
    [BetType.BANKER_PAIR]: 11,
    [BetType.EITHER_PAIR]: 5,
    [BetType.PERFECT_PAIR]: 25,
    [BetType.BIG]: 0.54,
    [BetType.SMALL]: 1.5
});

export default class PayoutResolver {
    constructor({
        payouts = {}
    } = {}) {
        this.payouts = {
            ...DEFAULT_PAYOUTS,
            ...payouts
        };
    }

    resolve({
        betType,
        amount,
        result = {}
    } = {}) {
        if (
            !Object.values(BetType)
                .includes(betType)
        ) {
            throw new Error(
                `Unsupported bet type: ${betType}`
            );
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new RangeError(
                "Bet amount must be greater than zero."
            );
        }

        const won =
            this.isWinner(
                betType,
                result
            );

        if (won === null) {
            return {
                status:
                    BetStatus.PUSH,

                odds:
                    0,

                returnAmount:
                    amount,

                profit:
                    0
            };
        }

        if (!won) {
            return {
                status:
                    BetStatus.LOST,

                odds:
                    this.payouts[betType],

                returnAmount:
                    0,

                profit:
                    -amount
            };
        }

        const odds =
            this.payouts[betType];

        const profit =
            amount * odds;

        return {
            status:
                BetStatus.WON,

            odds,

            returnAmount:
                amount +
                profit,

            profit
        };
    }

    isWinner(
        betType,
        result
    ) {
        switch (betType) {
            case BetType.PLAYER:
                if (
                    result.winner ===
                        "Tie"
                ) {
                    return null;
                }

                return (
                    result.winner ===
                    "Player"
                );

            case BetType.BANKER:
                if (
                    result.winner ===
                        "Tie"
                ) {
                    return null;
                }

                return (
                    result.winner ===
                    "Banker"
                );

            case BetType.TIE:
                return (
                    result.winner ===
                    "Tie"
                );

            case BetType.PLAYER_PAIR:
                return Boolean(
                    result.playerPair
                );

            case BetType.BANKER_PAIR:
                return Boolean(
                    result.bankerPair
                );

            case BetType.EITHER_PAIR:
                return Boolean(
                    result.playerPair ||
                    result.bankerPair
                );

            case BetType.PERFECT_PAIR:
                return Boolean(
                    result.perfectPair
                );

            case BetType.BIG:
                return (
                    result.totalCards >= 5
                );

            case BetType.SMALL:
                return (
                    result.totalCards === 4
                );

            default:
                return false;
        }
    }

    get summary() {
        return {
            version:
                PAYOUT_RESOLVER_VERSION,

            payouts: {
                ...this.payouts
            }
        };
    }
}
