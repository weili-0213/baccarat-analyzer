/** Baccarat Analyzer V9.2 */
export const DECISION_INTEGRATION_RUNTIME_ADAPTER_VERSION = "9.2.0";
export default class DecisionIntegrationRuntimeAdapter {
    constructor({integration}={}) { if(!integration||typeof integration.run!=="function") throw new TypeError("DecisionIntegrationRuntimeAdapter requires AIDecisionIntegration."); this.integration=integration; }
    run(input={}){ return this.integration.run(input); }
    analyze(input={}){ return this.integration.run(input); }
    pause(){ return this.integration.pause(); } resume(){ return this.integration.resume(); }
    reset(){ return this.integration.reset(); } destroy(){ return this.integration.destroy(); }
    get summary(){ return {version:DECISION_INTEGRATION_RUNTIME_ADAPTER_VERSION,integration:this.integration.summary}; }
}
