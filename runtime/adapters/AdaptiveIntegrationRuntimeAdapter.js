/**
 * Baccarat Analyzer V9.6
 * Path: runtime/adapters/AdaptiveIntegrationRuntimeAdapter.js
 * Purpose: Exposes V9.6 adaptive integration to Runtime and AI OS.
 */
export const ADAPTIVE_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.6.0";
export default class AdaptiveIntegrationRuntimeAdapter {
    constructor({integration}={}) {
        if(!integration||typeof integration.run!=="function")
            throw new TypeError("AdaptiveIntegrationRuntimeAdapter requires AIAdaptiveIntegration.");
        this.integration=integration;
    }
    run(input={}){return this.integration.run(input);}
    adapt(input={}){return this.integration.run(input);}
    rollback(){return this.integration.rollback();}
    pause(){return this.integration.pause();}
    resume(){return this.integration.resume();}
    reset(){return this.integration.reset();}
    destroy(){return this.integration.destroy();}
    get summary(){return {version:ADAPTIVE_INTEGRATION_RUNTIME_ADAPTER_VERSION,
        integration:this.integration.summary};}
}
