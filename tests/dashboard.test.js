/**
 * Baccarat Analyzer V3.3 Final
 * tests/dashboard.test.js
 */

import createDashboard, {
    DASHBOARD_VERSION,
    Dashboard,
    DashboardMode
} from "../pages/dashboard.js";

import {
    QuickCardInput
} from "../components/QuickCardInput.js";

import AnalysisPanel
    from "../components/AnalysisPanel.js";

import RecommendationPanel
    from "../components/RecommendationPanel.js";

import StatusPanel
    from "../components/StatusPanel.js";

import createGameMock
    from "./mocks/gameMock.js";


function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function createRoot() {
    const root = document.createElement("div");
    document.body.appendChild(root);
    return root;
}

function nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

async function waitReady(dashboard, attempts = 80) {
    for (let index = 0; index < attempts; index++) {
        await nextTick();
        if (!dashboard.ui.busy) {
            await nextTick();
            return;
        }
    }
    throw new Error("Dashboard action timeout.");
}

async function clickAction(root, dashboard, action) {
    const button = root.querySelector(`[data-action="${action}"]`);
    assert(button, `找不到按鈕：${action}`);
    assert(!button.disabled, `按鈕停用：${action}`);
    button.click();
    await waitReady(dashboard);
}

function selectBurn(root, rank, suit) {
    const rankSelect = root.querySelector('[name="card-rank"]');
    const suitSelect = root.querySelector('[name="card-suit"]');

    rankSelect.value = rank;
    rankSelect.dispatchEvent(new Event("change", { bubbles: true }));

    suitSelect.value = suit;
    suitSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

async function addQuickCard(root, dashboard, rank) {
    const rankButton = root.querySelector(`[data-quick-rank="${rank}"]`);
    assert(rankButton, `缺少點數牌卡：${rank}`);

    rankButton.click();
    await waitReady(dashboard);
}

async function addPreciseCard(root, dashboard, rank, suit) {
    const preciseButton = root.querySelector('[data-quick-mode="precise"]');
    assert(preciseButton, "缺少指定花色模式按鈕");
    preciseButton.click();

    const rankButton = root.querySelector(`[data-quick-rank="${rank}"]`);
    assert(rankButton, `缺少點數牌卡：${rank}`);
    rankButton.click();
    await nextTick();

    const suitButton = root.querySelector(`[data-quick-suit="${suit}"]`);
    assert(suitButton, `缺少花色牌卡：${suit}`);
    assert(!suitButton.disabled, `花色牌卡未啟用：${suit}`);

    suitButton.click();
    await waitReady(dashboard);
}


export default async function dashboardTest() {
    const messages = [];
    const root = createRoot();

    try {
        const game = createGameMock();
        const dashboard = createDashboard({ root, game });

        assert(dashboard instanceof Dashboard, "工廠函式應建立 Dashboard");
        assert(DASHBOARD_VERSION === "3.3.0", "Dashboard 版本應為 3.3.0");
        assert(dashboard.components.statusPanel instanceof StatusPanel, "StatusPanel 未建立");
        assert(dashboard.components.analysisPanel instanceof AnalysisPanel, "AnalysisPanel 未建立");
        assert(dashboard.components.recommendationPanel instanceof RecommendationPanel, "RecommendationPanel 未建立");
        messages.push("✓ V3.3 Final 元件建立正確");

        assert(root.querySelector(".dashboardV33"), "缺少 Dashboard V3.3");
        assert(root.querySelector(".v3StatusStrip"), "缺少 StatusPanel");
        assert(root.querySelector(".v3RoundPanel"), "缺少 Round Panel");
        assert(root.querySelector(".v3AnalysisPanel"), "缺少 AnalysisPanel");
        assert(root.querySelector(".v3RecommendationPanel"), "缺少 RecommendationPanel");
        assert(root.querySelector(".v3HistoryPanel"), "缺少 History Panel");
        assert(root.querySelector(".v3RoadmapPanel"), "缺少 Roadmap Panel");
        assert(root.querySelector(".v33CasinoGrid"), "缺少 V3.3 Casino Grid");
        assert(root.querySelector(".v33InputZone"), "缺少輸牌區");
        assert(root.querySelector(".v33InsightZone"), "缺少分析區");
        assert(root.querySelector(".v33RoadZone"), "缺少路單區");
        assert(root.querySelectorAll("[data-action='set-mobile-section']").length === 3, "手機分區按鈕應為 3 個");
        messages.push("✓ V3.3 Final Casino Dashboard DOM 正確");

        assert(root.querySelector('[data-mode="quick"]'), "缺少快速模式按鈕");
        assert(root.querySelector('[data-mode="full"]'), "缺少完整模式按鈕");
        assert(dashboard.ui.mode === DashboardMode.QUICK || dashboard.ui.mode === DashboardMode.FULL, "模式值錯誤");

        root.querySelector('[data-mode="full"]').click();
        assert(dashboard.ui.mode === DashboardMode.FULL, "完整模式切換失敗");

        root.querySelector('[data-mode="quick"]').click();
        assert(dashboard.ui.mode === DashboardMode.QUICK, "快速模式切換失敗");
        messages.push("✓ 快速／完整模式切換正確");

        root.querySelector('[data-section="insight"]').click();
        assert(dashboard.ui.mobileSection === "insight", "手機分析分區切換失敗");

        root.querySelector('[data-section="roadmap"]').click();
        assert(dashboard.ui.mobileSection === "roadmap", "手機路單分區切換失敗");

        root.querySelector('[data-section="input"]').click();
        assert(dashboard.ui.mobileSection === "input", "手機輸牌分區切換失敗");
        messages.push("✓ 手機三區切換正確");

        selectBurn(root, "A", "S");
        await clickAction(root, dashboard, "confirm-burn");

        assert(game.burnConfirmed === true, "燒牌確認失敗");
        assert(root.querySelector(".v3MainMetrics"), "缺少橫向主注分析");
        assert(root.textContent.includes("建議下注"), "缺少下注建議");
        messages.push("✓ 燒牌、分析與建議正確");

        root.querySelector('[data-mode="full"]').click();

        assert(root.querySelector(".v3FullAnalysis"), "完整模式未顯示完整分析");
        assert(root.textContent.includes("邊注參考"), "完整模式缺少邊注區");
        assert(root.textContent.includes("最低"), "完整模式缺少建議限制");
        messages.push("✓ 完整分析顯示正確");

        await clickAction(root, dashboard, "start-round");

        assert(dashboard.components.quickCardInput instanceof QuickCardInput, "QuickCardInput 未掛載");
        assert(
            root.querySelectorAll("[data-quick-rank]").length === 13,
            "點數牌卡應為 13 個"
        );

        assert(
            root.querySelector('[data-quick-mode="auto"]'),
            "缺少自動花色模式按鈕"
        );

        assert(
            root.querySelector('[data-quick-mode="precise"]'),
            "缺少指定花色模式按鈕"
        );

        /*
         * V3.3 自動花色模式下不顯示四個花色牌卡；
         * 切換為指定花色模式後才應出現。
         */
        assert(
            root.querySelectorAll("[data-quick-suit]").length === 0,
            "自動花色模式不應顯示花色牌卡"
        );

        root.querySelector('[data-quick-mode="precise"]').click();

        assert(
            root.querySelectorAll("[data-quick-suit]").length === 4,
            "指定花色模式下花色牌卡應為 4 個"
        );

        root.querySelector('[data-quick-mode="auto"]').click();

        messages.push("✓ QuickCardInput V3.3 模式掛載正確");

        /*
         * V3.3 鍵盤一鍵輸牌：
         * 按 9 應自動選花色並立即加入。
         */
        window.dispatchEvent(new KeyboardEvent("keydown", {
            key: "9",
            bubbles: true
        }));

        await waitReady(dashboard);

        assert(game.calls.addManualCard === 1, "鍵盤 9 未自動加入");
        assert(game.manualCards[0]?.card.rank === "9", "鍵盤加入 Rank 錯誤");
        assert(game.manualCards[0]?.card.suit, "自動花色未產生");
        messages.push("✓ V3.3 鍵盤一鍵輸牌正確");

        await clickAction(root, dashboard, "undo-card");

        const clickInputCallsBefore =
            game.calls.addManualCard;

        await addQuickCard(root, dashboard, "9");

        assert(
            game.calls.addManualCard ===
                clickInputCallsBefore + 1,
            "點數牌卡未一鍵自動加入"
        );

        assert(game.manualCards.length === 1, "牌面未加入");
        assert(game.manualCards[0]?.card.rank === "9", "一鍵加入點數錯誤");
        messages.push("✓ 點數一鍵自動花色正確");

        await clickAction(root, dashboard, "undo-card");

        await addPreciseCard(root, dashboard, "8", "D");

        assert(game.manualCards[0]?.card.rank === "8", "指定花色 Rank 錯誤");
        assert(game.manualCards[0]?.card.suit === "D", "指定花色 Suit 錯誤");
        messages.push("✓ 指定花色模式正確");

        await clickAction(root, dashboard, "undo-card");
        assert(game.manualCards.length === 0, "復原失敗");

        await addQuickCard(root, dashboard, "9");
        await addQuickCard(root, dashboard, "5");
        await addQuickCard(root, dashboard, "K");
        await addQuickCard(root, dashboard, "2");

        assert(game.canFinishManualRound === true, "四張牌後應可確認");
        assert(dashboard.components.quickCardInput === null, "完成輸牌後應卸載 QuickCardInput");

        await clickAction(root, dashboard, "finish-round");

        assert(game.history.count === 1, "History 未新增");
        assert(root.querySelector(".v3HistoryRoad"), "History 未顯示");
        messages.push("✓ 完成本局與 History 正確");

        const roadmapButton = root.querySelector('[data-road="smallRoad"]');
        assert(roadmapButton, "缺少小路按鈕");
        roadmapButton.click();
        assert(dashboard.ui.activeRoad === "smallRoad", "路單切換失敗");
        messages.push("✓ Roadmap 切換正確");

        const summary = dashboard.summary;
        assert(summary.version === "3.3.0", "summary.version 錯誤");
        assert(summary.mounted === true, "summary.mounted 錯誤");
        assert(summary.roundCount === 1, "summary.roundCount 錯誤");
        assert(summary.hasAnalysis === true, "summary.hasAnalysis 錯誤");
        assert(summary.autoSuit === true, "summary.autoSuit 錯誤");
        assert(summary.casinoLayout === true, "summary.casinoLayout 錯誤");
        assert(summary.mobileSection === "input", "summary.mobileSection 錯誤");
        messages.push("✓ summary 正確");

        dashboard.destroy();
        assert(root.innerHTML === "", "destroy() 應清空 root");
        messages.push("✓ destroy() 正確");

        return `
${messages.join("\n")}

Dashboard V3.3 Final 測試完成

元件化：通過
快速／完整模式：通過
13 點數牌卡：通過
4 花色牌卡：通過
自動加入：通過
單頁版面：通過
鍵盤一鍵輸牌：通過
自動花色：通過
指定花色模式：通過
V3.3 Final：通過
Casino Grid：通過
手機三區切換：通過
`;
    }
    finally {
        root.remove();
    }
}
