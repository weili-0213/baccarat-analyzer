/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/HypothesisBuilder.js
 */
export const HYPOTHESIS_BUILDER_VERSION = "7.3.0";
export default class HypothesisBuilder {
    build({ context = {}, knowledgeResult = null } = {}) {
        const hypotheses = [];
        const candidate =
            context.decision?.bestBet ??
            context.decision?.candidateBet ??
            context.analysis?.recommendation?.bestBet ??
            knowledgeResult?.best?.value ??
            null;

        if (candidate) {
            hypotheses.push({
                hypothesisId: "primary",
                statement: `Recommend ${candidate}`,
                candidate,
                confidence:
                    context.decision?.confidence ??
                    context.analysis?.recommendation?.confidence ??
                    0.5,
                source: "decision"
            });
        }

        const trend =
            context.decision?.trend?.trend ??
            context.analysis?.trend?.trend ??
            null;

        if (trend) {
            hypotheses.push({
                hypothesisId: "trend",
                statement: `Trend supports ${trend}`,
                candidate: trend,
                confidence:
                    context.decision?.trend?.confidence ??
                    context.analysis?.trend?.confidence ??
                    0.5,
                source: "trend"
            });
        }

        if (knowledgeResult?.best) {
            hypotheses.push({
                hypothesisId: "knowledge",
                statement: "Knowledge inference candidate",
                candidate: knowledgeResult.best.value,
                confidence: Math.min(1, knowledgeResult.best.score),
                source: "knowledge"
            });
        }

        return hypotheses;
    }
    get summary() {
        return { version: HYPOTHESIS_BUILDER_VERSION };
    }
}
