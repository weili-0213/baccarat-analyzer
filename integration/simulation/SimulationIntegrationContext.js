/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/SimulationIntegrationContext.js
 * Purpose: Carries simulation inputs.
 */
export const SIMULATION_INTEGRATION_CONTEXT_VERSION = "9.3.0";
export default class SimulationIntegrationContext {
 constructor({round=null,shoe=null,remainingCards=null,statistics=null,roadmap=null,settings=null,mode="auto",iterations=10000,metadata={}}={}){Object.assign(this,{version:SIMULATION_INTEGRATION_CONTEXT_VERSION,round,shoe,remainingCards,statistics,roadmap,settings,mode,iterations,metadata:{...metadata}});}
 merge(data={}){for(const [k,v] of Object.entries(data)){this[k]=(v&&typeof v==="object"&&!Array.isArray(v)&&this[k]&&typeof this[k]==="object"&&!Array.isArray(this[k]))?{...this[k],...v}:v;}return this;}
 toJSON(){return {version:this.version,round:this.round,shoe:this.shoe,remainingCards:this.remainingCards,statistics:this.statistics,roadmap:this.roadmap,settings:this.settings,mode:this.mode,iterations:this.iterations,metadata:{...this.metadata}};}
}
