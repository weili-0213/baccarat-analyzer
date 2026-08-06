/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionIntegrationContext.js
 * Purpose: Carries strategy plan, bankroll, limits and runtime metadata.
 */
export const EXECUTION_INTEGRATION_CONTEXT_VERSION = "9.8.0";
export default class ExecutionIntegrationContext {
    constructor({
        strategy=null,betPlan=null,bankroll=null,limits={},settings=null,
        session=null,round=null,metadata={}
    }={}) {
        this.version=EXECUTION_INTEGRATION_CONTEXT_VERSION;
        this.strategy=strategy;
        this.betPlan=betPlan;
        this.bankroll=bankroll;
        this.limits={...limits};
        this.settings=settings;
        this.session=session;
        this.round=round;
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
        return {
            version:this.version,strategy:this.strategy,betPlan:this.betPlan,
            bankroll:this.bankroll,limits:{...this.limits},settings:this.settings,
            session:this.session,round:this.round,metadata:{...this.metadata}
        };
    }
}
