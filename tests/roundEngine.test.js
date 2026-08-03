/**
 * Baccarat Analyzer V6.2
 * tests/roundEngine.test.js
 */

import RoundEngine, {
    ROUND_ENGINE_VERSION,
    RoundEvent
} from "../casino/round/RoundEngine.js";

import {
    ROUND_STATE_VERSION,
    RoundState
} from "../casino/round/RoundState.js";

import RoundResultBuilder, {
    ROUND_RESULT_BUILDER_VERSION
} from "../casino/round/RoundResultBuilder.js";

import RoundHistory, {
    ROUND_HISTORY_VERSION
} from "../casino/round/RoundHistory.js";

import RoundEngineAdapter, {
    ROUND_ENGINE_ADAPTER_VERSION
} from "../casino/round/RoundEngineAdapter.js";

import {
    ROUND_ENGINE_FACTORY_VERSION
} from "../casino/round/createRoundEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


class TestHand {
    constructor(cards = []) {
        this.cards =
            [...cards];
    }

    getCards() {
        return [
            ...this.cards
        ];
    }

    get value() {
        return this.cards
            .reduce(
                (
                    total,
                    card
                ) =>
                    total +
                    card.value,
                0
            ) % 10;
    }
}


function createDealer() {
    return {
        playerHand:
            null,

        bankerHand:
            null,

        timeline:
            [],

        runCount:
            0,

        async run({
            context
        }) {
            this.runCount++;

            this.playerHand =
                new TestHand([
                    {
                        rank: "7",
                        pairValue: "7",
                        value: 7
                    },
                    {
                        rank: "2",
                        pairValue: "2",
                        value: 2
                    }
                ]);

            this.bankerHand =
                new TestHand([
                    {
                        rank: "3",
                        pairValue: "3",
                        value: 3
                    },
                    {
                        rank: "3",
                        pairValue: "3",
                        value: 3
                    },
                    {
                        rank: "1",
                        pairValue: "A",
                        value: 1
                    }
                ]);

            this.timeline = [
                {
                    action:
                        "initial-deal"
                },
                {
                    action:
                        "banker-draw"
                }
            ];

            return {
                winner:
                    "Player",

                reason:
                    "rules-complete",

                context
            };
        },

        resetCount:
            0,

        reset() {
            this.resetCount++;
        },

        destroyed:
            false,

        destroy() {
            this.destroyed =
                true;
        }
    };
}


export default async function roundEngineTest() {
    const messages = [];

    assert(
        ROUND_ENGINE_VERSION ===
            "6.2.0" &&
        ROUND_STATE_VERSION ===
            "6.2.0" &&
        ROUND_RESULT_BUILDER_VERSION ===
            "6.2.0" &&
        ROUND_HISTORY_VERSION ===
            "6.2.0" &&
        ROUND_ENGINE_ADAPTER_VERSION ===
            "6.2.0" &&
        ROUND_ENGINE_FACTORY_VERSION ===
            "6.2.0",
        "V6.2 Round Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.2 Round Engine 版本正確"
    );

    let now = 100;

    const events = [];

    const history =
        new RoundHistory({
            limit:
                10
        });

    const resultBuilder =
        new RoundResultBuilder({
            sideBetResolver:
                result => ({
                    playerPair:
                        result.playerPair,
                    bankerPair:
                        result.bankerPair,
                    natural:
                        result.natural
                })
        });

    const dealer =
        createDealer();

    const engine =
        new RoundEngine({
            dealer,
            resultBuilder,
            history,

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            clock:
                () => now++
        });

    assert(
        engine.state ===
            RoundState.IDLE,
        "Round Engine initial state 錯誤"
    );

    const result =
        await engine.run({
            shoe: {
                remaining:
                    400
            },

            shoeNumber:
                1,

            roundNumber:
                1,

            metadata: {
                table:
                    "A"
            },

            context: {
                mode:
                    "live"
            }
        });

    assert(
        result.roundId ===
            "shoe-1-round-1" &&
        result.shoeNumber ===
            1 &&
        result.roundNumber ===
            1 &&
        result.winner ===
            "Player" &&
        result.playerValue ===
            9 &&
        result.bankerValue ===
            7 &&
        result.playerPair ===
            false &&
        result.bankerPair ===
            true &&
        result.anyPair ===
            true &&
        result.natural ===
            false &&
        result.sideBets
            .bankerPair ===
            true,
        "Round Result 錯誤"
    );

    messages.push(
        "✓ Round Start、Dealer Integration 與 Result 正確"
    );

    assert(
        engine.state ===
            RoundState.COMPLETED &&
        engine.summary
            .hasDealerResult ===
            true &&
        engine.summary
            .hasResult ===
            true &&
        engine.summary
            .history.count ===
            1 &&
        history.latest()
            .timeline.length ===
            2,
        "Round History 或狀態錯誤"
    );

    messages.push(
        "✓ Round History 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                RoundEvent.STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                RoundEvent.DEALER_COMPLETED
        ) &&
        events.some(
            event =>
                event.type ===
                RoundEvent.COMPLETED
        ),
        "Round Events 錯誤"
    );

    messages.push(
        "✓ Round Events 正確"
    );

    engine.reset();

    assert(
        engine.state ===
            RoundState.IDLE &&
        dealer.resetCount ===
            1 &&
        engine.summary
            .hasResult ===
            false,
        "Round reset 錯誤"
    );

    messages.push(
        "✓ Round Reset 正確"
    );

    engine.start({
        shoeNumber:
            1,
        roundNumber:
            2
    });

    engine.cancel(
        "manual"
    );

    assert(
        engine.state ===
            RoundState.CANCELLED,
        "Round cancel 錯誤"
    );

    messages.push(
        "✓ Round Cancel 正確"
    );

    const adapterEngine =
        new RoundEngine({
            dealer:
                createDealer(),

            resultBuilder:
                new RoundResultBuilder()
        });

    const adapter =
        new RoundEngineAdapter({
            roundEngine:
                adapterEngine,

            shoe: {
                remaining:
                    350
            },

            shoeNumber:
                2,

            roundNumber:
                4,

            input: {
                table:
                    "B"
            }
        });

    const adapterResult =
        await adapter.complete({
            source:
                "casino-engine"
        });

    assert(
        adapterResult.roundId ===
            "shoe-2-round-4" &&
        adapter.summary.completed ===
            true &&
        adapter.summary.hasResult ===
            true,
        "RoundEngineAdapter 錯誤"
    );

    messages.push(
        "✓ RoundEngineAdapter 正確"
    );

    assert(
        engine.summary.version ===
            "6.2.0" &&
        engine.summary.lastError ===
            null &&
        engine.summary.history.count ===
            1,
        "Round summary 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            RoundState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.history.count ===
            0 &&
        dealer.destroyed ===
            true,
        "Round destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Round Engine V6.2 測試完成

Round Start：通過
Dealer Integration：通過
Winner：通過
Pair：通過
Natural：通過
Side Bets：通過
Round Result：通過
Round History：通過
Events：通過
Adapter：通過
Lifecycle：通過
`;
}
