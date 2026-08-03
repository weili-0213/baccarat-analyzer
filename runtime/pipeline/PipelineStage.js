/**
 * Baccarat Analyzer V5.5
 * runtime/pipeline/PipelineStage.js
 */

export const PIPELINE_STAGE_VERSION = "5.5.0";

export const PipelineStageStatus = Object.freeze({
    IDLE: "idle",
    RUNNING: "running",
    COMPLETED: "completed",
    SKIPPED: "skipped",
    FAILED: "failed",
    ABORTED: "aborted"
});

export default class PipelineStage {
    constructor({
        name,
        execute,
        enabled = true,
        priority = 50,
        timeout = 0,
        shouldRun = null,
        rollback = null,
        retry = 0
    } = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "PipelineStage requires a name."
            );
        }

        if (typeof execute !== "function") {
            throw new TypeError(
                "PipelineStage requires execute()."
            );
        }

        if (
            !Number.isFinite(priority)
        ) {
            throw new TypeError(
                "PipelineStage priority must be finite."
            );
        }

        if (
            !Number.isFinite(timeout) ||
            timeout < 0
        ) {
            throw new RangeError(
                "PipelineStage timeout must be zero or greater."
            );
        }

        if (
            !Number.isInteger(retry) ||
            retry < 0
        ) {
            throw new RangeError(
                "PipelineStage retry must be zero or greater."
            );
        }

        this.name = name;
        this.executeHandler = execute;
        this.enabled = Boolean(enabled);
        this.priority = priority;
        this.timeout = timeout;
        this.shouldRun = shouldRun;
        this.rollbackHandler = rollback;
        this.retry = retry;

        this.status =
            PipelineStageStatus.IDLE;

        this.executionCount = 0;
        this.failureCount = 0;
        this.skipCount = 0;
        this.lastDuration = 0;
        this.lastError = null;
        this.lastResult = null;
    }

    async canRun(context) {
        if (!this.enabled) {
            return false;
        }

        if (
            typeof this.shouldRun ===
                "function"
        ) {
            return Boolean(
                await this.shouldRun(context)
            );
        }

        return true;
    }

    async execute(
        context,
        runtime = {}
    ) {
        this.status =
            PipelineStageStatus.RUNNING;

        const startedAt =
            runtime.clock?.() ??
            Date.now();

        try {
            let result;

            if (this.timeout > 0) {
                result =
                    await Promise.race([
                        this.executeHandler(
                            context,
                            runtime
                        ),

                        new Promise(
                            (_, reject) => {
                                runtime
                                    .scheduler
                                    ?.setTimeout
                                    ? runtime.scheduler
                                        .setTimeout(
                                            () => {
                                                reject(
                                                    new Error(
                                                        `Pipeline stage timeout: ${this.name}`
                                                    )
                                                );
                                            },
                                            this.timeout
                                        )
                                    : setTimeout(
                                        () => {
                                            reject(
                                                new Error(
                                                    `Pipeline stage timeout: ${this.name}`
                                                )
                                            );
                                        },
                                        this.timeout
                                    );
                            }
                        )
                    ]);
            }
            else {
                result =
                    await this.executeHandler(
                        context,
                        runtime
                    );
            }

            this.status =
                PipelineStageStatus.COMPLETED;

            this.executionCount++;
            this.lastResult = result;
            this.lastError = null;

            return result;
        }
        catch (error) {
            this.status =
                PipelineStageStatus.FAILED;

            this.failureCount++;
            this.lastError = error;

            throw error;
        }
        finally {
            const endedAt =
                runtime.clock?.() ??
                Date.now();

            this.lastDuration =
                Math.max(
                    0,
                    endedAt - startedAt
                );
        }
    }

    markSkipped() {
        this.status =
            PipelineStageStatus.SKIPPED;

        this.skipCount++;

        return this;
    }

    markAborted() {
        this.status =
            PipelineStageStatus.ABORTED;

        return this;
    }

    async rollback(
        context,
        runtime = {}
    ) {
        if (
            typeof this.rollbackHandler !==
                "function"
        ) {
            return null;
        }

        return this.rollbackHandler(
            context,
            runtime
        );
    }

    reset() {
        this.status =
            PipelineStageStatus.IDLE;

        this.lastError = null;
        this.lastResult = null;
        this.lastDuration = 0;

        return this;
    }

    destroy() {
        this.reset();
        this.executeHandler = null;
        this.shouldRun = null;
        this.rollbackHandler = null;

        return this;
    }

    get summary() {
        return {
            version:
                PIPELINE_STAGE_VERSION,

            name:
                this.name,

            enabled:
                this.enabled,

            priority:
                this.priority,

            timeout:
                this.timeout,

            retry:
                this.retry,

            status:
                this.status,

            executionCount:
                this.executionCount,

            failureCount:
                this.failureCount,

            skipCount:
                this.skipCount,

            lastDuration:
                this.lastDuration,

            lastError:
                this.lastError
                    ?.message ??
                null
        };
    }
}
