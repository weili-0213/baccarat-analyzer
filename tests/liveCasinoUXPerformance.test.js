/**
 * Baccarat Analyzer V10.4.5
 * Path: tests/liveCasinoUXPerformance.test.js
 * Purpose: Runtime Integration Test for 3-second live decision UX/performance flow.
 */

import LiveCasinoPerformancePolicy, {
    LIVE_CASINO_PERFORMANCE_POLICY_VERSION
} from "../runtime/liveCasino/LiveCasinoPerformancePolicy.js";

import LiveCasinoDecisionModel, {
    LIVE_CASINO_DECISION_MODEL_VERSION
} from "../runtime/liveCasino/LiveCasinoDecisionModel.js";

import {
    AI_LIVE_DECISION_ENGINE_VERSION,
    LiveDecisionCategory
} from "../runtime/liveCasino/AILiveDecisionEngine.js";

import {
    LIVE_CASINO_UX_STYLES_VERSION,
    AI_LIVE_DECISION_STYLES_VERSION,
    RESPONSIVE_LIVE_DECISION_UX_VERSION
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";

import LiveCasinoUXController, {
    LIVE_CASINO_UX_CONTROLLER_VERSION,
    AI_LIVE_DECISION_UX_VERSION,
    AI_LIVE_DECISION_DOCK_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import createLiveCasinoUXController, {
    LIVE_CASINO_UX_FACTORY_VERSION,
    AI_LIVE_DECISION_FACTORY_VERSION
} from "../runtime/liveCasino/createLiveCasinoUXController.js";

import LiveCasinoUXRuntimeAdapter, {
    LIVE_CASINO_UX_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/LiveCasinoUXRuntimeAdapter.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function wait(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}


function createAnalysis() {
    return {
        probability: {
            player: 0.444,
            banker: 0.462,
            tie: 0.094
        },

        ev: {
            player: -0.0179,
            banker: -0.0052,
            tie: -0.1538
        },

        confidence: {
            overall: 0.72
        },

        ranking: [
            {
                key: "banker",
                ev: -0.0052,
                confidence: 0.72
            },
            {
                key: "player",
                ev: -0.0179,
                confidence: 0.68
            }
        ],

        recommendation: {
            shouldBet: false,
            amount: 0,
            reason:
                "目前沒有符合條件的正期望下注。"
        }
    };
}


function createGame({
    analysisDelayMs = 15
} = {}) {
    return {
        burnConfirmed: false,
        burnInfo: null,
        nextAnalysis: null,
        isAnalyzing: false,
        hasNextAnalysis: false,
        isManualRoundActive: false,
        analysisCalls: [],
        finishCalls: [],

        confirmBurnIndicator(card) {
            this.burnConfirmed = true;
            this.burnInfo = {
                confirmed: true,
                indicator: {
                    ...card
                }
            };
            return this.burnInfo;
        },

        async analyzeNextRound(options = {}) {
            this.analysisCalls.push(
                options
            );

            this.isAnalyzing = true;

            await wait(
                analysisDelayMs
            );

            this.nextAnalysis =
                createAnalysis();

            this.hasNextAnalysis = true;
            this.isAnalyzing = false;

            return this.nextAnalysis;
        },

        async finishManualRound(options = {}) {
            this.finishCalls.push(
                options
            );

            this.isManualRoundActive =
                false;

            return {
                winner: "Banker"
            };
        }
    };
}


export default async function liveCasinoUXPerformanceTest() {
    const messages = [];

    assert(
        [
            LIVE_CASINO_PERFORMANCE_POLICY_VERSION,
            LIVE_CASINO_DECISION_MODEL_VERSION,
            LIVE_CASINO_UX_STYLES_VERSION,
            LIVE_CASINO_UX_CONTROLLER_VERSION,
            LIVE_CASINO_UX_FACTORY_VERSION,
            LIVE_CASINO_UX_RUNTIME_ADAPTER_VERSION
        ].every(version =>
            version === "10.4.5"
        ),
        "V10.4.5 version contract 錯誤"
    );

    messages.push(
        "✓ V10.4.5 Live Casino UX / Performance 版本正確"
    );

    assert(
        [
            AI_LIVE_DECISION_ENGINE_VERSION,
            AI_LIVE_DECISION_STYLES_VERSION,
            AI_LIVE_DECISION_UX_VERSION,
            AI_LIVE_DECISION_FACTORY_VERSION
        ].every(version =>
            version === "10.5.0"
        ),
        "V10.5 AI Live Decision version contract 錯誤"
    );

    messages.push(
        "✓ V10.5 AI Live Decision Engine 版本正確"
    );

    assert(
        [
            RESPONSIVE_LIVE_DECISION_UX_VERSION,
            AI_LIVE_DECISION_DOCK_VERSION
        ].every(version =>
            version === "10.5.1"
        ),
        "V10.5.1 responsive decision UX version contract 錯誤"
    );

    messages.push(
        "✓ V10.5.1 Decision Dock / Responsive EV 版本正確"
    );


    const policy =
        new LiveCasinoPerformancePolicy({
            decisionDeadlineMs: 300,
            quickSimulations: 1200,
            quickBatchSize: 300
        });

    assert(
        policy.getQuickOptions().mode ===
            "monteCarlo" &&
        policy.getQuickOptions()
            .monteCarloOptions
            .simulations ===
            1200,
        "Quick analysis profile 錯誤"
    );

    messages.push(
        "✓ Quick Monte Carlo Profile 正確"
    );


    const decision =
        new LiveCasinoDecisionModel()
            .build(
                createAnalysis()
            );

    assert(
        decision.strictAction ===
            "WAIT" &&
        decision.category ===
            LiveDecisionCategory.RELATIVE_BEST &&
        decision.relativeKey ===
            "banker" &&
        decision.relativeLabel ===
            "莊家" &&
        decision.relativeEV ===
            -0.0052,
        "Strict / Relative Decision 錯誤"
    );

    messages.push(
        "✓ 負 EV 不偽裝下注，仍顯示相對最佳莊家"
    );


    let renders = 0;

    const game =
        createGame({
            analysisDelayMs: 15
        });

    const controller =
        new LiveCasinoUXController({
            game,
            policy,
            render() {
                renders++;
            }
        });

    const fast =
        await controller.runAnalysis();

    assert(
        fast.timedOut ===
            false &&
        fast.durationMs <
            300 &&
        game.analysisCalls[0].mode ===
            "monteCarlo",
        "Live fast analysis deadline 錯誤"
    );

    assert(
        controller.summary
            .decision
            .relativeKey ===
            "banker" &&
        controller.summary
            .liveDecisionVersion ===
            "10.5.0",
        "Live decision mapping 錯誤"
    );

    messages.push(
        "✓ 快速分析在 deadline 內完成並產生決策"
    );

    const dockHTML =
        controller
            .renderDecisionDockHTML();

    assert(
        dockHTML.includes(
            "data-live-decision-dock"
        ) &&
        dockHTML.includes(
            'data-decision-category="relative-best"'
        ) &&
        dockHTML.includes("推薦：莊家") &&
        dockHTML.includes("觀望 · 相對最佳") &&
        dockHTML.includes("信心 72.00%") &&
        dockHTML.includes("建議額 0"),
        "V10.5.1 compact Decision Dock 資訊不完整"
    );

    messages.push(
        "✓ 離開首屏後的精簡下一局決策資訊完整"
    );


    const burnGame =
        createGame({
            analysisDelayMs: 35
        });

    const burnController =
        createLiveCasinoUXController({
            game: burnGame,
            performance: {
                decisionDeadlineMs: 300
            }
        });

    const burnStarted =
        Date.now();

    const burn =
        await burnController.confirmBurn({
            rank: "7",
            suit: "H"
        });

    const burnElapsed =
        Date.now() -
        burnStarted;

    assert(
        burn.confirmed ===
            true &&
        burnGame.burnConfirmed ===
            true &&
        burnElapsed <
            80,
        "Burn confirmation 仍被分析阻塞"
    );

    await wait(60);

    assert(
        burnGame.nextAnalysis !==
            null,
        "Burn 後背景快速分析未完成"
    );

    messages.push(
        "✓ 燒牌確認不等待分析，背景分析正常完成"
    );


    const finishGame =
        createGame({
            analysisDelayMs: 30
        });

    finishGame.isManualRoundActive =
        true;

    const finishController =
        createLiveCasinoUXController({
            game: finishGame,
            performance: {
                decisionDeadlineMs: 300
            }
        });

    const finishStarted =
        Date.now();

    const round =
        await finishController
            .finishRound();

    const finishElapsed =
        Date.now() -
        finishStarted;

    assert(
        round.winner ===
            "Banker" &&
        finishElapsed <
            80 &&
        finishGame.finishCalls[0]
            .analyze ===
            false,
        "確認本局仍同步等待分析"
    );

    await wait(55);

    assert(
        finishGame.nextAnalysis !==
            null &&
        finishGame.analysisCalls[0]
            .mode ===
            "monteCarlo",
        "本局結束後快速分析未啟動"
    );

    messages.push(
        "✓ 確認本局立即返回，下一局快速分析背景執行"
    );


    const slowGame =
        createGame({
            analysisDelayMs: 320
        });

    const slowController =
        createLiveCasinoUXController({
            game: slowGame,
            performance: {
                decisionDeadlineMs: 250
            }
        });

    const timed =
        await slowController
            .runAnalysis();

    assert(
        timed.timedOut ===
            true &&
        slowController.summary
            .timedOut ===
            true,
        "Deadline timeout flow 錯誤"
    );

    await wait(120);

    assert(
        slowController.summary
            .timedOut ===
            false &&
        slowController.summary
            .decision
            .ready ===
            true,
        "Timeout 後背景完成沒有更新"
    );

    messages.push(
        "✓ Deadline 超時不鎖 UI，背景完成後更新"
    );


    const adapter =
        new LiveCasinoUXRuntimeAdapter({
            controller
        });

    assert(
        adapter.summary.version ===
            "10.4.5" &&
        adapter.summary.controller
            .decision
            .relativeKey ===
            "banker",
        "Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );


    controller.destroy();
    burnController.destroy();
    finishController.destroy();
    slowController.destroy();

    assert(
        renders > 0,
        "Render bridge 未執行"
    );

    messages.push(
        "✓ Render Bridge / Lifecycle 正確"
    );


    return `
${messages.join("\n")}

Live Casino UX & Performance Refactor V10.4.5 測試完成

Version Contracts：通過
V10.5 Decision Engine：通過
V10.5.1 Decision Dock：通過
Quick Analysis Profile：通過
Strict + Relative Decision：通過
3-Second Deadline Architecture：通過
Non-Blocking Burn：通過
Non-Blocking Finish Round：通過
Timeout Recovery：通過
Runtime Adapter：通過
Lifecycle：通過
`;
}
