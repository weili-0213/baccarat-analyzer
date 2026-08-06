/**
 * Baccarat Analyzer V10.1
 * Path: runtime/adapters/ClosedLoopUIRuntimeAdapter.js
 * Purpose: Exposes V10.1 Closed-Loop UI Integration to Runtime.
 */
export const CLOSED_LOOP_UI_RUNTIME_ADAPTER_VERSION="10.1.0";
export default class ClosedLoopUIRuntimeAdapter{
 constructor({integration}={}){if(!integration?.connect)throw new TypeError("integration required");this.integration=integration;}
 connect(){return this.integration.connect();}runAnalysis(input={}){return this.integration.runAnalysis(input);}submitRoundResult(input={}){return this.integration.submitRoundResult(input);}pause(){return this.integration.pause();}resume(){return this.integration.resume();}reset(){return this.integration.reset();}destroy(){return this.integration.destroy();}
 get summary(){return {version:CLOSED_LOOP_UI_RUNTIME_ADAPTER_VERSION,integration:this.integration.summary};}
}
