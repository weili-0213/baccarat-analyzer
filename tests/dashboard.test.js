/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dashboard Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. mount()
 * 3. Game 注入
 * 4. 初始畫面
 * 5. CardInput 掛載
 * 6. ProbabilityTable 掛載
 * 7. EVTable 掛載
 * 8. Recommendation 掛載
 * 9. 新牌靴
 * 10. 燒牌
 * 11. 開始本局
 * 12. 手動輸入牌面
 * 13. 復原牌面
 * 14. 取消本局
 * 15. 確認本局
 * 16. History 更新
 * 17. Roadmap 更新
 * 18. Analyzer 結果更新
 * 19. 重新分析
 * 20. 路單切換
 * 21. 訊息顯示與清除
 * 22. summary
 * 23. destroy()
 *
 * 注意：
 *
 * 本測試使用 Dashboard 專用 Game Mock，
 * 目的是驗證 UI 整合與事件流程，
 * 不重複測試 engine/game.js 的規則細節。
 */

import createDashboard, {
    Dashboard
} from "../pages/dashboard.js";

import {
    CardInput
} from "../components/CardInput.js";

import {
    ProbabilityTable
} from "../components/ProbabilityTable.js";

import {
    EVTable
} from "../components/EVTable.js";

import {
    Recommendation
} from "../components/Recommendation.js";


/**
 * 斷言工具
 */
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


/**
 * 預期同步錯誤
 */
function assertThrows(
    callback,
    message
) {

    let error =
        null;

    try {

        callback();

    }
    catch (caught) {

        error =
            caught;

    }

    assert(
        error instanceof Error,
        message
    );

    return error;

}


/**
 * 等待一次事件循環
 */
function nextTick() {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                0
            )
    );

}


/**
 * 建立測試 Root
 */
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


/**
 * 建立簡易 History Mock
 */
function createHistoryMock() {

    return {

        items: [],

        get count() {

            return this.items.length;

        },

        get last() {

            return (
                this.items[
                    this.items.length - 1
                ] ??
                null
            );

        },

        lastRounds(limit = 20) {

            return this.items.slice(
                -limit
            );

        }

    };

}


/**
 * 建立分析結果
 */
function createAnalysis(
    roundCount = 0
) {

    return {

        method:
            "mock",

        probability: {

            player:
                0.44,

            banker:
                0.47,

            tie:
                0.09,

            playerPair:
                0.074,

            bankerPair:
                0.075,

            super6:
                0.052

        },

        ev: {

            player:
                -0.01,

            banker:
                0.008,

            tie:
                -0.13,

            super6:
                -0.04

        },

        kelly: {

            banker:
                0.03

        },

        risk: {

            banker:
                0.2

        },

        confidence: {

            overall:
                0.8

        },

        overallConfidence:
            0.8,

        ranking: [

            {
                key:
                    "banker",

                name:
                    "banker",

                score:
                    0.9,

                ev:
                    0.008,

                confidence:
                    0.8
            },

            {
                key:
                    "player",

                name:
                    "player",

                score:
                    0.5,

                ev:
                    -0.01,

                confidence:
                    0.6
            }

        ],

        best: {

            key:
                "banker",

            name:
                "banker",

            ev:
                0.008,

            kelly:
                0.03,

            risk:
                0.2,

            amount:
                300,

            confidence:
                0.8

        },

        shouldBet:
            true,

        recommendation: {

            shouldBet:
                true,

            bet:
                "banker",

            amount:
                300,

            ev:
                0.008,

            kelly:
                0.03,

            risk:
                0.2,

            confidence:
                0.8,

            reason:
                "莊家目前為最佳選項。"

        },

        generatedAfterRound:
            roundCount,

        physicalRemaining:
            410

    };

}


/**
 * 建立 Dashboard 專用 Game Mock
 */
function createGameMock() {

    const history =
        createHistoryMock();

    const game = {

        state:
            "WAITING_BURN_INDICATOR",

        manualState:
            "IDLE",

        analysisState:
            "IDLE",

        shoeNumber:
            1,

        shoe: {

            total:
                416

        },

        remainingCards:
            416,

        observableRemainingCards:
            416,

        unknownBurnedCount:
            0,

        usedCards:
            0,

        burnConfirmed:
            false,

        isWaitingBurnIndicator:
            true,

        isAnalyzing:
            false,

        hasNextAnalysis:
            false,

        isManualRoundActive:
            false,

        canStartManualRound:
            false,

        canFinishManualRound:
            false,

        nextManualSide:
            null,

        nextManualInput:
            null,

        manualCards: [],

        manualProgress: {

            playerCards:
                [],

            bankerCards:
                [],

            playerScore:
                null,

            bankerScore:
                null

        },

        burnInfo:
            null,

        nextAnalysis:
            null,

        winner:
            null,

        history,

        roadMatrices: {

            beadRoad:
                [],

            bigRoad:
                [],

            bigEyeRoad:
                [],

            smallRoad:
                [],

            cockroachRoad:
                []

        },

        roadmapViewModel: {

            roads: {

                beadRoad:
                    [],

                bigRoad:
                    [],

                bigEyeRoad:
                    [],

                smallRoad:
                    [],

                cockroachRoad:
                    []

            }

        },

        calls: {

            startNewShoe:
                0,

            confirmBurnIndicator:
                0,

            analyzeNextRound:
                0,

            startManualRound:
                0,

            addManualCard:
                0,

            undoManualCard:
                0,

            cancelManualRound:
                0,

            finishManualRound:
                0

        },


        get roundCount() {

            return this.history.count;

        },


        startNewShoe() {

            this.calls
                .startNewShoe++;

            this.state =
                "WAITING_BURN_INDICATOR";

            this.manualState =
                "IDLE";

            this.analysisState =
                "IDLE";

            this.shoeNumber++;

            this.remainingCards =
                416;

            this.observableRemainingCards =
                416;

            this.unknownBurnedCount =
                0;

            this.usedCards =
                0;

            this.burnConfirmed =
                false;

            this.isWaitingBurnIndicator =
                true;

            this.isAnalyzing =
                false;

            this.hasNextAnalysis =
                false;

            this.isManualRoundActive =
                false;

            this.canStartManualRound =
                false;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                null;

            this.nextManualInput =
                null;

            this.manualCards = [];

            this.manualProgress = {

                playerCards:
                    [],

                bankerCards:
                    [],

                playerScore:
                    null,

                bankerScore:
                    null

            };

            this.burnInfo =
                null;

            this.nextAnalysis =
                null;

            this.winner =
                null;

            this.history.items = [];

            for (
                const key of
                Object.keys(
                    this.roadMatrices
                )
            ) {

                this.roadMatrices[
                    key
                ] = [];

                this.roadmapViewModel
                    .roads[
                        key
                    ] = [];

            }

            return this;

        },


        confirmBurnIndicator(card) {

            this.calls
                .confirmBurnIndicator++;

            this.lastBurnCard = {

                ...card

            };

            this.state =
                "SHOE_ACTIVE";

            this.analysisState =
                "IDLE";

            this.burnConfirmed =
                true;

            this.isWaitingBurnIndicator =
                false;

            this.canStartManualRound =
                true;

            this.observableRemainingCards =
                415;

            this.unknownBurnedCount =
                card.rank === "A"
                    ? 1
                    : Number(card.rank) || 10;

            this.remainingCards =

                this.observableRemainingCards -

                this.unknownBurnedCount;

            this.usedCards =
                1;

            this.burnInfo = {

                confirmed:
                    true,

                indicator: {

                    rank:
                        card.rank,

                    suit:
                        card.suit,

                    toString() {

                        const symbols = {

                            S:
                                "♠",

                            H:
                                "♥",

                            D:
                                "♦",

                            C:
                                "♣"

                        };

                        return `${this.rank}${symbols[this.suit]}`;

                    }

                },

                hiddenCount:
                    this.unknownBurnedCount,

                totalRemoved:
                    this.unknownBurnedCount +
                    1

            };

            return this.burnInfo;

        },


        async analyzeNextRound() {

            this.calls
                .analyzeNextRound++;

            this.isAnalyzing =
                true;

            this.analysisState =
                "RUNNING";

            await nextTick();

            this.nextAnalysis =
                createAnalysis(
                    this.roundCount
                );

            this.isAnalyzing =
                false;

            this.hasNextAnalysis =
                true;

            this.analysisState =
                "COMPLETED";

            this.state =
                "SHOE_ACTIVE";

            return this.nextAnalysis;

        },


        async waitForAnalysis() {

            if (
                !this.nextAnalysis
            ) {

                return this
                    .analyzeNextRound();

            }

            return this.nextAnalysis;

        },


        startManualRound() {

            this.calls
                .startManualRound++;

            this.state =
                "ROUND_INPUT";

            this.manualState =
                "INITIAL";

            this.isManualRoundActive =
                true;

            this.canStartManualRound =
                false;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                "player";

            this.nextManualInput = {

                side:
                    "player",

                cardNumber:
                    1,

                label:
                    "Player 第 1 張"

            };

            this.manualCards = [];

            this.manualProgress = {

                playerCards:
                    [],

                bankerCards:
                    [],

                playerScore:
                    0,

                bankerScore:
                    0

            };

            return this.manualProgress;

        },


        addManualCard(
            side,
            card
        ) {

            this.calls
                .addManualCard++;

            const storedCard = {

                rank:
                    card.rank,

                suit:
                    card.suit,

                baccaratValue:
                    card.rank === "A"
                        ? 1
                        : [
                            "10",
                            "J",
                            "Q",
                            "K"
                        ].includes(
                            card.rank
                        )
                            ? 0
                            : Number(
                                card.rank
                            ),

                toString() {

                    const symbols = {

                        S:
                            "♠",

                        H:
                            "♥",

                        D:
                            "♦",

                        C:
                            "♣"

                    };

                    return `${this.rank}${symbols[this.suit]}`;

                }

            };

            this.manualCards.push({

                side,

                card:
                    storedCard

            });

            if (
                side === "player"
            ) {

                this.manualProgress
                    .playerCards
                    .push(
                        storedCard
                    );

                this.manualProgress
                    .playerScore =

                    this.manualProgress
                        .playerCards
                        .reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                item.baccaratValue,
                            0
                        ) % 10;

            }
            else {

                this.manualProgress
                    .bankerCards
                    .push(
                        storedCard
                    );

                this.manualProgress
                    .bankerScore =

                    this.manualProgress
                        .bankerCards
                        .reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                item.baccaratValue,
                            0
                        ) % 10;

            }

            const total =
                this.manualCards.length;

            const sequence = [

                {
                    side:
                        "banker",

                    cardNumber:
                        1,

                    label:
                        "Banker 第 1 張"
                },

                {
                    side:
                        "player",

                    cardNumber:
                        2,

                    label:
                        "Player 第 2 張"
                },

                {
                    side:
                        "banker",

                    cardNumber:
                        2,

                    label:
                        "Banker 第 2 張"
                }

            ];

            if (
                total < 4
            ) {

                this.nextManualInput =
                    sequence[
                        total - 1
                    ];

                this.nextManualSide =
                    this.nextManualInput
                        .side;

            }
            else {

                this.manualState =
                    "READY_TO_FINISH";

                this.canFinishManualRound =
                    true;

                this.nextManualInput =
                    null;

                this.nextManualSide =
                    null;

            }

            this.observableRemainingCards--;

            this.remainingCards--;

            this.usedCards++;

            return storedCard;

        },


        undoManualCard() {

            this.calls
                .undoManualCard++;

            const removed =
                this.manualCards.pop() ??
                null;

            if (!removed) {

                return null;

            }

            const list =

                removed.side === "player"

                    ? this.manualProgress
                        .playerCards

                    : this.manualProgress
                        .bankerCards;

            list.pop();

            this.observableRemainingCards++;

            this.remainingCards++;

            this.usedCards--;

            this.canFinishManualRound =
                false;

            this.manualState =
                "INITIAL";

            this.nextManualSide =
                removed.side;

            this.nextManualInput = {

                side:
                    removed.side,

                cardNumber:
                    list.length + 1,

                label:
                    `${removed.side === "player"
                        ? "Player"
                        : "Banker"} 第 ${list.length + 1} 張`

            };

            return removed;

        },


        cancelManualRound() {

            this.calls
                .cancelManualRound++;

            this.observableRemainingCards +=
                this.manualCards.length;

            this.remainingCards +=
                this.manualCards.length;

            this.usedCards -=
                this.manualCards.length;

            this.state =
                "SHOE_ACTIVE";

            this.manualState =
                "IDLE";

            this.isManualRoundActive =
                false;

            this.canStartManualRound =
                true;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                null;

            this.nextManualInput =
                null;

            this.manualCards = [];

            this.manualProgress = {

                playerCards:
                    [],

                bankerCards:
                    [],

                playerScore:
                    null,

                bankerScore:
                    null

            };

            return this;

        },


        async finishManualRound() {

            this.calls
                .finishManualRound++;

            const result = {

                winner:
                    "Player",

                playerPair:
                    false,

                bankerPair:
                    false,

                super6:
                    false

            };

            this.history.items.push(
                result
            );

            this.winner =
                result.winner;

            this.state =
                "SHOE_ACTIVE";

            this.manualState =
                "FINISHED";

            this.isManualRoundActive =
                false;

            this.canStartManualRound =
                true;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                null;

            this.nextManualInput =
                null;

            this.roadMatrices
                .beadRoad = [

                    [
                        {
                            winner:
                                "Player"
                        }
                    ]

                ];

            this.roadmapViewModel
                .roads
                .beadRoad =
                this.roadMatrices
                    .beadRoad;

            await this
                .analyzeNextRound();

            return result;

        },


        validateConsistency() {

            return {

                valid:
                    true,

                errors:
                    []

            };

        }

    };

    return game;

}


/**
 * Dashboard 完整測試
 */
export default async function dashboardTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. constructor()。
         */
        const unmounted =
            new Dashboard({

                root:
                    null,

                game:
                    createGameMock(),

                autoMount:
                    false

            });

        assert(
            unmounted instanceof Dashboard,
            "Dashboard 建立失敗"
        );

        assert(
            unmounted.root === null,
            "未指定 root 時 root 應為 null"
        );

        assert(
            unmounted.game,
            "Dashboard 應保存 Game"
        );

        messages.push(
            "✓ constructor() 正確"
        );


        /**
         * 2. 非法參數。
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
            "gameOptions 非物件時應拋出錯誤"
        );

        messages.push(
            "✓ 建構參數驗證正確"
        );


        /**
         * 3. 工廠函式、Game 注入與 mount()。
         */
        const root =
            createRoot();

        roots.push(root);

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
            "mount() 後應建立 Dashboard DOM"
        );

        assert(
            root.textContent.includes(
                "百家樂分析儀"
            ),
            "Dashboard 標題未顯示"
        );

        messages.push(
            "✓ 工廠函式、Game 注入與 mount() 正確"
        );


        /**
         * 4. 初始畫面。
         */
        assert(
            root.textContent.includes(
                "輸入燒牌指示牌"
            ),
            "初始畫面應要求輸入燒牌指示牌"
        );

        assert(
            root.textContent.includes(
                "請先輸入燒牌指示牌"
            ),
            "燒牌前本局輸入應停用"
        );

        assert(
            root.textContent.includes(
                "尚無牌局紀錄"
            ),
            "初始 History 應為空"
        );

        messages.push(
            "✓ 初始畫面正確"
        );


        /**
         * 5. 初始元件掛載。
         */
        assert(
            dashboard.components
                .burnInput instanceof
                CardInput,
            "燒牌 CardInput 應成功掛載"
        );

        assert(
            dashboard.components
                .probabilityTable instanceof
                ProbabilityTable,
            "ProbabilityTable 應成功掛載"
        );

        assert(
            dashboard.components
                .evTable instanceof
                EVTable,
            "EVTable 應成功掛載"
        );

        assert(
            dashboard.components
                .recommendation instanceof
                Recommendation,
            "Recommendation 應成功掛載"
        );

        assert(
            dashboard.components
                .roundInput === null,
            "燒牌前不應掛載 Round CardInput"
        );

        messages.push(
            "✓ 初始 UI 元件掛載正確"
        );


        /**
         * 6. 燒牌 CardInput 送出。
         */
        dashboard.components
            .burnInput
            .setValue({

                rank:
                    "A",

                suit:
                    "S"

            });

        await dashboard.components
            .burnInput
            .submit();

        assert(
            game.calls
                .confirmBurnIndicator === 1,
            "確認燒牌應呼叫 Game"
        );

        assert(
            game.lastBurnCard.rank ===
                "A" &&
            game.lastBurnCard.suit ===
                "S",
            "燒牌 CardInput 傳入資料錯誤"
        );

        assert(
            game.burnConfirmed ===
                true,
            "燒牌後 burnConfirmed 應為 true"
        );

        assert(
            game.calls
                .analyzeNextRound === 1,
            "燒牌後應執行第一局分析"
        );

        assert(
            root.textContent.includes(
                "燒牌已確認"
            ),
            "燒牌完成訊息未顯示"
        );

        assert(
            root.textContent.includes(
                "A♠"
            ),
            "燒牌指示牌未顯示"
        );

        messages.push(
            "✓ 燒牌與第一局分析流程正確"
        );


        /**
         * 7. 分析元件資料更新。
         */
        assert(
            dashboard.components
                .probabilityTable
                .getValue(
                    "banker"
                ) === 0.47,
            "ProbabilityTable 未收到分析資料"
        );

        assert(
            dashboard.components
                .evTable
                .getValue(
                    "banker"
                ) === 0.008,
            "EVTable 未收到分析資料"
        );

        assert(
            dashboard.components
                .recommendation
                .recommendedKey ===
                "banker",
            "Recommendation 未收到分析資料"
        );

        assert(
            root.textContent.includes(
                "47.00%"
            ),
            "Dashboard 未顯示 Banker 機率"
        );

        assert(
            root.textContent.includes(
                "+0.0080"
            ),
            "Dashboard 未顯示 Banker EV"
        );

        assert(
            root.textContent.includes(
                "莊家目前為最佳選項"
            ),
            "Dashboard 未顯示下注建議"
        );

        messages.push(
            "✓ 分析元件資料更新正確"
        );


        /**
         * 8. 開始本局。
         */
        const startButton =
            root.querySelector(
                '[data-action="start-round"]'
            );

        assert(
            startButton,
            "燒牌後應顯示開始本局按鈕"
        );

        startButton.click();

        await nextTick();

        assert(
            game.calls
                .startManualRound === 1,
            "開始本局應呼叫 Game.startManualRound()"
        );

        assert(
            dashboard.components
                .roundInput instanceof
                CardInput,
            "開始本局後應掛載 Round CardInput"
        );

        assert(
            dashboard.components
                .roundInput
                .summary
                .side ===
                "player",
            "第一張應提示 Player"
        );

        assert(
            root.textContent.includes(
                "Player 第 1 張"
            ),
            "第一張輸入提示錯誤"
        );

        messages.push(
            "✓ 開始本局與 Round CardInput 掛載正確"
        );


        /**
         * 9. 手動輸入第一張牌。
         */
        dashboard.components
            .roundInput
            .setValue({

                rank:
                    "9",

                suit:
                    "H"

            });

        await dashboard.components
            .roundInput
            .submit();

        assert(
            game.calls
                .addManualCard === 1,
            "輸入牌面應呼叫 Game.addManualCard()"
        );

        assert(
            game.manualCards.length ===
                1,
            "輸入後 manualCards 應有一張"
        );

        assert(
            game.manualCards[0].side ===
                "player",
            "第一張應加入 Player"
        );

        assert(
            root.textContent.includes(
                "9♥"
            ),
            "Player 手牌未顯示"
        );

        assert(
            dashboard.components
                .roundInput
                .summary
                .side ===
                "banker",
            "第二張應提示 Banker"
        );

        messages.push(
            "✓ 手動輸入牌面與下一張提示正確"
        );


        /**
         * 10. 復原牌面。
         */
        const undoButton =
            root.querySelector(
                '[data-action="undo-card"]'
            );

        undoButton.click();

        await nextTick();

        assert(
            game.calls
                .undoManualCard === 1,
            "復原應呼叫 Game.undoManualCard()"
        );

        assert(
            game.manualCards.length ===
                0,
            "復原後 manualCards 應為空"
        );

        assert(
            root.textContent.includes(
                "已復原最後一張牌"
            ),
            "復原成功訊息未顯示"
        );

        messages.push(
            "✓ 復原牌面流程正確"
        );


        /**
         * 11. 再次輸入並取消本局。
         */
        dashboard.components
            .roundInput
            .setValue({

                rank:
                    "8",

                suit:
                    "D"

            });

        await dashboard.components
            .roundInput
            .submit();

        root.querySelector(
            '[data-action="cancel-round"]'
        ).click();

        await nextTick();

        assert(
            game.calls
                .cancelManualRound === 1,
            "取消本局應呼叫 Game.cancelManualRound()"
        );

        assert(
            game.manualCards.length ===
                0,
            "取消本局後 manualCards 應清空"
        );

        assert(
            dashboard.components
                .roundInput === null,
            "取消本局後 Round CardInput 應移除"
        );

        assert(
            root.textContent.includes(
                "已取消本局輸入"
            ),
            "取消成功訊息未顯示"
        );

        messages.push(
            "✓ 取消本局流程正確"
        );


        /**
         * 12. 完整輸入四張並確認本局。
         */
        root.querySelector(
            '[data-action="start-round"]'
        ).click();

        await nextTick();

        const cards = [

            {
                rank:
                    "9",

                suit:
                    "H"
            },

            {
                rank:
                    "5",

                suit:
                    "D"
            },

            {
                rank:
                    "K",

                suit:
                    "C"
            },

            {
                rank:
                    "2",

                suit:
                    "C"
            }

        ];

        for (
            const card of
            cards
        ) {

            dashboard.components
                .roundInput
                .setValue(
                    card
                );

            await dashboard.components
                .roundInput
                .submit();

        }

        assert(
            game.canFinishManualRound ===
                true,
            "四張輸入後應可確認本局"
        );

        assert(
            dashboard.components
                .roundInput === null,
            "可確認本局時不應再顯示 CardInput"
        );

        const finishButton =
            root.querySelector(
                '[data-action="finish-round"]'
            );

        assert(
            finishButton,
            "四張輸入後應顯示確認本局按鈕"
        );

        finishButton.click();

        await nextTick();
        await nextTick();

        assert(
            game.calls
                .finishManualRound === 1,
            "確認本局應呼叫 Game.finishManualRound()"
        );

        assert(
            game.history.count ===
                1,
            "確認後 History 應增加一局"
        );

        assert(
            game.roundCount === 1,
            "roundCount 應為 1"
        );

        assert(
            root.textContent.includes(
                "本局已確認"
            ),
            "完成本局訊息未顯示"
        );

        assert(
            root.textContent.includes(
                "閒勝"
            ),
            "本局勝方未顯示"
        );

        messages.push(
            "✓ 完整牌局確認流程正確"
        );


        /**
         * 13. History 更新。
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
            "Player 勝應使用 player class"
        );

        messages.push(
            "✓ History 更新正確"
        );


        /**
         * 14. Roadmap 更新。
         */
        assert(
            root.querySelector(
                ".roadCell.player"
            ),
            "確認本局後珠盤路應顯示 Player"
        );

        assert(
            root.textContent.includes(
                "1 局"
            ),
            "Roadmap 應顯示一局"
        );

        messages.push(
            "✓ Roadmap 更新正確"
        );


        /**
         * 15. 本局完成後分析更新。
         */
        assert(
            game.calls
                .analyzeNextRound >= 2,
            "完成本局後應再次分析"
        );

        assert(
            dashboard.components
                .probabilityTable
                .getValue(
                    "banker"
                ) === 0.47,
            "完成本局後 ProbabilityTable 應保留最新分析"
        );

        assert(
            dashboard.components
                .recommendation
                .summary
                .hasData ===
                true,
            "完成本局後 Recommendation 應有資料"
        );

        messages.push(
            "✓ 完成本局後 Analyzer 元件更新正確"
        );


        /**
         * 16. 重新分析。
         */
        const analysisCallsBefore =
            game.calls
                .analyzeNextRound;

        root.querySelector(
            '[data-action="analyze"]'
        ).click();

        await nextTick();
        await nextTick();

        assert(
            game.calls
                .analyzeNextRound ===
                analysisCallsBefore + 1,
            "重新分析按鈕應呼叫 Analyzer"
        );

        assert(
            root.textContent.includes(
                "下一局分析完成"
            ),
            "重新分析完成訊息未顯示"
        );

        messages.push(
            "✓ 重新分析流程正確"
        );


        /**
         * 17. 路單切換。
         */
        const smallRoadButton =
            root.querySelector(
                '[data-action="select-road"][data-road="smallRoad"]'
            );

        smallRoadButton.click();

        assert(
            dashboard.ui.activeRoad ===
                "smallRoad",
            "路單切換後 activeRoad 錯誤"
        );

        assert(
            root.querySelector(
                '[data-road="smallRoad"]'
            )
                .classList
                .contains(
                    "active"
                ),
            "切換後 Small Road Tab 應為 active"
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
         * 18. History limit。
         */
        const historySelect =
            root.querySelector(
                '[name="history-limit"]'
            );

        historySelect.value =
            "10";

        historySelect.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles:
                        true
                }
            )
        );

        assert(
            dashboard.ui
                .historyLimit === 10,
            "History limit 更新失敗"
        );

        messages.push(
            "✓ History limit 更新正確"
        );


        /**
         * 19. 訊息顯示與清除。
         */
        dashboard.setMessage(
            "測試訊息",
            "success"
        );

        dashboard.renderMessageOnly();

        assert(
            root.textContent.includes(
                "測試訊息"
            ),
            "自訂訊息未顯示"
        );

        root.querySelector(
            '[data-action="clear-message"]'
        ).click();

        assert(
            dashboard.ui.message ===
                "",
            "清除訊息後 state 應為空"
        );

        assert(
            !root.textContent.includes(
                "測試訊息"
            ),
            "清除後 DOM 不應保留訊息"
        );

        messages.push(
            "✓ 訊息顯示與清除正確"
        );


        /**
         * 20. 新牌靴。
         */
        const oldShoeNumber =
            game.shoeNumber;

        root.querySelector(
            '[data-action="new-shoe"]'
        ).click();

        await nextTick();

        assert(
            game.calls
                .startNewShoe === 1,
            "新牌靴按鈕應呼叫 Game.startNewShoe()"
        );

        assert(
            game.shoeNumber ===
                oldShoeNumber + 1,
            "新牌靴編號應增加"
        );

        assert(
            game.history.count === 0,
            "新牌靴應清空 History"
        );

        assert(
            dashboard.components
                .burnInput instanceof
                CardInput,
            "新牌靴後應重新掛載 Burn CardInput"
        );

        assert(
            root.textContent.includes(
                "請輸入燒牌指示牌"
            ),
            "新牌靴後應重新等待燒牌"
        );

        messages.push(
            "✓ 新牌靴流程正確"
        );


        /**
         * 21. Busy 狀態同步元件。
         */
        dashboard.ui.busy =
            true;

        dashboard.syncComponents();

        assert(
            dashboard.components
                .burnInput
                .isDisabled ===
                true,
            "Busy 時 Burn CardInput 應停用"
        );

        dashboard.ui.busy =
            false;

        dashboard.syncComponents();

        assert(
            dashboard.components
                .burnInput
                .isDisabled ===
                false,
            "取消 Busy 後 Burn CardInput 應恢復"
        );

        messages.push(
            "✓ Busy 狀態同步正確"
        );


        /**
         * 22. summary。
         */
        const summary =
            dashboard.summary;

        assert(
            summary.gameState ===
                game.state,
            "summary.gameState 錯誤"
        );

        assert(
            summary.shoeNumber ===
                game.shoeNumber,
            "summary.shoeNumber 錯誤"
        );

        assert(
            summary.roundCount ===
                game.roundCount,
            "summary.roundCount 錯誤"
        );

        assert(
            summary.activeRoad ===
                "smallRoad",
            "summary.activeRoad 錯誤"
        );

        assert(
            summary.components
                .burnInput ===
                true,
            "summary.components.burnInput 錯誤"
        );

        assert(
            summary.components
                .probabilityTable ===
                true,
            "summary.components.probabilityTable 錯誤"
        );

        assert(
            summary.components
                .evTable ===
                true,
            "summary.components.evTable 錯誤"
        );

        assert(
            summary.components
                .recommendation ===
                true,
            "summary.components.recommendation 錯誤"
        );

        messages.push(
            "✓ summary 正確"
        );


        /**
         * 23. destroy()。
         */
        dashboard.destroy();

        assert(
            root.innerHTML ===
                "",
            "destroy() 應清空 root"
        );

        assert(
            dashboard.components
                .burnInput ===
                null,
            "destroy() 應清除 Burn CardInput"
        );

        assert(
            dashboard.components
                .probabilityTable ===
                null,
            "destroy() 應清除 ProbabilityTable"
        );

        assert(
            dashboard.components
                .evTable ===
                null,
            "destroy() 應清除 EVTable"
        );

        assert(
            dashboard.components
                .recommendation ===
                null,
            "destroy() 應清除 Recommendation"
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

UI 元件：
Burn CardInput：通過
Round CardInput：通過
ProbabilityTable：通過
EVTable：通過
Recommendation：通過

整合流程：
新牌靴 → 燒牌 → 分析 → 手動輸牌 → 確認本局
→ History → Roadmap → 下一局分析
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
