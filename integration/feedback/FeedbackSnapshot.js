/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/FeedbackSnapshot.js
 * Purpose: Represents one immutable closed-loop feedback snapshot.
 */
export const FEEDBACK_SNAPSHOT_VERSION = "9.9.0";

export default class FeedbackSnapshot {
    constructor({
        snapshotId,
        executionFeedback,
        performance,
        routed,
        calibrations,
        action,
        createdAt = Date.now()
    } = {}) {
        if (!snapshotId) {
            throw new TypeError(
                "FeedbackSnapshot requires snapshotId."
            );
        }

        this.version = FEEDBACK_SNAPSHOT_VERSION;
        this.snapshotId = snapshotId;
        this.executionFeedback = executionFeedback;
        this.performance = performance;
        this.routed = routed;
        this.calibrations = calibrations;
        this.action = action;
        this.createdAt = createdAt;

        Object.freeze(this);
    }
}
