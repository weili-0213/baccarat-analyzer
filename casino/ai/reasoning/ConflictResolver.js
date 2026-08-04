/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ConflictResolver.js
 */
import { ReasoningVerdict } from "./ReasoningState.js";
export const CONFLICT_RESOLVER_VERSION = "7.3.0";
export default class ConflictResolver {
    resolve({ hypotheses = [], evidence = [] } = {}) {
        const results = [];

        for (const hypothesis of hypotheses) {
            let support = 0;
            let oppose = 0;

            const matchedEvidence = evidence.filter(
                item =>
                    item.candidate === hypothesis.candidate ||
                    item.candidate === null
            );

            for (const item of matchedEvidence) {
                const confidence = Number.isFinite(item.confidence)
                    ? item.confidence
                    : 0.5;
                if (item.direction === "oppose") {
                    oppose += confidence;
                } else {
                    support += confidence;
                }
            }

            support += Number.isFinite(hypothesis.confidence)
                ? hypothesis.confidence
                : 0;

            let verdict = ReasoningVerdict.UNCERTAIN;
            if (support > oppose) {
                verdict = ReasoningVerdict.SUPPORT;
            } else if (oppose > support) {
                verdict = ReasoningVerdict.OPPOSE;
            }

            const total = support + oppose;

            results.push({
                hypothesisId: hypothesis.hypothesisId,
                candidate: hypothesis.candidate,
                verdict,
                support,
                oppose,
                confidence:
                    total > 0
                        ? Math.abs(support - oppose) / total
                        : 0,
                evidenceCount: matchedEvidence.length
            });
        }

        results.sort((a, b) => b.confidence - a.confidence);

        return {
            results,
            best: results[0] ?? null
        };
    }
    get summary() {
        return { version: CONFLICT_RESOLVER_VERSION };
    }
}
