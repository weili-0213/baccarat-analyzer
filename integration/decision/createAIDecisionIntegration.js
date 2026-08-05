/** Baccarat Analyzer V9.2 */
import AIDecisionIntegration from "./AIDecisionIntegration.js";
import DecisionInputCollector from "./DecisionInputCollector.js";
import AnalyzerGateway from "./AnalyzerGateway.js";
import StrategyGateway from "./StrategyGateway.js";
import DecisionGateway from "./DecisionGateway.js";
import BetRecommendationMapper from "./BetRecommendationMapper.js";
import DecisionIntegrationHistory from "./DecisionIntegrationHistory.js";
export const AI_DECISION_INTEGRATION_FACTORY_VERSION = "9.2.0";
export default function createAIDecisionIntegration({analyzer,strategy,decision,collector=null,mapper=null,history=null,eventBus=null,clock=()=>Date.now()}={}) {
    return new AIDecisionIntegration({collector:collector??new DecisionInputCollector(),analyzerGateway:new AnalyzerGateway({analyzer}),strategyGateway:new StrategyGateway({strategy}),decisionGateway:new DecisionGateway({decision}),mapper:mapper??new BetRecommendationMapper(),history:history??new DecisionIntegrationHistory(),eventBus,clock});
}
