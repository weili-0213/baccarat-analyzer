/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/ImprovementSnapshot.js
 */

export const IMPROVEMENT_SNAPSHOT_VERSION = "8.1.0";

export default class ImprovementSnapshot {
    constructor({
        snapshotId,
        parameters = {},
        createdAt = null,
        reason = null
    } = {}) {
        if (
            typeof snapshotId !== "string" ||
            snapshotId.length === 0
        ) {
            throw new TypeError(
                "ImprovementSnapshot snapshotId is required."
            );
        }

        this.version =
            IMPROVEMENT_SNAPSHOT_VERSION;

        this.snapshotId =
            snapshotId;

        this.parameters =
            { ...parameters };

        this.createdAt =
            createdAt;

        this.reason =
            reason;
    }

    toJSON() {
        return {
            version:
                this.version,
            snapshotId:
                this.snapshotId,
            parameters:
                { ...this.parameters },
            createdAt:
                this.createdAt,
            reason:
                this.reason
        };
    }
}
