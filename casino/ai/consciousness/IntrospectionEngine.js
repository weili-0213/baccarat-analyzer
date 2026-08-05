/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/IntrospectionEngine.js
 */

export const INTROSPECTION_ENGINE_VERSION = "8.4.0";

export default class IntrospectionEngine {
    inspect(context = {}) {
        const observations = [];
        const uncertainties = [];

        const confidence =
            context.decision?.confidence ??
            null;

        const assuranceScore =
            context.assurance?.score ??
            null;

        const blocked =
            context.governance?.blocked ??
            false;

        const executionSuccess =
            context.execution?.success ??
            null;

        if (Number.isFinite(confidence)) {
            observations.push({
                key:
                    "decision-confidence",
                value:
                    confidence
            });

            if (confidence < 0.5) {
                uncertainties.push({
                    key:
                        "decision-confidence",
                    reason:
                        "Decision confidence is low."
                });
            }
        }

        if (Number.isFinite(assuranceScore)) {
            observations.push({
                key:
                    "assurance-score",
                value:
                    assuranceScore
            });

            if (assuranceScore < 85) {
                uncertainties.push({
                    key:
                        "assurance-score",
                    reason:
                        "Assurance score is below preferred threshold."
                });
            }
        }

        if (blocked) {
            observations.push({
                key:
                    "governance-block",
                value:
                    true
            });
        }

        if (executionSuccess !== null) {
            observations.push({
                key:
                    "execution-success",
                value:
                    executionSuccess
            });
        }

        return {
            observations,
            uncertainties,
            stable:
                uncertainties.length === 0 &&
                !blocked
        };
    }

    get summary() {
        return {
            version:
                INTROSPECTION_ENGINE_VERSION
        };
    }
}
