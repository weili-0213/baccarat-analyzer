/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * tests/dashboard.test.js
 *
 * 對應目前 pages/dashboard.js：
 *
 * - 直接操作 DOM 的牌面選單
 * - 直接渲染 Probability、EV、Recommendation
 * - 使用 tests/mocks/gameMock.js
 * - 不使用舊版 components 容器
 */

import createDashboard, {
    Dashboard
} from "../pages/dashboard.js";

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
    attempts = 40
) {

    for (
        let index = 0;
        index < attempts;
        index++
    ) {

        await nextTick();

        if (!dashboard.ui.busy) {

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

    button.click();

    await waitUntilReady(
        dashboard
    );

}


function selectCard(
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
        "找不到 Rank 選單"
    );

    assert(
        suitSelect,
        "找不到 Suit 選單"
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


async function addCard(
    root,
    dashboard,
    rank,
    suit
) {

    selectCard(
        root,
        rank,
        suit
    );

    await clickAction(
        root,
        dashboard,
        "add-card"
    );

}


export default async function dashboardTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. constructor()
         */
        const gameForConstructor =
            createGameMock();

        const unmounted =
            new Dashboard({

                root:
                    null,

                game:
                    gameForConstructor,

                autoMount:
                    false

            });

        assert(
            unmounted instanceof Dashboard,
            "Dashboard 建立失敗"
        );

        assert(
            unmounted.game ===
                gameForConstructor,
            "Dashboard 未保存注入的 Game"
        );

        assert(
            unmounted.root === null,
            "未掛載時 root 應為 null"
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
         * 3. mount()
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

        messages.push(
            "✓ mount() 正確"
        );


        /**
         * 4. 初始 DOM
         */
        assert(
            root.querySelector(
                ".shoePanel"
            ),
            "缺少 Shoe Panel"
        );

        assert(
            root.querySelector(
                ".burnPanel"
            ),
            "缺少 Burn Panel"
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
                ".statusPanel"
            ),
            "缺少 Status Panel"
        );

        assert(
            root.querySelector(
                ".historyPanel"
            ),
            "缺少 History Panel"
        );

        assert(
            root.textContent.includes(
                "請先輸入燒牌指示牌"
            ),
            "初始畫面應等待燒牌"
        );

        assert(
            root.textContent.includes(
                "尚無牌局紀錄"
            ),
            "初始 History 應為空"
        );

        messages.push(
            "✓ 初始 DOM 正確"
        );


        /**
         * 5. 牌面選單
         */
        selectCard(
            root,
            "K",
            "D"
        );

        assert(
            dashboard.ui.selectedRank ===
                "K",
            "Rank 未同步"
        );

        assert(
            dashboard.ui.selectedSuit ===
                "D",
            "Suit 未同步"
        );

        messages.push(
            "✓ 牌面選單正確"
        );


        /**
         * 6. 新牌靴
         */
        const previousShoeNumber =
            game.shoeNumber;

        await clickAction(
            root,
            dashboard,
            "new-shoe"
        );

        assert(
            game.calls.startNewShoe === 1,
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
            "新牌靴訊息未顯示"
        );

        messages.push(
            "✓ 新牌靴正確"
        );


        /**
         * 7. 燒牌與第一局分析
         */
        selectCard(
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
                .confirmBurnIndicator === 1,
            "未呼叫 confirmBurnIndicator()"
        );

        assert(
            game.burnConfirmed === true,
            "burnConfirmed 應為 true"
        );

        assert(
            game.calls
                .analyzeNextRound === 1,
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
            "燒牌完成訊息未顯示"
        );

        messages.push(
            "✓ 燒牌與第一局分析正確"
        );


        /**
         * 8. 分析畫面
         */
        assert(
            root.textContent.includes(
                "47.00%"
            ),
            "Banker 機率未顯示"
        );

        assert(
            root.textContent.includes(
                "0.0080"
            ),
            "Banker EV 未顯示"
        );

        assert(
            root.textContent.includes(
                "建議下注"
            ),
            "Recommendation 未顯示"
        );

        assert(
            root.textContent.includes(
                "COMPLETED"
            ),
            "分析狀態未顯示 COMPLETED"
        );

        messages.push(
            "✓ 分析畫面正確"
        );


        /**
         * 9. 開始手動牌局
         */
        await clickAction(
            root,
            dashboard,
            "start-round"
        );

        assert(
            game.calls
                .startManualRound === 1,
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

        messages.push(
            "✓ 開始手動牌局正確"
        );


        /**
         * 10. 加牌與復原
         */
        await addCard(
            root,
            dashboard,
            "9",
            "H"
        );

        assert(
            game.manualCards.length === 1,
            "加入後應有一張牌"
        );

        assert(
            root.textContent.includes(
                "9♥"
            ),
            "加入的牌未顯示"
        );

        await clickAction(
            root,
            dashboard,
            "undo-card"
        );

        assert(
            game.manualCards.length === 0,
            "復原後應為零張"
        );

        assert(
            root.textContent.includes(
                "已復原最後一張牌"
            ),
            "復原訊息未顯示"
        );

        messages.push(
            "✓ 加牌與復原正確"
        );


        /**
         * 11. 取消牌局
         */
        await addCard(
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
            game.isManualRoundActive ===
                false,
            "取消後牌局應停止"
        );

        assert(
            game.manualCards.length === 0,
            "取消後手動牌應清空"
        );

        messages.push(
            "✓ 取消牌局正確"
        );


        /**
         * 12. 完整四張牌
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
                "C"
            ]

        ];

        for (
            const [
                rank,
                suit
            ] of cards
        ) {

            await addCard(
                root,
                dashboard,
                rank,
                suit
            );

        }

        assert(
            game.canFinishManualRound ===
                true,
            "四張牌後應可完成"
        );

        assert(
            findAction(
                root,
                "finish-round"
            ),
            "應顯示確認本局按鈕"
        );

        messages.push(
            "✓ 完整四張牌正確"
        );


        /**
         * 13. 完成牌局
         */
        await clickAction(
            root,
            dashboard,
            "finish-round"
        );

        assert(
            game.calls
                .finishManualRound === 1,
            "未呼叫 finishManualRound()"
        );

        assert(
            game.history.count === 1,
            "History 應有一局"
        );

        assert(
            game.winner === "Player",
            "測試牌局應為 Player 勝"
        );

        assert(
            root.textContent.includes(
                "閒勝"
            ),
            "勝方未顯示"
        );

        messages.push(
            "✓ 完成牌局正確"
        );


        /**
         * 14. History 與 Roadmap
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
            "History 應為 Player 樣式"
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
         * 15. 重新分析
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
         * 16. 路單切換
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
                "尚無小路資料"
            ),
            "空小路提示未顯示"
        );

        messages.push(
            "✓ 路單切換正確"
        );


        /**
         * 17. History limit
         */
        const historyLimit =
            root.querySelector(
                '[name="history-limit"]'
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
            dashboard.ui.historyLimit === 10,
            "History limit 未更新"
        );

        messages.push(
            "✓ History limit 正確"
        );


        /**
         * 18. 訊息
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
            dashboard.ui.message === "",
            "訊息未清除"
        );

        messages.push(
            "✓ 訊息功能正確"
        );


        /**
         * 19. Busy
         */
        dashboard.ui.busy =
            true;

        dashboard.render();

        assert(
            findAction(
                root,
                "new-shoe"
            ).disabled === true,
            "Busy 時按鈕應停用"
        );

        dashboard.ui.busy =
            false;

        dashboard.render();

        messages.push(
            "✓ Busy 狀態正確"
        );


        /**
         * 20. destroy()
         */
        dashboard.destroy();

        assert(
            root.innerHTML === "",
            "destroy() 應清空 root"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        return `
${messages.join("\n")}

Dashboard 測試完成

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
