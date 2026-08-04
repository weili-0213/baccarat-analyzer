/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/EvidenceCollector.js
 */
export const EVIDENCE_COLLECTOR_VERSION = "7.3.0";
export default class EvidenceCollector {
    collect({ context = {}, hypotheses = [], knowledgeResult = null } = {}) {
        const evidence = [];
        const recommendation = context.analysis?.recommendation ?? {};

        if (recommendation.bestBet) {
            evidence.push({
                evidenceId: "analysis-recommendation",
                type: "analysis",
                candidate: recommendation.bestBet,
                direction: "support",
                confidence: recommendation.confidence ?? 0.5,
                detail: "Analyzer recommendation"
            });
        }

        const ranking = Array.isArray(context.analysis?.ranking)
            ? context.analysis.ranking
            : [];

        for (const item of ranking.slice(0, 3)) {
            evidence.push({
                evidenceId: `ranking-${item.bet}`,
                type: "ranking",
                candidate: item.bet,
                direction:
                    Number.isFinite(item.ev) && item.ev >= 0
                        ? "support"
                        : "oppose",
                confidence: Number.isFinite(item.score) ? item.score : 0.5,
                detail: item
            });
        }

        const patterns = context.decision?.patterns ?? [];
        for (const pattern of patterns) {
            evidence.push({
                evidenceId: `pattern-${pattern.type}`,
                type: "pattern",
                candidate: pattern.side ?? null,
                direction: "support",
                confidence: pattern.strength ?? 0.5,
                detail: pattern
            });
        }

        if (knowledgeResult?.candidates) {
            for (const candidate of knowledgeResult.candidates) {
                evidence.push({
                    evidenceId: `knowledge-${evidence.length + 1}`,
                    type: "knowledge",
                    candidate: candidate.value,
                    direction: "support",
                    confidence: candidate.confidence ?? 0.5,
                    detail: candidate
                });
            }
        }

        if (hypotheses.length === 0) {
            evidence.push({
                evidenceId: "no-hypothesis",
                type: "system",
                candidate: null,
                direction: "oppose",
                confidence: 1,
                detail: "No hypothesis available."
            });
        }

        return evidence;
    }
    get summary() {
        return { version: EVIDENCE_COLLECTOR_VERSION };
    }
}
