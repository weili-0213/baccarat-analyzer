/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeContext.js
 * Purpose: Carries live shoe, round, observation and runtime data.
 */
export const LIVE_RUNTIME_CONTEXT_VERSION="10.2.0";
export default class LiveRuntimeContext{
constructor({shoeId=null,roundId=null,roundNumber=0,observation=null,analysisResult=null,
actualOutcome=null,statistics=null,roadmap=null,bankroll=null,settings=null,metadata={}}={}){
this.version=LIVE_RUNTIME_CONTEXT_VERSION;this.shoeId=shoeId;this.roundId=roundId;
this.roundNumber=roundNumber;this.observation=observation;this.analysisResult=analysisResult;
this.actualOutcome=actualOutcome;this.statistics=statistics;this.roadmap=roadmap;
this.bankroll=bankroll;this.settings=settings;this.metadata={...metadata};}
merge(data={}){for(const[k,v]of Object.entries(data)){if(v&&typeof v==="object"&&!Array.isArray(v)&&this[k]&&typeof this[k]==="object"&&!Array.isArray(this[k]))this[k]={...this[k],...v};else this[k]=v;}return this;}
snapshot(){return{version:this.version,shoeId:this.shoeId,roundId:this.roundId,roundNumber:this.roundNumber,
observation:this.observation,analysisResult:this.analysisResult,actualOutcome:this.actualOutcome,
statistics:this.statistics,roadmap:this.roadmap,bankroll:this.bankroll,settings:this.settings,metadata:{...this.metadata}};}
}
