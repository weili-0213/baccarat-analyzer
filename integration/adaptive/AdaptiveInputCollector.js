/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveInputCollector.js
 * Purpose: Normalizes learning feedback and current parameters.
 */
export const ADAPTIVE_INPUT_COLLECTOR_VERSION = "9.6.0";
export default class AdaptiveInputCollector {
    collect(context={}) {
        return {
            learning:context.learning??null,
            prediction:context.prediction??null,
            decision:context.decision??null,
            statistics:context.statistics??null,
            bankroll:context.bankroll??null,
            parameters:{...(context.parameters??{})},
            constraints:{...(context.constraints??{})},
            baseline:context.baseline??null,
            metadata:{...(context.metadata??{})}
        };
    }
    get summary(){return {version:ADAPTIVE_INPUT_COLLECTOR_VERSION};}
}
