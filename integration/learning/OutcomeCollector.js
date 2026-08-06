/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/OutcomeCollector.js
 * Purpose: Normalizes the actual baccarat round outcome.
 */
export const OUTCOME_COLLECTOR_VERSION = "9.5.0";
export default class OutcomeCollector {
    collect(actualOutcome={}) {
        return {
            winner:actualOutcome.winner??actualOutcome.result??null,
            profit:Number.isFinite(actualOutcome.profit)?actualOutcome.profit:0,
            payout:Number.isFinite(actualOutcome.payout)?actualOutcome.payout:0,
            stake:Number.isFinite(actualOutcome.stake)?actualOutcome.stake:0,
            roundId:actualOutcome.roundId??null,
            timestamp:actualOutcome.timestamp??Date.now()
        };
    }
    get summary(){return {version:OUTCOME_COLLECTOR_VERSION};}
}
