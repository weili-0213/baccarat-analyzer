/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/AssuranceScorer.js
 */

import {
    AssuranceLevel
} from "./AssuranceState.js";

export const ASSURANCE_SCORER_VERSION = "7.8.0";

export default class AssuranceScorer {
    score(results = []) {
        let weightedScore = 0;
        let totalWeight = 0;

        for (const result of results) {
            const weight =
                Number.isFinite(result.weight)
                    ? result.weight
                    : 1;

            weightedScore +=
                result.score * weight;

            totalWeight +=
                weight;
        }

        const score =
            totalWeight > 0
                ? Math.round(
                    weightedScore /
                    totalWeight
                )
                : 0;

        const failed =
            results.some(
                result =>
                    result.passed === false &&
                    result.score < 50
            );

        let level =
            AssuranceLevel.PASS;

        if (failed || score < 60) {
            level =
                AssuranceLevel.FAIL;
        } else if (score < 85) {
            level =
                AssuranceLevel.WARN;
        }

        return {
            score,
            level,
            passed:
                level !==
                AssuranceLevel.FAIL
        };
    }

    get summary() {
        return {
            version: ASSURANCE_SCORER_VERSION
        };
    }
}
