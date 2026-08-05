/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/HarmEvaluator.js
 */

export const HARM_EVALUATOR_VERSION = "8.6.0";

export default class HarmEvaluator {
    evaluate({
        action = {},
        context = {}
    } = {}) {
        const risk =
            action.risk ??
            context.decision?.risk ??
            "unknown";

        const irreversible =
            Boolean(
                action.irreversible
            );

        const financialImpact =
            Number.isFinite(
                action.financialImpact
            )
                ? Math.abs(
                    action.financialImpact
                )
                : 0;

        let score = 100;
        const concerns = [];

        if (risk === "high") {
            score -= 50;
            concerns.push(
                "High-risk action detected."
            );
        } else if (risk === "medium") {
            score -= 20;
        }

        if (irreversible) {
            score -= 20;
            concerns.push(
                "Action is irreversible."
            );
        }

        if (financialImpact > 1000) {
            score -= 20;
            concerns.push(
                "Financial impact exceeds preferred threshold."
            );
        }

        score = Math.max(
            0,
            score
        );

        return {
            score,
            safe:
                score >= 70,
            concerns
        };
    }

    get summary() {
        return {
            version:
                HARM_EVALUATOR_VERSION
        };
    }
}
