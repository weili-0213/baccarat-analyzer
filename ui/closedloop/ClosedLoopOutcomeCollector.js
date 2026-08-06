/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopOutcomeCollector.js
 * Purpose: Collects and normalizes the actual round outcome submitted by the UI.
 */
export const CLOSED_LOOP_OUTCOME_COLLECTOR_VERSION="10.1.0";
export default class ClosedLoopOutcomeCollector{
 collect(input={}){const winner=input.winner??input.result??null;if(!["Player","Banker","Tie"].includes(winner))throw new TypeError("winner must be Player, Banker or Tie");return {roundId:input.roundId??null,winner,profit:Number.isFinite(input.profit)?input.profit:0,payout:Number.isFinite(input.payout)?input.payout:0,stake:Number.isFinite(input.stake)?input.stake:0,timestamp:input.timestamp??Date.now()};}
 get summary(){return {version:CLOSED_LOOP_OUTCOME_COLLECTOR_VERSION};}
}
