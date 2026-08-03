/**
 * Baccarat Analyzer V5.1
 * runtime/createCasinoRuntime.js
 *
 * Production runtime composition helper.
 */

import CasinoRuntime
    from "./CasinoRuntime.js";

import GameRuntimeAdapter
    from "./adapters/GameRuntimeAdapter.js";

import AnalyzerRuntimeAdapter
    from "./adapters/AnalyzerRuntimeAdapter.js";

import SessionRuntimeAdapter
    from "./adapters/SessionRuntimeAdapter.js";

import DashboardRuntimeAdapter
    from "./adapters/DashboardRuntimeAdapter.js";


export const RUNTIME_ADAPTERS_VERSION = "5.1.0";


export default function createCasinoRuntime({
    game,
    analyzer,
    sessionStore,
    dashboard = null,
    eventBus = null,
    clock = undefined,
    runtimeOptions = {},
    gameAdapterOptions = {},
    analyzerAdapterOptions = {}
} = {}) {
    const gameAdapter =
        game instanceof GameRuntimeAdapter
            ? game
            : new GameRuntimeAdapter({
                game,
                ...gameAdapterOptions
            });

    const analyzerAdapter =
        analyzer instanceof
            AnalyzerRuntimeAdapter
            ? analyzer
            : new AnalyzerRuntimeAdapter({
                analyzer,
                ...analyzerAdapterOptions
            });

    const sessionAdapter =
        sessionStore instanceof
            SessionRuntimeAdapter
            ? sessionStore
            : new SessionRuntimeAdapter({
                store:
                    sessionStore
            });

    const dashboardAdapter =
        dashboard === null
            ? null
            : dashboard instanceof
                DashboardRuntimeAdapter
                ? dashboard
                : new DashboardRuntimeAdapter({
                    dashboard
                });

    const runtime =
        new CasinoRuntime({
            game:
                gameAdapter,
            analyzer:
                analyzerAdapter,
            sessionStore:
                sessionAdapter,
            dashboard:
                dashboardAdapter,
            eventBus,
            clock:
                clock ??
                (() =>
                    new Date()
                        .toISOString()
                ),
            options:
                runtimeOptions
        });

    runtime.adapters = {
        game:
            gameAdapter,
        analyzer:
            analyzerAdapter,
        session:
            sessionAdapter,
        dashboard:
            dashboardAdapter
    };

    return runtime;
}
