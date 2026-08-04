/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/OptimizationSelector.js
 */

export const OPTIMIZATION_SELECTOR_VERSION = "7.9.0";

export default class OptimizationSelector {
    select(evaluations = []) {
        const eligible =
            evaluations.filter(
                item =>
                    item.passed
            );

        const ranking =
            [...eligible]
                .sort(
                    (a, b) =>
                        b.score - a.score
                );

        return {
            ranking,
            selected:
                ranking[0] ??
                null
        };
    }

    get summary() {
        return {
            version: OPTIMIZATION_SELECTOR_VERSION
        };
    }
}
