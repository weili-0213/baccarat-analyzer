/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyRepository.js
 * Purpose: Registers and exposes available betting strategies.
 */
export const STRATEGY_REPOSITORY_VERSION = "9.7.0";
export default class StrategyRepository {
    constructor({strategies=[]}={}){
        this.strategies=new Map();
        for(const strategy of strategies)this.register(strategy);
    }
    register(strategy){
        if(!strategy?.strategyId)throw new TypeError("Strategy requires strategyId.");
        this.strategies.set(strategy.strategyId,{...strategy});
        return this;
    }
    get(strategyId){return this.strategies.get(strategyId)??null;}
    all(){return [...this.strategies.values()].map(item=>({...item}));}
    clear(){this.strategies.clear();return this;}
    get summary(){return {version:STRATEGY_REPOSITORY_VERSION,count:this.strategies.size,
        strategyIds:[...this.strategies.keys()]};}
}
