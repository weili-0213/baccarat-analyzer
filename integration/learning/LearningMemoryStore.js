/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/LearningMemoryStore.js
 * Purpose: Stores closed-loop learning experiences.
 */
export const LEARNING_MEMORY_STORE_VERSION = "9.5.0";
export default class LearningMemoryStore {
    constructor({limit=1000}={}) {
        if (!Number.isInteger(limit)||limit<1) throw new RangeError("LearningMemoryStore limit must be positive.");
        this.limit=limit; this.experiences=[];
    }
    add(experience) {
        this.experiences.push(experience);
        if (this.experiences.length>this.limit) {
            this.experiences.splice(0,this.experiences.length-this.limit);
        }
        return experience;
    }
    latest(){return this.experiences[this.experiences.length-1]??null;}
    clear(){this.experiences=[];return this;}
    get summary(){
        return {version:LEARNING_MEMORY_STORE_VERSION,limit:this.limit,count:this.experiences.length,
            totalReward:this.experiences.reduce((total,item)=>total+(item.reward??0),0),latest:this.latest()};
    }
}
