/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/MetricCollector.js
 */

export const METRIC_COLLECTOR_VERSION = "7.9.0";

export default class MetricCollector {
    collect(context = {}) {
        const metrics = {
            reward:
                context.learning?.lastExperience?.reward ??
                context.learning?.reward ??
                context.metrics?.reward ??
                0,

            assuranceScore:
                context.assurance?.score ??
                context.metrics?.assuranceScore ??
                0,

            confidence:
                context.decision?.confidence ??
                context.metrics?.confidence ??
                0,

            expectedValue:
                context.decision?.expectedValue ??
                context.strategy?.expectedValue ??
                context.metrics?.expectedValue ??
                0,

            executionSuccess:
                context.execution?.success === true
                    ? 1
                    : context.execution?.success === false
                        ? 0
                        : context.metrics?.executionSuccess ?? 0,

            planScore:
                context.planning?.evaluation?.score ??
                context.metrics?.planScore ??
                0,

            risk:
                context.decision?.risk ??
                context.strategy?.risk ??
                context.metrics?.risk ??
                "unavailable"
        };

        return metrics;
    }

    get summary() {
        return {
            version: METRIC_COLLECTOR_VERSION
        };
    }
}
