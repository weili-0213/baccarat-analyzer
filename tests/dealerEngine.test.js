/**
 * Baccarat Analyzer V6.1
 * tests/dealerEngine.test.js
 */

import DealerEngine, {
    DEALER_ENGINE_VERSION,
    DealerState,
    DealerEvent
} from "../casino/dealer/DealerEngine.js";

import DealerRoundAdapter, {
    DEALER_ROUND_ADAPTER_VERSION
} from "../casino/dealer/DealerRoundAdapter.js";

import {
    DEALER_ENGINE_FACTORY_VERSION
} from "../casino/dealer/createDealerEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


class TestHand {
    constructor() {
        this.cards = [];
    }

    add(card) {
        this.cards.push(card);
        return this;
    }

    getCards() {
        return [...this.cards];
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


function createShoe(values) {
    return {
        cards:
            [...values]
                .reverse()
                .map(
                    (
                        value,
                        index
                    ) => ({
                        id:
                            `${value}-${index}`,
                        value
                    })
                ),

        draw() {
            return this.cards.pop();
        },

        get remaining() {
            return this.cards.length;
        }
    };
}


function resolveResult({
    playerHand,
    bankerHand,
    reason,
    timeline
}) {
    const playerValue =
        playerHand.value;

    const bankerValue =
        bankerHand.value;

    let winner = "Tie";

    if (
        playerValue >
        bankerValue
    ) {
        winner = "Player";
    }
    else if (
        bankerValue >
        playerValue
    ) {
        winner = "Banker";
    }

    return {
        winner,
        playerValue,
        bankerValue,
        reason,
        timelineCount:
            timeline.length
    };
}


export default async function dealerEngineTest() {
    const messages = [];

    assert(
        DEALER_ENGINE_VERSION ===
            "6.1.0" &&
        DEALER_ROUND_ADAPTER_VERSION ===
            "6.1.0" &&
        DEALER_ENGINE_FACTORY_VERSION ===
            "6.1.0",
        "V6.1 Dealer Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.1 Dealer Engine 版本正確"
    );

    const events = [];

    const dealer =
        new DealerEngine({
            handFactory:
                () =>
                    new TestHand(),

            playerRule:
                ({ hand }) => ({
                    draw:
                        hand.value <= 5,
                    reason:
                        hand.value <= 5
                            ? "player-draw"
                            : "player-stand"
                }),

            bankerRule:
                ({
                    hand,
                    playerThirdCard
                }) => ({
                    draw:
                        hand.value <= 2 ||
                        (
                            hand.value === 3 &&
                            playerThirdCard
                                ?.value !== 8
                        ),
                    reason:
                        "banker-rule"
                }),

            resultResolver:
                resolveResult,

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            }
        });

    const naturalShoe =
        createShoe([
            4,
            3,
            5,
            4
        ]);

    const naturalResult =
        await dealer.run({
            shoe:
                naturalShoe
        });

    assert(
        naturalResult.reason ===
            "natural" &&
        naturalResult.playerValue ===
            9 &&
        naturalResult.bankerValue ===
            7 &&
        dealer.state ===
            DealerState.COMPLETED &&
        dealer.summary
            .playerCardCount ===
            2 &&
        dealer.summary
            .bankerCardCount ===
            2,
        "Natural 流程錯誤"
    );

    messages.push(
        "✓ Initial Deal 與 Natural 正確"
    );

    dealer.reset();

    const ruleShoe =
        createShoe([
            2,
            1,
            3,
            1,
            4,
            5
        ]);

    const ruleResult =
        await dealer.run({
            shoe:
                ruleShoe
        });

    assert(
        dealer.summary
            .playerCardCount ===
            3 &&
        dealer.summary
            .bankerCardCount ===
            3 &&
        ruleResult.reason ===
            "rules-complete" &&
        ruleResult.playerValue ===
            9 &&
        ruleResult.bankerValue ===
            7 &&
        ruleResult.winner ===
            "Player",
        "Third Card 流程錯誤"
    );

    messages.push(
        "✓ Player／Banker Third Card Rule 正確"
    );

    assert(
        dealer.timeline.some(
            entry =>
                entry.action ===
                "player-draw"
        ) &&
        dealer.timeline.some(
            entry =>
                entry.action ===
                "banker-draw"
        ) &&
        dealer.timeline.some(
            entry =>
                entry.action ===
                "round-complete"
        ),
        "Dealer Timeline 錯誤"
    );

    messages.push(
        "✓ Dealer Timeline 正確"
    );

    const adapterDealer =
        new DealerEngine({
            handFactory:
                () =>
                    new TestHand(),

            playerRule:
                ({ hand }) => ({
                    draw:
                        hand.value <= 5
                }),

            bankerRule:
                ({ hand }) => ({
                    draw:
                        hand.value <= 5
                }),

            resultResolver:
                resolveResult
        });

    const adapter =
        new DealerRoundAdapter({
            dealer:
                adapterDealer,

            shoe:
                createShoe([
                    2,
                    2,
                    3,
                    3,
                    4,
                    4
                ])
        });

    const adapterResult =
        await adapter.complete({
            table:
                "A"
        });

    assert(
        adapterResult &&
        adapter.summary.completed ===
            true &&
        adapter.summary.hasResult ===
            true,
        "DealerRoundAdapter 錯誤"
    );

    messages.push(
        "✓ DealerRoundAdapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                DealerEvent.INITIAL_DEAL_STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                DealerEvent.NATURAL_FOUND
        ) &&
        events.some(
            event =>
                event.type ===
                DealerEvent.PLAYER_DREW
        ) &&
        events.some(
            event =>
                event.type ===
                DealerEvent.BANKER_DREW
        ) &&
        events.some(
            event =>
                event.type ===
                DealerEvent.ROUND_COMPLETED
        ),
        "Dealer Events 錯誤"
    );

    messages.push(
        "✓ Dealer Events 正確"
    );

    assert(
        dealer.summary.version ===
            "6.1.0" &&
        dealer.summary.hasResult ===
            true &&
        dealer.summary.lastError ===
            null,
        "Dealer summary 錯誤"
    );

    dealer.destroy();

    assert(
        dealer.state ===
            DealerState.DESTROYED &&
        dealer.summary.destroyed ===
            true,
        "Dealer destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Dealer Engine V6.1 測試完成

Initial Deal：通過
Natural：通過
Player Rule：通過
Banker Rule：通過
Third Card：通過
Timeline：通過
Round Adapter：通過
Events：通過
Lifecycle：通過
`;
}
