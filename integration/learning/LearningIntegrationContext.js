/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/LearningIntegrationContext.js
 * Purpose: Carries prediction, decision, simulation and actual outcome inputs.
 */
export const LEARNING_INTEGRATION_CONTEXT_VERSION = "9.5.0";
export default class LearningIntegrationContext {
    constructor({simulation=null,prediction=null,decision=null,actualOutcome=null,
        statistics=null,bankroll=null,before=null,after=null,metadata={}}={}) {
        this.version=LEARNING_INTEGRATION_CONTEXT_VERSION;
        this.simulation=simulation; this.prediction=prediction; this.decision=decision;
        this.actualOutcome=actualOutcome; this.statistics=statistics; this.bankroll=bankroll;
        this.before=before; this.after=after; this.metadata={...metadata};
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
        return {version:this.version,simulation:this.simulation,prediction:this.prediction,
            decision:this.decision,actualOutcome:this.actualOutcome,statistics:this.statistics,
            bankroll:this.bankroll,before:this.before,after:this.after,metadata:{...this.metadata}};
    }
}
