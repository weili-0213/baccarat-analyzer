/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/EthicsConflictResolver.js
 */

export const ETHICS_CONFLICT_RESOLVER_VERSION = "8.6.0";

export default class EthicsConflictResolver {
    resolve({
        principleResults = [],
        domainResults = {}
    } = {}) {
        const conflicts = [];

        for (const result of principleResults) {
            if (!result.passed) {
                conflicts.push({
                    source:
                        "principle",
                    id:
                        result.principleId,
                    reason:
                        result.reason ??
                        "Ethical principle failed."
                });
            }
        }

        for (
            const [
                domain,
                result
            ] of
            Object.entries(
                domainResults
            )
        ) {
            const passed =
                result.safe ??
                result.fair ??
                result.valid ??
                result.proportionate ??
                true;

            if (!passed) {
                conflicts.push({
                    source:
                        domain,
                    id:
                        domain,
                    reason:
                        result.reason ??
                        result.concerns
                            ?.join(" ") ??
                        `${domain} evaluation failed.`
                });
            }
        }

        return {
            hasConflict:
                conflicts.length > 0,
            conflicts,
            recommendation:
                conflicts.length === 0
                    ? "approve"
                    : "review"
        };
    }

    get summary() {
        return {
            version:
                ETHICS_CONFLICT_RESOLVER_VERSION
        };
    }
}
