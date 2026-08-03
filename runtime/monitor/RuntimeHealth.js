/**
 * Baccarat Analyzer V5.6
 * runtime/monitor/RuntimeHealth.js
 */

export const RUNTIME_HEALTH_VERSION = "5.6.0";

export const RuntimeHealthStatus = Object.freeze({
    HEALTHY: "healthy",
    DEGRADED: "degraded",
    CRITICAL: "critical"
});

export default class RuntimeHealth {
    constructor({
        warningPenalty = 3,
        errorPenalty = 12,
        queuePenaltyThreshold = 20,
        slowPipelineThreshold = 1000
    } = {}) {
        this.warningPenalty =
            warningPenalty;
        this.errorPenalty =
            errorPenalty;
        this.queuePenaltyThreshold =
            queuePenaltyThreshold;
        this.slowPipelineThreshold =
            slowPipelineThreshold;
    }

    evaluate(snapshot = {}) {
        const warnings =
            snapshot.warnings ?? 0;

        const errors =
            snapshot.errors ?? 0;

        const queueLength =
            snapshot.scheduler
                ?.queueLength ??
            0;

        const pipelineAverage =
            snapshot.pipeline
                ?.averageDuration ??
            0;

        let score = 100;

        score -=
            warnings *
            this.warningPenalty;

        score -=
            errors *
            this.errorPenalty;

        if (
            queueLength >
            this.queuePenaltyThreshold
        ) {
            score -=
                Math.min(
                    25,
                    queueLength -
                    this.queuePenaltyThreshold
                );
        }

        if (
            pipelineAverage >
            this.slowPipelineThreshold
        ) {
            score -= 15;
        }

        score =
            Math.max(
                0,
                Math.min(
                    100,
                    Math.round(score)
                )
            );

        let status =
            RuntimeHealthStatus.HEALTHY;

        if (score < 50) {
            status =
                RuntimeHealthStatus.CRITICAL;
        }
        else if (score < 80) {
            status =
                RuntimeHealthStatus.DEGRADED;
        }

        return {
            version:
                RUNTIME_HEALTH_VERSION,

            score,
            status,

            reasons: {
                warnings,
                errors,
                queueLength,
                pipelineAverage
            }
        };
    }

    get summary() {
        return {
            version:
                RUNTIME_HEALTH_VERSION,

            warningPenalty:
                this.warningPenalty,

            errorPenalty:
                this.errorPenalty,

            queuePenaltyThreshold:
                this.queuePenaltyThreshold,

            slowPipelineThreshold:
                this.slowPipelineThreshold
        };
    }
}
