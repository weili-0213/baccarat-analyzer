/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyIntegrationContext.js
 * Purpose: Carries simulation, prediction, decision, learning and adaptive inputs.
 */
export const STRATEGY_INTEGRATION_CONTEXT_VERSION = "9.7.0";
export default class StrategyIntegrationContext {
    constructor({
        simulation=null,prediction=null,decision=null,learning=null,adaptive=null,
        bankroll=null,statistics=null,roadmap=null,settings=null,metadata={}
    }={}) {
        this.version=STRATEGY_INTEGRATION_CONTEXT_VERSION;
        this.simulation=simulation;this.prediction=prediction;this.decision=decision;
        this.learning=learning;this.adaptive=adaptive;this.bankroll=bankroll;
        this.statistics=statistics;this.roadmap=roadmap;this.settings=settings;
        this.metadata={...metadata};
    }
    merge(data={}) {
        for(const [key,value] of Object.entries(data)){
            if(value&&typeof value==="object"&&!Array.isArray(value)&&
                this[key]&&typeof this[key]==="object"&&!Array.isArray(this[key])){
                this[key]={...this[key],...value};
            }else this[key]=value;
        }
        return this;
    }
    toJSON(){
        return {version:this.version,simulation:this.simulation,prediction:this.prediction,
            decision:this.decision,learning:this.learning,adaptive:this.adaptive,
            bankroll:this.bankroll,statistics:this.statistics,roadmap:this.roadmap,
            settings:this.settings,metadata:{...this.metadata}};
    }
}
