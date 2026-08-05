/** Baccarat Analyzer V9.2 */
export const DECISION_INPUT_COLLECTOR_VERSION = "9.2.0";
export default class DecisionInputCollector {
    collect(context={}) { return {
        round:context.round??null, shoe:context.shoe??null, statistics:context.statistics??null,
        roadmap:context.roadmap??null, bankroll:context.bankroll??null, settings:context.settings??null,
        analyzerInput: context.analyzerInput ?? {round:context.round??null,shoe:context.shoe??null,statistics:context.statistics??null,roadmap:context.roadmap??null,bankroll:context.bankroll??null}
    }; }
    get summary(){ return {version:DECISION_INPUT_COLLECTOR_VERSION}; }
}
