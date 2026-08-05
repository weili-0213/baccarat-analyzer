/**
 * Baccarat Analyzer V9.2
 * integration/decision/DecisionIntegrationContext.js
 */
export const DECISION_INTEGRATION_CONTEXT_VERSION = "9.2.0";
export default class DecisionIntegrationContext {
    constructor({round=null,shoe=null,statistics=null,roadmap=null,bankroll=null,settings=null,analyzerInput=null,metadata={}}={}) {
        this.version=DECISION_INTEGRATION_CONTEXT_VERSION; this.round=round; this.shoe=shoe;
        this.statistics=statistics; this.roadmap=roadmap; this.bankroll=bankroll;
        this.settings=settings; this.analyzerInput=analyzerInput; this.metadata={...metadata};
    }
    merge(data={}) { for (const [key,value] of Object.entries(data)) {
        if (value && typeof value === "object" && !Array.isArray(value) && this[key] && typeof this[key] === "object" && !Array.isArray(this[key])) this[key]={...this[key],...value};
        else this[key]=value;
    } return this; }
    toJSON(){ return {version:this.version,round:this.round,shoe:this.shoe,statistics:this.statistics,roadmap:this.roadmap,bankroll:this.bankroll,settings:this.settings,analyzerInput:this.analyzerInput,metadata:{...this.metadata}}; }
}
