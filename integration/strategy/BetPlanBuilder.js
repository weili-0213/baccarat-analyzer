/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/BetPlanBuilder.js
 * Purpose: Builds an executable bet plan from strategy and decision outputs.
 */
export const BET_PLAN_BUILDER_VERSION = "9.7.0";
export default class BetPlanBuilder {
    build({strategy={},input={},features={}}={}){
        const recommendation=input.decision?.recommendation??input.decision??{};
        const baseAmount=recommendation.recommendedAmount??0;
        const multiplier=(strategy.stakeMultiplier??1)*(features.kellyMultiplier??1);
        const amount=Math.max(0,Math.round(baseAmount*multiplier*100)/100);
        return {
            strategyId:strategy.strategyId,
            action:"bet",
            betType:recommendation.bestBet??null,
            amount,
            confidence:recommendation.confidence??features.decisionConfidence??0,
            expectedValue:recommendation.expectedValue??null,
            risk:recommendation.risk??null,
            stopLoss:strategy.stopLoss??null,
            takeProfit:strategy.takeProfit??null,
            maxRounds:strategy.maxRounds??1,
            reason:strategy.description??null
        };
    }
    get summary(){return {version:BET_PLAN_BUILDER_VERSION};}
}
