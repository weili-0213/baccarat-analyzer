/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/LearningInputCollector.js
 * Purpose: Normalizes prediction, decision and result data into learning input.
 */
export const LEARNING_INPUT_COLLECTOR_VERSION = "9.5.0";
export default class LearningInputCollector {
    collect(context={}) {
        return {
            simulation:context.simulation??null, prediction:context.prediction??null,
            decision:context.decision??null, actualOutcome:context.actualOutcome??null,
            statistics:context.statistics??null, bankroll:context.bankroll??null,
            before:context.before??null, after:context.after??null,
            metadata:{...(context.metadata??{})}
        };
    }
    get summary(){return {version:LEARNING_INPUT_COLLECTOR_VERSION};}
}
