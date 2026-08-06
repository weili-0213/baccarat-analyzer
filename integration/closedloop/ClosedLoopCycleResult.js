/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopCycleResult.js
 * Purpose: Represents one immutable closed-loop intelligence cycle result.
 */
export const CLOSED_LOOP_CYCLE_RESULT_VERSION = "10.0.0";

export default class ClosedLoopCycleResult {
    constructor({
        cycleId,
        action,
        outputs,
        context,
        completedStages,
        skippedStages,
        startedAt,
        completedAt
    } = {}) {
        if (!cycleId) {
            throw new TypeError(
                "ClosedLoopCycleResult requires cycleId."
            );
        }

        this.version =
            CLOSED_LOOP_CYCLE_RESULT_VERSION;

        this.cycleId = cycleId;
        this.action = action;
        this.outputs = outputs;
        this.context = context;
        this.completedStages = [
            ...(completedStages ?? [])
        ];
        this.skippedStages = [
            ...(skippedStages ?? [])
        ];
        this.startedAt = startedAt;
        this.completedAt = completedAt;

        Object.freeze(this.completedStages);
        Object.freeze(this.skippedStages);
        Object.freeze(this);
    }
}
