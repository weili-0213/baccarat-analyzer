/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyConflictResolver.js
 * Purpose: Resolves conflicts between selected strategy and safety constraints.
 */
export const STRATEGY_CONFLICT_RESOLVER_VERSION = "9.7.0";
export default class StrategyConflictResolver {
    resolve({selection={},input={},features={}}={}){
        const strategy=selection.strategy??null;
        if(!strategy)return {allowed:false,reason:"no-strategy",strategy:null};
        const decisionAction=input.decision?.recommendation?.action??
            input.decision?.action??"wait";
        if(decisionAction!=="bet")return {allowed:false,reason:"decision-not-bet",strategy};
        if(strategy.requiresPositiveReward&&features.reward<=0)
            return {allowed:false,reason:"reward-not-positive",strategy};
        if(strategy.maxRiskTolerance!=null&&features.riskTolerance>strategy.maxRiskTolerance)
            return {allowed:false,reason:"risk-conflict",strategy};
        return {allowed:true,reason:null,strategy};
    }
    get summary(){return {version:STRATEGY_CONFLICT_RESOLVER_VERSION};}
}
