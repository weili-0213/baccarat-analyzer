/**
 * Baccarat Analyzer V5.5
 * runtime/pipeline/RuntimePipeline.js
 */

import PipelineStage, {
    PipelineStageStatus
} from "./PipelineStage.js";

import PipelineContext
    from "./PipelineContext.js";

import PipelineResult
    from "./PipelineResult.js";

import PipelineHooks
    from "./PipelineHooks.js";

import PipelineHistory
    from "./PipelineHistory.js";

import {
    RuntimeEventType
} from "../events/RuntimeEvents.js";


export const RUNTIME_PIPELINE_VERSION = "5.5.0";


export default class RuntimePipeline {
    constructor({
        eventBus = null,
        clock = () => Date.now(),
        history = null,
        hooks = null,
        stopOnError = true
    } = {}) {
        if (typeof clock !== "function") {
            throw new TypeError(
                "RuntimePipeline clock must be a function."
            );
        }

        this.eventBus = eventBus;
        this.clock = clock;
        this.history =
            history ??
            new PipelineHistory();

        this.hooks =
            hooks ??
            new PipelineHooks();

        this.stopOnError =
            Boolean(stopOnError);

        this.stages = [];
        this.running = false;
        this.aborted = false;
        this.abortReason = null;
        this.executionCount = 0;
        this.failureCount = 0;
        this.lastResult = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "runtime-pipeline"
                }
            ) ??
            null;
    }

    register(stage) {
        if (!(stage instanceof PipelineStage)) {
            stage =
                new PipelineStage(stage);
        }

        if (
            this.stages.some(
                item =>
                    item.name === stage.name
            )
        ) {
            throw new Error(
                `Pipeline stage already exists: ${stage.name}`
            );
        }

        this.stages.push(stage);

        this.stages.sort(
            (a, b) =>
                b.priority -
                a.priority
        );

        return stage;
    }

    unregister(name) {
        const index =
            this.stages.findIndex(
                stage =>
                    stage.name === name
            );

        if (index < 0) {
            return false;
        }

        this.stages.splice(
            index,
            1
        );

        return true;
    }

    getStage(name) {
        return (
            this.stages.find(
                stage =>
                    stage.name === name
            ) ??
            null
        );
    }

    abort(reason = "aborted") {
        this.aborted = true;
        this.abortReason = reason;

        return this;
    }

    async execute(
        input = {},
        runtime = {}
    ) {
        if (this.destroyed) {
            throw new Error(
                "RuntimePipeline has been destroyed."
            );
        }

        if (this.running) {
            throw new Error(
                "RuntimePipeline is already running."
            );
        }

        this.running = true;
        this.aborted = false;
        this.abortReason = null;

        const context =
            input instanceof PipelineContext
                ? input
                : new PipelineContext(
                    input
                );

        const startedAt =
            this.clock();

        const stageRecords = [];
        const errors = [];
        const warnings = [];

        await this.hooks.run(
            "beforePipeline",
            {
                pipeline:
                    this,
                context
            }
        );

        try {
            for (const stage of this.stages) {
                if (this.aborted) {
                    stage.markAborted();

                    stageRecords.push({
                        name:
                            stage.name,
                        status:
                            PipelineStageStatus.ABORTED
                    });

                    break;
                }

                const shouldRun =
                    await stage.canRun(
                        context
                    );

                if (!shouldRun) {
                    stage.markSkipped();

                    const skipped = {
                        name:
                            stage.name,
                        status:
                            PipelineStageStatus.SKIPPED
                    };

                    stageRecords.push(
                        skipped
                    );

                    await this.hooks.run(
                        "onSkip",
                        {
                            pipeline:
                                this,
                            stage,
                            context
                        }
                    );

                    continue;
                }

                await this.hooks.run(
                    "beforeStage",
                    {
                        pipeline:
                            this,
                        stage,
                        context
                    }
                );

                let attempt = 0;
                let completed = false;

                while (
                    attempt <=
                    stage.retry
                ) {
                    attempt++;

                    try {
                        const result =
                            await stage.execute(
                                context,
                                {
                                    ...runtime,
                                    clock:
                                        this.clock
                                }
                            );

                        if (
                            result &&
                            typeof result ===
                                "object" &&
                            result.context
                        ) {
                            context.merge(
                                result.context
                            );
                        }
                        else if (
                            result !==
                                undefined
                        ) {
                            context.set(
                                stage.name,
                                result
                            );
                        }

                        stageRecords.push({
                            name:
                                stage.name,
                            status:
                                PipelineStageStatus.COMPLETED,
                            attempt,
                            duration:
                                stage.lastDuration
                        });

                        await this.hooks.run(
                            "afterStage",
                            {
                                pipeline:
                                    this,
                                stage,
                                context,
                                result
                            }
                        );

                        completed = true;
                        break;
                    }
                    catch (error) {
                        await this.hooks.run(
                            "onError",
                            {
                                pipeline:
                                    this,
                                stage,
                                context,
                                error,
                                attempt
                            }
                        );

                        if (
                            attempt <=
                            stage.retry
                        ) {
                            warnings.push({
                                stage:
                                    stage.name,
                                attempt,
                                type:
                                    "retry",
                                message:
                                    error?.message ??
                                    String(error)
                            });

                            await this.hooks.run(
                                "onRetry",
                                {
                                    pipeline:
                                        this,
                                    stage,
                                    context,
                                    error,
                                    attempt
                                }
                            );

                            continue;
                        }

                        errors.push({
                            stage:
                                stage.name,
                            attempt,
                            message:
                                error?.message ??
                                String(error)
                        });

                        stageRecords.push({
                            name:
                                stage.name,
                            status:
                                PipelineStageStatus.FAILED,
                            attempt,
                            duration:
                                stage.lastDuration,
                            error:
                                error?.message ??
                                String(error)
                        });

                        if (this.stopOnError) {
                            throw error;
                        }
                    }
                    }
                }

                if (
                    !completed &&
                    this.stopOnError
                ) {
                    break;
                }
            }
        }
        catch (error) {
            this.failureCount++;

            this.emit(
                RuntimeEventType.ERROR,
                {
                    phase:
                        "pipeline",
                    message:
                        error?.message ??
                        String(error)
                }
            );
        }
        finally {
            const endedAt =
                this.clock();

            const result =
                new PipelineResult({
                    success:
                        errors.length === 0 &&
                        !this.aborted,

                    aborted:
                        this.aborted,

                    startedAt,

                    endedAt,

                    duration:
                        Math.max(
                            0,
                            endedAt - startedAt
                        ),

                    context,

                    stages:
                        stageRecords,

                    errors,

                    warnings
                });

            this.executionCount++;
            this.lastResult = result;

            this.history.add(
                result.toJSON()
            );

            if (this.aborted) {
                await this.hooks.run(
                    "onAbort",
                    {
                        pipeline:
                            this,
                        context,
                        reason:
                            this.abortReason
                    }
                );
            }

            await this.hooks.run(
                "afterPipeline",
                {
                    pipeline:
                        this,
                    context,
                    result
                }
            );

            this.running = false;

            return result;
        }
    }

    async rollback(
        context =
            this.lastResult
                ?.context ??
            null
    ) {
        if (!context) {
            return [];
        }

        const rolledBack = [];

        for (
            const stage of
            [...this.stages].reverse()
        ) {
            const result =
                await stage.rollback(
                    context,
                    {
                        clock:
                            this.clock
                    }
                );

            if (result !== null) {
                rolledBack.push({
                    stage:
                        stage.name,
                    result
                });
            }
        }

        return rolledBack;
    }

    clearStages() {
        this.stages = [];

        return this;
    }

    destroy() {
        for (const stage of this.stages) {
            stage.destroy();
        }

        this.clearStages();
        this.history.clear();
        this.hooks.clear();

        this.lastResult = null;
        this.running = false;
        this.destroyed = true;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_PIPELINE_VERSION,

            running:
                this.running,

            aborted:
                this.aborted,

            stageCount:
                this.stages.length,

            executionCount:
                this.executionCount,

            failureCount:
                this.failureCount,

            destroyed:
                this.destroyed,

            lastResult:
                this.lastResult
                    ?.summary ??
                null,

            history:
                this.history.summary
        };
    }
}
