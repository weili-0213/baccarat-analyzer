/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/MetaSynthesisEngine.js
 */

import {
    MetaDecision
} from "./MetaIntelligenceState.js";

export const META_SYNTHESIS_ENGINE_VERSION = "8.8.0";

export default class MetaSynthesisEngine {
    synthesize({
        capabilityResults = [],
        strategySelection = {},
        resolution = {}
    } = {}) {
        const weightedTotal =
            capabilityResults.reduce(
                (total, result) =>
                    total +
                    result.score *
                    result.weight,
                0
            );

        const totalWeight =
            capabilityResults.reduce(
                (total, result) =>
                    total +
                    result.weight,
                0
            );

        const capabilityScore =
            totalWeight > 0
                ? Math.round(
                    weightedTotal /
                    totalWeight
                )
                : 0;

        const criticalConflict =
            resolution.conflicts
                ?.some(
                    conflict =>
                        conflict.severity ===
                        "critical"
                ) ??
            false;

        let decision =
            MetaDecision.PROCEED;

        if (criticalConflict) {
            decision =
                MetaDecision.HALT;
        } else if (
            resolution.hasConflict ||
            capabilityScore < 70
        ) {
            decision =
                MetaDecision.REVIEW;
        }

        return {
            capabilityScore,
            decision,
            proceed:
                decision ===
                MetaDecision.PROCEED,
            selectedStrategy:
                strategySelection.selected ??
                null,
            conflicts:
                resolution.conflicts ??
                []
        };
    }

    get summary() {
        return {
            version:
                META_SYNTHESIS_ENGINE_VERSION
        };
    }
}
