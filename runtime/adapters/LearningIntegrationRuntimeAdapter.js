/**
 * Baccarat Analyzer V9.5
 * Path: runtime/adapters/LearningIntegrationRuntimeAdapter.js
 * Purpose: Exposes V9.5 learning integration to Runtime and AI OS.
 */
export const LEARNING_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.5.0";
export default class LearningIntegrationRuntimeAdapter {
    constructor({integration}={}) {
        if(!integration||typeof integration.run!=="function")
            throw new TypeError("LearningIntegrationRuntimeAdapter requires AILearningIntegration.");
        this.integration=integration;
    }
    run(input={}){return this.integration.run(input);}
    learn(input={}){return this.integration.run(input);}
    pause(){return this.integration.pause();}
    resume(){return this.integration.resume();}
    reset(){return this.integration.reset();}
    destroy(){return this.integration.destroy();}
    get summary(){return {version:LEARNING_INTEGRATION_RUNTIME_ADAPTER_VERSION,
        integration:this.integration.summary};}
}
