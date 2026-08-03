/**
 * Baccarat Analyzer V5.5
 * runtime/pipeline/PipelineResult.js
 */

export const PIPELINE_RESULT_VERSION = "5.5.0";

export default class PipelineResult {
    constructor({
        success = false,
        aborted = false,
        startedAt = null,
        endedAt = null,
        duration = 0,
        context = null,
        stages = [],
        errors = [],
        warnings = []
    } = {}) {
        this.success = Boolean(success);
        this.aborted = Boolean(aborted);
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.duration = duration;
        this.context = context;
        this.stages = stages;
        this.errors = errors;
        this.warnings = warnings;
    }

    toJSON() {
        return {
            version:
                PIPELINE_RESULT_VERSION,

            success:
                this.success,

            aborted:
                this.aborted,

            startedAt:
                this.startedAt,

            endedAt:
                this.endedAt,

            duration:
                this.duration,

            stages:
                this.stages,

            errors:
                this.errors,

            warnings:
                this.warnings,

            context:
                this.context
                    ?.snapshot
                    ? this.context.snapshot()
                    : this.context
        };
    }

    get summary() {
        return {
            version:
                PIPELINE_RESULT_VERSION,

            success:
                this.success,

            aborted:
                this.aborted,

            stageCount:
                this.stages.length,

            errorCount:
                this.errors.length,

            warningCount:
                this.warnings.length,

            duration:
                this.duration
        };
    }
}
