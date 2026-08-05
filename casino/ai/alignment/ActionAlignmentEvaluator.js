/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/ActionAlignmentEvaluator.js
 */

export const ACTION_ALIGNMENT_EVALUATOR_VERSION = "8.5.0";

export default class ActionAlignmentEvaluator {
    evaluate({
        actions = [],
        constraints = [],
        context = {}
    } = {}) {
        return actions.map(
            action => {
                const violations = [];

                for (const constraint of constraints) {
                    const passed =
                        typeof constraint.evaluate ===
                            "function"
                            ? Boolean(
                                constraint.evaluate({
                                    action,
                                    context
                                })
                            )
                            : true;

                    if (!passed) {
                        violations.push({
                            constraintId:
                                constraint.constraintId ??
                                constraint.name ??
                                "unnamed",
                            reason:
                                constraint.reason ??
                                "Action violates constraint."
                        });
                    }
                }

                return {
                    actionId:
                        action.actionId ??
                        action.type ??
                        action.action ??
                        "unnamed-action",
                    aligned:
                        violations.length === 0,
                    score:
                        violations.length === 0
                            ? 100
                            : Math.max(
                                0,
                                100 -
                                violations.length *
                                    40
                            ),
                    violations
                };
            }
        );
    }

    get summary() {
        return {
            version:
                ACTION_ALIGNMENT_EVALUATOR_VERSION
        };
    }
}
