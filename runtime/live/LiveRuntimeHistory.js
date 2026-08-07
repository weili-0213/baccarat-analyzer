/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeHistory.js
 * Purpose: Stores live runtime lifecycle and round records.
 */
export const LIVE_RUNTIME_HISTORY_VERSION="10.2.0";
export default class LiveRuntimeHistory{
constructor({limit=1000}={}){if(!Number.isInteger(limit)||limit<1)throw new RangeError("LiveRuntimeHistory limit must be positive.");this.limit=limit;this.records=[];}
add(record){this.records.push(record);if(this.records.length>this.limit)this.records.splice(0,this.records.length-this.limit);return record;}
latest(){return this.records[this.records.length-1]??null;}
clear(){this.records=[];return this;}
get summary(){return{version:LIVE_RUNTIME_HISTORY_VERSION,limit:this.limit,count:this.records.length,latest:this.latest()};}
}
