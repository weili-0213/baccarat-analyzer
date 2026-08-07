/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeSession.js
 * Purpose: Tracks current shoe and round lifecycle.
 */
export const LIVE_RUNTIME_SESSION_VERSION="10.2.0";
export default class LiveRuntimeSession{
constructor({shoeId=null,clock=()=>Date.now()}={}){if(typeof clock!=="function")throw new TypeError("LiveRuntimeSession clock must be a function.");
this.clock=clock;this.shoeSequence=0;this.roundSequence=0;this.shoeId=shoeId;this.roundId=null;this.roundNumber=0;this.startedAt=null;this.roundStartedAt=null;}
startShoe(shoeId=null){this.shoeSequence++;this.shoeId=shoeId??`shoe-${this.clock()}-${this.shoeSequence}`;this.roundSequence=0;this.roundId=null;this.roundNumber=0;this.startedAt=this.clock();this.roundStartedAt=null;return this.snapshot();}
beginRound(roundId=null){if(!this.shoeId)this.startShoe();this.roundSequence++;this.roundNumber++;this.roundId=roundId??`round-${this.clock()}-${this.roundSequence}`;this.roundStartedAt=this.clock();return this.snapshot();}
completeRound(){const s=this.snapshot();this.roundStartedAt=null;return s;}
resetShoe(shoeId=null){return this.startShoe(shoeId);}
snapshot(){return{version:LIVE_RUNTIME_SESSION_VERSION,shoeId:this.shoeId,roundId:this.roundId,roundNumber:this.roundNumber,startedAt:this.startedAt,roundStartedAt:this.roundStartedAt};}
}
