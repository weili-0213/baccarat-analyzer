/**
 * Baccarat Analyzer V6.0
 * tests/casinoEngine.test.js
 */

import CasinoEngine, {
    CASINO_ENGINE_VERSION,
    CasinoEngineState,
    CasinoEngineEvent
} from "../casino/CasinoEngine.js";

import {
    CASINO_ENGINE_FACTORY_VERSION
} from "../casino/createCasinoEngine.js";

import CasinoEngineRuntimeAdapter, {
    CASINO_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/CasinoEngineRuntimeAdapter.js";


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
        deckCount,
        cards,
        shuffled: false,

        get remaining() {
            return this.cards.length;
        },

        create() {
            return this;
        },

        shuffle() {
            this.shuffled = true;
            return this;
        },

        draw() {
            return this.cards.pop();
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


function createRound({
    shoe,
    roundNumber,
    shoeNumber,
    input
}) {
    const cards = [];

    return {
        roundNumber,
        shoeNumber,
        input,

        draw(target) {
            const card =
                shoe.draw();

            cards.push({
                target,
                card
            });

            return card;
        },

        complete(result = {}) {
            return {
                winner:
                    result.winner ??
                    "Player",

                cards:
                    [...cards]
            };
        }
    };
}


export default async function casinoEngineTest() {
    const messages = [];

    assert(
        CASINO_ENGINE_VERSION ===
            "6.0.0" &&
        CASINO_ENGINE_FACTORY_VERSION ===
            "6.0.0" &&
        CASINO_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "6.0.0",
        "V6.0 Casino Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.0 Casino Engine 版本正確"
    );

    const events = [];

    const engine =
        new CasinoEngine({
            shoeFactory:
                createShoe,

            burnFactory:
                createBurn,

            roundFactory:
                createRound,

            resultFactory:
                ({
                    rawResult,
                    shoeNumber,
                    roundNumber
                }) => ({
                    ...rawResult,
                    shoeNumber,
                    roundNumber
                }),

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            options: {
                deckCount: 8,
                autoBurn: true,
                minimumCards: 6
            }
        });

    assert(
        engine.state ===
            CasinoEngineState.IDLE,
        "Casino Engine initial state 錯誤"
    );

    await engine.initialize();

    assert(
        engine.state ===
            CasinoEngineState.READY &&
        engine.summary
            .shoeNumber === 1 &&
        engine.summary
            .remainingCards === 414 &&
        engine.shoe.shuffled ===
            true,
        "Casino Engine initialize 錯誤"
    );

    messages.push(
        "✓ Shoe 建立、洗牌與 Burn 正確"
    );

    const round =
        await engine.startRound({
            table:
                "A"
        });

    assert(
        engine.state ===
            CasinoEngineState.ROUND_ACTIVE &&
        engine.summary
            .roundNumber === 1 &&
        round.roundNumber === 1,
        "startRound() 錯誤"
    );

    messages.push(
        "✓ startRound() 正確"
    );

    const playerCard =
        await engine.drawCard(
            "player"
        );

    const bankerCard =
        await engine.drawCard(
            "banker"
        );

    assert(
        playerCard &&
        bankerCard &&
        engine.summary
            .remainingCards === 412,
        "drawCard() 錯誤"
    );

    messages.push(
        "✓ drawCard() 正確"
    );

    const result =
        await engine.completeRound({
            winner:
                "Banker"
        });

    assert(
        result.winner ===
            "Banker" &&
        result.shoeNumber === 1 &&
        result.roundNumber === 1 &&
        result.cards.length === 2 &&
        engine.state ===
            CasinoEngineState.READY &&
        engine.summary
            .completedRoundCount === 1 &&
        engine.summary
            .hasLastResult === true,
        "completeRound() 錯誤"
    );

    messages.push(
        "✓ completeRound() 與 Result 正確"
    );

    const adapter =
        new CasinoEngineRuntimeAdapter({
            engine
        });

    await adapter.start();

    await adapter.startRound();

    await engine.drawCard(
        "player"
    );

    await engine.drawCard(
        "banker"
    );

    const adapterResult =
        await adapter.completeRound({
            winner:
                "Player"
        });

    assert(
        adapterResult.winner ===
            "Player" &&
        adapter.summary.engine
            .completedRoundCount === 2,
        "CasinoEngine Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    await engine.reset({
        deckCount: 6
    });

    assert(
        engine.state ===
            CasinoEngineState.READY &&
        engine.summary
            .shoeNumber === 2 &&
        engine.summary
            .roundNumber === 0 &&
        engine.summary
            .completedRoundCount === 0 &&
        engine.summary
            .remainingCards === 310,
        "reset()／New Shoe 錯誤"
    );

    messages.push(
        "✓ reset() 與 New Shoe 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                CasinoEngineEvent.SHOE_CREATED
        ) &&
        events.some(
            event =>
                event.type ===
                CasinoEngineEvent.SHOE_BURNED
        ) &&
        events.some(
            event =>
                event.type ===
                CasinoEngineEvent.ROUND_STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                CasinoEngineEvent.ROUND_COMPLETED
        ),
        "Casino Engine Events 錯誤"
    );

    messages.push(
        "✓ Casino Engine Events 正確"
    );

    assert(
        engine.summary.version ===
            "6.0.0" &&
        engine.summary.lastError ===
            null &&
        engine.summary.hasShoe ===
            true,
        "Casino Engine summary 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            CasinoEngineState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.hasShoe ===
            false,
        "Casino Engine destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Casino Engine V6.0 測試完成

Engine State：通過
Shoe Lifecycle：通過
Burn：通過
Round Lifecycle：通過
Draw Card：通過
Round Result：通過
Runtime Adapter：通過
Events：通過
New Shoe：通過
Lifecycle：通過
`;
}
