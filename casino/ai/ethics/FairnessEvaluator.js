/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/FairnessEvaluator.js
 */

export const FAIRNESS_EVALUATOR_VERSION = "8.6.0";

export default class FairnessEvaluator {
    evaluate({
        stakeholders = [],
        action = {}
    } = {}) {
        const impacts =
            stakeholders.map(
                stakeholder => ({
                    stakeholderId:
                        stakeholder.stakeholderId ??
                        stakeholder.id ??
                        "unknown",
                    impact:
                        Number.isFinite(
                            stakeholder.impact
                        )
                            ? stakeholder.impact
                            : 0
                })
            );

        const values =
            impacts.map(
                item =>
                    item.impact
            );

        const max =
            values.length > 0
                ? Math.max(...values)
                : 0;

        const min =
            values.length > 0
                ? Math.min(...values)
                : 0;

        const disparity =
            max - min;

        let score =
            Math.max(
                0,
                100 -
                disparity *
                    20
            );

        if (
            action.preferential ===
            true
        ) {
            score =
                Math.max(
                    0,
                    score - 30
                );
        }

        return {
            score:
                Math.round(score),
            fair:
                score >= 70,
            disparity,
            impacts
        };
    }

    get summary() {
        return {
            version:
                FAIRNESS_EVALUATOR_VERSION
        };
    }
}
