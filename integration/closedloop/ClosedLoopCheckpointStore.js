/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopCheckpointStore.js
 * Purpose: Stores pipeline checkpoints for recovery and diagnostics.
 */
export const CLOSED_LOOP_CHECKPOINT_STORE_VERSION = "10.0.0";

export default class ClosedLoopCheckpointStore {
    constructor({
        limit = 200
    } = {}) {
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError(
                "ClosedLoopCheckpointStore limit must be positive."
            );
        }

        this.limit = limit;
        this.checkpoints = [];
    }

    save(checkpoint) {
        this.checkpoints.push(checkpoint);

        if (this.checkpoints.length > this.limit) {
            this.checkpoints.splice(
                0,
                this.checkpoints.length - this.limit
            );
        }

        return checkpoint;
    }

    latest() {
        return (
            this.checkpoints[
                this.checkpoints.length - 1
            ] ??
            null
        );
    }

    clear() {
        this.checkpoints = [];
        return this;
    }

    get summary() {
        return {
            version:
                CLOSED_LOOP_CHECKPOINT_STORE_VERSION,
            limit: this.limit,
            count: this.checkpoints.length,
            latest: this.latest()
        };
    }
}
