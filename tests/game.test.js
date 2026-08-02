/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game Controller v2 Test
 *
 * 測試：
 *
 * 1. 建立 Game 與新牌靴
 * 2. 等待燒牌指示牌
 * 3. 手動確認燒牌
 * 4. 未知燒牌與剩餘牌數
 * 5. 手動輸入發牌順序
 * 6. Natural 完成牌局
 * 7. History 與 Roadmap 更新
 * 8. Analyzer 整合
 * 9. 下一局分析狀態
 * 10. undoManualCard()
 * 11. cancelManualRound()
 * 12. 非法輸入驗證
 * 13. startNewShoe() 重置
 * 14. ViewModel 與統計
 * 15. 一致性檢查
 * 16. JSON 匯出
 */

import Game, {
    GameState,
    ManualRoundState,
    AnalysisState,
    HandSide
} from "../engine/game.js";


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
 * 建立測試用 Analyzer
 *
 * 避免測試時真的執行大量 Monte Carlo，
 * 只驗證 Game 是否正確傳入 context，
 * 並保存下一局分析結果。
 */
function createAnalyzerMock() {

    return {

        calls: [],

        async analyzeContext(
            context,
            runOptions = {}
        ) {

            this.calls.push({

                context,

                runOptions

            });

            return {

                method:
                    "mock",

                probability: {

                    player:
                        0.45,

                    banker:
                        0.46,

                    tie:
                        0.09,

                    playerPair:
                        0.07,

                    bankerPair:
                        0.07,

                    super6:
                        0.05

                },

                ev: {

                    player:
                        -0.01,

                    banker:
                        -0.005,

                    tie:
                        -0.12

                },

                ranking: [

                    {
                        name:
                            "banker",

                        score:
                            0.8
                    }

                ],

                recommendation: {

                    shouldBet:
                        false,

                    bet:
                        null,

                    reason:
                        "測試分析結果"

                },

                shouldBet:
                    false,

                remainingCards:
                    context
                        .physicalRemaining,

                observableRemaining:
                    context
                        .observableRemaining,

                physicalRemaining:
                    context
                        .physicalRemaining,

                unknownBurnedCount:
                    context
                        .unknownBurnedCount,

                generatedAfterRound:
                    context
                        .roundCount

            };

        }

    };

}


/**
 * 確認物件存在指定欄位
 */
function assertHasKeys(
    object,
    keys,
    label
) {

    assert(
        object &&
        typeof object ===
            "object",
        `${label} 必須是物件`
    );

    for (
        const key of
        keys
    ) {

        assert(
            key in object,
            `${label} 缺少欄位：${key}`
        );

    }

}


/**
 * Game v2 完整測試
 */
export default async function gameTest() {

    const messages = [];

    const analyzer =
        createAnalyzerMock();


    /**
     * 1. 建立 Game。
     *
     * 關閉燒牌後自動分析，
     * 讓測試可以逐步驗證狀態。
     */
    const game =
        new Game({

            deckCount:
                8,

            autoShuffle:
                false,

            analyzeAfterBurn:
                false,

            analyzeAfterRound:
                true,

            analyzer

        });


    assert(
        game instanceof Game,
        "Game 建立失敗"
    );

    assert(
        game.state ===
            GameState
                .WAITING_BURN_INDICATOR,
        "建立 Game 後應等待燒牌指示牌"
    );

    assert(
        game.shoeNumber === 1,
        "第一個牌靴編號應為 1"
    );

    assert(
        game.shoe.total === 416,
        "8 副牌應有 416 張"
    );

    assert(
        game.history.count === 0,
        "新牌靴 History 應為空"
    );

    messages.push(
        "✓ Game 與 8 副牌新牌靴建立完成"
    );


    /**
     * 2. 尚未燒牌前不可開始牌局。
     */
    assert(
        game.isWaitingBurnIndicator ===
            true,
        "應處於等待燒牌狀態"
    );

    assert(
        game.burnConfirmed ===
            false,
        "燒牌尚未完成"
    );

    assert(
        game.canStartManualRound ===
            false,
        "燒牌前不可開始牌局"
    );

    let earlyRoundError =
        null;

    try {

        game.startManualRound();

    }
    catch (error) {

        earlyRoundError =
            error;

    }

    assert(
        earlyRoundError instanceof Error,
        "燒牌前開始牌局應報錯"
    );

    messages.push(
        "✓ 燒牌前禁止開始牌局"
    );


    /**
     * 3. 確認燒牌指示牌。
     *
     * A♠：
     * - 公開指示牌 1 張
     * - 隱藏燒牌 1 張
     */
    const burnInfo =
        game.confirmBurnIndicator({

            rank:
                "A",

            suit:
                "S"

        });


    assert(
        game.burnConfirmed ===
            true,
        "燒牌應已確認"
    );

    assert(
        game.state ===
            GameState.SHOE_ACTIVE,
        "燒牌後應進入 SHOE_ACTIVE"
    );

    assert(
        burnInfo.hiddenCount === 1,
        "A 指示牌的隱藏燒牌數應為 1"
    );

    assert(
        burnInfo.totalRemoved === 2,
        "A 指示牌總移除張數應為 2"
    );

    assert(
        game.shoe.observableRemaining ===
            415,
        "燒牌後可觀察牌池應為 415"
    );

    assert(
        game.shoe.physicalRemaining ===
            414,
        "燒牌後物理剩餘牌應為 414"
    );

    assert(
        game.unknownBurnedCount === 1,
        "未知燒牌數應為 1"
    );

    messages.push(
        "✓ 燒牌指示牌與未知燒牌處理正確"
    );


    /**
     * 4. 手動執行第一局分析。
     */
    const firstAnalysis =
        await game.analyzeNextRound({

            source:
                "afterBurn"

        });


    assert(
        firstAnalysis.method ===
            "mock",
        "Game 應保存 Analyzer 回傳結果"
    );

    assert(
        game.analysisState ===
            AnalysisState.COMPLETED,
        "分析狀態應為 COMPLETED"
    );

    assert(
        game.hasNextAnalysis ===
            true,
        "應已有下一局分析"
    );

    assert(
        game.nextAnalysis ===
            firstAnalysis,
        "nextAnalysis 應保存分析結果"
    );

    assert(
        analyzer.calls.length === 1,
        "Analyzer 應被呼叫一次"
    );

    const firstContext =
        analyzer.calls[0]
            .context;

    assert(
        firstContext.shoe ===
            game.shoe,
        "Analyzer context 應包含目前 Shoe"
    );

    assert(
        firstContext.history ===
            game.history,
        "Analyzer context 應包含 History"
    );

    assert(
        firstContext.roundCount === 0,
        "第一局前 roundCount 應為 0"
    );

    assert(
        firstContext.observableRemaining ===
            415,
        "Analyzer 可觀察牌數錯誤"
    );

    assert(
        firstContext.physicalRemaining ===
            414,
        "Analyzer 物理牌數錯誤"
    );

    messages.push(
        "✓ 燒牌後下一局分析整合正確"
    );


    /**
     * 5. 開始手動牌局。
     */
    const round =
        game.startManualRound();


    assert(
        round ===
            game.manualRound,
        "startManualRound() 應回傳目前 Round"
    );

    assert(
        game.state ===
            GameState.ROUND_INPUT,
        "開始牌局後狀態應為 ROUND_INPUT"
    );

    assert(
        game.manualState ===
            ManualRoundState.INITIAL,
        "手動牌局初始狀態錯誤"
    );

    assert(
        game.nextManualSide ===
            HandSide.PLAYER,
        "第一張應輸入 Player"
    );

    assert(
        game.nextManualInput
            .cardNumber === 1,
        "第一張牌編號應為 1"
    );

    messages.push(
        "✓ 手動牌局建立與第一張提示正確"
    );


    /**
     * 6. 錯誤發牌順序。
     */
    let wrongSideError =
        null;

    try {

        game.addManualCard(

            HandSide.BANKER,

            {
                rank:
                    "2",

                suit:
                    "S"
            }

        );

    }
    catch (error) {

        wrongSideError =
            error;

    }

    assert(
        wrongSideError instanceof Error,
        "錯誤發牌順序應報錯"
    );

    assert(
        game.manualCards.length === 0,
        "錯誤輸入不應加入牌局"
    );

    messages.push(
        "✓ 發牌順序驗證正確"
    );


    /**
     * 7. 輸入 Natural Player 勝牌局。
     *
     * Player：9♥ + K♣ = 9
     * Banker：5♦ + 2♣ = 7
     */
    game.addManualCard(

        HandSide.PLAYER,

        {
            rank:
                "9",

            suit:
                "H"
        }

    );

    assert(
        game.nextManualSide ===
            HandSide.BANKER,
        "第二張應輸入 Banker"
    );


    game.addManualCard(

        HandSide.BANKER,

        {
            rank:
                "5",

            suit:
                "D"
        }

    );

    assert(
        game.nextManualSide ===
            HandSide.PLAYER,
        "第三張應輸入 Player"
    );


    game.addManualCard(

        HandSide.PLAYER,

        {
            rank:
                "K",

            suit:
                "C"
        }

    );

    assert(
        game.nextManualSide ===
            HandSide.BANKER,
        "第四張應輸入 Banker"
    );


    game.addManualCard(

        HandSide.BANKER,

        {
            rank:
                "2",

            suit:
                "C"
        }

    );


    assert(
        game.manualState ===
            ManualRoundState
                .READY_TO_FINISH,
        "Natural 牌局應可立即完成"
    );

    assert(
        game.canFinishManualRound ===
            true,
        "Natural 牌局應允許完成"
    );

    assert(
        game.nextManualInput === null,
        "Natural 後不應再要求第三張"
    );

    assert(
        game.manualProgress
            .playerScore === 9,
        "Player 點數應為 9"
    );

    assert(
        game.manualProgress
            .bankerScore === 7,
        "Banker 點數應為 7"
    );

    assert(
        game.manualProgress
            .isNatural === true,
        "此牌局應為 Natural"
    );

    messages.push(
        "✓ Natural 手動發牌流程正確"
    );


    /**
     * 8. 完成本局並自動分析下一局。
     */
    const result =
        await game.finishManualRound();


    assert(
        result.winner ===
            "Player",
        "本局應為 Player 勝"
    );

    assert(
        game.manualState ===
            ManualRoundState.FINISHED,
        "完成後 manualState 應為 FINISHED"
    );

    assert(
        game.state ===
            GameState.SHOE_ACTIVE,
        "完成與分析後應回到 SHOE_ACTIVE"
    );

    assert(
        game.history.count === 1,
        "History 應增加一局"
    );

    assert(
        game.history.last ===
            result,
        "History.last 應為本局結果"
    );

    assert(
        game.lastResult ===
            result,
        "Game.lastResult 應為本局結果"
    );

    assert(
        game.winner ===
            "Player",
        "Game.winner 應為 Player"
    );

    assert(
        game.roadmapAnalyzer
            .sourceCount === 1,
        "Roadmap sourceCount 應為 1"
    );

    assert(
        game.roadmapAnalyzer
            .beadRoad
            .count === 1,
        "珠盤路應有一局"
    );

    assert(
        analyzer.calls.length === 2,
        "完成牌局後 Analyzer 應再執行一次"
    );

    assert(
        analyzer.calls[1]
            .context
            .roundCount === 1,
        "第二次分析 roundCount 應為 1"
    );

    assert(
        game.nextAnalysis
            .generatedAfterRound === 1,
        "分析結果應標記在第 1 局後產生"
    );

    messages.push(
        "✓ 完成本局、History、Roadmap 與 Analyzer 更新正確"
    );


    /**
     * 9. 已知移除與剩餘牌數。
     *
     * 已知移除：
     * - 燒牌指示牌 1
     * - 本局公開牌 4
     *
     * 可觀察剩餘 411
     * 物理剩餘 410
     */
    assert(
        game.shoe
            .observableRemaining === 411,
        "完成第一局後可觀察牌數應為 411"
    );

    assert(
        game.shoe
            .physicalRemaining === 410,
        "完成第一局後物理牌數應為 410"
    );

    assert(
        game.usedCards === 5,
        "已知移除牌數應為 5"
    );

    messages.push(
        "✓ 完成本局後牌靴數量正確"
    );


    /**
     * 10. 開始第二局並測試 undo。
     */
    game.startManualRound();

    game.addManualCard(

        HandSide.PLAYER,

        {
            rank:
                "3",

            suit:
                "S"
        }

    );

    game.addManualCard(

        HandSide.BANKER,

        {
            rank:
                "4",

            suit:
                "H"
        }

    );


    const beforeUndo =
        game.shoe
            .observableRemaining;


    const undone =
        game.undoManualCard();


    assert(
        undone.side ===
            HandSide.BANKER,
        "undo 應撤銷 Banker 最後一張"
    );

    assert(
        game.manualCards.length === 1,
        "undo 後應剩一張輸入牌"
    );

    assert(
        game.shoe
            .observableRemaining ===
            beforeUndo + 1,
        "undo 應將牌放回 Shoe"
    );

    assert(
        game.nextManualSide ===
            HandSide.BANKER,
        "undo 後下一張應重新要求 Banker"
    );

    messages.push(
        "✓ undoManualCard() 正確"
    );


    /**
     * 11. cancelManualRound()。
     */
    const beforeCancel =
        game.shoe
            .observableRemaining;


    game.cancelManualRound();


    assert(
        game.manualRound === null,
        "取消後 manualRound 應為 null"
    );

    assert(
        game.manualState ===
            ManualRoundState.IDLE,
        "取消後 manualState 應為 IDLE"
    );

    assert(
        game.manualCards.length === 0,
        "取消後 manualCards 應清空"
    );

    assert(
        game.state ===
            GameState.SHOE_ACTIVE,
        "取消後應回到 SHOE_ACTIVE"
    );

    assert(
        game.shoe
            .observableRemaining ===
            beforeCancel + 1,
        "取消後應放回剩餘的一張輸入牌"
    );

    assert(
        game.history.count === 1,
        "取消未完成牌局不應影響 History"
    );

    messages.push(
        "✓ cancelManualRound() 正確"
    );


    /**
     * 12. 分析期間不可輸入牌局。
     */
    const delayedAnalyzer = {

        analyzeContext() {

            return new Promise(
                resolve => {

                    setTimeout(
                        () => {

                            resolve({

                                method:
                                    "delayed",

                                probability: {

                                    player:
                                        0.45,

                                    banker:
                                        0.46,

                                    tie:
                                        0.09

                                }

                            });

                        },
                        10
                    );

                }
            );

        }

    };


    const analysisGame =
        new Game({

            autoShuffle:
                false,

            analyzeAfterBurn:
                false,

            analyzeAfterRound:
                false,

            analyzer:
                delayedAnalyzer

        });


    analysisGame
        .confirmBurnIndicator({

            rank:
                "A",

            suit:
                "S"

        });


    const runningPromise =
        analysisGame
            .runNextAnalysis();


    assert(
        analysisGame.isAnalyzing ===
            true,
        "分析開始後 isAnalyzing 應為 true"
    );


    let analyzingRoundError =
        null;

    try {

        analysisGame
            .startManualRound();

    }
    catch (error) {

        analyzingRoundError =
            error;

    }

    assert(
        analyzingRoundError instanceof Error,
        "分析期間開始牌局應報錯"
    );


    await runningPromise;


    assert(
        analysisGame.state ===
            GameState.SHOE_ACTIVE,
        "分析完成後應回到 SHOE_ACTIVE"
    );

    messages.push(
        "✓ 分析期間狀態鎖定正確"
    );


    /**
     * 13. ViewModel、statistics 與一致性。
     */
    const viewModel =
        game.toViewModel();

    const statistics =
        game.statistics;

    const consistency =
        game.validateConsistency();


    assertHasKeys(

        viewModel,

        [
            "state",
            "shoeNumber",
            "burn",
            "manual",
            "analysis",
            "statistics",
            "roadmap",
            "consistency"
        ],

        "Game ViewModel"

    );


    assert(
        statistics.rounds === 1,
        "statistics.rounds 應為 1"
    );

    assert(
        statistics.winners
            .player === 1,
        "Player 勝場應為 1"
    );

    assert(
        statistics.lastWinner ===
            "Player",
        "lastWinner 應為 Player"
    );

    assert(
        consistency.valid === true,
        `Game 一致性檢查失敗：${consistency.errors.join(", ")}`
    );

    messages.push(
        "✓ ViewModel、統計與一致性檢查正確"
    );


    /**
     * 14. JSON 匯出。
     */
    const json =
        game.toJSON();


    assert(
        json.version === 2,
        "Game JSON version 應為 2"
    );

    assert(
        json.shoe &&
        Array.isArray(
            json.shoe.cards
        ),
        "JSON 應包含 Shoe"
    );

    assert(
        Array.isArray(
            json.history
        ) &&
        json.history.length === 1,
        "JSON History 應有一局"
    );

    assert(
        json.burn
            .hiddenCount === 1,
        "JSON 應保存未知燒牌數"
    );

    assert(
        json.analysis
            .result !== null,
        "JSON 應保存分析結果"
    );

    messages.push(
        "✓ toJSON() 匯出正確"
    );


    /**
     * 15. 開始新牌靴。
     */
    const oldShoe =
        game.shoe;

    game.startNewShoe({

        clearHistory:
            true,

        shuffle:
            false

    });


    assert(
        game.shoe !== oldShoe,
        "新牌靴應建立新的 Shoe"
    );

    assert(
        game.shoeNumber === 2,
        "第二個牌靴編號應為 2"
    );

    assert(
        game.state ===
            GameState
                .WAITING_BURN_INDICATOR,
        "新牌靴後應重新等待燒牌"
    );

    assert(
        game.burnConfirmed ===
            false,
        "新牌靴燒牌狀態應重置"
    );

    assert(
        game.history.count === 0,
        "新牌靴應清空 History"
    );

    assert(
        game.roadmapAnalyzer
            .sourceCount === 0,
        "新牌靴應清空 Roadmap"
    );

    assert(
        game.nextAnalysis === null,
        "新牌靴應清空下一局分析"
    );

    assert(
        game.lastResult === null,
        "新牌靴應清空上一局結果"
    );

    assert(
        game.shoe
            .observableRemaining === 416,
        "新牌靴可觀察牌數應為 416"
    );

    assert(
        game.shoe
            .physicalRemaining === 416,
        "新牌靴物理牌數應為 416"
    );

    messages.push(
        "✓ startNewShoe() 完整重置正確"
    );


    return `
${messages.join("\n")}

Game Controller v2 測試完成

新牌靴編號：${game.shoeNumber}
目前狀態：${game.state}
總牌數：${game.shoe.total}
可觀察牌數：${game.shoe.observableRemaining}
物理剩餘牌數：${game.shoe.physicalRemaining}
未知燒牌數：${game.shoe.unknownBurnedCount}

上一個牌靴測試結果：
Player 勝：1
History：1
Roadmap：1
Analyzer 呼叫：${analyzer.calls.length}
`;
}
