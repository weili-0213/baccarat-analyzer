/**
 * Baccarat Analyzer V10.3
 * Path: runtime/game/createAIGameRuntimeIntegration.js
 * Purpose: Factory for V10.3 AI Game Runtime Integration.
 */
import AIGameRuntimeIntegration
    from "./AIGameRuntimeIntegration.js";

import BaccaratGameGateway
    from "./BaccaratGameGateway.js";

import ShoeStateCollector
    from "./ShoeStateCollector.js";

import RoundStateCollector
    from "./RoundStateCollector.js";

import GameAnalysisInputBuilder
    from "./GameAnalysisInputBuilder.js";

import GameSettlementMapper
    from "./GameSettlementMapper.js";

import GameRuntimeHistory
    from "./GameRuntimeHistory.js";

export const AI_GAME_RUNTIME_INTEGRATION_FACTORY_VERSION = "10.3.0";

export default function createAIGameRuntimeIntegration({
    game,
    liveRuntime,
    roadmapProvider = null,
    bankrollProvider = null,
    settingsProvider = null,
    eventBus = null,
    clock = () => Date.now()
} = {}) {
    return new AIGameRuntimeIntegration({
        game,
        liveRuntime,
        gameGateway:
            new BaccaratGameGateway({
                game
            }),
        shoeCollector:
            new ShoeStateCollector(),
        roundCollector:
            new RoundStateCollector(),
        inputBuilder:
            new GameAnalysisInputBuilder(),
        settlementMapper:
            new GameSettlementMapper(),
        roadmapProvider,
        bankrollProvider,
        settingsProvider,
        history:
            new GameRuntimeHistory(),
        eventBus,
        clock
    });
}
