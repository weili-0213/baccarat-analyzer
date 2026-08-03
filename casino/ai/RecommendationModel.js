/**
 * Baccarat Analyzer V7.0
 * casino/ai/RecommendationModel.js
 */

import {
    AIAction
} from "./AIState.js";


export const RECOMMENDATION_MODEL_VERSION = "7.0.0";


export default class RecommendationModel {
    constructor({
        minimumConfidence = 0.6,
        minimumEV = 0,
        waitConfidence = 0.5
    } = {}) {
        this.minimumConfidence =
            minimumConfidence;

        this.minimumEV =
            minimumEV;

        this.waitConfidence =
            waitConfidence;
    }

    build({
        fusedProbability = {},
        analysis = {},
        trend = {},
        patterns = []
    } = {}) {
        const ordered =
            Object.entries(
                fusedProbability
            )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b[1] -
                        a[1]
                );

        const [
            bestBet,
            confidence
        ] =
            ordered[0] ??
            [
                null,
                0
            ];

        const rankingItem =
            Array.isArray(
                analysis.ranking
            )
                ? analysis.ranking.find(
                    item =>
                        item.bet ===
                        bestBet
                )
                : null;

        const expectedValue =
            analysis.ev?.[bestBet] ??
            rankingItem?.ev ??
            analysis.recommendation
                ?.expectedValue ??
            analysis.recommendation
                ?.ev ??
            null;

        const kelly =
            analysis.kelly?.[bestBet] ??
            analysis.recommendation
                ?.kelly ??
            null;

        const risk =
            analysis.risk?.level ??
            analysis.recommendation
                ?.risk ??
            analysis.risk ??
            null;

        const reasons = [];

        if (
            trend.trend ===
            bestBet
        ) {
            reasons.push(
                "trend-support"
            );
        }

        if (
            patterns.some(
                pattern =>
                    pattern.side ===
                    bestBet
            )
        ) {
            reasons.push(
                "pattern-support"
            );
        }

        if (
            Number.isFinite(
                expectedValue
            ) &&
            expectedValue >
                this.minimumEV
        ) {
            reasons.push(
                "positive-ev"
            );
        }

        if (
            Number.isFinite(kelly) &&
            kelly > 0
        ) {
            reasons.push(
                "kelly-positive"
            );
        }

        let action =
            AIAction.SKIP;

        if (
            confidence >=
                this.minimumConfidence &&
            Number.isFinite(
                expectedValue
            ) &&
            expectedValue >
                this.minimumEV
        ) {
            action =
                AIAction.RECOMMEND;
        }
        else if (
            confidence >=
                this.waitConfidence
        ) {
            action =
                AIAction.WAIT;
        }

        return {
            action,

            bestBet:
                action ===
                    AIAction.RECOMMEND
                    ? bestBet
                    : null,

            candidateBet:
                bestBet,

            confidence,

            expectedValue,
            kelly,
            risk,
            reasons
        };
    }

    get summary() {
        return {
            version:
                RECOMMENDATION_MODEL_VERSION,

            minimumConfidence:
                this.minimumConfidence,

            minimumEV:
                this.minimumEV,

            waitConfidence:
                this.waitConfidence
        };
    }
}
