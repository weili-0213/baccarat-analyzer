/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ExplanationBuilder.js
 */
export const EXPLANATION_BUILDER_VERSION = "7.3.0";
export default class ExplanationBuilder {
    build({ resolution = {}, hypotheses = [], evidence = [] } = {}) {
        const best = resolution.best ?? null;

        if (!best) {
            return {
                summary: "No supported reasoning conclusion.",
                reasons: [],
                confidence: 0
            };
        }

        const hypothesis =
            hypotheses.find(
                item => item.hypothesisId === best.hypothesisId
            ) ?? null;

        const supporting = evidence.filter(
            item =>
                item.candidate === best.candidate &&
                item.direction !== "oppose"
        );

        const opposing = evidence.filter(
            item =>
                item.candidate === best.candidate &&
                item.direction === "oppose"
        );

        return {
            summary: hypothesis
                ? `${hypothesis.statement} (${best.verdict})`
                : `Reasoning result: ${best.verdict}`,
            candidate: best.candidate,
            verdict: best.verdict,
            confidence: best.confidence,
            support: best.support,
            oppose: best.oppose,
            reasons: [
                ...supporting.map(item => `${item.type}: support`),
                ...opposing.map(item => `${item.type}: oppose`)
            ]
        };
    }
    get summary() {
        return { version: EXPLANATION_BUILDER_VERSION };
    }
}
