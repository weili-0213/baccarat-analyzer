/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/createAIFeedbackIntegration.js
 * Purpose: Factory for V9.9 AI Feedback Integration.
 */
import AIFeedbackIntegration
    from "./AIFeedbackIntegration.js";

import FeedbackInputCollector
    from "./FeedbackInputCollector.js";

import ExecutionFeedbackAnalyzer
    from "./ExecutionFeedbackAnalyzer.js";

import PerformanceFeedbackAnalyzer
    from "./PerformanceFeedbackAnalyzer.js";

import FeedbackRouter
    from "./FeedbackRouter.js";

import PredictionFeedbackCalibrator
    from "./PredictionFeedbackCalibrator.js";

import DecisionFeedbackCalibrator
    from "./DecisionFeedbackCalibrator.js";

import StrategyFeedbackCalibrator
    from "./StrategyFeedbackCalibrator.js";

import SimulationFeedbackCalibrator
    from "./SimulationFeedbackCalibrator.js";

import FeedbackIntegrationHistory
    from "./FeedbackIntegrationHistory.js";


export const AI_FEEDBACK_INTEGRATION_FACTORY_VERSION = "9.9.0";


export default function createAIFeedbackIntegration({
    collector = null,
    executionAnalyzer = null,
    performanceAnalyzer = null,
    router = null,
    predictionCalibrator = null,
    decisionCalibrator = null,
    strategyCalibrator = null,
    simulationCalibrator = null,
    history = null,
    eventBus = null,
    clock = () => Date.now()
} = {}) {
    return new AIFeedbackIntegration({
        collector:
            collector ??
            new FeedbackInputCollector(),
        executionAnalyzer:
            executionAnalyzer ??
            new ExecutionFeedbackAnalyzer(),
        performanceAnalyzer:
            performanceAnalyzer ??
            new PerformanceFeedbackAnalyzer(),
        router:
            router ??
            new FeedbackRouter(),
        predictionCalibrator:
            predictionCalibrator ??
            new PredictionFeedbackCalibrator(),
        decisionCalibrator:
            decisionCalibrator ??
            new DecisionFeedbackCalibrator(),
        strategyCalibrator:
            strategyCalibrator ??
            new StrategyFeedbackCalibrator(),
        simulationCalibrator:
            simulationCalibrator ??
            new SimulationFeedbackCalibrator(),
        history:
            history ??
            new FeedbackIntegrationHistory(),
        eventBus,
        clock
    });
}
