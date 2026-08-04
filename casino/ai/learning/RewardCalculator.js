/** Baccarat Analyzer V7.1 */
export const REWARD_CALCULATOR_VERSION = "7.1.0";
export default class RewardCalculator {
  constructor({winReward=5,lossPenalty=-5,skipReward=.5,positiveEVReward=2,lowRiskReward=1,roiScale=10,winRateScale=5}={}){ this.config={winReward,lossPenalty,skipReward,positiveEVReward,lowRiskReward,roiScale,winRateScale}; }
  calculate({evaluation={},features={}}={}){ let reward=0; const reasons=[]; if(evaluation.skipped){reward+=this.config.skipReward;reasons.push("skip");}else if(evaluation.correct){reward+=this.config.winReward;reasons.push("correct-prediction");}else{reward+=this.config.lossPenalty;reasons.push("wrong-prediction");} if(features.expectedValue>0){reward+=this.config.positiveEVReward;reasons.push("positive-ev");} if(features.risk==="low"){reward+=this.config.lowRiskReward;reasons.push("low-risk");} reward+=(evaluation.roiDelta??0)*this.config.roiScale; reward+=(evaluation.winRateDelta??0)*this.config.winRateScale; return {reward,reasons}; }
  get summary(){ return {version:REWARD_CALCULATOR_VERSION,config:{...this.config}}; }
}
