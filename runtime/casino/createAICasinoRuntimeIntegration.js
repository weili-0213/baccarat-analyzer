/**
 * Baccarat Analyzer V10.4
 * Path: runtime/casino/createAICasinoRuntimeIntegration.js
 * Purpose: Factory for V10.4 AI Casino Runtime Integration.
 */
import AICasinoRuntimeIntegration
    from "./AICasinoRuntimeIntegration.js";

import CasinoSessionCoordinator
    from "./CasinoSessionCoordinator.js";

import CasinoRuntimeSynchronizer
    from "./CasinoRuntimeSynchronizer.js";

import CasinoBetCoordinator
    from "./CasinoBetCoordinator.js";

import CasinoDashboardBridge
    from "./CasinoDashboardBridge.js";

import CasinoRuntimeHistory
    from "./CasinoRuntimeHistory.js";

export const AI_CASINO_RUNTIME_INTEGRATION_FACTORY_VERSION = "10.4.0";

export default function createAICasinoRuntimeIntegration({
    legacyRuntime = null,
    gameRuntime,
    sessionStore = null,
    dashboardRuntime = null,
    eventBus = null,
    clock = () => Date.now()
} = {}) {
    return new AICasinoRuntimeIntegration({
        legacyRuntime,
        gameRuntime,
        sessionStore,
        dashboardRuntime,
        sessionCoordinator:
            new CasinoSessionCoordinator({
                clock
            }),
        synchronizer:
            new CasinoRuntimeSynchronizer(),
        betCoordinator:
            new CasinoBetCoordinator({
                legacyRuntime,
                sessionStore,
                dashboardRuntime
            }),
        dashboardBridge:
            new CasinoDashboardBridge({
                dashboardRuntime
            }),
        history:
            new CasinoRuntimeHistory(),
        eventBus,
        clock
    });
}
