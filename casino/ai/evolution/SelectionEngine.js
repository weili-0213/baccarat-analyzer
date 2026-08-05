/**
 * Baccarat Analyzer V8.2
 * casino/ai/evolution/SelectionEngine.js
 */

export const SELECTION_ENGINE_VERSION = "8.2.0";

export default class SelectionEngine {
    select({
        population = [],
        eliteCount = 1,
        parentCount = 2
    } = {}) {
        const ranking =
            [...population]
                .sort(
                    (a, b) =>
                        (
                            b.fitness ??
                            -Infinity
                        ) -
                        (
                            a.fitness ??
                            -Infinity
                        )
                );

        return {
            ranking,
            elites:
                ranking.slice(
                    0,
                    Math.max(
                        0,
                        eliteCount
                    )
                ),
            parents:
                ranking.slice(
                    0,
                    Math.max(
                        0,
                        parentCount
                    )
                )
        };
    }

    get summary() {
        return {
            version:
                SELECTION_ENGINE_VERSION
        };
    }
}
