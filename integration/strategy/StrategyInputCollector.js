/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyInputCollector.js
 * Purpose: Normalizes all strategy decision inputs.
 */
export const STRATEGY_INPUT_COLLECTOR_VERSION = "9.7.0";
export default class StrategyInputCollector {
    collect(context={}){
        return {
            simulation:context.simulation??null,
            prediction:context.prediction??null,
            decision:context.decision??null,
            learning:context.learning??null,
            adaptive:context.adaptive??null,
            bankroll:context.bankroll??null,
            statistics:context.statistics??null,
            roadmap:context.roadmap??null,
            settings:context.settings??null,
            metadata:{...(context.metadata??{})}
        };
    }
    get summary(){return {version:STRATEGY_INPUT_COLLECTOR_VERSION};}
}
