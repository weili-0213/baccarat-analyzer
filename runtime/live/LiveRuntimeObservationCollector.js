/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeObservationCollector.js
 * Purpose: Normalizes current live game state for Closed-Loop analysis.
 */
export const LIVE_RUNTIME_OBSERVATION_COLLECTOR_VERSION="10.2.0";
export default class LiveRuntimeObservationCollector{
constructor({provider=null}={}){if(provider!==null&&typeof provider!=="function")throw new TypeError("LiveRuntimeObservationCollector provider must be a function.");this.provider=provider??(()=>({}));}
collect({session=null,context=null,override=null}={}){const p=override??this.provider({session,context})??{};
return{round:p.round??{roundId:session?.roundId??context?.roundId??null,roundNumber:session?.roundNumber??context?.roundNumber??0},
shoe:p.shoe??{shoeId:session?.shoeId??context?.shoeId??null},remainingCards:p.remainingCards??null,
statistics:p.statistics??context?.statistics??null,roadmap:p.roadmap??context?.roadmap??null,
bankroll:p.bankroll??context?.bankroll??null,settings:p.settings??context?.settings??null,
metadata:{...(context?.metadata??{}),...(p.metadata??{})}};}
get summary(){return{version:LIVE_RUNTIME_OBSERVATION_COLLECTOR_VERSION};}
}
