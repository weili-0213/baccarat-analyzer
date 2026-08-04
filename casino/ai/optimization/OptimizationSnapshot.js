/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/OptimizationSnapshot.js
 */

export const OPTIMIZATION_SNAPSHOT_VERSION = "7.9.0";

export default class OptimizationSnapshot {
    constructor({
        snapshotId,
        parameters = {},
        reason = null,
        createdAt = null
    } = {}) {
        if (
            typeof snapshotId !== "string" ||
            snapshotId.length === 0
        ) {
            throw new TypeError(
                "OptimizationSnapshot snapshotId is required."
            );
        }

        this.version =
            OPTIMIZATION_SNAPSHOT_VERSION;

        this.snapshotId =
            snapshotId;

        this.parameters = {
            ...parameters
        };

        this.reason =
            reason;

        this.createdAt =
            createdAt;
    }

    toJSON() {
        return {
            version:
                this.version,
            snapshotId:
                this.snapshotId,
            parameters:
                { ...this.parameters },
            reason:
                this.reason,
            createdAt:
                this.createdAt
        };
    }
}
