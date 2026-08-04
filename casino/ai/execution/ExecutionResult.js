/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/ExecutionResult.js
 */

export const EXECUTION_RESULT_VERSION = "7.5.0";

export default class ExecutionResult {
    constructor({
        executionId,
        planId = null,
        status,
        steps = [],
        startedAt = null,
        completedAt = null,
        error = null,
        metadata = {}
    } = {}) {
        this.version = EXECUTION_RESULT_VERSION;
        this.executionId = executionId;
        this.planId = planId;
        this.status = status;
        this.steps = [...steps];
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.error = error;
        this.metadata = { ...metadata };
    }

    get success() {
        return this.status === "success";
    }

    toJSON() {
        return {
            version: this.version,
            executionId: this.executionId,
            planId: this.planId,
            status: this.status,
            steps: this.steps.map(step => ({ ...step })),
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            error: this.error,
            metadata: { ...this.metadata }
        };
    }
}
