/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/LearningIntegrationHistory.js
 * Purpose: Stores complete learning integration execution records.
 */
export const LEARNING_INTEGRATION_HISTORY_VERSION = "9.5.0";
export default class LearningIntegrationHistory {
    constructor({limit=500}={}) {
        if (!Number.isInteger(limit)||limit<1) throw new RangeError("LearningIntegrationHistory limit must be positive.");
        this.limit=limit; this.records=[];
    }
    add(record){
        this.records.push(record);
        if(this.records.length>this.limit)this.records.splice(0,this.records.length-this.limit);
        return record;
    }
    latest(){return this.records[this.records.length-1]??null;}
    clear(){this.records=[];return this;}
    get summary(){return {version:LEARNING_INTEGRATION_HISTORY_VERSION,limit:this.limit,
        count:this.records.length,latest:this.latest()};}
}
