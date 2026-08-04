/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/CandidateEvaluator.js
 */

export const CANDIDATE_EVALUATOR_VERSION = "7.9.0";

export default class CandidateEvaluator {
    evaluate({
        candidate,
        metrics = {},
        objectives = [],
        constraints = []
    } = {}) {
        const violations = [];

        for (const constraint of constraints) {
            const passed =
                typeof constraint.evaluate === "function"
                    ? Boolean(
                        constraint.evaluate({
                            candidate,
                            metrics
                        })
                    )
                    : true;

            if (!passed) {
                violations.push({
                    name:
                        constraint.name ??
                        "unnamed",
                    reason:
                        constraint.reason ??
                        "Constraint failed."
                });
            }
        }

        let score = 0;
        let totalWeight = 0;

        for (const objective of objectives) {
            const weight =
                Number.isFinite(objective.weight)
                    ? objective.weight
                    : 1;

            const value =
                typeof objective.evaluate === "function"
                    ? objective.evaluate({
                        candidate,
                        metrics
                    })
                    : 0;

            score += value * weight;
            totalWeight += weight;
        }

        const normalized =
            totalWeight > 0
                ? score / totalWeight
                : 0;

        return {
            candidateId:
                candidate.candidateId,
            parameters:
                { ...candidate.parameters },
            score:
                Number.isFinite(normalized)
                    ? normalized
                    : 0,
            passed:
                violations.length === 0,
            violations
        };
    }

    get summary() {
        return {
            version: CANDIDATE_EVALUATOR_VERSION
        };
    }
}
