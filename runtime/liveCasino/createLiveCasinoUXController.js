/**
 * Baccarat Analyzer V10.9.0
 * Path: runtime/liveCasino/createLiveCasinoUXController.js
 * Purpose: Factory for live casino UX/performance controller.
 */
import LiveCasinoUXController
    from "./LiveCasinoUXController.js";

import LiveCasinoPerformancePolicy
    from "./LiveCasinoPerformancePolicy.js";

import LiveCasinoDecisionModel
    from "./LiveCasinoDecisionModel.js";

import SignalTrendMonitor
    from "./SignalTrendMonitor.js";

import ExactOpportunityConfirmation
    from "./ExactOpportunityConfirmation.js";

import DecisionStabilityExplainabilityEngine
    from "./DecisionStabilityExplainabilityEngine.js";

import DecisionIntelligenceSignalAttributionEngine
    from "./DecisionIntelligenceSignalAttributionEngine.js";

import WholeShoeProfitabilityStrategyValidationEngine
    from "./WholeShoeProfitabilityStrategyValidationEngine.js";

import FifteenSecondEightMarketPredictionEngine
    from "./FifteenSecondEightMarketPredictionEngine.js";

export const LIVE_CASINO_UX_FACTORY_VERSION = "10.4.5";
export const AI_LIVE_DECISION_FACTORY_VERSION = "10.5.0";
export const AI_LIVE_DECISION_CALIBRATION_FACTORY_VERSION = "10.5.2";
export const SIGNAL_TREND_MONITOR_FACTORY_VERSION = "10.5.3";
export const EXACT_OPPORTUNITY_CONFIRMATION_FACTORY_VERSION = "10.5.4";
export const DECISION_STABILITY_EXPLAINABILITY_FACTORY_VERSION = "10.6.0";
export const DECISION_INTELLIGENCE_SIGNAL_ATTRIBUTION_FACTORY_VERSION = "10.7.0";
export const WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_FACTORY_VERSION = "10.8.0";
export const FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_FACTORY_VERSION = "10.9.0";

export default function createLiveCasinoUXController({
    game,
    render = null,
    aiRuntime = null,
    clock = () => Date.now(),
    performance = {}
} = {}) {
    const {
        decision = {},
        signalTrend = {},
        exactConfirmation = {},
        decisionStability = {},
        decisionIntelligence = {},
        wholeShoeStrategy = {},
        predictionBoard = {},
        ...performancePolicy
    } = performance ?? {};

    return new LiveCasinoUXController({
        game,
        render,
        aiRuntime,
        clock,
        policy:
            new LiveCasinoPerformancePolicy(
                performancePolicy
            ),
        decisionModel:
            new LiveCasinoDecisionModel({
                thresholds:
                    decision
            }),
        signalTrendMonitor:
            new SignalTrendMonitor(
                signalTrend
            ),
        exactConfirmation:
            new ExactOpportunityConfirmation({
                ...exactConfirmation,
                clock
            }),
        decisionStabilityEngine:
            new DecisionStabilityExplainabilityEngine({
                ...decisionStability,
                clock
            }),
        decisionIntelligenceEngine:
            new DecisionIntelligenceSignalAttributionEngine(
                decisionIntelligence
            ),
        wholeShoeStrategyEngine:
            new WholeShoeProfitabilityStrategyValidationEngine(
                wholeShoeStrategy
            ),
        predictionEngine:
            new FifteenSecondEightMarketPredictionEngine(
                predictionBoard
            )
    });
}
