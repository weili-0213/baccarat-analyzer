/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/createAIPredictionIntegration.js
 * Purpose: Factory for V9.4 prediction integration.
 */

import AIPredictionIntegration
    from "./AIPredictionIntegration.js";

import PredictionInputCollector
    from "./PredictionInputCollector.js";

import PredictionFeatureExtractor
    from "./PredictionFeatureExtractor.js";

import TrendPredictionGateway
    from "./TrendPredictionGateway.js";

import PatternPredictionGateway
    from "./PatternPredictionGateway.js";

import PredictionCalibrator
    from "./PredictionCalibrator.js";

import PredictionFusionEngine
    from "./PredictionFusionEngine.js";

import PredictionIntegrationHistory
    from "./PredictionIntegrationHistory.js";


export const AI_PREDICTION_INTEGRATION_FACTORY_VERSION = "9.4.0";


export default function createAIPredictionIntegration({
    trendPredictor,
    patternPredictor,
    collector = null,
    featureExtractor = null,
    calibrator = null,
    fusion = null,
    history = null,
    eventBus = null,
    clock = () => Date.now()
} = {}) {
    return new AIPredictionIntegration({
        collector:
            collector ??
            new PredictionInputCollector(),
        featureExtractor:
            featureExtractor ??
            new PredictionFeatureExtractor(),
        trendGateway:
            new TrendPredictionGateway({
                predictor:
                    trendPredictor
            }),
        patternGateway:
            new PatternPredictionGateway({
                predictor:
                    patternPredictor
            }),
        calibrator:
            calibrator ??
            new PredictionCalibrator(),
        fusion:
            fusion ??
            new PredictionFusionEngine(),
        history:
            history ??
            new PredictionIntegrationHistory(),
        eventBus,
        clock
    });
}
