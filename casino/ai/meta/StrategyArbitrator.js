/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/StrategyArbitrator.js
 */

export const STRATEGY_ARBITRATOR_VERSION = "8.8.0";

export default class StrategyArbitrator {
    select(strategies = []) {
        const ranking =
            [...strategies]
                .map(
                    strategy => ({
                        ...strategy,
                        score:
                            Number.isFinite(
                                strategy.score
                            )
                                ? strategy.score
                                : 0,
                        confidence:
                            Number.isFinite(
                                strategy.confidence
                            )
                                ? strategy.confidence
                                : 1,
                        weight:
                            Number.isFinite(
                                strategy.weight
                            )
                                ? strategy.weight
                                : 1
                    })
                )
                .map(
                    strategy => ({
                        ...strategy,
                        metaScore:
                            strategy.score *
                            strategy.confidence *
                            strategy.weight
                    })
                )
                .sort(
                    (a, b) =>
                        b.metaScore -
                        a.metaScore
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
            version:
                STRATEGY_ARBITRATOR_VERSION
        };
    }
}
