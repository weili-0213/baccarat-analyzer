/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeRoundCoordinator.js
 * Purpose: Coordinates begin, analyze, settle and next-round transitions.
 */
export const LIVE_RUNTIME_ROUND_COORDINATOR_VERSION="10.2.0";
export default class LiveRuntimeRoundCoordinator{
constructor(){this.current={roundId:null,analyzed:false,settled:false};}
begin(roundId){this.current={roundId,analyzed:false,settled:false};return this.snapshot();}
markAnalyzed(){this.current.analyzed=true;return this.snapshot();}
markSettled(){this.current.settled=true;return this.snapshot();}
canAnalyze(){return Boolean(this.current.roundId&&!this.current.analyzed&&!this.current.settled);}
canSettle(){return Boolean(this.current.roundId&&this.current.analyzed&&!this.current.settled);}
reset(){this.current={roundId:null,analyzed:false,settled:false};return this;}
snapshot(){return{version:LIVE_RUNTIME_ROUND_COORDINATOR_VERSION,...this.current};}
}
