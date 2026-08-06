/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/DecisionEvaluator.js
 * Purpose: Evaluates bet recommendation and financial outcome.
 */
export const DECISION_EVALUATOR_VERSION = "9.5.0";
export default class DecisionEvaluator {
    evaluate({decision={},outcome={}}={}) {
        const recommendation=decision.recommendation??decision;
        const action=recommendation.action??decision.action??null;
        const bestBet=recommendation.bestBet??decision.bestBet??null;
        const placedBet=action==="bet"&&Boolean(bestBet);
        const correct=placedBet&&bestBet===outcome.winner;
        const profit=Number.isFinite(outcome.profit)?outcome.profit:0;
        return {action,bestBet,placedBet,correct,profit,profitable:profit>0,
            expectedValue:recommendation.expectedValue??decision.expectedValue??null,
            kelly:recommendation.kelly??decision.kelly??null,
            risk:recommendation.risk??decision.risk??null,
            recommendedAmount:recommendation.recommendedAmount??0};
    }
    get summary(){return {version:DECISION_EVALUATOR_VERSION};}
}
