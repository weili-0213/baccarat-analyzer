/**
 * Baccarat Analyzer V6.9
 * tests/strategyEngine.test.js
 */

import StrategyEngine, {
    STRATEGY_ENGINE_VERSION,
    StrategyEvent
} from "../casino/strategy/StrategyEngine.js";

import {
    STRATEGY_STATE_VERSION,
    StrategyState,
    StrategyAction
} from "../casino/strategy/StrategyState.js";

import StrategyRule, {
    STRATEGY_RULE_VERSION
} from "../casino/strategy/StrategyRule.js";

import StrategyPipeline, {
    STRATEGY_PIPELINE_VERSION
} from "../casino/strategy/StrategyPipeline.js";

import StrategyHistory, {
    STRATEGY_HISTORY_VERSION
} from "../casino/strategy/StrategyHistory.js";

import StrategyDecision, {
    STRATEGY_DECISION_VERSION
} from "../casino/strategy/StrategyDecision.js";

import {
    STRATEGY_PRESET_VERSION,
    resolveStrategyPreset
} from "../casino/strategy/StrategyPreset.js";

import StrategyEngineRuntimeAdapter, {
    STRATEGY_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/StrategyEngineRuntimeAdapter.js";

import {
    STRATEGY_ENGINE_FACTORY_VERSION
} from "../casino/strategy/createStrategyEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default async function strategyEngineTest() {
    const messages = [];

    assert(
        STRATEGY_ENGINE_VERSION ===
            "6.9.0" &&
        STRATEGY_STATE_VERSION ===
            "6.9.0" &&
        STRATEGY_RULE_VERSION ===
            "6.9.0" &&
        STRATEGY_PIPELINE_VERSION ===
            "6.9.0" &&
        STRATEGY_HISTORY_VERSION ===
            "6.9.0" &&
        STRATEGY_DECISION_VERSION ===
            "6.9.0" &&
        STRATEGY_PRESET_VERSION ===
            "6.9.0" &&
        STRATEGY_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "6.9.0" &&
        STRATEGY_ENGINE_FACTORY_VERSION ===
            "6.9.0",
        "V6.9 Strategy Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.9 Strategy Engine 版本正確"
    );

    const preset =
        resolveStrategyPreset(
            "balanced"
        );

    assert(
        preset.minimumEV ===
            0.005 &&
        preset.minimumConfidence ===
            0.65,
        "Strategy Preset 錯誤"
    );

    messages.push(
        "✓ Strategy Preset 正確"
    );

    const pipeline =
        new StrategyPipeline();

    pipeline.register(
        new StrategyRule({
            name:
                "custom-first",

            priority:
                1000,

            evaluate:
                () => ({
                    matched:
                        false
                })
        })
    );

    assert(
        pipeline.summary.ruleCount ===
            1 &&
        pipeline.getRule(
            "custom-first"
        ) !== null,
        "Strategy Pipeline Register 錯誤"
    );

    messages.push(
        "✓ Strategy Pipeline 與 Rule Engine 正確"
    );

    let now = 100;

    const events = [];
    const createdBets = [];

    const betEngine = {
        createFromRecommendation(
            input
        ) {
            const bet = {
                betId:
                    `bet-${createdBets.length + 1}`,
                ...input
            };

            createdBets.push(
                bet
            );

            return bet;
        }
    };

    const strategy =
        new StrategyEngine({
            pipeline:
                new StrategyPipeline(),

            history:
                new StrategyHistory({
                    limit:
                        20
                }),

            betEngine,

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

            preset:
                "balanced"
        });

    const betDecision =
        await strategy.evaluate({
            roundId:
                "round-1",

            analysis: {
                recommendation: {
                    bestBet:
                        "Banker",

                    expectedValue:
                        0.012,

                    kelly:
                        0.04,

                    confidence:
                        0.78,

                    risk:
                        "low"
                }
            },

            bankroll: {
                available:
                    1000
            }
        });

    assert(
        betDecision instanceof
            StrategyDecision &&
        betDecision.action ===
            StrategyAction.BET &&
        betDecision.betType ===
            "Banker" &&
        betDecision.expectedValue ===
            0.012 &&
        betDecision.kelly ===
            0.04 &&
        betDecision.confidence ===
            0.78 &&
        betDecision.risk ===
            "low" &&
        betDecision.bankrollFraction ===
            0.025 &&
        betDecision.amount ===
            25 &&
        strategy.state ===
            StrategyState.DECIDED,
        "Strategy Bet Decision 錯誤"
    );

    messages.push(
        "✓ Decision、EV、Kelly、Confidence、Risk 與 Bankroll Rule 正確"
    );

    const evSkip =
        await strategy.evaluate({
            roundId:
                "round-2",

            analysis: {
                recommendation: {
                    bestBet:
                        "Player",

                    expectedValue:
                        -0.01,

                    kelly:
                        0.01,

                    confidence:
                        0.8,

                    risk:
                        "low"
                }
            }
        });

    assert(
        evSkip.action ===
            StrategyAction.SKIP &&
        evSkip.reason ===
            "ev-below-threshold" &&
        strategy.state ===
            StrategyState.SKIPPED,
        "EV Threshold Skip 錯誤"
    );

    const confidenceSkip =
        await strategy.evaluate({
            roundId:
                "round-3",

            analysis: {
                recommendation: {
                    bestBet:
                        "Banker",

                    expectedValue:
                        0.02,

                    kelly:
                        0.03,

                    confidence:
                        0.4,

                    risk:
                        "low"
                }
            }
        });

    assert(
        confidenceSkip.action ===
            StrategyAction.SKIP &&
        confidenceSkip.reason ===
            "confidence-below-threshold",
        "Confidence Filter 錯誤"
    );

    const kellySkip =
        await strategy.evaluate({
            roundId:
                "round-4",

            analysis: {
                recommendation: {
                    bestBet:
                        "Banker",

                    expectedValue:
                        0.02,

                    kelly:
                        0,

                    confidence:
                        0.8,

                    risk:
                        "low"
                }
            }
        });

    assert(
        kellySkip.action ===
            StrategyAction.SKIP &&
        kellySkip.reason ===
            "kelly-not-positive",
        "Kelly Filter 錯誤"
    );

    const riskSkip =
        await strategy.evaluate({
            roundId:
                "round-5",

            analysis: {
                recommendation: {
                    bestBet:
                        "Tie",

                    expectedValue:
                        0.02,

                    kelly:
                        0.02,

                    confidence:
                        0.8,

                    risk:
                        "high"
                }
            }
        });

    assert(
        riskSkip.action ===
            StrategyAction.SKIP &&
        riskSkip.reason ===
            "risk-too-high",
        "Risk Filter 錯誤"
    );

    messages.push(
        "✓ Skip Rule、EV Threshold、Kelly、Confidence 與 Risk Filter 正確"
    );

    const integrated =
        await strategy
            .evaluateAndCreateBet({
                roundId:
                    "round-6",

                analysis: {
                    recommendation: {
                        bestBet:
                            "Player",

                        expectedValue:
                            0.02,

                        kelly:
                            0.03,

                        confidence:
                            0.8,

                        risk:
                            "low"
                    }
                },

                bankroll: {
                    available:
                        2000
                }
            });

    assert(
        integrated.decision.shouldBet ===
            true &&
        integrated.bet !==
            null &&
        integrated.bet.roundId ===
            "round-6" &&
        integrated.bet
            .recommendation.bestBet ===
            "Player" &&
        integrated.bet.amount ===
            50 &&
        createdBets.length ===
            1,
        "Strategy → Bet Engine Integration 錯誤"
    );

    messages.push(
        "✓ Recommendation Mapping 與 Bet Engine Integration 正確"
    );

    assert(
        strategy.summary
            .evaluationCount === 6 &&
        strategy.summary.betCount ===
            2 &&
        strategy.summary.skipCount ===
            4 &&
        strategy.summary.history
            .count === 6,
        "Strategy Statistics 或 History 錯誤"
    );

    messages.push(
        "✓ Strategy History 正確"
    );

    const adapter =
        new StrategyEngineRuntimeAdapter({
            strategy
        });

    const adapterDecision =
        await adapter.evaluate({
            roundId:
                "round-7",

            analysis: {
                recommendation: {
                    bestBet:
                        "Banker",

                    expectedValue:
                        0.02,

                    kelly:
                        0.02,

                    confidence:
                        0.8,

                    risk:
                        "low"
                }
            }
        });

    assert(
        adapterDecision.shouldBet ===
            true &&
        adapter.summary.strategy
            .hasDecision === true,
        "Strategy Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                StrategyEvent.EVALUATION_STARTED
        ) &&
        events.some(
            event =>
                event.type ===
                StrategyEvent.RULE_EVALUATED
        ) &&
        events.some(
            event =>
                event.type ===
                StrategyEvent.DECIDED
        ) &&
        events.some(
            event =>
                event.type ===
                StrategyEvent.SKIPPED
        ) &&
        events.some(
            event =>
                event.type ===
                StrategyEvent.BET_CREATED
        ),
        "Strategy Events 錯誤"
    );

    messages.push(
        "✓ Strategy Events 正確"
    );

    strategy.reset();

    assert(
        strategy.state ===
            StrategyState.IDLE &&
        strategy.summary.hasDecision ===
            false,
        "Strategy Reset 錯誤"
    );

    strategy.destroy();

    assert(
        strategy.state ===
            StrategyState.DESTROYED &&
        strategy.summary.destroyed ===
            true &&
        strategy.summary.history
            .count === 0 &&
        strategy.summary.pipeline
            .ruleCount === 0,
        "Strategy Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Strategy Engine V6.9 測試完成

Strategy Pipeline：通過
Rule Engine：通過
Decision：通過
Skip Rule：通過
EV Threshold：通過
Kelly Filter：通過
Confidence Filter：通過
Risk Filter：通過
Bankroll Rule：通過
Recommendation Mapping：通過
Bet Engine Integration：通過
Strategy History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
