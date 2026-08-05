/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/GoalAlignmentEvaluator.js
 */

export const GOAL_ALIGNMENT_EVALUATOR_VERSION = "8.5.0";

export default class GoalAlignmentEvaluator {
    evaluate({
        goals = [],
        values = [],
        context = {}
    } = {}) {
        const results = [];

        for (const goal of goals) {
            let score = 0;
            let totalWeight = 0;
            const violations = [];

            for (const value of values) {
                const evaluation =
                    value.evaluate({
                        goal,
                        context
                    });

                const normalized =
                    Number.isFinite(
                        evaluation?.score
                    )
                        ? Math.max(
                            0,
                            Math.min(
                                100,
                                evaluation.score
                            )
                        )
                        : evaluation?.aligned === false
                            ? 0
                            : 100;

                score +=
                    normalized *
                    value.weight;

                totalWeight +=
                    value.weight;

                if (
                    evaluation?.aligned ===
                    false
                ) {
                    violations.push({
                        valueId:
                            value.valueId,
                        reason:
                            evaluation.reason ??
                            "Goal violates value."
                    });
                }
            }

            results.push({
                goalId:
                    goal.goalId ??
                    goal.name ??
                    "unnamed-goal",
                score:
                    totalWeight > 0
                        ? Math.round(
                            score /
                            totalWeight
                        )
                        : 0,
                aligned:
                    violations.length === 0,
                violations
            });
        }

        return results;
    }

    get summary() {
        return {
            version:
                GOAL_ALIGNMENT_EVALUATOR_VERSION
        };
    }
}
