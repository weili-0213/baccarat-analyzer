/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/ImprovementEvaluator.js
 */

export const IMPROVEMENT_EVALUATOR_VERSION = "8.1.0";

export default class ImprovementEvaluator {
    evaluate({
        goal,
        baseline = {},
        result
    } = {}) {
        if (!goal || !result) {
            throw new TypeError(
                "ImprovementEvaluator requires goal and result."
            );
        }

        const metric =
            goal.targetMetric;

        const before =
            baseline[metric] ??
            0;

        const after =
            result.output?.metrics?.[metric] ??
            before;

        const delta =
            after - before;

        const improved =
            goal.direction === "decrease"
                ? delta < 0
                : delta > 0;

        return {
            experimentId:
                result.experimentId,
            metric,
            before,
            after,
            delta,
            improved,
            score:
                improved
                    ? Math.abs(delta)
                    : -Math.abs(delta)
        };
    }

    get summary() {
        return {
            version: IMPROVEMENT_EVALUATOR_VERSION
        };
    }
}
