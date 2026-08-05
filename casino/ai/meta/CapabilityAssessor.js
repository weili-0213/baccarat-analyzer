/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/CapabilityAssessor.js
 */

export const CAPABILITY_ASSESSOR_VERSION = "8.8.0";

export default class CapabilityAssessor {
    async assess({
        capabilities = [],
        context
    } = {}) {
        const results = [];

        for (const capability of capabilities) {
            const evaluation =
                await capability.assess({
                    context
                });

            const score =
                Number.isFinite(
                    evaluation?.score
                )
                    ? Math.max(
                        0,
                        Math.min(
                            100,
                            evaluation.score
                        )
                    )
                    : 0;

            results.push({
                capabilityId:
                    capability.capabilityId,
                score,
                healthy:
                    evaluation?.healthy !==
                    false,
                confidence:
                    Number.isFinite(
                        evaluation?.confidence
                    )
                        ? evaluation.confidence
                        : 1,
                reason:
                    evaluation?.reason ??
                    null,
                weight:
                    capability.weight
            });
        }

        return results;
    }

    get summary() {
        return {
            version:
                CAPABILITY_ASSESSOR_VERSION
        };
    }
}
