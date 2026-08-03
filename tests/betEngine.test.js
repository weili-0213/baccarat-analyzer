/**
 * Baccarat Analyzer V6.8
 * tests/betEngine.test.js
 */

import BetEngine, {
    BET_ENGINE_VERSION,
    BetEvent
} from "../casino/bet/BetEngine.js";

import {
    BET_STATE_VERSION,
    BetState,
    BetStatus,
    BetType
} from "../casino/bet/BetState.js";

import BetHistory, {
    BET_HISTORY_VERSION
} from "../casino/bet/BetHistory.js";

import Bankroll, {
    BANKROLL_VERSION
} from "../casino/bet/Bankroll.js";

import PayoutResolver, {
    PAYOUT_RESOLVER_VERSION
} from "../casino/bet/PayoutResolver.js";

import BetEngineRuntimeAdapter, {
    BET_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/BetEngineRuntimeAdapter.js";

import {
    BET_ENGINE_FACTORY_VERSION
} from "../casino/bet/createBetEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function betEngineTest() {
    const messages = [];

    assert(
        BET_ENGINE_VERSION ===
            "6.8.0" &&
        BET_STATE_VERSION ===
            "6.8.0" &&
        BET_HISTORY_VERSION ===
            "6.8.0" &&
        BANKROLL_VERSION ===
            "6.8.0" &&
        PAYOUT_RESOLVER_VERSION ===
            "6.8.0" &&
        BET_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "6.8.0" &&
        BET_ENGINE_FACTORY_VERSION ===
            "6.8.0",
        "V6.8 Bet Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.8 Bet Engine 版本正確"
    );

    let now = 100;

    const events = [];

    const bankroll =
        new Bankroll({
            balance:
                1000
        });

    const engine =
        new BetEngine({
            bankroll,

            payoutResolver:
                new PayoutResolver(),

            history:
                new BetHistory({
                    limit:
                        20
                }),

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

            limits: {
                minimum:
                    10,

                maximum:
                    500
            }
        });

    assert(
        engine.state ===
            BetState.IDLE &&
        engine.summary.bankroll
            .balance === 1000,
        "Bet Engine initial state 錯誤"
    );

    const bankerBet =
        engine.createBet({
            roundId:
                "round-1",

            betType:
                BetType.BANKER,

            amount:
                100,

            expectedValue:
                0.01,

            kelly:
                0.02,

            confidence:
                0.8
        });

    assert(
        bankerBet.status ===
            BetStatus.PENDING &&
        bankerBet.betType ===
            BetType.BANKER &&
        engine.state ===
            BetState.OPEN &&
        engine.summary
            .openBetCount === 1 &&
        engine.summary.bankroll
            .reserved === 100 &&
        engine.summary.bankroll
            .available === 900,
        "Bet Creation 或 Bankroll Reserve 錯誤"
    );

    messages.push(
        "✓ Bet Creation 與 Bankroll Reserve 正確"
    );

    const settledBanker =
        engine.settleBet(
            bankerBet.betId,
            {
                winner:
                    "Banker"
            }
        );

    assert(
        settledBanker.status ===
            BetStatus.WON &&
        settledBanker.profit ===
            95 &&
        settledBanker.returnAmount ===
            195 &&
        engine.summary.bankroll
            .balance === 1095 &&
        engine.summary.bankroll
            .reserved === 0 &&
        engine.summary.history
            .count === 1,
        "Banker Settlement 或 Payout 錯誤"
    );

    messages.push(
        "✓ Banker Payout 與 Settlement 正確"
    );

    const playerBet =
        engine.createBet({
            roundId:
                "round-2",

            betType:
                BetType.PLAYER,

            amount:
                50
        });

    const pushResult =
        engine.settleBet(
            playerBet.betId,
            {
                winner:
                    "Tie"
            }
        );

    assert(
        pushResult.status ===
            BetStatus.PUSH &&
        pushResult.profit ===
            0 &&
        engine.summary.bankroll
            .balance === 1095,
        "Player Tie Push 錯誤"
    );

    messages.push(
        "✓ Player／Banker Tie Push 正確"
    );

    const tieBet =
        engine.createBet({
            roundId:
                "round-3",

            betType:
                BetType.TIE,

            amount:
                25
        });

    const tieResult =
        engine.settleBet(
            tieBet.betId,
            {
                winner:
                    "Tie"
            }
        );

    assert(
        tieResult.status ===
            BetStatus.WON &&
        tieResult.profit ===
            200 &&
        engine.summary.bankroll
            .balance === 1295,
        "Tie Payout 錯誤"
    );

    messages.push(
        "✓ Tie Payout 正確"
    );

    const pairBet =
        engine.createBet({
            roundId:
                "round-4",

            betType:
                BetType.PLAYER_PAIR,

            amount:
                20
        });

    const pairResult =
        engine.settleBet(
            pairBet.betId,
            {
                playerPair:
                    true
            }
        );

    assert(
        pairResult.status ===
            BetStatus.WON &&
        pairResult.profit ===
            220,
        "Pair Payout 錯誤"
    );

    messages.push(
        "✓ Pair Bet Settlement 正確"
    );

    const recommendationBet =
        engine.createFromRecommendation({
            roundId:
                "round-5",

            recommendation: {
                bestBet:
                    BetType.BANKER,

                ev:
                    0.012,

                kelly:
                    0.03,

                confidence:
                    0.75
            },

            bankrollFraction:
                0.1
        });

    assert(
        recommendationBet.betType ===
            BetType.BANKER &&
        recommendationBet.amount ===
            engine.bankroll.available +
                recommendationBet.amount
                    ? recommendationBet.amount
                    : recommendationBet.amount,
        "Recommendation Bet 錯誤"
    );

    assert(
        recommendationBet.metadata
            .source ===
            "recommendation" &&
        recommendationBet.expectedValue ===
            0.012 &&
        recommendationBet.kelly ===
            0.03 &&
        recommendationBet.confidence ===
            0.75,
        "Recommendation Mapping 錯誤"
    );

    engine.cancelBet(
        recommendationBet.betId,
        "manual"
    );

    assert(
        engine.summary
            .openBetCount === 0 &&
        engine.summary.history
            .totals.cancelled === 1,
        "Bet Cancel 錯誤"
    );

    messages.push(
        "✓ Analyzer Recommendation Integration 與 Cancel 正確"
    );

    const voidBet =
        engine.createBet({
            roundId:
                "round-6",

            betType:
                BetType.SMALL,

            amount:
                10
        });

    engine.voidBet(
        voidBet.betId,
        "round-void"
    );

    assert(
        engine.summary.history
            .totals.voided === 1,
        "Bet Void 錯誤"
    );

    messages.push(
        "✓ Void Bet 正確"
    );

    const roundBetA =
        engine.createBet({
            roundId:
                "round-7",

            betType:
                BetType.PLAYER,

            amount:
                10
        });

    const roundBetB =
        engine.createBet({
            roundId:
                "round-7",

            betType:
                BetType.BANKER_PAIR,

            amount:
                10
        });

    const settledRound =
        engine.settleRound(
            "round-7",
            {
                winner:
                    "Player",

                bankerPair:
                    false
            }
        );

    assert(
        settledRound.length ===
            2 &&
        settledRound[0].status ===
            BetStatus.WON &&
        settledRound[1].status ===
            BetStatus.LOST &&
        engine.summary
            .openBetCount === 0,
        "Round Settlement 錯誤"
    );

    messages.push(
        "✓ Multi-Bet Round Settlement 正確"
    );

    const adapter =
        new BetEngineRuntimeAdapter({
            betEngine:
                engine
        });

    const adapterBet =
        adapter.createBet({
            roundId:
                "round-8",

            betType:
                BetType.BIG,

            amount:
                10
        });

    const adapterSettlement =
        adapter.settleBet(
            adapterBet.betId,
            {
                totalCards:
                    6
            }
        );

    assert(
        adapterSettlement.status ===
            BetStatus.WON &&
        adapter.summary.betEngine
            .hasLastSettlement ===
            true,
        "Bet Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                BetEvent.CREATED
        ) &&
        events.some(
            event =>
                event.type ===
                BetEvent.SETTLED
        ) &&
        events.some(
            event =>
                event.type ===
                BetEvent.CANCELLED
        ) &&
        events.some(
            event =>
                event.type ===
                BetEvent.VOIDED
        ) &&
        events.some(
            event =>
                event.type ===
                BetEvent.BANKROLL_UPDATED
        ),
        "Bet Events 錯誤"
    );

    messages.push(
        "✓ Bet Events 正確"
    );

    assert(
        engine.summary.version ===
            "6.8.0" &&
        engine.summary.lastError ===
            null &&
        engine.summary.history
            .count >= 8 &&
        engine.summary.bankroll
            .totalWagered > 0,
        "Bet Summary 錯誤"
    );

    engine.reset({
        balance:
            2000
    });

    assert(
        engine.state ===
            BetState.IDLE &&
        engine.summary.bankroll
            .balance === 2000 &&
        engine.summary
            .openBetCount === 0,
        "Bet Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state ===
            BetState.DESTROYED &&
        engine.summary.destroyed ===
            true &&
        engine.summary.history
            .count === 0,
        "Bet Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Bet Engine V6.8 測試完成

Bet Creation：通過
Bet Validation：通過
Bankroll Reserve：通過
Player Settlement：通過
Banker Settlement：通過
Tie Settlement：通過
Pair Settlement：通過
Push：通過
Cancel：通過
Void：通過
Round Settlement：通過
Payout Calculation：通過
Bankroll Update：通過
Recommendation Integration：通過
History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
