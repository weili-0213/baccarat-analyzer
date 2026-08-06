/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveIntegrationContext.js
 * Purpose: Carries learning results, metrics, parameters and runtime state.
 */
export const ADAPTIVE_INTEGRATION_CONTEXT_VERSION = "9.6.0";
export default class AdaptiveIntegrationContext {
    constructor({
        learning=null, prediction=null, decision=null, statistics=null,
        bankroll=null, parameters={}, constraints={}, baseline=null, metadata={}
    }={}) {
        this.version=ADAPTIVE_INTEGRATION_CONTEXT_VERSION;
        this.learning=learning;
        this.prediction=prediction;
        this.decision=decision;
        this.statistics=statistics;
        this.bankroll=bankroll;
        this.parameters={...parameters};
        this.constraints={...constraints};
        this.baseline=baseline;
        this.metadata={...metadata};
    }
    merge(data={}) {
        for (const [key,value] of Object.entries(data)) {
            if (value && typeof value==="object" && !Array.isArray(value) &&
                this[key] && typeof this[key]==="object" && !Array.isArray(this[key])) {
                this[key]={...this[key],...value};
            } else this[key]=value;
        }
        return this;
    }
    toJSON() {
        return {
            version:this.version,learning:this.learning,prediction:this.prediction,
            decision:this.decision,statistics:this.statistics,bankroll:this.bankroll,
            parameters:{...this.parameters},constraints:{...this.constraints},
            baseline:this.baseline,metadata:{...this.metadata}
        };
    }
}
