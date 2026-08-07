/**
 * Baccarat Analyzer V10.2
 * Path: tests/aiLiveRuntimeIntegration.test.js
 * Purpose: Full V10.2 syntax-compatible Runtime Integration Test.
 */
import {LIVE_RUNTIME_STATE_VERSION,LiveRuntimeState,LiveRuntimeAction} from "../runtime/live/LiveRuntimeState.js";
import LiveRuntimeContext,{LIVE_RUNTIME_CONTEXT_VERSION} from "../runtime/live/LiveRuntimeContext.js";
import LiveRuntimeSession,{LIVE_RUNTIME_SESSION_VERSION} from "../runtime/live/LiveRuntimeSession.js";
import LiveRuntimeObservationCollector,{LIVE_RUNTIME_OBSERVATION_COLLECTOR_VERSION} from "../runtime/live/LiveRuntimeObservationCollector.js";
import LiveRuntimeRoundCoordinator,{LIVE_RUNTIME_ROUND_COORDINATOR_VERSION} from "../runtime/live/LiveRuntimeRoundCoordinator.js";
import LiveRuntimeScheduler,{LIVE_RUNTIME_SCHEDULER_VERSION} from "../runtime/live/LiveRuntimeScheduler.js";
import LiveRuntimeHistory,{LIVE_RUNTIME_HISTORY_VERSION} from "../runtime/live/LiveRuntimeHistory.js";
import AILiveRuntime,{AI_LIVE_RUNTIME_VERSION,LiveRuntimeEvent} from "../runtime/live/AILiveRuntime.js";
import LiveRuntimeAdapter,{LIVE_RUNTIME_ADAPTER_VERSION} from "../runtime/adapters/LiveRuntimeAdapter.js";
import {AI_LIVE_RUNTIME_FACTORY_VERSION} from "../runtime/live/createAILiveRuntime.js";

const assert=(c,m)=>{if(!c)throw new Error(m);};

export default async function aiLiveRuntimeIntegrationTest(){
const messages=[];
assert([LIVE_RUNTIME_STATE_VERSION,LIVE_RUNTIME_CONTEXT_VERSION,LIVE_RUNTIME_SESSION_VERSION,
LIVE_RUNTIME_OBSERVATION_COLLECTOR_VERSION,LIVE_RUNTIME_ROUND_COORDINATOR_VERSION,
LIVE_RUNTIME_SCHEDULER_VERSION,LIVE_RUNTIME_HISTORY_VERSION,AI_LIVE_RUNTIME_VERSION,
LIVE_RUNTIME_ADAPTER_VERSION,AI_LIVE_RUNTIME_FACTORY_VERSION].every(v=>v==="10.2.0"),
"V10.2 AI Live Runtime Integration 版本錯誤");
assert(LiveRuntimeAction.ANALYZE==="analyze","Live Runtime Action 錯誤");
messages.push("✓ V10.2 AI Live Runtime Integration 版本正確");

const context=new LiveRuntimeContext({shoeId:"shoe-1",roundId:"round-1",roundNumber:1,bankroll:{balance:1000}});
assert(context.shoeId==="shoe-1"&&context.roundNumber===1,"Live Runtime Context 錯誤");
messages.push("✓ Live Runtime Context 正確");

let now=100;
const session=new LiveRuntimeSession({clock:()=>now++});
const shoe=session.startShoe("shoe-A");
const round=session.beginRound("round-A1");
assert(shoe.shoeId==="shoe-A"&&round.roundId==="round-A1"&&round.roundNumber===1,"Live Runtime Session 錯誤");
messages.push("✓ Live Runtime Session 正確");

const collector=new LiveRuntimeObservationCollector({provider:()=>({remainingCards:300,statistics:{roundCount:1},bankroll:{balance:1000}})});
const observation=collector.collect({session:session.snapshot(),context});
assert(observation.remainingCards===300&&observation.statistics.roundCount===1,"Live Runtime Observation Collector 錯誤");
messages.push("✓ Live Runtime Observation Collector 正確");

const coordinator=new LiveRuntimeRoundCoordinator();coordinator.begin("round-A1");
assert(coordinator.canAnalyze(),"Round Coordinator analyze gate 錯誤");coordinator.markAnalyzed();
assert(coordinator.canSettle(),"Round Coordinator settle gate 錯誤");coordinator.markSettled();
assert(!coordinator.canAnalyze()&&!coordinator.canSettle(),"Round Coordinator settled state 錯誤");
messages.push("✓ Live Runtime Round Coordinator 正確");

const scheduler=new LiveRuntimeScheduler();
assert(await scheduler.run("test",async()=>123)===123&&!scheduler.summary.running,"Live Runtime Scheduler 錯誤");
messages.push("✓ Live Runtime Scheduler 正確");

const history=new LiveRuntimeHistory({limit:10});history.add({type:"test"});
assert(history.summary.count===1&&history.latest().type==="test","Live Runtime History 錯誤");
messages.push("✓ Live Runtime History 正確");

const closedLoopCalls=[];
const closedLoopRuntime={
paused:false,destroyed:false,
async cycle({context}){closedLoopCalls.push(context);const settled=Boolean(context.actualOutcome);
return{action:"continue",completedStages:settled?["simulation","prediction","decision","strategy","execution","feedback","learning","adaptive"]:["simulation","prediction","decision","strategy"],
outputs:{prediction:{predictedOutcome:"Banker",confidence:.82},decision:{recommendation:{action:"bet",bestBet:"Banker"}},
strategy:{plan:{action:"bet",betType:"Banker",amount:20}},
execution:settled?{action:"execute"}:null,feedback:settled?{action:"update"}:null,
learning:settled?{reward:{reward:7}}:null,adaptive:settled?{action:"apply"}:null}};},
pause(){this.paused=true;},resume(){this.paused=false;},destroy(){this.destroyed=true;}
};

const events=[];let runtimeNow=1000;
const runtime=new AILiveRuntime({closedLoopRuntime,
observationCollector:new LiveRuntimeObservationCollector({provider:()=>({remainingCards:300,statistics:{roundCount:1},roadmap:{bigRoad:["B"]},bankroll:{balance:1000}})}),
eventBus:{emit(type,payload){events.push({type,payload});}},clock:()=>runtimeNow++});

runtime.start({shoeId:"shoe-live"});
assert(runtime.state===LiveRuntimeState.READY&&runtime.summary.running&&runtime.summary.session.shoeId==="shoe-live","Live Runtime Start 錯誤");
messages.push("✓ Live Runtime Start 正確");

runtime.beginRound({roundId:"round-live-1"});
assert(runtime.state===LiveRuntimeState.ROUND_OPEN&&runtime.summary.session.roundNumber===1,"Live Runtime Begin Round 錯誤");
messages.push("✓ Live Runtime Begin Round 正確");

const analysis=await runtime.analyze();
assert(analysis.outputs.prediction.predictedOutcome==="Banker"&&runtime.state===LiveRuntimeState.AWAITING_RESULT&&runtime.summary.hasAnalysis,"Live Runtime Analyze 錯誤");
messages.push("✓ Round Complete → Auto Analyze Flow 正確");

const settlement=await runtime.submitResult({winner:"Banker",profit:19,payout:39,stake:20});
assert(settlement.outputs.feedback.action==="update"&&settlement.outputs.learning.reward.reward===7&&settlement.outputs.adaptive.action==="apply"&&runtime.state===LiveRuntimeState.COMPLETED&&runtime.summary.hasSettlement,"Live Runtime Submit Result 錯誤");
messages.push("✓ Result → Feedback → Learning → Adaptive Flow 正確");

const second=runtime.nextRound({roundId:"round-live-2"});
assert(second.roundNumber===2&&runtime.state===LiveRuntimeState.ROUND_OPEN,"Live Runtime Next Round 錯誤");
messages.push("✓ Live Runtime Next Round 正確");

runtime.pause();assert(runtime.state===LiveRuntimeState.PAUSED&&runtime.summary.paused&&closedLoopRuntime.paused,"Pause 錯誤");
runtime.resume();assert(runtime.state===LiveRuntimeState.READY&&!runtime.summary.paused&&!closedLoopRuntime.paused,"Resume 錯誤");
messages.push("✓ Pause／Resume 正確");

const resetShoe=runtime.resetShoe({shoeId:"shoe-live-2"});
assert(resetShoe.shoeId==="shoe-live-2"&&resetShoe.roundNumber===0&&runtime.state===LiveRuntimeState.READY,"Reset Shoe 錯誤");
messages.push("✓ Reset Shoe 正確");

runtime.beginRound({roundId:"round-live-3"});
const adapter=new LiveRuntimeAdapter({runtime});
const adapterAnalysis=await adapter.analyze();
assert(adapterAnalysis&&adapter.summary.runtime.hasAnalysis,"Live Runtime Adapter 錯誤");
messages.push("✓ Live Runtime Adapter 正確");

runtime.stop();assert(runtime.state===LiveRuntimeState.STOPPED&&!runtime.summary.running,"Live Runtime Stop 錯誤");
messages.push("✓ Live Runtime Stop 正確");

assert([LiveRuntimeEvent.STARTED,LiveRuntimeEvent.ROUND_BEGAN,LiveRuntimeEvent.OBSERVATION_COLLECTED,
LiveRuntimeEvent.ANALYSIS_STARTED,LiveRuntimeEvent.ANALYSIS_COMPLETED,LiveRuntimeEvent.RESULT_SUBMITTED,
LiveRuntimeEvent.SETTLEMENT_COMPLETED,LiveRuntimeEvent.NEXT_ROUND,LiveRuntimeEvent.SHOE_RESET,
LiveRuntimeEvent.PAUSED,LiveRuntimeEvent.RESUMED,LiveRuntimeEvent.STOPPED]
.every(type=>events.some(e=>e.type===type)),"Live Runtime Events 錯誤");
messages.push("✓ Live Runtime Events 正確");

runtime.reset();assert(runtime.state===LiveRuntimeState.IDLE&&runtime.summary.history.count===0&&!runtime.summary.hasAnalysis&&!runtime.summary.hasSettlement,"Reset 錯誤");
runtime.destroy();assert(runtime.state===LiveRuntimeState.DESTROYED&&runtime.summary.destroyed&&closedLoopRuntime.destroyed,"Destroy 錯誤");
messages.push("✓ Summary、Reset 與 Destroy 正確");

return `
${messages.join("\n")}

AI Live Runtime Integration V10.2 測試完成

Live Runtime State：通過
Live Runtime Context：通過
Live Runtime Session：通過
Live Runtime Observation Collector：通過
Live Runtime Round Coordinator：通過
Live Runtime Scheduler：通過
Live Runtime History：通過
Live Runtime Start：通過
Begin Round：通過
Auto Analyze Flow：通過
Submit Result Flow：通過
Next Round：通過
Reset Shoe：通過
Pause／Resume：通過
Runtime Adapter：通過
Stop：通過
Events：通過
Lifecycle：通過
`;
}
