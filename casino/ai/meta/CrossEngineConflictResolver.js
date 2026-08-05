/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/CrossEngineConflictResolver.js
 */

export const CROSS_ENGINE_CONFLICT_RESOLVER_VERSION = "8.8.0";

export default class CrossEngineConflictResolver {
    resolve({
        context = {},
        capabilityResults = [],
        strategySelection = {}
    } = {}) {
        const conflicts = [];

        if (
            context.safety?.safe ===
            false
        ) {
            conflicts.push({
                source:
                    "safety",
                severity:
                    "critical",
                reason:
                    "Safety engine marked the action unsafe."
            });
        }

        if (
            context.ethics?.ethical ===
            false
        ) {
            conflicts.push({
                source:
                    "ethics",
                severity:
                    "high",
                reason:
                    "Ethics engine rejected the action."
            });
        }

        if (
            context.alignment?.aligned ===
            false
        ) {
            conflicts.push({
                source:
                    "alignment",
                severity:
                    "high",
                reason:
                    "Value alignment failed."
            });
        }

        for (const result of capabilityResults) {
            if (
                result.healthy ===
                false
            ) {
                conflicts.push({
                    source:
                        result.capabilityId,
                    severity:
                        result.score < 40
                            ? "high"
                            : "medium",
                    reason:
                        result.reason ??
                        "Capability health check failed."
                });
            }
        }

        return {
            hasConflict:
                conflicts.length > 0,
            conflicts,
            selectedStrategy:
                strategySelection.selected ??
                null
        };
    }

    get summary() {
        return {
            version:
                CROSS_ENGINE_CONFLICT_RESOLVER_VERSION
        };
    }
}
