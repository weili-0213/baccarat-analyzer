/**
 * Baccarat Analyzer V10.9.0
 * Path: tests/fifteenSecondEightMarketPrediction.test.js
 * Test Runner: tests/main.js
 * 15-second Exact-only eight-market prediction and compact UX regressions.
 */

import FifteenSecondEightMarketPredictionEngine, {
    FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION,
    FIFTEEN_SECOND_DECISION_WINDOW_MS,
    EIGHT_PREDICTION_MARKETS
} from "../runtime/liveCasino/FifteenSecondEightMarketPredictionEngine.js";

import LiveCasinoUXController, {
    FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import LiveCasinoPerformancePolicy, {
    FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";

import {
    LIVE_CASINO_UX_CSS,
    FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_STYLES_VERSION
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";

import {
    FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";

import {
    DASHBOARD_FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function close(left, right, tolerance = 1e-12) {
    return Math.abs(left - right) <=
        tolerance;
}


function exactAnalysis({
    round = 8,
    player = 0.4367,
    banker = 0.4667,
    tie = 0.0966,
    playerPair = 0.075,
    bankerPair = 0.076,
    super6 = 0.065,
    playerDragonBonus = 0.285,
    bankerDragonBonus = 0.2983,
    playerEV = -0.03,
    bankerEV = 0.0038,
    shouldBet = false,
    amount = 0
} = {}) {
    const probability = {
        player,
        banker,
        tie,
        playerPair,
        bankerPair,
        super6,
        playerDragonBonus,
        bankerDragonBonus
    };

    return {
        generatedAfterRound:
            round,
        method: "hybrid",
        probability,
        exact: {
            probability
        },
        ev: {
            player:
                playerEV,
            banker:
                bankerEV,
            tie: -0.13,
            playerPair: -0.10,
            bankerPair: -0.088,
            super6: -0.155,
            playerDragonBonus: 0,
            bankerDragonBonus: 0
        },
        evStatus: {
            player: "available",
            banker: "available",
            tie: "available",
            playerPair: "available",
            bankerPair: "available",
            super6: "available",
            playerDragonBonus: "unavailable",
            bankerDragonBonus: "unavailable"
        },
        confidence: {
            overall: 0.82,
            banker: {
                confidenceScore: 0.82,
                zScore:
                    1.959963984540054
            }
        },
        overallConfidence: 0.82,
        risk: {
            banker: {
                relativeRisk: 0.4,
                standardDeviation: 0.01,
                riskLabel: "中等風險"
            }
        },
        kelly: {
            banker: {
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
                key: "banker",
                ev:
                    bankerEV,
                confidence: 0.82,
                risk: 0.4,
                standardDeviation: 0.01,
                amount
            },
            {
                key: "player",
                ev:
                    playerEV,
                confidence: 0.8,
                risk: 0.4,
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
            key: "banker",
            bet: "banker",
            amount:
                shouldBet
                    ? amount
                    : 0,
            limits: {
                minBet: 100,
                maxBet: 10000
            }
        },
        observableRemaining: 370
    };
}


function history() {
    const rounds = [
        {
            winner: "Player",
            playerPair: true,
            bankerPair: false,
            playerNatural: false,
            margin: 4,
            super6: false
        },
        {
            winner: "Banker",
            playerPair: false,
            bankerPair: true,
            bankerNatural: false,
            bankerScore: 6,
            margin: 2,
            super6: true
        },
        {
            winner: "Tie",
            playerPair: false,
            bankerPair: false,
            margin: 0,
            super6: false
        },
        {
            winner: "Banker",
            playerPair: false,
            bankerPair: false,
            bankerNatural: true,
            margin: 1,
            super6: false
        }
    ];

    return {
        rounds,
        get count() {
            return this.rounds.length;
        },
        getAll() {
            return [...this.rounds];
        }
    };
}


export default async function fifteenSecondEightMarketPredictionTest() {
    const messages = [];

    assert(
        [
            FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION,
            FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_UX_VERSION,
            FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_POLICY_VERSION,
            FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_STYLES_VERSION,
            FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_FACTORY_VERSION,
            DASHBOARD_FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION
        ].every(version =>
            version === "10.9.0"
        ) &&
        FIFTEEN_SECOND_DECISION_WINDOW_MS ===
            15000 &&
        EIGHT_PREDICTION_MARKETS.length ===
            8,
        "V10.9 全層版本或 15 秒／八項契約錯誤"
    );

    messages.push(
        "✓ V10.9 全層版本、15 秒與八項市場契約正確"
    );

    const engine =
        new FifteenSecondEightMarketPredictionEngine();
    const provisional =
        engine.build({
            analysis: {
                ...exactAnalysis(),
                method: "monteCarlo",
                exact: null
            },
            decision: {
                action: "WAIT"
            },
            windowStartedAt: 1000,
            now: 3500
        });

    assert(
        provisional.ready === false &&
        provisional.source ===
            "waiting-exact" &&
        provisional.markets.length === 0 &&
        provisional.remainingMs === 12500 &&
        provisional.message.includes(
            "不會先顯示"
        ),
        "快速 MC 不應成為首屏第二套分析答案"
    );

    messages.push(
        "✓ 快速 MC 隱藏，首屏只接受同局最終 Exact"
    );

    const final =
        engine.build({
            analysis:
                exactAnalysis(),
            decision: {
                action: "WAIT",
                reason: "尚未通過正 EV 安全門檻。"
            },
            history:
                history(),
            windowStartedAt: 1000,
            now: 4200
        });

    const byKey =
        Object.fromEntries(
            final.markets.map(item => [
                item.key,
                item
            ])
        );

    assert(
        final.ready === true &&
        final.source === "exact" &&
        final.markets.length === 8 &&
        final.mainPick.key === "banker" &&
        final.specialPick.key ===
            "bankerDragonBonus" &&
        close(
            final.mainGap,
            0.03
        ) &&
        final.remainingMs === 11800,
        "八項 Exact、大膽主預測或特殊項目預測錯誤"
    );

    assert(
        byKey.player.hitCount === 1 &&
        close(
            byKey.player.historyRate,
            0.25
        ) &&
        byKey.super6.hitCount === 1 &&
        byKey.playerDragonBonus.hitCount === 1 &&
        byKey.bankerDragonBonus.hitCount === 1,
        "本靴八項命中率計算錯誤"
    );

    assert(
        byKey.banker.evAvailable === true &&
        byKey.banker.positiveEV === true &&
        byKey.playerDragonBonus.ev === null &&
        byKey.bankerDragonBonus.ev === null &&
        byKey.bankerDragonBonus.note.includes(
            "分級賠率"
        ),
        "EV 可用狀態或龍寶分級 EV 防造假錯誤"
    );

    assert(
        final.formal.action === "WAIT" &&
        final.formal.amount === 0 &&
        final.overlapNotice.includes(
            "不會加總為 100%"
        ),
        "大膽預測不可強迫正式下注，重疊事件需有說明"
    );

    messages.push(
        "✓ 八項 Exact、本靴命中、大膽預測與下注安全分離正確"
    );

    const game = {
        nextAnalysis:
            exactAnalysis({
                bankerEV: -0.0126
            }),
        shoeNumber: 1,
        roundCount: 4,
        remainingCards: 370,
        observableRemainingCards: 374,
        history:
            history()
    };
    let now = 10000;
    const controller =
        new LiveCasinoUXController({
            game,
            clock: () => now
        });
    const html =
        controller.renderDecisionHTML();
    const dock =
        controller.renderDecisionDockHTML();

    assert(
        html.includes(
            'data-prediction-version="10.10.0"'
        ) &&
        html.includes(
            "下一局 · V10.10 組成優勢決策"
        ) &&
        html.includes(
            "情境預測"
        ) &&
        html.includes(
            "相容特殊優勢"
        ) &&
        html.includes(
            "選擇性下注"
        ) &&
        (
            html.match(
                /data-prediction-market=/g
            ) ?? []
        ).length === 8 &&
        html.includes(
            "查看進階分析、EV、安全證據與整靴驗證"
        ),
        "15 秒八項首屏資訊不完整或進階資訊未收合"
    );

    assert(
        dock.includes(
            "v109DecisionDock"
        ) &&
        dock.includes(
            "下一局預測"
        ) &&
        dock.includes(
            "正式：觀望 0"
        ) &&
        dock.includes(
            "data-v109-countdown"
        ),
        "手機 Decision Dock 未簡化為預測／正式下注／倒數"
    );

    now += 16000;

    assert(
        controller.getPredictionBoard()
            .expired === true &&
        controller.summary
            .predictionBoardVersion ===
            "10.10.0" &&
        controller.summary
            .predictionBoard
            .markets.length === 8 &&
        new LiveCasinoPerformancePolicy()
            .summary
            .predictionBoardVersion ===
            "10.9.0" &&
        LIVE_CASINO_UX_CSS.includes(
            ".v109PredictionBoard"
        ) &&
        LIVE_CASINO_UX_CSS.includes(
            "grid-template-columns: repeat(2,minmax(0,1fr))"
        ),
        "倒數、摘要或響應式 V10.9 契約錯誤"
    );

    controller.destroy();

    messages.push(
        "✓ 單一首屏、手機 Dock、15 秒倒數與進階收合正確"
    );

    return `
${messages.join("\n")}

15-Second Eight-Market Prediction Board V10.9.0 測試完成

Exact-Only Single Result：通過
Eight Market Probability：通過
Shoe Hit Rate：通過
Bold Main / Special Pick：通過
Prediction / Bet Separation：通過
Dragon Bonus EV Guard：通過
15-Second Countdown：通過
Compact Dashboard：通過
Mobile Decision Dock：通過
Advanced Analysis Collapse：通過
`;
}
