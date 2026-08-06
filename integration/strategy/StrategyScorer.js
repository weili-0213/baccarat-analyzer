/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyScorer.js
 * Purpose: Scores candidate strategies against current features.
 */
export const STRATEGY_SCORER_VERSION = "9.7.0";
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export default class StrategyScorer {
    score({strategy={},features={}}={}){
        const riskTarget=strategy.riskLevel??.5;
        const confidence=(features.predictionConfidence+features.decisionConfidence)/2;
        const riskFit=1-Math.abs(features.riskTolerance-riskTarget);
        const rewardFactor=clamp((features.reward+5)/10,0,1);
        const profitFactor=features.recentProfit>0?1:features.recentProfit<0?.2:.5;
        const baseWeight=strategy.baseWeight??1;
        const score=(confidence*.35+riskFit*.25+rewardFactor*.25+profitFactor*.15)*baseWeight;
        return {
            strategyId:strategy.strategyId,
            score:Math.round(score*10000)/10000,
            components:{confidence,riskFit,rewardFactor,profitFactor,baseWeight}
        };
    }
    get summary(){return {version:STRATEGY_SCORER_VERSION};}
}
