/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/ImprovementSelector.js
 */

export const IMPROVEMENT_SELECTOR_VERSION = "8.1.0";

export default class ImprovementSelector {
    select(evaluations = []) {
        const ranking =
            [...evaluations]
                .sort(
                    (a, b) =>
                        b.score - a.score
                );

        const selected =
            ranking.find(
                evaluation =>
                    evaluation.improved
            ) ??
            null;

        return {
            ranking,
            selected
        };
    }

    get summary() {
        return {
            version: IMPROVEMENT_SELECTOR_VERSION
        };
    }
}
