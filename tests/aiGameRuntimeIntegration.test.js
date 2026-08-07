/**
 * Baccarat Analyzer V10.3
 * Path: tests/aiGameRuntimeIntegration.test.js
 * Purpose: Full V10.3 syntax-compatible Runtime Integration Test.
 */
import {
    GAME_RUNTIME_STATE_VERSION,
    GameRuntimeState,
    GameRuntimeAction
} from "../runtime/game/GameRuntimeState.js";

import GameRuntimeContext, {
    GAME_RUNTIME_CONTEXT_VERSION
} from "../runtime/game/GameRuntimeContext.js";

import BaccaratGameGateway, {
    BACCARAT_GAME_GATEWAY_VERSION
} from "../runtime/game/BaccaratGameGateway.js";

import ShoeStateCollector, {
    SHOE_STATE_COLLECTOR_VERSION
} from "../runtime/game/ShoeStateCollector.js";

import RoundStateCollector, {
    ROUND_STATE_COLLECTOR_VERSION
} from "../runtime/game/RoundStateCollector.js";

import GameAnalysisInputBuilder, {
    GAME_ANALYSIS_INPUT_BUILDER_VERSION
} from "../runtime/game/GameAnalysisInputBuilder.js";

import GameSettlementMapper, {
    GAME_SETTLEMENT_MAPPER_VERSION
} from "../runtime/game/GameSettlementMapper.js";

import GameRuntimeHistory, {
    GAME_RUNTIME_HISTORY_VERSION
} from "../runtime/game/GameRuntimeHistory.js";

import AIGameRuntimeIntegration, {
    AI_GAME_RUNTIME_INTEGRATION_VERSION,
    GameRuntimeEvent
} from "../runtime/game/AIGameRuntimeIntegration.js";

import GameRuntimeAdapter, {
    GAME_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/GameRuntimeAdapter.js";

import {
    AI_GAME_RUNTIME_INTEGRATION_FACTORY_VERSION
} from "../runtime/game/createAIGameRuntimeIntegration.js";

const assert = (
    condition,
    message
) => {
    if (!condition) {
        throw new Error(message);
    }
};

export default async function aiGameRuntimeIntegrationTest() {
    const messages = [];

    assert(
        [
            GAME_RUNTIME_STATE_VERSION,
            GAME_RUNTIME_CONTEXT_VERSION,
            BACCARAT_GAME_GATEWAY_VERSION,
            SHOE_STATE_COLLECTOR_VERSION,
            ROUND_STATE_COLLECTOR_VERSION,
            GAME_ANALYSIS_INPUT_BUILDER_VERSION,
            GAME_SETTLEMENT_MAPPER_VERSION,
            GAME_RUNTIME_HISTORY_VERSION,
            AI_GAME_RUNTIME_INTEGRATION_VERSION,
            GAME_RUNTIME_ADAPTER_VERSION,
            AI_GAME_RUNTIME_INTEGRATION_FACTORY_VERSION
        ].every(
            version =>
                version === "10.3.0"
        ),
        "V10.3 AI Game Runtime Integration 版本錯誤"
    );

    assert(
        GameRuntimeAction.ANALYZE ===
            "analyze",
        "Game Runtime Action 錯誤"
    );

    messages.push(
        "✓ V10.3 AI Game Runtime Integration 版本正確"
    );

    const context =
        new GameRuntimeContext({
            shoeId:
                "shoe-1",
            roundId:
                "round-1",
            roundNumber:
                1
        });

    assert(
        context.shoeId ===
            "shoe-1" &&
        context.roundNumber ===
            1,
        "Game Runtime Context 錯誤"
    );

    messages.push(
        "✓ Game Runtime Context 正確"
    );

    const fakeCards = [
        { rank: "A", suit: "S" },
        { rank: "K", suit: "H" }
    ];

    const fakeShoe = {
        deckCount:
            8,
        cards:
            [...fakeCards],
        discarded: [
            { rank: "9", suit: "D" }
        ],
        burned: [
            { rank: "5", suit: "C" }
        ],
        get total() {
            return 416;
        },
        get remaining() {
            return this.cards.length;
        },
        get used() {
            return this.discarded.length;
        },
        get remainingRatio() {
            return this.remaining / this.total;
        },
        peek() {
            return [...this.cards];
        },
        resetCalled:
            false,
        reset() {
            this.resetCalled =
                true;
            return this;
        }
    };

    const playerHand = {
        cards: [
            { rank: "4", suit: "S" },
            { rank: "5", suit: "H" }
        ],
        value:
            9,
        isNatural:
            true,
        isPair:
            false,
        getCards() {
            return [...this.cards];
        }
    };

    const bankerHand = {
        cards: [
            { rank: "3", suit: "D" },
            { rank: "4", suit: "C" }
        ],
        value:
            7,
        isNatural:
            false,
        isPair:
            false,
        getCards() {
            return [...this.cards];
        }
    };

    const fakeRound = {
        roundId:
            "game-round-1",
        status:
            "completed",
        completed:
            true,
        player:
            playerHand,
        banker:
            bankerHand
    };

    const fakeResult = {
        winner:
            "Player",
        playerValue:
            9,
        bankerValue:
            7,
        playerPair:
            false,
        bankerPair:
            false,
        natural:
            true
    };

    const fakeGame = {
        shoe:
            fakeShoe,
        currentRound:
            fakeRound,
        lastResult:
            fakeResult,
        statistics: {
            roundCount:
                1,
            bankerWins:
                0,
            playerWins:
                1,
            ties:
                0
        },
        toJSON() {
            return {
                active:
                    true,
                roundId:
                    this.currentRound?.roundId ??
                    null
            };
        }
    };

    const gameGateway =
        new BaccaratGameGateway({
            game:
                fakeGame
        });

    assert(
        gameGateway.getShoe() ===
            fakeShoe &&
        gameGateway.getRound() ===
            fakeRound &&
        gameGateway.getLastResult() ===
            fakeResult &&
        gameGateway.getStatistics()
            .roundCount ===
            1,
        "Baccarat Game Gateway 錯誤"
    );

    messages.push(
        "✓ Baccarat Game Gateway 正確"
    );

    const shoeState =
        new ShoeStateCollector()
            .collect(
                fakeShoe
            );

    assert(
        shoeState.deckCount ===
            8 &&
        shoeState.total ===
            416 &&
        shoeState.remaining ===
            2 &&
        shoeState.used ===
            1 &&
        shoeState.burned.length ===
            1,
        "Shoe State Collector 錯誤"
    );

    messages.push(
        "✓ Shoe State Collector 正確"
    );

    const roundCollector =
        new RoundStateCollector();

    const roundState =
        roundCollector.collect(
            fakeRound
        );

    const roundResult =
        roundCollector.collectResult(
            fakeResult
        );

    assert(
        roundState.roundId ===
            "game-round-1" &&
        roundState.player.value ===
            9 &&
        roundState.banker.value ===
            7 &&
        roundResult.winner ===
            "Player",
        "Round State Collector 錯誤"
    );

    messages.push(
        "✓ Round State Collector 正確"
    );

    const analysisInput =
        new GameAnalysisInputBuilder()
            .build({
                shoeId:
                    "shoe-live",
                roundId:
                    "round-live-1",
                roundNumber:
                    1,
                shoeState,
                roundState,
                statistics:
                    fakeGame.statistics,
                roadmap: {
                    bigRoad: [
                        "P"
                    ]
                },
                bankroll: {
                    balance:
                        1000
                },
                settings: {
                    risk:
                        "normal"
                }
            });

    assert(
        analysisInput.observation.shoe.remaining ===
            2 &&
        analysisInput.observation.remainingCards.length ===
            2 &&
        analysisInput.statistics.roundCount ===
            1,
        "Game Analysis Input Builder 錯誤"
    );

    messages.push(
        "✓ Game Analysis Input Builder 正確"
    );

    const settlementInput =
        new GameSettlementMapper()
            .map({
                roundResult:
                    fakeResult,
                profit:
                    20,
                payout:
                    40,
                stake:
                    20
            });

    assert(
        settlementInput.winner ===
            "Player" &&
        settlementInput.profit ===
            20 &&
        settlementInput.metadata.playerValue ===
            9,
        "Game Settlement Mapper 錯誤"
    );

    messages.push(
        "✓ Game Settlement Mapper 正確"
    );

    const history =
        new GameRuntimeHistory({
            limit:
                10
        });

    history.add({
        type:
            "sync"
    });

    assert(
        history.summary.count ===
            1 &&
        history.latest().type ===
            "sync",
        "Game Runtime History 錯誤"
    );

    messages.push(
        "✓ Game Runtime History 正確"
    );

    const liveCalls = [];

    const liveRuntime = {
        state:
            "idle",
        destroyed:
            false,
        paused:
            false,
        session:
            {
                roundNumber:
                    0
            },

        start({
            shoeId
        }) {
            this.state =
                "ready";
            this.shoeId =
                shoeId;
            liveCalls.push(
                [
                    "start",
                    shoeId
                ]
            );

            return {
                state:
                    "ready"
            };
        },

        beginRound({
            roundId
        }) {
            this.state =
                "round-open";

            this.session.roundNumber++;

            liveCalls.push(
                [
                    "beginRound",
                    roundId
                ]
            );

            return {
                roundId,
                roundNumber:
                    this.session.roundNumber
            };
        },

        async analyze({
            observation
        }) {
            this.state =
                "awaiting-result";

            liveCalls.push(
                [
                    "analyze",
                    observation
                ]
            );

            return {
                action:
                    "continue",
                outputs: {
                    simulation: {
                        probabilities: {
                            Player:
                                0.45,
                            Banker:
                                0.46,
                            Tie:
                                0.09
                        }
                    },
                    prediction: {
                        predictedOutcome:
                            "Banker",
                        confidence:
                            0.72
                    },
                    decision: {
                        recommendation: {
                            action:
                                "bet",
                            bestBet:
                                "Banker"
                        }
                    },
                    strategy: {
                        plan: {
                            action:
                                "bet",
                            betType:
                                "Banker",
                            amount:
                                20
                        }
                    }
                }
            };
        },

        async submitResult(input) {
            this.state =
                "completed";

            liveCalls.push(
                [
                    "submitResult",
                    input
                ]
            );

            return {
                action:
                    "continue",
                outputs: {
                    execution: {
                        action:
                            "execute"
                    },
                    feedback: {
                        action:
                            "update"
                    },
                    learning: {
                        reward: {
                            reward:
                                3
                        }
                    },
                    adaptive: {
                        action:
                            "apply"
                    }
                }
            };
        },

        resetShoe({
            shoeId
        }) {
            this.shoeId =
                shoeId;
            this.session.roundNumber =
                0;

            liveCalls.push(
                [
                    "resetShoe",
                    shoeId
                ]
            );

            return {
                shoeId
            };
        },

        pause() {
            this.paused =
                true;
        },

        resume() {
            this.paused =
                false;
        },

        stop() {
            this.state =
                "stopped";
        },

        reset() {
            this.state =
                "idle";
        },

        destroy() {
            this.destroyed =
                true;
        }
    };

    const events = [];
    let now =
        1000;

    const integration =
        new AIGameRuntimeIntegration({
            game:
                fakeGame,
            liveRuntime,
            roadmapProvider:
                () => ({
                    bigRoad: [
                        "P"
                    ]
                }),
            bankrollProvider:
                () => ({
                    balance:
                        1000
                }),
            settingsProvider:
                () => ({
                    risk:
                        "normal"
                }),
            eventBus: {
                emit(
                    type,
                    payload
                ) {
                    events.push({
                        type,
                        payload
                    });
                }
            },
            clock:
                () => now++
        });

    integration.connect({
        shoeId:
            "shoe-live"
    });

    assert(
        integration.state ===
            GameRuntimeState.READY &&
        integration.summary.connected &&
        integration.summary.shoeId ===
            "shoe-live",
        "Game Runtime Connect 錯誤"
    );

    messages.push(
        "✓ Game Runtime Connect 正確"
    );

    const synced =
        integration.sync();

    assert(
        synced.shoeState.remaining ===
            2 &&
        synced.statistics.roundCount ===
            1 &&
        synced.roadmap.bigRoad[0] ===
            "P",
        "Game Runtime Sync 錯誤"
    );

    messages.push(
        "✓ Game → Shoe → Statistics → Runtime Sync 正確"
    );

    const begun =
        integration.beginRound({
            roundId:
                "round-live-1"
        });

    assert(
        begun.roundId ===
            "round-live-1" &&
        integration.state ===
            GameRuntimeState.ROUND_OPEN &&
        integration.summary.roundNumber ===
            1,
        "Game Runtime Begin Round 錯誤"
    );

    messages.push(
        "✓ Game Runtime Begin Round 正確"
    );

    const analysis =
        await integration
            .analyzeCurrentRound();

    assert(
        analysis.outputs.prediction
            .predictedOutcome ===
            "Banker" &&
        integration.state ===
            GameRuntimeState.AWAITING_RESULT &&
        integration.summary.hasAnalysis,
        "Game Runtime Analyze 錯誤"
    );

    messages.push(
        "✓ Real Shoe State → Live Runtime → AI Analyze 正確"
    );

    const settlement =
        await integration
            .settleCurrentRound({
                roundResult:
                    fakeResult,
                profit:
                    20,
                payout:
                    40,
                stake:
                    20
            });

    assert(
        settlement.outputs.feedback.action ===
            "update" &&
        settlement.outputs.learning.reward.reward ===
            3 &&
        integration.state ===
            GameRuntimeState.READY &&
        integration.summary.hasSettlement,
        "Game Runtime Settlement 錯誤"
    );

    messages.push(
        "✓ RoundResult → Execution → Feedback → Learning → Adaptive 正確"
    );

    const next =
        integration.nextRound({
            roundId:
                "round-live-2"
        });

    assert(
        next.roundId ===
            "round-live-2" &&
        next.roundNumber ===
            2,
        "Game Runtime Next Round 錯誤"
    );

    messages.push(
        "✓ Game Runtime Next Round 正確"
    );

    integration.pause();

    assert(
        integration.state ===
            GameRuntimeState.PAUSED &&
        liveRuntime.paused,
        "Pause 錯誤"
    );

    integration.resume();

    assert(
        integration.state ===
            GameRuntimeState.READY &&
        !liveRuntime.paused,
        "Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const reset =
        integration.resetShoe({
            shoeId:
                "shoe-live-2"
        });

    assert(
        fakeShoe.resetCalled &&
        reset.shoeId ===
            "shoe-live-2" &&
        liveCalls.some(
            call =>
                call[0] ===
                    "resetShoe"
        ),
        "Game Runtime Reset Shoe 錯誤"
    );

    messages.push(
        "✓ BaccaratGame Shoe Reset → Live Runtime Reset 正確"
    );

    integration.beginRound({
        roundId:
            "round-live-3"
    });

    const adapter =
        new GameRuntimeAdapter({
            integration
        });

    const adapterAnalysis =
        await adapter
            .analyzeCurrentRound();

    assert(
        adapterAnalysis &&
        adapter.summary.integration
            .hasAnalysis,
        "Game Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Game Runtime Adapter 正確"
    );

    assert(
        [
            GameRuntimeEvent.CONNECTED,
            GameRuntimeEvent.SYNCED,
            GameRuntimeEvent.ROUND_BEGAN,
            GameRuntimeEvent.ANALYSIS_STARTED,
            GameRuntimeEvent.ANALYSIS_COMPLETED,
            GameRuntimeEvent.RESULT_SUBMITTED,
            GameRuntimeEvent.SETTLEMENT_COMPLETED,
            GameRuntimeEvent.NEXT_ROUND,
            GameRuntimeEvent.SHOE_RESET,
            GameRuntimeEvent.PAUSED,
            GameRuntimeEvent.RESUMED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "Game Runtime Events 錯誤"
    );

    messages.push(
        "✓ Game Runtime Events 正確"
    );

    integration.stop();

    assert(
        integration.state ===
            GameRuntimeState.STOPPED &&
        !integration.summary.connected,
        "Stop 錯誤"
    );

    integration.reset();

    assert(
        integration.state ===
            GameRuntimeState.IDLE &&
        integration.summary.history.count ===
            0,
        "Reset 錯誤"
    );

    integration.destroy();

    assert(
        integration.state ===
            GameRuntimeState.DESTROYED &&
        integration.summary.destroyed &&
        liveRuntime.destroyed,
        "Destroy 錯誤"
    );

    messages.push(
        "✓ Stop、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Game Runtime Integration V10.3 測試完成

Game Runtime State：通過
Game Runtime Context：通過
Baccarat Game Gateway：通過
Shoe State Collector：通過
Round State Collector：通過
Game Analysis Input Builder：通過
Game Settlement Mapper：通過
Game Runtime History：通過
Game Runtime Connect：通過
Game Runtime Sync：通過
Begin Round：通過
Real Game Analyze Flow：通過
Real Round Settlement Flow：通過
Next Round：通過
Reset Shoe：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
