/** Baccarat Analyzer V7.1 */
export const LEARNING_RUNTIME_ADAPTER_VERSION="7.1.0";
export default class LearningRuntimeAdapter {
  constructor({learning}={}){ if(!learning||typeof learning.learn!=="function")throw new TypeError("LearningRuntimeAdapter requires a LearningEngine-compatible object."); this.learning=learning; }
  learn(input={}){ return this.learning.learn(input); }
  sample(size=1){ return this.learning.sample(size); }
  pause(){ return this.learning.pause(); }
  resume(){ return this.learning.resume(); }
  reset(){ return this.learning.reset(); }
  destroy(){ return this.learning.destroy(); }
  get summary(){ return {version:LEARNING_RUNTIME_ADAPTER_VERSION,learning:this.learning.summary}; }
}
