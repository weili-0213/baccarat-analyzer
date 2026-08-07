/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/AILiveRuntime.js
 * Purpose: Drives automatic live round analysis, settlement, feedback, learning and adaptation.
 */
import {LiveRuntimeState} from "./LiveRuntimeState.js";
import LiveRuntimeContext from "./LiveRuntimeContext.js";
import LiveRuntimeSession from "./LiveRuntimeSession.js";
import LiveRuntimeObservationCollector from "./LiveRuntimeObservationCollector.js";
import LiveRuntimeRoundCoordinator from "./LiveRuntimeRoundCoordinator.js";
import LiveRuntimeScheduler from "./LiveRuntimeScheduler.js";
import LiveRuntimeHistory from "./LiveRuntimeHistory.js";

export const AI_LIVE_RUNTIME_VERSION="10.2.0";
export const LiveRuntimeEvent=Object.freeze({
STATE_CHANGE:"ai-live-runtime:state-change",STARTED:"ai-live-runtime:started",STOPPED:"ai-live-runtime:stopped",
ROUND_BEGAN:"ai-live-runtime:round-began",OBSERVATION_COLLECTED:"ai-live-runtime:observation-collected",
ANALYSIS_STARTED:"ai-live-runtime:analysis-started",ANALYSIS_COMPLETED:"ai-live-runtime:analysis-completed",
RESULT_SUBMITTED:"ai-live-runtime:result-submitted",SETTLEMENT_COMPLETED:"ai-live-runtime:settlement-completed",
NEXT_ROUND:"ai-live-runtime:next-round",SHOE_RESET:"ai-live-runtime:shoe-reset",PAUSED:"ai-live-runtime:paused",
RESUMED:"ai-live-runtime:resumed",ERROR:"ai-live-runtime:error",DESTROYED:"ai-live-runtime:destroyed"});

export default class AILiveRuntime{
constructor({closedLoopRuntime,uiRuntime=null,session=null,observationCollector=null,coordinator=null,scheduler=null,history=null,eventBus=null,clock=()=>Date.now()}={}){
if(!closedLoopRuntime||typeof closedLoopRuntime.cycle!=="function")throw new TypeError("AILiveRuntime requires closedLoopRuntime.cycle().");
if(uiRuntime!==null&&typeof uiRuntime.runAnalysis!=="function")throw new TypeError("uiRuntime requires runAnalysis().");
if(eventBus!==null&&typeof eventBus.emit!=="function")throw new TypeError("eventBus requires emit().");
if(typeof clock!=="function")throw new TypeError("clock must be a function.");
this.closedLoopRuntime=closedLoopRuntime;this.uiRuntime=uiRuntime;this.clock=clock;
this.session=session??new LiveRuntimeSession({clock});this.observationCollector=observationCollector??new LiveRuntimeObservationCollector();
this.coordinator=coordinator??new LiveRuntimeRoundCoordinator();this.scheduler=scheduler??new LiveRuntimeScheduler();
this.history=history??new LiveRuntimeHistory();this.eventBus=eventBus;this.state=LiveRuntimeState.IDLE;this.previousState=null;
this.running=false;this.paused=false;this.destroyed=false;this.context=new LiveRuntimeContext();this.lastAnalysis=null;this.lastSettlement=null;this.lastError=null;}
emit(type,payload=null){return this.eventBus?.emit(type,payload,{source:"ai-live-runtime"})??null;}
setState(state){const previous=this.state;this.previousState=previous;this.state=state;this.emit(LiveRuntimeEvent.STATE_CHANGE,{previous,current:state});return this;}
assertNotDestroyed(){if(this.destroyed)throw new Error("AILiveRuntime has been destroyed.");}
start({shoeId=null,context={}}={}){this.assertNotDestroyed();this.setState(LiveRuntimeState.STARTING);const s=this.session.startShoe(shoeId);
this.context=new LiveRuntimeContext({...context,shoeId:s.shoeId,roundNumber:0});this.running=true;this.paused=false;this.setState(LiveRuntimeState.READY);
const r={type:"start",session:s,createdAt:this.clock()};this.history.add(r);this.emit(LiveRuntimeEvent.STARTED,r);return this.summary;}
beginRound({roundId=null,context={}}={}){this.assertNotDestroyed();if(!this.running)this.start();if(this.paused)return null;
const s=this.session.beginRound(roundId);this.context.merge({...context,shoeId:s.shoeId,roundId:s.roundId,roundNumber:s.roundNumber,actualOutcome:null});
this.coordinator.begin(s.roundId);this.setState(LiveRuntimeState.ROUND_OPEN);const r={type:"round-began",session:s,createdAt:this.clock()};
this.history.add(r);this.emit(LiveRuntimeEvent.ROUND_BEGAN,r);return s;}
observe({observation=null}={}){this.assertNotDestroyed();if(this.paused)return null;this.setState(LiveRuntimeState.OBSERVING);
const c=this.observationCollector.collect({session:this.session.snapshot(),context:this.context,override:observation});
this.context.merge({observation:c,statistics:c.statistics??this.context.statistics,roadmap:c.roadmap??this.context.roadmap,bankroll:c.bankroll??this.context.bankroll,settings:c.settings??this.context.settings});
this.emit(LiveRuntimeEvent.OBSERVATION_COLLECTED,c);return c;}
async analyze({observation=null}={}){this.assertNotDestroyed();if(this.paused)return null;if(!this.coordinator.canAnalyze())throw new Error("Current round cannot be analyzed.");
return this.scheduler.run("analyze",async()=>{this.setState(LiveRuntimeState.ANALYZING);const collected=this.observe({observation});this.setState(LiveRuntimeState.ANALYZING);
this.emit(LiveRuntimeEvent.ANALYSIS_STARTED,{roundId:this.context.roundId});
const input={observation:collected,statistics:this.context.statistics,roadmap:this.context.roadmap,bankroll:this.context.bankroll,settings:this.context.settings,metadata:this.context.metadata};
const result=this.uiRuntime?await this.uiRuntime.runAnalysis(input):await this.closedLoopRuntime.cycle({context:input});
this.lastAnalysis=result;this.context.merge({analysisResult:result});this.coordinator.markAnalyzed();this.setState(LiveRuntimeState.AWAITING_RESULT);
const r={type:"analysis-completed",roundId:this.context.roundId,result,createdAt:this.clock()};this.history.add(r);this.emit(LiveRuntimeEvent.ANALYSIS_COMPLETED,r);return result;});}
async submitResult({winner,profit=0,payout=0,stake=0,metadata={}}={}){this.assertNotDestroyed();if(this.paused)return null;if(!this.coordinator.canSettle())throw new Error("Current round cannot be settled.");
return this.scheduler.run("submit-result",async()=>{this.setState(LiveRuntimeState.SETTLING);
const actualOutcome={roundId:this.context.roundId,winner,profit,payout,stake,metadata:{...metadata},timestamp:this.clock()};this.context.merge({actualOutcome});
this.emit(LiveRuntimeEvent.RESULT_SUBMITTED,actualOutcome);
const input={observation:this.context.observation,actualOutcome,statistics:this.context.statistics,roadmap:this.context.roadmap,bankroll:this.context.bankroll,settings:this.context.settings,metadata:this.context.metadata};
const result=this.uiRuntime?await this.uiRuntime.submitRoundResult(actualOutcome):await this.closedLoopRuntime.cycle({context:input});
this.lastSettlement=result;this.coordinator.markSettled();this.session.completeRound();this.setState(LiveRuntimeState.COMPLETED);
const r={type:"settlement-completed",roundId:this.context.roundId,actualOutcome,result,createdAt:this.clock()};this.history.add(r);this.emit(LiveRuntimeEvent.SETTLEMENT_COMPLETED,r);return result;});}
nextRound({roundId=null,context={}}={}){this.assertNotDestroyed();if(this.paused)return null;const s=this.beginRound({roundId,context});this.emit(LiveRuntimeEvent.NEXT_ROUND,s);return s;}
resetShoe({shoeId=null,context={}}={}){this.assertNotDestroyed();const s=this.session.resetShoe(shoeId);this.coordinator.reset();this.context=new LiveRuntimeContext({...context,shoeId:s.shoeId});
this.lastAnalysis=null;this.lastSettlement=null;this.setState(LiveRuntimeState.READY);this.emit(LiveRuntimeEvent.SHOE_RESET,s);return s;}
pause(){this.assertNotDestroyed();this.closedLoopRuntime.pause?.();this.uiRuntime?.pause?.();this.paused=true;this.setState(LiveRuntimeState.PAUSED);this.emit(LiveRuntimeEvent.PAUSED,this.summary);return this.summary;}
resume(){this.assertNotDestroyed();this.closedLoopRuntime.resume?.();this.uiRuntime?.resume?.();this.paused=false;this.setState(LiveRuntimeState.READY);this.emit(LiveRuntimeEvent.RESUMED,this.summary);return this.summary;}
stop(){this.assertNotDestroyed();this.running=false;this.paused=false;this.setState(LiveRuntimeState.STOPPED);const r={type:"stop",session:this.session.snapshot(),createdAt:this.clock()};this.history.add(r);this.emit(LiveRuntimeEvent.STOPPED,r);return this.summary;}
reset(){this.assertNotDestroyed();this.scheduler.reset();this.coordinator.reset();this.history.clear();this.context=new LiveRuntimeContext();this.running=false;this.paused=false;this.lastAnalysis=null;this.lastSettlement=null;this.lastError=null;this.setState(LiveRuntimeState.IDLE);return this;}
destroy(){if(this.destroyed)return this;this.scheduler.reset();this.coordinator.reset();this.history.clear();this.closedLoopRuntime.destroy?.();this.uiRuntime?.destroy?.();this.running=false;this.paused=false;this.destroyed=true;this.lastAnalysis=null;this.lastSettlement=null;this.lastError=null;this.setState(LiveRuntimeState.DESTROYED);this.emit(LiveRuntimeEvent.DESTROYED,null);return this;}
get summary(){return{version:AI_LIVE_RUNTIME_VERSION,state:this.state,previousState:this.previousState,running:this.running,paused:this.paused,destroyed:this.destroyed,session:this.session.snapshot(),coordinator:this.coordinator.snapshot(),scheduler:this.scheduler.summary,history:this.history.summary,hasAnalysis:Boolean(this.lastAnalysis),hasSettlement:Boolean(this.lastSettlement),lastError:this.lastError?.message??null};}
}
