/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/EthicsScorer.js
 */

import {
    EthicsDecision
} from "./EthicsState.js";

export const ETHICS_SCORER_VERSION = "8.6.0";

export default class EthicsScorer {
    score({
        principleResults = [],
        domainResults = {}
    } = {}) {
        const scores = [
            ...principleResults.map(
                result =>
                    result.score ??
                    0
            ),
            ...Object.values(
                domainResults
            ).map(
                result =>
                    result.score ??
                    0
            )
        ];

        const score =
            scores.length > 0
                ? Math.round(
                    scores.reduce(
                        (
                            total,
                            value
                        ) =>
                            total +
                            value,
                        0
                    ) /
                    scores.length
                )
                : 0;

        let decision =
            EthicsDecision.REJECT;

        if (score >= 85) {
            decision =
                EthicsDecision.APPROVE;
        } else if (score >= 60) {
            decision =
                EthicsDecision.REVIEW;
        }

        return {
            score,
            decision,
            ethical:
                decision ===
                EthicsDecision.APPROVE
        };
    }

    get summary() {
        return {
            version:
                ETHICS_SCORER_VERSION
        };
    }
}
