/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/AlignmentScorer.js
 */

import {
    AlignmentLevel
} from "./AlignmentState.js";

export const ALIGNMENT_SCORER_VERSION = "8.5.0";

export default class AlignmentScorer {
    score({
        goalResults = [],
        actionResults = []
    } = {}) {
        const items = [
            ...goalResults,
            ...actionResults
        ];

        const score =
            items.length > 0
                ? Math.round(
                    items.reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            (
                                item.score ??
                                0
                            ),
                        0
                    ) /
                    items.length
                )
                : 0;

        let level =
            AlignmentLevel.MISALIGNED;

        if (score >= 85) {
            level =
                AlignmentLevel.ALIGNED;
        } else if (score >= 60) {
            level =
                AlignmentLevel.PARTIAL;
        }

        return {
            score,
            level,
            aligned:
                level ===
                AlignmentLevel.ALIGNED
        };
    }

    get summary() {
        return {
            version:
                ALIGNMENT_SCORER_VERSION
        };
    }
}
