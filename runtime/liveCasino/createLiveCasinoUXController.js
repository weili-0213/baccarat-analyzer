/**
 * Baccarat Analyzer V10.4.4
 * Path: runtime/liveCasino/createLiveCasinoUXController.js
 * Purpose: Factory for live casino UX/performance controller.
 */
import LiveCasinoUXController
    from "./LiveCasinoUXController.js";

import LiveCasinoPerformancePolicy
    from "./LiveCasinoPerformancePolicy.js";

import LiveCasinoDecisionModel
    from "./LiveCasinoDecisionModel.js";

export const LIVE_CASINO_UX_FACTORY_VERSION = "10.4.5";

export default function createLiveCasinoUXController({
    game,
    render = null,
    aiRuntime = null,
    clock = () => Date.now(),
    performance = {}
} = {}) {
    return new LiveCasinoUXController({
        game,
        render,
        aiRuntime,
        clock,
        policy:
            new LiveCasinoPerformancePolicy(
                performance
            ),
        decisionModel:
            new LiveCasinoDecisionModel()
    });
}
