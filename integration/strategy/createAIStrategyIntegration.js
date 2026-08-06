/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/createAIStrategyIntegration.js
 * Purpose: Factory for V9.7 AI Strategy Integration.
 */
import AIStrategyIntegration from "./AIStrategyIntegration.js";
import StrategyRepository from "./StrategyRepository.js";
import StrategyInputCollector from "./StrategyInputCollector.js";
import StrategyFeatureExtractor from "./StrategyFeatureExtractor.js";
import StrategyScorer from "./StrategyScorer.js";
import StrategySelector from "./StrategySelector.js";
import StrategyConflictResolver from "./StrategyConflictResolver.js";
import BetPlanBuilder from "./BetPlanBuilder.js";
import StrategyIntegrationHistory from "./StrategyIntegrationHistory.js";

export const AI_STRATEGY_INTEGRATION_FACTORY_VERSION = "9.7.0";
export default function createAIStrategyIntegration({
    strategies=[],repository=null,collector=null,featureExtractor=null,scorer=null,
    selector=null,conflictResolver=null,planBuilder=null,history=null,
    eventBus=null,clock=()=>Date.now()
}={}){
    return new AIStrategyIntegration({
        repository:repository??new StrategyRepository({strategies}),
        collector:collector??new StrategyInputCollector(),
        featureExtractor:featureExtractor??new StrategyFeatureExtractor(),
        scorer:scorer??new StrategyScorer(),
        selector:selector??new StrategySelector(),
        conflictResolver:conflictResolver??new StrategyConflictResolver(),
        planBuilder:planBuilder??new BetPlanBuilder(),
        history:history??new StrategyIntegrationHistory(),
        eventBus,clock
    });
}
