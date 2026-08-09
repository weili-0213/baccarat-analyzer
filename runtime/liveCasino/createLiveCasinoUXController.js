/**
 * Baccarat Analyzer V10.5.3
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

export const LIVE_CASINO_UX_FACTORY_VERSION = "10.4.5";
export const AI_LIVE_DECISION_FACTORY_VERSION = "10.5.0";
export const AI_LIVE_DECISION_CALIBRATION_FACTORY_VERSION = "10.5.2";
export const SIGNAL_TREND_MONITOR_FACTORY_VERSION = "10.5.3";

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
            )
    });
}
