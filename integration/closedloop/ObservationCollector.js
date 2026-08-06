/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ObservationCollector.js
 * Purpose: Normalizes the current shoe, round, statistics, roadmap and bankroll observations.
 */
export const OBSERVATION_COLLECTOR_VERSION = "10.0.0";

export default class ObservationCollector {
    collect(context = {}) {
        return {
            round: context.observation?.round ?? null,
            shoe: context.observation?.shoe ?? null,
            remainingCards:
                context.observation?.remainingCards ??
                null,
            statistics:
                context.statistics ??
                context.observation?.statistics ??
                null,
            roadmap:
                context.roadmap ??
                context.observation?.roadmap ??
                null,
            bankroll:
                context.bankroll ??
                context.observation?.bankroll ??
                null,
            settings:
                context.settings ??
                context.observation?.settings ??
                null,
            metadata: {
                ...(context.metadata ?? {}),
                ...(context.observation?.metadata ?? {})
            }
        };
    }

    get summary() {
        return {
            version: OBSERVATION_COLLECTOR_VERSION
        };
    }
}
