/**
 * Baccarat Analyzer V9.2
 * integration/decision/BetRecommendationMapper.js
 */
import { DecisionIntegrationAction } from "./DecisionIntegrationState.js";
export const BET_RECOMMENDATION_MAPPER_VERSION = "9.2.0";
export default class BetRecommendationMapper {
    map({analysis={},strategy={},decision={},bankroll={}}={}) {
        const action=decision.action ?? (decision.bestBet ? DecisionIntegrationAction.BET : DecisionIntegrationAction.WAIT);
        const bestBet=decision.bestBet ?? strategy.bestBet ?? analysis.bestBet ?? null;
        const confidence=decision.confidence ?? strategy.confidence ?? analysis.confidence ?? null;
        const expectedValue=decision.expectedValue ?? strategy.expectedValue ?? analysis.expectedValue ?? null;
        const kelly=decision.kelly ?? strategy.kelly ?? analysis.kelly ?? null;
        const risk=decision.risk ?? strategy.risk ?? analysis.risk ?? null;
        const balance=Number.isFinite(bankroll.balance) ? bankroll.balance : 0;
        const recommendedAmount=action===DecisionIntegrationAction.BET && Number.isFinite(kelly) ? Math.max(0,Math.round(balance*kelly*100)/100) : 0;
        return {action,bestBet,confidence,expectedValue,kelly,risk,recommendedAmount,reason:decision.reason??strategy.reason??analysis.reason??null};
    }
    get summary(){ return {version:BET_RECOMMENDATION_MAPPER_VERSION}; }
}
