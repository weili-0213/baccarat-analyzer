/**
 * Baccarat Analyzer V10.4.4
 * Path: tests/liveRoundCriticalPath.test.js
 * Purpose:
 *   Verifies the burn critical path, compact live layout, unified full EV panel,
 *   and non-blocking live-analysis handoff.
 */
import Game, {
    GAME_LIVE_CRITICAL_PATH_VERSION,
    GameState
} from "../engine/game.js";

import AnalysisPanel, {
    ANALYSIS_PANEL_LIVE_VERSION,
    AnalysisDisplayMode
} from "../components/AnalysisPanel.js";

import StatusPanel, {
    STATUS_PANEL_LIVE_VERSION
} from "../components/StatusPanel.js";

import DashboardRenderer, {
    DASHBOARD_RENDERER_VERSION,
    DASHBOARD_RENDERER_LIVE_VERSION
} from "../renderers/DashboardRenderer.js";

import LiveCasinoUXController, {
    LIVE_CASINO_UX_CONTROLLER_VERSION
} from "../runtime/liveCasino/LiveCasinoUXController.js";

import {
    LIVE_CASINO_UX_STYLES_VERSION,
    LIVE_CASINO_UX_CSS
} from "../runtime/liveCasino/LiveCasinoUXStyles.js";


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
        generatedAfterRound: 4,

        probability: {
            player: 0.4464,
            banker: 0.4585,
            tie: 0.095,
            playerPair: 0.074,
            bankerPair: 0.075,
            super6: 0.053,
            playerDragonBonus: 0.031,
            bankerDragonBonus: 0.034
        },

        ev: {
            player: -0.0121,
            banker: -0.0108,
            tie: -0.1448,
            playerPair: -0.1034,
            bankerPair: -0.1034,
            super6: -0.3054,
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

        sideBetAnalysis: {
            playerPair: {
                label: "閒對",
                available: true,
                ev: -0.1034
            },
            bankerPair: {
                label: "莊對",
                available: true,
                ev: -0.1034
            },
            super6: {
                label: "幸運 6",
                available: true,
                ev: -0.3054
            },
            playerDragonBonus: {
                label: "閒龍寶",
                probability: 0.031,
                available: false
            },
            bankerDragonBonus: {
                label: "莊龍寶",
                probability: 0.034,
                available: false
            }
        },

        ranking: [
            {
                key: "banker",
                ev: -0.0108,
                confidence: 0.71
            }
        ],

        recommendation: {
            shouldBet: false,
            amount: 0,
            reason: "目前沒有正期望下注。"
        }
    };
}


function createBurnHarness() {
    let analysisCalls = 0;

    const burn = {
        isConfirmed: false,
        info: null,

        confirmIndicator(input) {
            this.isConfirmed = true;
            this.info = {
                confirmed: true,
                indicator: {
                    ...input
                }
            };
            return this.info;
        }
    };

    const game = {
        shoe: {},
        burn,
        isWaitingBurnIndicator: true,
        options: {
            analyzeAfterBurn: true
        },
        state: "WAITING_BURN_INDICATOR",
        lastError: null,

        runNextAnalysis() {
            analysisCalls++;
            return Promise.resolve(
                createAnalysis()
            );
        }
    };

    return {
        game,
        get analysisCalls() {
            return analysisCalls;
        }
    };
}


export default async function liveRoundCriticalPathTest() {
    const messages = [];

    assert(
        GAME_LIVE_CRITICAL_PATH_VERSION === "10.4.4" &&
        ANALYSIS_PANEL_LIVE_VERSION === "10.4.4" &&
        STATUS_PANEL_LIVE_VERSION === "10.4.4" &&
        DASHBOARD_RENDERER_LIVE_VERSION === "10.4.4" &&
        LIVE_CASINO_UX_CONTROLLER_VERSION === "10.4.4" &&
        LIVE_CASINO_UX_STYLES_VERSION === "10.4.4",
        "V10.4.4 version contracts 錯誤"
    );

    assert(
        DASHBOARD_RENDERER_VERSION === "3.4.3",
        "Legacy DashboardRenderer contract 被破壞"
    );

    messages.push(
        "✓ V10.4.4 / Legacy version contracts 正確"
    );


    const noAuto =
        createBurnHarness();

    const burnInfo =
        Game.prototype
            .confirmBurnIndicator
            .call(
                noAuto.game,
                {
                    rank: "5",
                    suit: "S"
                },
                {
                    analyze: false
                }
            );

    assert(
        burnInfo.confirmed === true &&
        noAuto.analysisCalls === 0 &&
        noAuto.game.state === GameState.SHOE_ACTIVE,
        "confirmBurnIndicator({analyze:false}) 仍啟動舊 Auto Analysis"
    );

    messages.push(
        "✓ Game Burn per-call analyze:false 正確"
    );


    const legacyDefault =
        createBurnHarness();

    Game.prototype
        .confirmBurnIndicator
        .call(
            legacyDefault.game,
            {
                rank: "A",
                suit: "H"
            }
        );

    assert(
        legacyDefault.analysisCalls === 1,
        "Legacy analyzeAfterBurn 預設行為被破壞"
    );

    messages.push(
        "✓ Legacy analyzeAfterBurn 相容性正確"
    );


    let legacyAutoCalls = 0;
    let quickCalls = 0;

    const liveGame = {
        options: {
            analyzeAfterBurn: true
        },
        burnConfirmed: false,
        nextAnalysis: null,
        hasNextAnalysis: false,
        isAnalyzing: false,
        isManualRoundActive: false,

        confirmBurnIndicator(
            card,
            options = {}
        ) {
            this.burnConfirmed = true;
            this.lastBurnOptions = options;

            if (
                options.analyze !== false &&
                this.options.analyzeAfterBurn
            ) {
                legacyAutoCalls++;
            }

            return {
                confirmed: true,
                indicator: card
            };
        },

        async analyzeNextRound(options = {}) {
            quickCalls++;
            this.lastAnalysisOptions = options;
            this.isAnalyzing = true;
            await wait(20);
            this.nextAnalysis = createAnalysis();
            this.hasNextAnalysis = true;
            this.isAnalyzing = false;
            return this.nextAnalysis;
        }
    };

    const controller =
        new LiveCasinoUXController({
            game: liveGame
        });

    const started = Date.now();

    await controller.confirmBurn({
        rank: "5",
        suit: "S"
    });

    const elapsed =
        Date.now() - started;

    assert(
        elapsed < 100 &&
        legacyAutoCalls === 0 &&
        liveGame.lastBurnOptions.analyze === false &&
        liveGame.options.analyzeAfterBurn === true,
        "Live Burn critical path 仍被舊 Auto Analysis 阻塞"
    );

    await wait(45);

    assert(
        quickCalls === 1 &&
        liveGame.lastAnalysisOptions.mode === "monteCarlo" &&
        liveGame.nextAnalysis !== null,
        "Burn 後 Quick Live Analysis 未正確執行"
    );

    messages.push(
        "✓ Burn Critical Path：舊分析 0 次、Quick Analysis 1 次"
    );


    const fullHTML =
        new AnalysisPanel({
            analysis: createAnalysis(),
            mode: AnalysisDisplayMode.FULL
        }).render();

    assert(
        fullHTML.includes("完整機率與 EV") &&
        fullHTML.includes("閒龍寶") &&
        fullHTML.includes("莊龍寶") &&
        fullHTML.includes("EV 尚不可用") &&
        !fullHTML.includes("邊注參考"),
        "Full Analysis 邊注整合錯誤"
    );

    messages.push(
        "✓ 完整機率與 EV 已整合龍寶並移除重複邊注參考"
    );


    const statusHTML =
        new StatusPanel({
            game: {
                shoeNumber: 1,
                observableRemainingCards: 397,
                remainingCards: 392,
                burnConfirmed: true,
                burnInfo: {
                    indicator: {
                        rank: "5",
                        suit: "S"
                    }
                },
                roundCount: 4,
                analysisState: "COMPLETED",
                nextAnalysis: createAnalysis()
            }
        }).render();

    assert(
        statusHTML.includes("牌靴") &&
        statusHTML.includes("397") &&
        statusHTML.includes("392") &&
        statusHTML.includes("5♠") &&
        statusHTML.includes("COMPLETED") &&
        statusHTML.includes("下一局") &&
        statusHTML.includes("44.64%") &&
        statusHTML.includes("45.85%"),
        "Shoe + Next Analysis compact status 錯誤"
    );

    messages.push(
        "✓ 牌靴狀態 + 下一局分析同列摘要正確"
    );


    const renderer =
        new DashboardRenderer({
            version: "3.4.3",
            sections: {
                INPUT: "input",
                INSIGHT: "insight",
                ROADMAP: "roadmap"
            },
            modes: {
                QUICK: "quick",
                FULL: "full"
            }
        });

    const headerHTML =
        renderer.renderHeader({
            mode: "quick",
            busy: false
        });

    assert(
        headerHTML.indexOf("快速") <
            headerHTML.indexOf("完整") &&
        headerHTML.indexOf("完整") <
            headerHTML.indexOf("新牌靴") &&
        headerHTML.includes("v1044ControlRow"),
        "快速 / 完整 / 新牌靴未放在同一控制列"
    );

    assert(
        renderer.renderMessage({
            message: "已開始輸入本局牌面。",
            messageType: "success"
        }) === "" &&
        !renderer.renderMessage({
            message: "測試錯誤",
            messageType: "error"
        }).includes("data-action=\"clear-message\""),
        "成功 X 訊息列仍存在"
    );

    messages.push(
        "✓ Header 單列控制 + 無效 X 成功訊息列已移除"
    );


    assert(
        LIVE_CASINO_UX_CSS.includes("v1044StatusStrip") &&
        LIVE_CASINO_UX_CSS.includes("v1044ControlRow") &&
        LIVE_CASINO_UX_CSS.includes("v1044UnifiedFullAnalysis"),
        "V10.4.4 compact CSS contract 錯誤"
    );

    messages.push(
        "✓ Compact Live CSS contract 正確"
    );


    controller.destroy();

    return `
${messages.join("\n")}

Live Round Critical Path Fix V10.4.4 測試完成

Game Burn Override：通過
Legacy Compatibility：通過
Critical Path：通過
Quick Analysis：通過
Unified Full EV：通過
Dragon Bonus Rows：通過
Compact Status：通過
Compact Header：通過
Message Cleanup：通過
Lifecycle：通過
`;
}
