/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionInputCollector.js
 * Purpose: Normalizes strategy and bet plan into execution input.
 */
export const EXECUTION_INPUT_COLLECTOR_VERSION = "9.8.0";
export default class ExecutionInputCollector {
    collect(context={}){
        return {
            strategy:context.strategy??null,
            betPlan:context.betPlan??context.strategy?.plan??null,
            bankroll:context.bankroll??null,
            limits:{...(context.limits??{})},
            settings:context.settings??null,
            session:context.session??null,
            round:context.round??null,
            metadata:{...(context.metadata??{})}
        };
    }
    get summary(){return {version:EXECUTION_INPUT_COLLECTOR_VERSION};}
}
