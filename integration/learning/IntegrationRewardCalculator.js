/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/IntegrationRewardCalculator.js
 * Purpose: Calculates the closed-loop learning reward.
 */
export const INTEGRATION_REWARD_CALCULATOR_VERSION = "9.5.0";
export default class IntegrationRewardCalculator {
    calculate({predictionEvaluation={},decisionEvaluation={},outcome={}}={}) {
        let reward=0;
        reward+=predictionEvaluation.correct?4:-2;
        reward+=decisionEvaluation.correct?4:decisionEvaluation.placedBet?-3:0;
        reward+=Math.max(-3,Math.min(3,Number.isFinite(outcome.profit)?outcome.profit/100:0));
        reward+=Math.max(-1,Math.min(1,1-(predictionEvaluation.confidenceError??1)));
        reward=Math.round(reward*100)/100;
        return {reward,positive:reward>0,action:reward>=2?"update":reward<=-2?"forget":"observe",
            components:{predictionCorrect:Boolean(predictionEvaluation.correct),
                decisionCorrect:Boolean(decisionEvaluation.correct),profit:outcome.profit??0,
                confidenceError:predictionEvaluation.confidenceError??null}};
    }
    get summary(){return {version:INTEGRATION_REWARD_CALCULATOR_VERSION};}
}
