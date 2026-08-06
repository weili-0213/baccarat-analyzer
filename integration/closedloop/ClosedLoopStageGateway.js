/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopStageGateway.js
 * Purpose: Adapts an existing integration stage to a standard closed-loop stage interface.
 */
export const CLOSED_LOOP_STAGE_GATEWAY_VERSION = "10.0.0";

export default class ClosedLoopStageGateway {
    constructor({
        stageId,
        target,
        method
    } = {}) {
        if (!stageId) {
            throw new TypeError(
                "ClosedLoopStageGateway requires stageId."
            );
        }

        if (!target || typeof target[method] !== "function") {
            throw new TypeError(
                `ClosedLoopStageGateway ${stageId} requires target.${method}().`
            );
        }

        this.stageId = stageId;
        this.target = target;
        this.method = method;
    }

    async run(input = {}) {
        return this.target[this.method](input);
    }

    get summary() {
        return {
            version: CLOSED_LOOP_STAGE_GATEWAY_VERSION,
            stageId: this.stageId,
            method: this.method
        };
    }
}
