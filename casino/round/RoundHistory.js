/**
 * Baccarat Analyzer V6.2
 * casino/round/RoundHistory.js
 */

export const ROUND_HISTORY_VERSION = "6.2.0";

export default class RoundHistory {
    constructor({
        limit = 500
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "RoundHistory limit must be positive."
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

    find(roundId) {
        return (
            this.records.find(
                record =>
                    record.roundId === roundId
            ) ??
            null
        );
    }

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        const winners = {
            Player: 0,
            Banker: 0,
            Tie: 0
        };

        for (const record of this.records) {
            const winner =
                record.result?.winner;

            if (winner in winners) {
                winners[winner]++;
            }
        }

        return {
            version:
                ROUND_HISTORY_VERSION,

            limit:
                this.limit,

            count:
                this.records.length,

            winners,

            latest:
                this.latest()
        };
    }
}
