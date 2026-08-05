/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/SimulationIntegrationHistory.js
 * Purpose: Stores recent simulation results.
 */
export const SIMULATION_INTEGRATION_HISTORY_VERSION = "9.3.0";
export default class SimulationIntegrationHistory {constructor({limit=500}={}){if(!Number.isInteger(limit)||limit<1)throw new RangeError("SimulationIntegrationHistory limit must be positive.");this.limit=limit;this.records=[];}add(record){this.records.push(record);if(this.records.length>this.limit)this.records.splice(0,this.records.length-this.limit);return record;}latest(){return this.records.at(-1)??null;}clear(){this.records=[];return this;}get summary(){return {version:SIMULATION_INTEGRATION_HISTORY_VERSION,limit:this.limit,count:this.records.length,latest:this.latest()};}}
