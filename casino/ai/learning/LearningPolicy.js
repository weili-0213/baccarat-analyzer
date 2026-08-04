/** Baccarat Analyzer V7.1 */
import {LearningAction} from "./LearningState.js";
export const LEARNING_POLICY_VERSION = "7.1.0";
export default class LearningPolicy {
  constructor({updateThreshold=2,forgetThreshold=-4,decayThreshold=-1}={}){ this.updateThreshold=updateThreshold; this.forgetThreshold=forgetThreshold; this.decayThreshold=decayThreshold; }
  decide({reward=0,experience={}}={}){ if(reward<=this.forgetThreshold)return{action:LearningAction.FORGET,reason:"reward-too-low",weight:0}; if(reward<=this.decayThreshold)return{action:LearningAction.DECAY,reason:"negative-reward",weight:Math.max(0,(experience.weight??1)*.5)}; if(reward>=this.updateThreshold)return{action:LearningAction.UPDATE,reason:"positive-reward",weight:Math.min(2,(experience.weight??1)+reward/10)}; return{action:LearningAction.KEEP,reason:"stable-reward",weight:experience.weight??1}; }
  get summary(){ return {version:LEARNING_POLICY_VERSION,updateThreshold:this.updateThreshold,forgetThreshold:this.forgetThreshold,decayThreshold:this.decayThreshold}; }
}
