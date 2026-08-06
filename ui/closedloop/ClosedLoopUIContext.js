/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopUIContext.js
 * Purpose: Carries dashboard observations, AI outputs and submitted outcome.
 */
export const CLOSED_LOOP_UI_CONTEXT_VERSION="10.1.0";
export default class ClosedLoopUIContext{
 constructor({observation=null,analysisResult=null,actualOutcome=null,statistics=null,roadmap=null,bankroll=null,settings=null,metadata={}}={}){
  this.version=CLOSED_LOOP_UI_CONTEXT_VERSION;this.observation=observation;this.analysisResult=analysisResult;this.actualOutcome=actualOutcome;
  this.statistics=statistics;this.roadmap=roadmap;this.bankroll=bankroll;this.settings=settings;this.metadata={...metadata};
 }
 snapshot(){return {version:this.version,observation:this.observation,analysisResult:this.analysisResult,actualOutcome:this.actualOutcome,statistics:this.statistics,roadmap:this.roadmap,bankroll:this.bankroll,settings:this.settings,metadata:{...this.metadata}};}
}
