/**
 * Baccarat Analyzer V9.8
 * Path: runtime/adapters/ExecutionIntegrationRuntimeAdapter.js
 * Purpose: Exposes V9.8 execution integration to Runtime and AI OS.
 */
export const EXECUTION_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.8.0";
export default class ExecutionIntegrationRuntimeAdapter {
    constructor({integration}={}){
        if(!integration||typeof integration.run!=="function")
            throw new TypeError("ExecutionIntegrationRuntimeAdapter requires AIExecutionIntegration.");
        this.integration=integration;
    }
    run(input={}){return this.integration.run(input);}
    execute(input={}){return this.integration.run(input);}
    pause(){return this.integration.pause();}
    resume(){return this.integration.resume();}
    reset(){return this.integration.reset();}
    destroy(){return this.integration.destroy();}
    get summary(){return {version:EXECUTION_INTEGRATION_RUNTIME_ADAPTER_VERSION,
        integration:this.integration.summary};}
}
