/**
 * Baccarat Analyzer V3
 * tests/dashboard.test.js
 */

import createDashboard, {
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

async function addQuickCard(root, dashboard, rank, suit) {
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
        assert(dashboard.components.statusPanel instanceof StatusPanel, "StatusPanel 未建立");
        assert(dashboard.components.analysisPanel instanceof AnalysisPanel, "AnalysisPanel 未建立");
        assert(dashboard.components.recommendationPanel instanceof RecommendationPanel, "RecommendationPanel 未建立");
        messages.push("✓ V3 元件建立正確");

        assert(root.querySelector(".dashboardV3"), "缺少 Dashboard V3");
        assert(root.querySelector(".v3StatusStrip"), "缺少 StatusPanel");
        assert(root.querySelector(".v3RoundPanel"), "缺少 Round Panel");
        assert(root.querySelector(".v3AnalysisPanel"), "缺少 AnalysisPanel");
        assert(root.querySelector(".v3RecommendationPanel"), "缺少 RecommendationPanel");
        assert(root.querySelector(".v3HistoryPanel"), "缺少 History Panel");
        assert(root.querySelector(".v3RoadmapPanel"), "缺少 Roadmap Panel");
        messages.push("✓ V3 初始 DOM 正確");

        assert(root.querySelector('[data-mode="quick"]'), "缺少快速模式按鈕");
        assert(root.querySelector('[data-mode="full"]'), "缺少完整模式按鈕");
        assert(dashboard.ui.mode === DashboardMode.QUICK || dashboard.ui.mode === DashboardMode.FULL, "模式值錯誤");

        root.querySelector('[data-mode="full"]').click();
        assert(dashboard.ui.mode === DashboardMode.FULL, "完整模式切換失敗");

        root.querySelector('[data-mode="quick"]').click();
        assert(dashboard.ui.mode === DashboardMode.QUICK, "快速模式切換失敗");
        messages.push("✓ 快速／完整模式切換正確");

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
        assert(root.querySelectorAll("[data-quick-rank]").length === 13, "點數牌卡應為 13 個");
        assert(root.querySelectorAll("[data-quick-suit]").length === 4, "花色牌卡應為 4 個");
        messages.push("✓ QuickCardInput 掛載正確");

        await addQuickCard(root, dashboard, "9", "H");

        assert(game.calls.addManualCard === 1, "選完花色後未自動加入");
        assert(game.manualCards.length === 1, "牌面未加入");
        assert(root.textContent.includes("9♥"), "加入牌面未顯示");
        messages.push("✓ 點數＋花色自動加入正確");

        await clickAction(root, dashboard, "undo-card");
        assert(game.manualCards.length === 0, "復原失敗");

        await addQuickCard(root, dashboard, "9", "H");
        await addQuickCard(root, dashboard, "5", "D");
        await addQuickCard(root, dashboard, "K", "C");
        await addQuickCard(root, dashboard, "2", "S");

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
        assert(summary.mounted === true, "summary.mounted 錯誤");
        assert(summary.roundCount === 1, "summary.roundCount 錯誤");
        assert(summary.hasAnalysis === true, "summary.hasAnalysis 錯誤");
        messages.push("✓ summary 正確");

        dashboard.destroy();
        assert(root.innerHTML === "", "destroy() 應清空 root");
        messages.push("✓ destroy() 正確");

        return `
${messages.join("\n")}

Dashboard V3 測試完成

元件化：通過
快速／完整模式：通過
13 點數牌卡：通過
4 花色牌卡：通過
自動加入：通過
單頁版面：通過
`;
    }
    finally {
        root.remove();
    }
}
