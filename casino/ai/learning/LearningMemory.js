/** Baccarat Analyzer V7.1 */
export const LEARNING_MEMORY_VERSION = "7.1.0";
export default class LearningMemory {
  constructor({limit=1000}={}) {
    if(!Number.isInteger(limit)||limit<1) throw new RangeError("LearningMemory limit must be positive.");
    this.limit=limit; this.records=[];
  }
  add(record){ this.records.push({...record}); if(this.records.length>this.limit)this.records.splice(0,this.records.length-this.limit); return record; }
  latest(){ return this.records[this.records.length-1]??null; }
  find(experienceId){ return this.records.find(r=>r.experienceId===experienceId)??null; }
  filterByDecision(decisionId){ return this.records.filter(r=>r.decisionId===decisionId); }
  remove(experienceId){ const i=this.records.findIndex(r=>r.experienceId===experienceId); if(i<0)return false; this.records.splice(i,1); return true; }
  clear(){ this.records=[]; return this; }
  get summary(){ const rewards=this.records.map(r=>Number.isFinite(r.reward)?r.reward:0); const totalReward=rewards.reduce((s,v)=>s+v,0); return {version:LEARNING_MEMORY_VERSION,limit:this.limit,count:this.records.length,totalReward,averageReward:rewards.length?totalReward/rewards.length:0,latest:this.latest()}; }
}
