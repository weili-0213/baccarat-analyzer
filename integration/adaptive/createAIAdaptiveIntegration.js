/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/createAIAdaptiveIntegration.js
 * Purpose: Factory for V9.6 AI Adaptive Integration.
 */
import AIAdaptiveIntegration from "./AIAdaptiveIntegration.js";
import AdaptiveInputCollector from "./AdaptiveInputCollector.js";
import AdaptiveFeedbackAnalyzer from "./AdaptiveFeedbackAnalyzer.js";
import ThresholdAutoTuner from "./ThresholdAutoTuner.js";
import RiskAutoTuner from "./RiskAutoTuner.js";
import KellyAutoTuner from "./KellyAutoTuner.js";
import PredictionWeightTuner from "./PredictionWeightTuner.js";
import AdaptiveParameterMerger from "./AdaptiveParameterMerger.js";
import AdaptiveValidator from "./AdaptiveValidator.js";
import AdaptiveParameterStore from "./AdaptiveParameterStore.js";
import AdaptiveIntegrationHistory from "./AdaptiveIntegrationHistory.js";

export const AI_ADAPTIVE_INTEGRATION_FACTORY_VERSION = "9.6.0";
export default function createAIAdaptiveIntegration({
    collector=null,feedbackAnalyzer=null,thresholdTuner=null,riskTuner=null,
    kellyTuner=null,weightTuner=null,merger=null,validator=null,store=null,
    history=null,eventBus=null,clock=()=>Date.now()
}={}) {
    return new AIAdaptiveIntegration({
        collector:collector??new AdaptiveInputCollector(),
        feedbackAnalyzer:feedbackAnalyzer??new AdaptiveFeedbackAnalyzer(),
        thresholdTuner:thresholdTuner??new ThresholdAutoTuner(),
        riskTuner:riskTuner??new RiskAutoTuner(),
        kellyTuner:kellyTuner??new KellyAutoTuner(),
        weightTuner:weightTuner??new PredictionWeightTuner(),
        merger:merger??new AdaptiveParameterMerger(),
        validator:validator??new AdaptiveValidator(),
        store:store??new AdaptiveParameterStore(),
        history:history??new AdaptiveIntegrationHistory(),
        eventBus,clock
    });
}
