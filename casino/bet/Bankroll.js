/**
 * Baccarat Analyzer V6.8
 * casino/bet/Bankroll.js
 */

export const BANKROLL_VERSION = "6.8.0";

export default class Bankroll {
    constructor({
        balance = 0
    } = {}) {
        if (
            !Number.isFinite(balance) ||
            balance < 0
        ) {
            throw new RangeError(
                "Bankroll balance must be zero or greater."
            );
        }

        this.initialBalance = balance;
        this.balance = balance;
        this.reserved = 0;
        this.profit = 0;
        this.totalWagered = 0;
        this.maxBalance = balance;
        this.minBalance = balance;
        this.maxDrawdown = 0;
    }

    reserve(amount) {
        this.validateAmount(amount);

        if (amount > this.available) {
            throw new Error(
                "Insufficient bankroll."
            );
        }

        this.reserved += amount;
        this.totalWagered += amount;

        return this.summary;
    }

    release(amount) {
        this.validateAmount(amount);

        this.reserved =
            Math.max(
                0,
                this.reserved -
                    amount
            );

        return this.summary;
    }

    settle({
        stake,
        returnAmount
    }) {
        this.validateAmount(stake);

        if (
            !Number.isFinite(returnAmount) ||
            returnAmount < 0
        ) {
            throw new RangeError(
                "returnAmount must be zero or greater."
            );
        }

        this.reserved =
            Math.max(
                0,
                this.reserved -
                    stake
            );

        const profit =
            returnAmount -
            stake;

        this.balance +=
            profit;

        this.profit +=
            profit;

        this.maxBalance =
            Math.max(
                this.maxBalance,
                this.balance
            );

        this.minBalance =
            Math.min(
                this.minBalance,
                this.balance
            );

        this.maxDrawdown =
            Math.max(
                this.maxDrawdown,
                this.maxBalance -
                    this.balance
            );

        return {
            profit,
            summary:
                this.summary
        };
    }

    reset({
        balance =
            this.initialBalance
    } = {}) {
        if (
            !Number.isFinite(balance) ||
            balance < 0
        ) {
            throw new RangeError(
                "Bankroll balance must be zero or greater."
            );
        }

        this.initialBalance = balance;
        this.balance = balance;
        this.reserved = 0;
        this.profit = 0;
        this.totalWagered = 0;
        this.maxBalance = balance;
        this.minBalance = balance;
        this.maxDrawdown = 0;

        return this;
    }

    validateAmount(amount) {
        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new RangeError(
                "Amount must be greater than zero."
            );
        }
    }

    get available() {
        return Math.max(
            0,
            this.balance -
                this.reserved
        );
    }

    get roi() {
        return this.totalWagered > 0
            ? this.profit /
                this.totalWagered
            : 0;
    }

    get summary() {
        return {
            version:
                BANKROLL_VERSION,

            initialBalance:
                this.initialBalance,

            balance:
                this.balance,

            reserved:
                this.reserved,

            available:
                this.available,

            profit:
                this.profit,

            totalWagered:
                this.totalWagered,

            roi:
                this.roi,

            maxBalance:
                this.maxBalance,

            minBalance:
                this.minBalance,

            maxDrawdown:
                this.maxDrawdown
        };
    }
}
