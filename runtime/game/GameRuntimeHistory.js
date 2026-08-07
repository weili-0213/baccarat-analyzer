/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/GameRuntimeHistory.js
 * Purpose: Stores Game Runtime sync, analysis and settlement records.
 */
export const GAME_RUNTIME_HISTORY_VERSION = "10.3.0";

export default class GameRuntimeHistory {
    constructor({
        limit = 1000
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "GameRuntimeHistory limit must be positive."
            );
        }

        this.limit = limit;
        this.records = [];
    }

    add(record) {
        this.records.push(record);

        if (this.records.length > this.limit) {
            this.records.splice(
                0,
                this.records.length - this.limit
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

    clear() {
        this.records = [];
        return this;
    }

    get summary() {
        return {
            version:
                GAME_RUNTIME_HISTORY_VERSION,
            count:
                this.records.length,
            limit:
                this.limit,
            latest:
                this.latest()
        };
    }
}
