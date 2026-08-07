/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/createAILiveRuntime.js
 * Purpose: Factory for V10.2 AI Live Runtime Integration.
 */
import AILiveRuntime from "./AILiveRuntime.js";
import LiveRuntimeSession from "./LiveRuntimeSession.js";
import LiveRuntimeObservationCollector from "./LiveRuntimeObservationCollector.js";
import LiveRuntimeRoundCoordinator from "./LiveRuntimeRoundCoordinator.js";
import LiveRuntimeScheduler from "./LiveRuntimeScheduler.js";
import LiveRuntimeHistory from "./LiveRuntimeHistory.js";
export const AI_LIVE_RUNTIME_FACTORY_VERSION="10.2.0";
export default function createAILiveRuntime({closedLoopRuntime,uiRuntime=null,observationProvider=null,eventBus=null,clock=()=>Date.now()}={}){
return new AILiveRuntime({closedLoopRuntime,uiRuntime,session:new LiveRuntimeSession({clock}),
observationCollector:new LiveRuntimeObservationCollector({provider:observationProvider}),
coordinator:new LiveRuntimeRoundCoordinator(),scheduler:new LiveRuntimeScheduler(),history:new LiveRuntimeHistory(),eventBus,clock});}
