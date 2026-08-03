/**
 * Baccarat Analyzer V6.8
 * casino/bet/BetHistory.js
 */

export const BET_HISTORY_VERSION = "6.8.0";

export default class BetHistory {
    constructor({
        limit = 1000
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "BetHistory limit must be positive."
            );
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push(record);

        if (
            this.records.length >
            this.limit
        ) {
            this.records.splice(
                0,
                this.records.length -
                    this.limit
            );
        }

        return record;
    }

    latest() {
        return (
            this.records[
                this.records.length - 1
            ] ??
            null
        );
    }

    find(betId) {
        return (
            this.records.find(
                record =>
                    record.betId === betId
            ) ??
            null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        const totals = {
            won: 0,
            lost: 0,
            push: 0,
            cancelled: 0,
            voided: 0
        };

        let totalStake = 0;
        let totalProfit = 0;

        for (const record of this.records) {
            if (
                record.status &&
                record.status in totals
            ) {
                totals[record.status]++;
            }

            totalStake +=
                Number.isFinite(
                    record.amount
                )
                    ? record.amount
                    : 0;

            totalProfit +=
                Number.isFinite(
                    record.profit
                )
                    ? record.profit
                    : 0;
        }

        const settledCount =
            totals.won +
            totals.lost +
            totals.push;

        return {
            version:
                BET_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            totals,

            totalStake,

            totalProfit,

            roi:
                totalStake > 0
                    ? totalProfit /
                        totalStake
                    : 0,

            winRate:
                settledCount > 0
                    ? totals.won /
                        settledCount
                    : 0,

            latest:
                this.latest()
        };
    }
}
