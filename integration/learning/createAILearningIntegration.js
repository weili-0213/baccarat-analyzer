/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/createAILearningIntegration.js
 * Purpose: Factory for V9.5 AI Learning Integration.
 */
import AILearningIntegration from "./AILearningIntegration.js";
import LearningInputCollector from "./LearningInputCollector.js";
import OutcomeCollector from "./OutcomeCollector.js";
import PredictionEvaluator from "./PredictionEvaluator.js";
import DecisionEvaluator from "./DecisionEvaluator.js";
import IntegrationRewardCalculator from "./IntegrationRewardCalculator.js";
import LearningMemoryStore from "./LearningMemoryStore.js";
import LearningIntegrationHistory from "./LearningIntegrationHistory.js";
import LearningEngineGateway from "./LearningEngineGateway.js";

export const AI_LEARNING_INTEGRATION_FACTORY_VERSION = "9.5.0";
export default function createAILearningIntegration({learningEngine,collector=null,outcomeCollector=null,
    predictionEvaluator=null,decisionEvaluator=null,rewardCalculator=null,memory=null,history=null,
    eventBus=null,clock=()=>Date.now()}={}) {
    return new AILearningIntegration({
        collector:collector??new LearningInputCollector(),
        outcomeCollector:outcomeCollector??new OutcomeCollector(),
        predictionEvaluator:predictionEvaluator??new PredictionEvaluator(),
        decisionEvaluator:decisionEvaluator??new DecisionEvaluator(),
        rewardCalculator:rewardCalculator??new IntegrationRewardCalculator(),
        learningGateway:new LearningEngineGateway({learningEngine}),
        memory:memory??new LearningMemoryStore(),
        history:history??new LearningIntegrationHistory(),
        eventBus,clock
    });
}
