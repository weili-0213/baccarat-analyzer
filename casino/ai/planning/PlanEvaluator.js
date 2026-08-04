/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/PlanEvaluator.js
 */
export const PLAN_EVALUATOR_VERSION = "7.4.0";
export default class PlanEvaluator {
    evaluate({ plan, context = {} } = {}) {
        const confidence =
            context.decision?.confidence ??
            context.reasoning?.explanation?.confidence ??
            0;
        const expectedValue =
            context.decision?.expectedValue ??
            context.strategy?.expectedValue ??
            0;
        const risk =
            context.decision?.risk ??
            context.strategy?.risk ??
            "unavailable";

        const riskPenalty =
            risk === "high"
                ? 25
                : risk === "medium"
                    ? 10
                    : 0;

        const stepPenalty = Math.max(0, plan.steps.length - 4) * 2;

        const score = Math.max(
            0,
            Math.min(
                100,
                confidence * 60 +
                Math.max(-20, Math.min(20, expectedValue * 1000)) +
                20 -
                riskPenalty -
                stepPenalty
            )
        );

        return {
            score: Math.round(score),
            confidence,
            expectedValue,
            risk,
            acceptable: score >= 50 && !plan.isBlocked
        };
    }
    get summary() {
        return { version: PLAN_EVALUATOR_VERSION };
    }
}
