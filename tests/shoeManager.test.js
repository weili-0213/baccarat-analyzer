/**
 * Baccarat Analyzer V6.3
 * tests/shoeManager.test.js
 */

import ShoeManager, {
    SHOE_MANAGER_VERSION,
    ShoeEvent
} from "../casino/shoe/ShoeManager.js";

import {
    SHOE_STATE_VERSION,
    ShoeState
} from "../casino/shoe/ShoeState.js";

import ShoeHistory, {
    SHOE_HISTORY_VERSION
} from "../casino/shoe/ShoeHistory.js";

import ShoeStatistics, {
    SHOE_STATISTICS_VERSION
} from "../casino/shoe/ShoeStatistics.js";

import ShoeManagerAdapter, {
    SHOE_MANAGER_ADAPTER_VERSION
} from "../casino/shoe/ShoeManagerAdapter.js";

import {
    SHOE_MANAGER_FACTORY_VERSION
} from "../casino/shoe/createShoeManager.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createShoe({
    deckCount
}) {
    const cards =
        Array.from(
            {
                length:
                    deckCount * 52
            },
            (_, index) =>
                `C${index + 1}`
        );

    return {
        cards,
        shuffled: false,

        create() {
            return this;
        },

        shuffle() {
            this.shuffled =
                true;

            return this;
        },

        draw() {
            return this.cards.pop();
        },

        get remaining() {
            return this.cards.length;
        }
    };
}


function createBurn({
    shoe
}) {
    return {
        execute() {
            const indicator =
                shoe.draw();

            const hidden =
                shoe.draw();

            return {
                indicator,
                amount: 1,
                hidden: [
                    hidden
                ]
            };
        }
    };
}


export default async function shoeManagerTest() {
    const messages = [];

    assert(
        SHOE_MANAGER_VERSION ===
            "6.3.0" &&
        SHOE_STATE_VERSION ===
            "6.3.0" &&
        SHOE_HISTORY_VERSION ===
            "6.3.0" &&
        SHOE_STATISTICS_VERSION ===
            "6.3.0" &&
        SHOE_MANAGER_ADAPTER_VERSION ===
            "6.3.0" &&
        SHOE_MANAGER_FACTORY_VERSION ===
            "6.3.0",
        "V6.3 Shoe Manager 版本錯誤"
    );

    messages.push(
        "✓ V6.3 Shoe Manager 版本正確"
    );

    let now = 10;

    const events = [];

    const manager =
        new ShoeManager({
            shoeFactory:
                createShoe,

            burnFactory:
                createBurn,

            history:
                new ShoeHistory({
                    limit:
                        10
                }),

            statistics:
                new ShoeStatistics(),

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            clock:
                () => now++,

            options: {
                deckCount:
                    8,

                cutCardRemaining:
                    10,

                minimumRoundCards:
                    6
            }
        });

    assert(
        manager.state ===
            ShoeState.IDLE,
        "Shoe Manager initial state 錯誤"
    );

    await manager.create();

    assert(
        manager.state ===
            ShoeState.READY &&
        manager.summary
            .shoeNumber === 1 &&
        manager.summary
            .remainingCards === 414 &&
        manager.shoe.shuffled ===
            true &&
        manager.summary.hasBurn ===
            true,
        "New Shoe／Shuffle／Burn 錯誤"
    );

    messages.push(
        "✓ New Shoe、Shuffle 與 Burn 正確"
    );

    const roundInfo =
        manager.beginRound();

    assert(
        roundInfo.shoeNumber === 1 &&
        roundInfo.roundNumber === 1 &&
        manager.state ===
            ShoeState.IN_PLAY,
        "beginRound() 錯誤"
    );

    manager.recordRound({
        winner:
            "Player",

        playerPair:
            true,

        bankerPair:
            false,

        natural:
            false,

        cardsUsed:
            4
    });

    assert(
        manager.state ===
            ShoeState.READY &&
        manager.summary.statistics
            .roundCount === 1 &&
        manager.summary.statistics
            .winners.Player === 1 &&
        manager.summary.statistics
            .playerPairs === 1 &&
        manager.summary.statistics
            .cardsUsed === 4,
        "Round Counter 或 Shoe Statistics 錯誤"
    );

    messages.push(
        "✓ Round Counter 與 Shoe Statistics 正確"
    );

    while (
        manager.shoe.cards.length >
        10
    ) {
        manager.shoe.draw();
    }

    manager.beginRound();

    manager.recordRound({
        winner:
            "Banker",
        natural:
            true,
        cardsUsed:
            4
    });

    assert(
        manager.state ===
            ShoeState.CUT_REACHED &&
        manager.summary.cutReached ===
            true &&
        manager.summary.needsNewShoe ===
            true &&
        manager.summary.canStartRound ===
            false,
        "Cut Card 或 Need New Shoe 錯誤"
    );

    messages.push(
        "✓ Cut Card 與 Need New Shoe 正確"
    );

    const completed =
        manager.complete(
            "cut-card"
        );

    assert(
        completed.completed ===
            true &&
        completed.roundCount ===
            2 &&
        manager.state ===
            ShoeState.COMPLETED &&
        manager.summary.history
            .count === 1 &&
        manager.history.latest()
            .reason === "cut-card",
        "Shoe complete 或 History 錯誤"
    );

    messages.push(
        "✓ Shoe Complete 與 History 正確"
    );

    const adapter =
        new ShoeManagerAdapter({
            manager
        });

    await adapter.reset({
        deckCount:
            6
    });

    assert(
        adapter.remaining === 310 &&
        adapter.summary.manager
            .shoeNumber === 2 &&
        adapter.summary.manager
            .roundNumber === 0 &&
        adapter.summary.manager
            .history.count === 1,
        "ShoeManagerAdapter 或 reset 錯誤"
    );

    messages.push(
        "✓ ShoeManagerAdapter 與 Reset 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                ShoeEvent.CREATED
        ) &&
        events.some(
            event =>
                event.type ===
                ShoeEvent.SHUFFLED
        ) &&
        events.some(
            event =>
                event.type ===
                ShoeEvent.BURNED
        ) &&
        events.some(
            event =>
                event.type ===
                ShoeEvent.ROUND_RECORDED
        ) &&
        events.some(
            event =>
                event.type ===
                ShoeEvent.CUT_REACHED
        ) &&
        events.some(
            event =>
                event.type ===
                ShoeEvent.COMPLETED
        ),
        "Shoe Events 錯誤"
    );

    messages.push(
        "✓ Shoe Events 正確"
    );

    assert(
        manager.summary.version ===
            "6.3.0" &&
        manager.summary.lastError ===
            null &&
        manager.summary.hasShoe ===
            true,
        "Shoe summary 錯誤"
    );

    manager.destroy();

    assert(
        manager.state ===
            ShoeState.DESTROYED &&
        manager.summary.destroyed ===
            true &&
        manager.summary.hasShoe ===
            false,
        "Shoe destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Shoe Manager V6.3 測試完成

New Shoe：通過
Shuffle：通過
Burn：通過
Remaining Cards：通過
Round Counter：通過
Cut Card：通過
Shoe Statistics：通過
Need New Shoe：通過
History：通過
Adapter：通過
Lifecycle：通過
`;
}
