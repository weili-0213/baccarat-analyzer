/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyIntegrationHistory.js
 * Purpose: Stores strategy integration execution records.
 */
export const STRATEGY_INTEGRATION_HISTORY_VERSION = "9.7.0";
export default class StrategyIntegrationHistory {
    constructor({limit=500}={}){
        if(!Number.isInteger(limit)||limit<1)throw new RangeError("StrategyIntegrationHistory limit must be positive.");
        this.limit=limit;this.records=[];
    }
    add(record){this.records.push(record);
        if(this.records.length>this.limit)this.records.splice(0,this.records.length-this.limit);
        return record;}
    latest(){return this.records[this.records.length-1]??null;}
    clear(){this.records=[];return this;}
    get summary(){return {version:STRATEGY_INTEGRATION_HISTORY_VERSION,
        limit:this.limit,count:this.records.length,latest:this.latest()};}
}
