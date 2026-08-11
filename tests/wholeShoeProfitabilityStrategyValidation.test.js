/**
 * Baccarat Analyzer V10.8.0
 * Path: tests/wholeShoeProfitabilityStrategyValidation.test.js
 * Test Runner: tests/main.js
 * Whole-shoe profitability, walk-forward, and no-fake-forecast regressions.
 */

import WholeShoeProfitabilityStrategyValidationEngine, {
    WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION,
    WholeShoePolicy
} from "../runtime/liveCasino/WholeShoeProfitabilityStrategyValidationEngine.js";

import LiveCasinoPerformancePolicy, {
    WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";

import LiveCasinoUXController, {
    WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import {
    LIVE_CASINO_UX_CSS,
    WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_STYLES_VERSION
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";

import {
    WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";

import {
    DASHBOARD_WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function close(left, right, tolerance = 1e-9) {
    return Math.abs(left - right) <=
        tolerance;
}


function formalDecision({
    round = 2,
    key = "player",
    action = "WAIT",
    amount = 0,
    playerEV = -0.01235,
    bankerEV = -0.014581,
    playerProbability = 0.446247,
    bankerProbability = 0.458597,
    tieProbability = 0.095156
} = {}) {
    const recommendationKey =
        action === "BET"
            ? key
            : key;

    return {
        ready: true,
        generatedAfterRound:
            round,
        category:
            action === "BET"
                ? "positive-ev"
                : "relative-best",
        categoryLabel:
            action === "BET"
                ? "絕對正 EV"
                : "相對最佳",
        action,
        actionLabel:
            action === "BET"
                ? "可下注"
                : "觀望",
        amount,
        strictKey:
            action === "BET"
                ? key
                : null,
        relativeKey:
            key,
        recommendationKey,
        recommendationLabel:
            key === "banker"
                ? "莊家"
                : "閒家",
        probability: {
            player:
                playerProbability,
            banker:
                bankerProbability,
            tie:
                tieProbability
        },
        ev: {
            player:
                playerEV,
            banker:
                bankerEV,
            tie: -0.145
        },
        stableDecisionFinal: true,
        finalSnapshot: {
            snapshotId:
                `shoe-1-round-${round}`
        },
        decisionIntelligence: {
            canonical: {
                authority:
                    "final-exact",
                formal: true,
                snapshotId:
                    `shoe-1-round-${round}`
            }
        }
    };
}


function exactAnalysis({
    round = 3,
    playerEV = -0.01235,
    bankerEV = -0.014581,
    key = "player",
    shouldBet = false,
    amount = 0
} = {}) {
    const otherKey =
        key === "player"
            ? "banker"
            : "player";
    const probability = {
        player: 0.446247,
        banker: 0.458597,
        tie: 0.095156
    };

    return {
        generatedAfterRound:
            round,
        method: "hybrid",
        probability,
        ev: {
            player:
                playerEV,
            banker:
                bankerEV,
            tie: -0.145
        },
        exact: {
            probability
        },
        confidence: {
            overall: 0.82,
            [key]: {
                confidenceScore: 0.82,
                zScore:
                    1.959963984540054
            }
        },
        overallConfidence: 0.82,
        risk: {
            [key]: {
                relativeRisk: 0.952,
                standardDeviation: 0.01,
                riskLabel: "中等風險"
            }
        },
        kelly: {
            [key]: {
                fullKelly:
                    shouldBet ? 0.02 : 0,
                appliedKelly:
                    shouldBet ? 0.01 : 0,
                rawAmount:
                    amount,
                amount,
                bankroll: 10000
            }
        },
        ranking: [
            {
                key,
                ev:
                    key === "player"
                        ? playerEV
                        : bankerEV,
                confidence: 0.82,
                risk: 0.952,
                standardDeviation: 0.01,
                amount
            },
            {
                key:
                    otherKey,
                ev:
                    otherKey === "player"
                        ? playerEV
                        : bankerEV,
                confidence: 0.79,
                risk: 0.952,
                standardDeviation: 0.01,
                amount: 0
            }
        ],
        recommendation: {
            shouldBet,
            action:
                shouldBet
                    ? "bet"
                    : "skip",
            key,
            bet: key,
            amount:
                shouldBet
                    ? amount
                    : 0,
            limits: {
                minBet: 100,
                maxBet: 10000
            }
        }
    };
}


export default async function wholeShoeProfitabilityStrategyValidationTest() {
    const messages = [];

    assert(
        [
            WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION,
            WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_POLICY_VERSION,
            WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_UX_VERSION,
            WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_STYLES_VERSION,
            WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_FACTORY_VERSION,
            DASHBOARD_WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION
        ].every(version =>
            version === "10.8.0"
        ),
        "V10.8 全層版本契約錯誤"
    );

    messages.push(
        "✓ V10.8 全層版本契約正確"
    );

    const history = [
        {
            winner: "Player",
            playerScore: 8,
            bankerScore: 6,
            super6: false
        },
        {
            winner: "Banker",
            playerScore: 4,
            bankerScore: 6,
            super6: true
        },
        {
            winner: "Tie",
            playerScore: 7,
            bankerScore: 7,
            super6: false
        }
    ];
    const engine =
        new WholeShoeProfitabilityStrategyValidationEngine();
    const negative =
        formalDecision();
    const negativeAction =
        negative.action;
    const negativeAmount =
        negative.amount;
    const first =
        engine.explain(
            negative,
            {
                shoeId: 1,
                roundCount: 3,
                history
            }
        );
    const firstReport =
        first.wholeShoeStrategy;

    assert(
        first.action ===
            negativeAction &&
        first.amount ===
            negativeAmount &&
        firstReport
            .realizedValidation
            .playerFlat
            .profitUnits === 0 &&
        firstReport
            .realizedValidation
            .bankerFlat
            .profitUnits === -0.5 &&
        firstReport
            .remainingRoundRange
            .minimum === 47 &&
        firstReport
            .remainingRoundRange
            .maximum === 57 &&
        firstReport
            .remainingRoundRange
            .projection === 52,
        "整靴實際基線、莊 6 半賠或剩餘局數錯誤"
    );

    messages.push(
        "✓ 整靴固定閒／莊實際基線與莊 6 半賠正確"
    );

    const playerProjection =
        firstReport
            .conditionalProjection
            .playerFlat;
    const probabilityTotal =
        playerProjection
            .positiveProbability +
        playerProjection
            .breakEvenProbability +
        playerProjection
            .lossProbability;

    assert(
        playerProjection.ready === true &&
        close(probabilityTotal, 1, 1e-5) &&
        playerProjection
            .expectedAdditionalProfitUnits < 0 &&
        firstReport
            .opportunityForecast
            .available === false &&
        firstReport
            .opportunityForecast
            .probability === null &&
        firstReport
            .safetyContract
            .predictsFutureCardOrder === false &&
        firstReport
            .safetyContract
            .profitProbabilityCanForceBet === false,
        "條件投影機率或禁止假預測契約錯誤"
    );

    messages.push(
        "✓ 條件投影機率守恆，且不偽造未來正 EV 機會"
    );

    const walkForward =
        new WholeShoeProfitabilityStrategyValidationEngine();

    walkForward.explain(
        formalDecision({
            round: 2,
            key: "player",
            action: "WAIT"
        }),
        {
            shoeId: 9,
            roundCount: 2,
            history:
                history.slice(0, 2)
        }
    );

    const afterPlayer =
        walkForward.explain(
            {
                ...formalDecision({
                    round: 3,
                    key: "banker",
                    action: "BET",
                    amount: 100,
                    playerEV: -0.02,
                    bankerEV: 0.006,
                    playerProbability: 0.44,
                    bankerProbability: 0.47,
                    tieProbability: 0.09
                }),
                finalSnapshot: {
                    snapshotId:
                        "shoe-9-round-3"
                },
                decisionIntelligence: {
                    canonical: {
                        authority:
                            "final-exact",
                        formal: true,
                        snapshotId:
                            "shoe-9-round-3"
                    }
                }
            },
            {
                shoeId: 9,
                roundCount: 3,
                history
            }
        );

    const historyWithBankerSix = [
        ...history,
        {
            winner: "Banker",
            playerScore: 5,
            bankerScore: 6,
            super6: true
        }
    ];
    const afterBankerSix =
        walkForward.explain(
            formalDecision({
                round: 4,
                key: "player",
                action: "WAIT"
            }),
            {
                shoeId: 9,
                roundCount: 4,
                history:
                    historyWithBankerSix
            }
        );
    const repeated =
        walkForward.explain(
            afterBankerSix,
            {
                shoeId: 9,
                roundCount: 4,
                history:
                    historyWithBankerSix
            }
        );
    const walked =
        repeated.wholeShoeStrategy
            .realizedValidation;

    assert(
        afterPlayer.action === "BET" &&
        afterPlayer.amount === 100 &&
        walked.relativeBest
            .evaluatedRounds === 2 &&
        walked.relativeBest
            .profitUnits === 0.5 &&
        walked.exactPositiveOnly
            .evaluatedRounds === 2 &&
        walked.exactPositiveOnly
            .bets === 1 &&
        walked.exactPositiveOnly
            .wins === 1 &&
        walked.exactPositiveOnly
            .profitUnits === 0.5,
        "Walk-forward 原子結算、去重或正式 BET 保留錯誤"
    );

    messages.push(
        "✓ Walk-forward 決策只結算一次，正式 BET／WAIT 完整保留"
    );

    const reset =
        walkForward.explain(
            formalDecision({
                round: 0
            }),
            {
                shoeId: 10,
                roundCount: 0,
                history: []
            }
        );

    assert(
        reset.wholeShoeStrategy
            .shoeId === "10" &&
        reset.wholeShoeStrategy
            .realizedValidation
            .relativeBest
            .evaluatedRounds === 0 &&
        Object.isFrozen(
            reset.wholeShoeStrategy
        ) &&
        reset.wholeShoeStrategy
            .safePolicy.key ===
            WholeShoePolicy
                .EXACT_POSITIVE_ONLY,
        "換靴重置、不可變報告或安全政策錯誤"
    );

    messages.push(
        "✓ 換靴自動歸零，整靴報告不可變更"
    );

    const controllerHistory = {
        rounds:
            [...history],
        get count() {
            return this.rounds.length;
        },
        getAll() {
            return [...this.rounds];
        }
    };
    const game = {
        nextAnalysis:
            exactAnalysis(),
        shoeNumber: 12,
        roundCount: 3,
        remainingCards: 390,
        observableRemainingCards: 394,
        history:
            controllerHistory
    };
    const controller =
        new LiveCasinoUXController({
            game
        });
    const html =
        controller.renderDecisionHTML();
    const dock =
        controller.renderDecisionDockHTML();

    assert(
        html.includes(
            'data-whole-shoe-version="10.8.0"'
        ) &&
        html.includes(
            "整靴獲利與策略驗證"
        ) &&
        html.includes(
            "實際 walk-forward"
        ) &&
        html.includes(
            "不是牌序預測"
        ) &&
        html.includes(
            "整靴安全政策"
        ) &&
        html.includes(
            "莊 6 依半賠結算"
        ) &&
        html.includes(
            "查看剩餘牌局條件投影"
        ) &&
        dock.includes(
            'data-whole-shoe-version="10.8.0"'
        ) &&
        dock.includes("整靴") &&
        dock.includes("剩餘約"),
        "Dashboard 或 Decision Dock 未同步 V10.8 整靴結果"
    );

    const fields = new Map();
    const root = {
        querySelector(selector) {
            if (!fields.has(selector)) {
                fields.set(selector, {
                    textContent: ""
                });
            }

            return fields.get(selector);
        }
    };

    controller.updateAIPanel(root);

    assert(
        fields.get("[data-ai-stage]")
            .textContent ===
            "whole-shoe-profitability-strategy-validation-v10.8" &&
        fields.get("[data-ai-learning]")
            .textContent.includes(
                "整靴 Exact-only"
            ) &&
        fields.get("[data-ai-adaptive]")
            .textContent.includes(
                "固定閒條件獲利"
            ) &&
        controller.summary
            .wholeShoeStrategyVersion ===
            "10.8.0" &&
        controller.summary
            .wholeShoeStrategyCoreVersion ===
            "10.8.0" &&
        new LiveCasinoPerformancePolicy()
            .summary
            .wholeShoeStrategyVersion ===
            "10.8.0" &&
        LIVE_CASINO_UX_CSS.includes(
            ".v108WholeShoeStrategy"
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            ".v108ProjectionGrid"
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            "@media (max-width: 620px)"
        ),
        "AI Closed-Loop、Policy 或響應式 V10.8 契約未同步"
    );

    controller.destroy();

    messages.push(
        "✓ Dashboard、Dock、AI Closed-Loop 共用 V10.8 整靴驗證"
    );

    return `
${messages.join("\n")}

Whole-Shoe Profitability & Strategy Validation Engine V10.8.0 測試完成

Version Contract：通過
Realized Player / Banker Baseline：通過
No Commission Banker 6 Half Pay：通過
Conditional Projection Conservation：通過
No Fake Opportunity Forecast：通過
Walk-Forward Atomic Settlement：通過
No Decision Mutation：通過
Shoe Reset：通過
Dashboard Whole-Shoe UI：通過
Mobile Decision Dock Contract：通過
AI Closed-Loop Bridge：通過
`;
}
