/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/ConstraintEvaluator.js
 */
export const CONSTRAINT_EVALUATOR_VERSION = "7.4.0";
export default class ConstraintEvaluator {
    evaluate({ context = {}, constraints = [] } = {}) {
        const results = constraints.map(constraint => {
            const passed =
                typeof constraint.evaluate === "function"
                    ? Boolean(constraint.evaluate(context))
                    : true;
            return {
                name: constraint.name ?? "unnamed",
                passed,
                required: constraint.required !== false,
                reason: passed
                    ? null
                    : constraint.reason ?? "Constraint failed."
            };
        });
        const blocking = results.filter(
            result => result.required && !result.passed
        );
        return {
            passed: blocking.length === 0,
            results,
            blocking
        };
    }
    get summary() {
        return { version: CONSTRAINT_EVALUATOR_VERSION };
    }
}
