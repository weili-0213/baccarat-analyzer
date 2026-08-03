/** Baccarat Analyzer V7.1 */
export const EXPERIENCE_BUFFER_VERSION = "7.1.0";
export default class ExperienceBuffer {
  constructor({capacity=500,random=Math.random}={}) {
    if(!Number.isInteger(capacity)||capacity<1) throw new RangeError("ExperienceBuffer capacity must be positive.");
    if(typeof random!=="function") throw new TypeError("ExperienceBuffer random must be a function.");
    this.capacity=capacity; this.random=random; this.items=[];
  }
  push(experience){ this.items.push({...experience}); if(this.items.length>this.capacity)this.items.splice(0,this.items.length-this.capacity); return experience; }
  sample(size=1){ if(!Number.isInteger(size)||size<1)throw new RangeError("Sample size must be positive."); const pool=[...this.items], out=[]; while(out.length<Math.min(size,pool.length)){ const i=Math.floor(this.random()*pool.length); out.push(pool.splice(i,1)[0]); } return out; }
  latest(){ return this.items[this.items.length-1]??null; }
  clear(){ this.items=[]; return this; }
  get summary(){ return {version:EXPERIENCE_BUFFER_VERSION,capacity:this.capacity,size:this.items.length,latest:this.latest()}; }
}
