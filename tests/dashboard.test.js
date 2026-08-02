/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * tests/dashboard.test.js
 *
 * 對應新版 pages/dashboard.js：
 *
 * - 頂部牌靴狀態橫幅
 * - QuickCardInput 點數牌卡
 * - 四個花色牌卡
 * - 選完花色後自動加入牌面
 * - 主注橫向分析
 * - 完整分析展開／收合
 * - Recommendation、History、Roadmap
 *
 * 本測試使用 tests/mocks/gameMock.js，
 * 不重複測試 engine/game.js 的規則細節。
 */

import createDashboard, {
    Dashboard
} from "../pages/dashboard.js";

import {
    QuickCardInput
} from "../components/QuickCardInput.js";

import createGameMock
    from "./mocks/gameMock.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(
            message
        );

    }

}


function assertThrows(
    callback,
    message
) {

    let caught =
        null;

    try {

        callback();

    }
    catch (error) {

        caught =
            error;

    }

    assert(
        caught instanceof Error,
        message
    );

    return caught;

}


function createRoot() {

    const root =
        document.createElement(
            "div"
        );

    root.className =
        "dashboardTestRoot";

    document.body.appendChild(
        root
    );

    return root;

}


function nextTick() {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                0
            )
    );

}


async function waitUntilReady(
    dashboard,
    attempts = 80
) {

    for (
        let index = 0;
        index < attempts;
        index++
    ) {

        await nextTick();

        if (!dashboard.ui.busy) {

            /*
             * 再等一次，確保 finally 裡的 render()
             * 已完成並重新掛載 QuickCardInput。
             */
            await nextTick();

            return;

        }

    }

    throw new Error(
        "Dashboard action timeout."
    );

}


function findAction(
    root,
    action
) {

    return root.querySelector(
        `[data-action="${action}"]`
    );

}


async function clickAction(
    root,
    dashboard,
    action
) {

    const button =
        findAction(
            root,
            action
        );

    assert(
        button,
        `找不到按鈕：${action}`
    );

    assert(
        button.disabled !== true,
        `按鈕目前停用：${action}`
    );

    button.click();

    await waitUntilReady(
        dashboard
    );

}


function selectBurnCard(
    root,
    rank,
    suit
) {

    const rankSelect =
        root.querySelector(
            '[name="card-rank"]'
        );

    const suitSelect =
        root.querySelector(
            '[name="card-suit"]'
        );

    assert(
        rankSelect,
        "找不到燒牌 Rank 選單"
    );

    assert(
        suitSelect,
        "找不到燒牌 Suit 選單"
    );


    rankSelect.value =
        rank;

    rankSelect.dispatchEvent(
        new Event(
            "change",
            {
                bubbles:
                    true
            }
        )
    );


    suitSelect.value =
        suit;

    suitSelect.dispatchEvent(
        new Event(
            "change",
            {
                bubbles:
                    true
            }
        )
    );

}


function getQuickRankButton(
    root,
    rank
) {

    return root.querySelector(
        `[data-quick-rank="${rank}"]`
    );

}


function getQuickSuitButton(
    root,
    suit
) {

    return root.querySelector(
        `[data-quick-suit="${suit}"]`
    );

}


async function addQuickCard(
    root,
    dashboard,
    rank,
    suit
) {

    const rankButton =
        getQuickRankButton(
            root,
            rank
        );

    assert(
        rankButton,
        `找不到點數牌卡：${rank}`
    );

    assert(
        rankButton.disabled !== true,
        `點數牌卡已停用：${rank}`
    );

    rankButton.click();

    /*
     * QuickCardInput 選取點數後會立即重新 render。
     * 等待一個 event loop，避免不同瀏覽器的 DOM 更新時序差異。
     */
    await nextTick();


    const selectedRankButton =
        getQuickRankButton(
            root,
            rank
        );

    assert(
        selectedRankButton,
        `點數 ${rank} 選取後牌卡仍應存在`
    );


    const suitButtons =
        root.querySelectorAll(
            "[data-quick-suit]"
        );

    assert(
        suitButtons.length === 4,
        "花色牌卡應有四個"
    );

    assert(
        Array.from(
            suitButtons
        ).some(
            button =>
                button.disabled !==
                true
        ),
        `點數 ${rank} 選取後至少一個花色牌卡應啟用`
    );


    const suitButton =
        getQuickSuitButton(
            root,
            suit
        );

    assert(
        suitButton,
        `找不到花色牌卡：${suit}`
    );

    assert(
        suitButton.disabled !== true,
        `花色牌卡已停用：${suit}`
    );

    suitButton.click();

    await waitUntilReady(
        dashboard
    );

}


export default async function dashboardTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. constructor()
         */
        const constructorGame =
            createGameMock();

        const unmounted =
            new Dashboard({

                root:
                    null,

                game:
                    constructorGame,

                autoMount:
                    false

            });

        assert(
            unmounted instanceof Dashboard,
            "Dashboard 建立失敗"
        );

        assert(
            unmounted.game ===
                constructorGame,
            "Dashboard 未保存注入的 Game"
        );

        assert(
            unmounted.root === null,
            "未掛載時 root 應為 null"
        );

        assert(
            unmounted.components
                .quickCardInput ===
                null,
            "未掛載時 QuickCardInput 應為 null"
        );

        messages.push(
            "✓ constructor() 正確"
        );


        /**
         * 2. 參數驗證
         */
        assertThrows(
            () =>
                new Dashboard({

                    root:
                        123,

                    game:
                        createGameMock(),

                    autoMount:
                        false

                }),
            "非法 root 應拋出錯誤"
        );

        assertThrows(
            () =>
                new Dashboard({

                    game:
                        createGameMock(),

                    gameOptions:
                        null,

                    autoMount:
                        false

                }),
            "非法 gameOptions 應拋出錯誤"
        );

        messages.push(
            "✓ 參數驗證正確"
        );


        /**
         * 3. mount() 與初始 DOM
         */
        const root =
            createRoot();

        roots.push(
            root
        );

        const game =
            createGameMock();

        const dashboard =
            createDashboard({

                root,

                game

            });

        assert(
            dashboard instanceof Dashboard,
            "工廠函式應回傳 Dashboard"
        );

        assert(
            dashboard.game === game,
            "Dashboard 應使用注入的 Game"
        );

        assert(
            root.querySelector(
                ".dashboardPage"
            ),
            "mount() 後應建立 Dashboard"
        );

        assert(
            root.textContent.includes(
                "百家樂分析儀"
            ),
            "Dashboard 標題未顯示"
        );

        assert(
            root.querySelector(
                ".dashboardStatusBanner"
            ),
            "缺少牌靴狀態橫幅"
        );

        assert(
            root.querySelectorAll(
                ".statusBannerItem"
            ).length >= 5,
            "狀態橫幅應顯示牌靴、剩餘、燒牌與局數"
        );

        assert(
            root.querySelector(
                ".roundPanel"
            ),
            "缺少 Round Panel"
        );

        assert(
            root.querySelector(
                ".analysisPanel"
            ),
            "缺少 Analysis Panel"
        );

        assert(
            root.querySelector(
                ".recommendationPanel"
            ),
            "缺少 Recommendation Panel"
        );

        assert(
            root.querySelector(
                ".historyPanel"
            ),
            "缺少 History Panel"
        );

        assert(
            root.querySelector(
                ".roadmapPanel"
            ),
            "缺少 Roadmap Panel"
        );

        assert(
            root.textContent.includes(
                "輸入燒牌指示牌"
            ),
            "初始畫面應要求輸入燒牌指示牌"
        );

        assert(
            root.textContent.includes(
                "尚無牌局紀錄"
            ),
            "初始 History 應為空"
        );

        assert(
            dashboard.components
                .quickCardInput ===
                null,
            "燒牌前不應掛載 QuickCardInput"
        );

        messages.push(
            "✓ mount() 與初始橫幅 DOM 正確"
        );


        /**
         * 4. 燒牌選單
         */
        selectBurnCard(
            root,
            "K",
            "D"
        );

        assert(
            dashboard.ui.selectedRank ===
                "K",
            "燒牌 Rank 未同步"
        );

        assert(
            dashboard.ui.selectedSuit ===
                "D",
            "燒牌 Suit 未同步"
        );

        messages.push(
            "✓ 燒牌選單正確"
        );


        /**
         * 5. 建立新牌靴
         */
        const previousShoeNumber =
            game.shoeNumber;

        await clickAction(
            root,
            dashboard,
            "new-shoe"
        );

        assert(
            game.calls.startNewShoe ===
                1,
            "未呼叫 startNewShoe()"
        );

        assert(
            game.shoeNumber ===
                previousShoeNumber + 1,
            "牌靴編號未增加"
        );

        assert(
            root.textContent.includes(
                "已建立新牌靴"
            ),
            "新牌靴成功訊息未顯示"
        );

        messages.push(
            "✓ 建立新牌靴正確"
        );


        /**
         * 6. 確認燒牌與第一局分析
         */
        selectBurnCard(
            root,
            "A",
            "S"
        );

        await clickAction(
            root,
            dashboard,
            "confirm-burn"
        );

        assert(
            game.calls
                .confirmBurnIndicator ===
                1,
            "未呼叫 confirmBurnIndicator()"
        );

        assert(
            game.burnConfirmed ===
                true,
            "burnConfirmed 應為 true"
        );

        assert(
            game.calls
                .analyzeNextRound ===
                1,
            "燒牌後應分析第一局"
        );

        assert(
            root.textContent.includes(
                "A♠"
            ),
            "燒牌指示牌未顯示"
        );

        assert(
            root.textContent.includes(
                "燒牌已確認"
            ),
            "燒牌成功訊息未顯示"
        );

        messages.push(
            "✓ 燒牌與第一局分析正確"
        );


        /**
         * 7. 橫向主注分析與 Recommendation
         */
        assert(
            root.querySelector(
                ".analysisHorizontal"
            ),
            "缺少橫向分析摘要"
        );

        assert(
            root.querySelectorAll(
                ".analysisMetric"
            ).length === 3,
            "橫向分析應顯示閒、莊、和三項"
        );

        assert(
            root.textContent.includes(
                "47.00%"
            ),
            "莊機率未顯示"
        );

        assert(
            root.textContent.includes(
                "0.0080"
            ),
            "莊 EV 未顯示"
        );

        assert(
            root.textContent.includes(
                "建議下注"
            ),
            "Recommendation 未顯示"
        );

        assert(
            root.textContent.includes(
                "莊"
            ),
            "Recommendation 未顯示莊"
        );

        assert(
            root.textContent.includes(
                "300"
            ),
            "建議金額未顯示"
        );

        messages.push(
            "✓ 橫向分析與 Recommendation 正確"
        );


        /**
         * 8. 完整分析展開／收合
         */
        const toggleBefore =
            findAction(
                root,
                "toggle-analysis"
            );

        assert(
            toggleBefore,
            "找不到完整分析切換按鈕"
        );

        toggleBefore.click();

        assert(
            dashboard.ui
                .analysisExpanded ===
                true,
            "完整分析應展開"
        );

        assert(
            root.querySelectorAll(
                ".analysisSection"
            ).length >= 2,
            "展開後應顯示機率與 EV 詳細資料"
        );

        findAction(
            root,
            "toggle-analysis"
        ).click();

        assert(
            dashboard.ui
                .analysisExpanded ===
                false,
            "完整分析應收合"
        );

        messages.push(
            "✓ 完整分析展開與收合正確"
        );


        /**
         * 9. 開始手動牌局與 QuickCardInput
         */
        await clickAction(
            root,
            dashboard,
            "start-round"
        );

        assert(
            game.calls
                .startManualRound ===
                1,
            "未呼叫 startManualRound()"
        );

        assert(
            game.isManualRoundActive ===
                true,
            "手動牌局應為 active"
        );

        assert(
            root.textContent.includes(
                "Player 第 1 張"
            ),
            "第一張提示未顯示"
        );

        assert(
            dashboard.components
                .quickCardInput instanceof
                QuickCardInput,
            "QuickCardInput 應成功掛載"
        );

        assert(
            root.querySelectorAll(
                "[data-quick-rank]"
            ).length === 13,
            "點數牌卡應有十三個"
        );

        assert(
            root.querySelectorAll(
                "[data-quick-suit]"
            ).length === 4,
            "花色牌卡應有四個"
        );

        assert(
            root.querySelector(
                '[data-quick-suit="S"]'
            ),
            "缺少黑桃牌卡"
        );

        assert(
            root.querySelector(
                '[data-quick-suit="H"]'
            ),
            "缺少紅心牌卡"
        );

        assert(
            root.querySelector(
                '[data-quick-suit="D"]'
            ),
            "缺少方塊牌卡"
        );

        assert(
            root.querySelector(
                '[data-quick-suit="C"]'
            ),
            "缺少梅花牌卡"
        );

        messages.push(
            "✓ QuickCardInput 點數與四花色牌卡正確"
        );


        /**
         * 10. 快速輸牌與自動加入
         */
        await addQuickCard(
            root,
            dashboard,
            "9",
            "H"
        );

        assert(
            game.calls
                .addManualCard ===
                1,
            "選完花色後應呼叫 addManualCard()"
        );

        assert(
            game.manualCards.length ===
                1,
            "快速加入後應有一張牌"
        );

        assert(
            game.manualCards[0]
                .side ===
                "player",
            "第一張應加入 Player"
        );

        assert(
            game.manualCards[0]
                .card.rank ===
                "9" &&
            game.manualCards[0]
                .card.suit ===
                "H",
            "快速輸入牌面資料錯誤"
        );

        assert(
            root.textContent.includes(
                "9♥"
            ),
            "快速加入的牌未顯示"
        );

        assert(
            root.textContent.includes(
                "Banker 第 1 張"
            ),
            "加入後應自動切到下一張"
        );

        assert(
            !findAction(
                root,
                "add-card"
            ),
            "新版快速輸牌不應顯示加入按鈕"
        );

        messages.push(
            "✓ 點數加花色後自動加入正確"
        );


        /**
         * 11. 復原一張
         */
        await clickAction(
            root,
            dashboard,
            "undo-card"
        );

        assert(
            game.calls
                .undoManualCard ===
                1,
            "未呼叫 undoManualCard()"
        );

        assert(
            game.manualCards.length ===
                0,
            "復原後手動牌應為空"
        );

        assert(
            root.textContent.includes(
                "已復原最後一張牌"
            ),
            "復原訊息未顯示"
        );

        messages.push(
            "✓ 復原牌面正確"
        );


        /**
         * 12. 取消本局
         */
        await addQuickCard(
            root,
            dashboard,
            "8",
            "D"
        );

        await clickAction(
            root,
            dashboard,
            "cancel-round"
        );

        assert(
            game.calls
                .cancelManualRound ===
                1,
            "未呼叫 cancelManualRound()"
        );

        assert(
            game.isManualRoundActive ===
                false,
            "取消後牌局應停止"
        );

        assert(
            game.manualCards.length ===
                0,
            "取消後手動牌應清空"
        );

        messages.push(
            "✓ 取消本局正確"
        );


        /**
         * 13. 完整四張牌
         */
        await clickAction(
            root,
            dashboard,
            "start-round"
        );

        const cards = [

            [
                "9",
                "H"
            ],

            [
                "5",
                "D"
            ],

            [
                "K",
                "C"
            ],

            [
                "2",
                "S"
            ]

        ];

        for (
            const [
                rank,
                suit
            ] of cards
        ) {

            await addQuickCard(
                root,
                dashboard,
                rank,
                suit
            );

        }

        assert(
            game.canFinishManualRound ===
                true,
            "四張牌後應可確認本局"
        );

        assert(
            findAction(
                root,
                "finish-round"
            ),
            "應顯示確認本局按鈕"
        );

        assert(
            dashboard.components
                .quickCardInput ===
                null,
            "牌面完成後 QuickCardInput 應卸載"
        );

        messages.push(
            "✓ 完整四張快速輸牌正確"
        );


        /**
         * 14. 完成本局
         */
        await clickAction(
            root,
            dashboard,
            "finish-round"
        );

        assert(
            game.calls
                .finishManualRound ===
                1,
            "未呼叫 finishManualRound()"
        );

        assert(
            game.history.count ===
                1,
            "History 應新增一局"
        );

        assert(
            game.winner ===
                "Player",
            "測試牌局應為 Player 勝"
        );

        assert(
            root.textContent.includes(
                "閒勝"
            ),
            "勝方未顯示"
        );

        messages.push(
            "✓ 完成本局正確"
        );


        /**
         * 15. History 與 Roadmap
         */
        assert(
            root.querySelectorAll(
                ".historyItem"
            ).length === 1,
            "History 應顯示一筆"
        );

        assert(
            root.querySelector(
                ".historyItem.player"
            ),
            "History 應套用 Player 樣式"
        );

        assert(
            root.querySelector(
                ".roadCell.player"
            ),
            "Roadmap 應顯示 Player"
        );

        messages.push(
            "✓ History 與 Roadmap 正確"
        );


        /**
         * 16. 重新分析
         */
        const analyzeCalls =
            game.calls
                .analyzeNextRound;

        await clickAction(
            root,
            dashboard,
            "analyze"
        );

        assert(
            game.calls
                .analyzeNextRound ===
                analyzeCalls + 1,
            "重新分析未執行"
        );

        messages.push(
            "✓ 重新分析正確"
        );


        /**
         * 17. 路單切換
         */
        const smallRoadButton =
            root.querySelector(
                '[data-action="select-road"][data-road="smallRoad"]'
            );

        assert(
            smallRoadButton,
            "找不到小路按鈕"
        );

        smallRoadButton.click();

        assert(
            dashboard.ui.activeRoad ===
                "smallRoad",
            "activeRoad 未更新"
        );

        assert(
            root.textContent.includes(
                "小路尚無資料"
            ),
            "空小路提示未顯示"
        );

        messages.push(
            "✓ 路單切換正確"
        );


        /**
         * 18. History limit
         */
        const historyLimit =
            root.querySelector(
                '[name="history-limit"]'
            );

        assert(
            historyLimit,
            "找不到 History limit"
        );

        historyLimit.value =
            "10";

        historyLimit.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles:
                        true
                }
            )
        );

        assert(
            dashboard.ui.historyLimit ===
                10,
            "History limit 未更新"
        );

        messages.push(
            "✓ History limit 正確"
        );


        /**
         * 19. 訊息顯示與清除
         */
        dashboard.setMessage(
            "測試訊息",
            "success"
        );

        dashboard.render();

        assert(
            root.textContent.includes(
                "測試訊息"
            ),
            "訊息未顯示"
        );

        findAction(
            root,
            "clear-message"
        ).click();

        assert(
            dashboard.ui.message ===
                "",
            "訊息未清除"
        );

        messages.push(
            "✓ 訊息功能正確"
        );


        /**
         * 20. Busy 狀態
         */
        dashboard.ui.busy =
            true;

        dashboard.render();

        assert(
            findAction(
                root,
                "new-shoe"
            ).disabled ===
                true,
            "Busy 時新牌靴按鈕應停用"
        );

        dashboard.ui.busy =
            false;

        dashboard.render();

        messages.push(
            "✓ Busy 狀態正確"
        );


        /**
         * 21. summary
         */
        const summary =
            dashboard.summary;

        assert(
            summary &&
            typeof summary ===
                "object",
            "summary 應為物件"
        );

        assert(
            summary.mounted ===
                true,
            "summary.mounted 錯誤"
        );

        assert(
            summary.roundCount ===
                1,
            "summary.roundCount 錯誤"
        );

        assert(
            summary.hasAnalysis ===
                true,
            "summary.hasAnalysis 錯誤"
        );

        assert(
            summary.historyLimit ===
                10,
            "summary.historyLimit 錯誤"
        );

        messages.push(
            "✓ summary 正確"
        );


        /**
         * 22. destroy()
         */
        dashboard.destroy();

        assert(
            root.innerHTML ===
                "",
            "destroy() 應清空 root"
        );

        assert(
            dashboard.components
                .quickCardInput ===
                null,
            "destroy() 應清除 QuickCardInput"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        return `
${messages.join("\n")}

Dashboard 測試完成

新版介面：
狀態橫幅：通過
主注橫向分析：通過
QuickCardInput：通過
點數牌卡：13
花色牌卡：4
選完花色自動加入：通過
完整分析展開／收合：通過

Game 呼叫次數：
startNewShoe：${game.calls.startNewShoe}
confirmBurnIndicator：${game.calls.confirmBurnIndicator}
analyzeNextRound：${game.calls.analyzeNextRound}
startManualRound：${game.calls.startManualRound}
addManualCard：${game.calls.addManualCard}
undoManualCard：${game.calls.undoManualCard}
cancelManualRound：${game.calls.cancelManualRound}
finishManualRound：${game.calls.finishManualRound}
`;

    }
    finally {

        for (
            const root of
            roots
        ) {

            root?.remove();

        }

    }

}
