/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategySelector.js
 * Purpose: Selects the highest-scoring eligible strategy.
 */
export const STRATEGY_SELECTOR_VERSION = "9.7.0";
export default class StrategySelector {
    select({strategies=[],scores=[],minimumScore=.3}={}){
        const ranked=[...scores].sort((a,b)=>b.score-a.score);
        for(const score of ranked){
            if(score.score<minimumScore)continue;
            const strategy=strategies.find(item=>item.strategyId===score.strategyId);
            if(strategy)return {strategy,score,ranked};
        }
        return {strategy:null,score:null,ranked};
    }
    get summary(){return {version:STRATEGY_SELECTOR_VERSION};}
}
