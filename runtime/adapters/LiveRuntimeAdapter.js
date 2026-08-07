/**
 * Baccarat Analyzer V10.2
 * Path: runtime/adapters/LiveRuntimeAdapter.js
 * Purpose: Exposes V10.2 AI Live Runtime to application and UI.
 */
export const LIVE_RUNTIME_ADAPTER_VERSION="10.2.0";
export default class LiveRuntimeAdapter{
constructor({runtime}={}){if(!runtime||typeof runtime.start!=="function")throw new TypeError("LiveRuntimeAdapter requires AILiveRuntime.");this.runtime=runtime;}
start(input={}){return this.runtime.start(input);}beginRound(input={}){return this.runtime.beginRound(input);}
observe(input={}){return this.runtime.observe(input);}analyze(input={}){return this.runtime.analyze(input);}
submitResult(input={}){return this.runtime.submitResult(input);}nextRound(input={}){return this.runtime.nextRound(input);}
resetShoe(input={}){return this.runtime.resetShoe(input);}pause(){return this.runtime.pause();}resume(){return this.runtime.resume();}
stop(){return this.runtime.stop();}reset(){return this.runtime.reset();}destroy(){return this.runtime.destroy();}
get summary(){return{version:LIVE_RUNTIME_ADAPTER_VERSION,runtime:this.runtime.summary};}
}
