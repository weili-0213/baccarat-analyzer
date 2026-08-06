/**
 * Baccarat Analyzer V9.7
 * Path: runtime/adapters/StrategyIntegrationRuntimeAdapter.js
 * Purpose: Exposes V9.7 strategy integration to Runtime and AI OS.
 */
export const STRATEGY_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.7.0";
export default class StrategyIntegrationRuntimeAdapter {
    constructor({integration}={}){
        if(!integration||typeof integration.run!=="function")
            throw new TypeError("StrategyIntegrationRuntimeAdapter requires AIStrategyIntegration.");
        this.integration=integration;
    }
    run(input={}){return this.integration.run(input);}
    strategize(input={}){return this.integration.run(input);}
    pause(){return this.integration.pause();}
    resume(){return this.integration.resume();}
    reset(){return this.integration.reset();}
    destroy(){return this.integration.destroy();}
    get summary(){return {version:STRATEGY_INTEGRATION_RUNTIME_ADAPTER_VERSION,
        integration:this.integration.summary};}
}
