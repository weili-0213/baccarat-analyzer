/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PredictionInputCollector.js
 * Purpose: Normalizes all prediction inputs.
 */

export const PREDICTION_INPUT_COLLECTOR_VERSION = "9.4.0";

export default class PredictionInputCollector {
    collect(context = {}) {
        return {
            simulation:
                context.simulation ??
                null,
            statistics:
                context.statistics ??
                null,
            roadmap:
                context.roadmap ??
                null,
            history:
                Array.isArray(context.history)
                    ? [...context.history]
                    : [],
            recentOutcomes:
                Array.isArray(context.recentOutcomes)
                    ? [...context.recentOutcomes]
                    : [],
            settings:
                context.settings ??
                null
        };
    }

    get summary() {
        return {
            version:
                PREDICTION_INPUT_COLLECTOR_VERSION
        };
    }
}
