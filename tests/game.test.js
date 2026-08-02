/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game Test
 *
 * 百家樂遊戲主控制器測試
 */

import Game, {
    GameState
} from "../engine/game.js";

import Shoe
    from "../engine/shoe.js";

import Dealer
    from "../engine/dealer.js";

import History
    from "../engine/history.js";

import RoadmapAnalyzer
    from "../roadmap/roadmapAnalyzer.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(message);

    }

}


/**
 * 驗證指定函式必須丟出錯誤
 */
function assertThrows(
    callback,
    message
) {

    let thrown = false;

    try {

        callback();

    }
    catch {

        thrown = true;

    }

    assert(
        thrown,
        message
    );

}


/**
 * 驗證 Winner
 */
function assertWinner(
    winner,
    message
) {

    assert(
        [
            "Player",
            "Banker",
            "Tie"
        ].includes(winner),
        `${message}：無效 winner ${winner}`
    );

}


/**
 * 建立可供匯入的普通結果
 *
 * 注意：
 * 普通物件沒有 toJSON()，
 * 因此只用於 addResult() 與同步測試。
 */
function createResult(
    winner,
    options = {}
) {

    return {

        winner,

        playerPair:
            options.playerPair ??
            false,

        bankerPair:
            options.bankerPair ??
            false,

        super6:
            options.super6 ??
            false,

        margin:
            options.margin ??
            0,

        playerNatural:
            options.playerNatural ??
            false,

        bankerNatural:
            options.bankerNatural ??
            false

    };

}


/**
 * 確保 Shoe 已建立卡牌
 */
function prepareShoe(
    deckCount = 1
) {

    const shoe =
        new Shoe(deckCount);

    if (
        shoe.remaining === 0 &&
        typeof shoe.create ===
            "function"
    ) {

        shoe.create();

    }

    return shoe;

}


export default async function gameTest() {

    const details = [];


    /*
     * 測試 1：
     * 新遊戲初始化
     *
     * 關閉 shuffle 與 burn，
     * 讓初始牌數容易驗證。
     */
    const game =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    assert(
        game.state ===
            GameState.PLAYING,
        "新遊戲狀態應為 PLAYING"
    );

    assert(
        game.shoe instanceof Shoe,
        "新遊戲應建立 Shoe"
    );

    assert(
        game.dealer instanceof Dealer,
        "新遊戲應建立 Dealer"
    );

    assert(
        game.history instanceof History,
        "新遊戲應建立 History"
    );

    assert(
        game.roadmapAnalyzer instanceof
            RoadmapAnalyzer,
        "新遊戲應建立 RoadmapAnalyzer"
    );

    assert(
        game.shoeNumber === 1,
        "初始牌靴編號應為 1"
    );

    assert(
        game.remainingCards === 52,
        "一副未燒牌牌靴應有 52 張"
    );

    assert(
        game.usedCards === 0,
        "新牌靴已使用牌數應為 0"
    );

    assert(
        game.roundCount === 0,
        "新遊戲局數應為 0"
    );

    assert(
        game.isEmpty === true,
        "新遊戲 History 應為空"
    );

    assert(
        game.lastResult === null,
        "新遊戲 lastResult 應為 null"
    );

    assert(
        game.winner === null,
        "新遊戲 winner 應為 null"
    );

    assert(
        game.canPlay === true,
        "新遊戲應可開始牌局"
    );

    assert(
        game.finished === false,
        "新遊戲不應已完成牌靴"
    );

    assert(
        Number.isFinite(
            game.startedAt
        ),
        "新遊戲應記錄 startedAt"
    );

    assert(
        game.lastRoundAt === null,
        "尚未遊戲時 lastRoundAt 應為 null"
    );

    details.push(
        "建立 Game：PASS"
    );


    /*
     * 測試 2：
     * 未自動燒牌
     */
    const noBurnInfo =
        game.burnInfo;

    assert(
        noBurnInfo !== null,
        "應提供 burnInfo"
    );

    assert(
        noBurnInfo.executed === false,
        "autoBurn=false 時不應執行燒牌"
    );

    assert(
        noBurnInfo.count === 0,
        "未燒牌時 burn count 應為 0"
    );

    details.push(
        "關閉自動燒牌：PASS"
    );


    /*
     * 測試 3：
     * 預設自動燒牌
     */
    const burnedGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: true

        });

    assert(
        burnedGame.burnInfo.executed ===
            true,
        "autoBurn=true 時應執行燒牌"
    );

    assert(
        burnedGame.burnInfo.indicator !==
            null,
        "燒牌後應有指示牌"
    );

    assert(
        Number.isInteger(
            burnedGame.burnInfo.amount
        ),
        "燒牌數量應為整數"
    );

    assert(
        burnedGame.burnInfo.amount >= 1 &&
        burnedGame.burnInfo.amount <= 10,
        "燒牌數量應介於 1 到 10"
    );

    assert(
        burnedGame.remainingCards < 52,
        "燒牌後剩餘牌數應少於 52"
    );

    details.push(
        "自動燒牌：PASS"
    );


    /*
     * 測試 4：
     * play() 完成一局
     */
    const remainingBeforePlay =
        game.remainingCards;

    const firstResult =
        game.play();

    assert(
        firstResult !== null,
        "play() 應回傳結果"
    );

    assertWinner(
        firstResult.winner,
        "第一局結果"
    );

    assert(
        game.lastResult ===
            firstResult,
        "lastResult 應為 play() 回傳結果"
    );

    assert(
        game.lastRound ===
            firstResult,
        "History 最後一局應為目前結果"
    );

    assert(
        game.winner ===
            firstResult.winner,
        "Game winner 應與結果一致"
    );

    assert(
        game.roundCount === 1,
        "完成一局後 roundCount 應為 1"
    );

    assert(
        game.history.count === 1,
        "完成一局後 History 應有一局"
    );

    assert(
        game.remainingCards <
            remainingBeforePlay,
        "完成一局後剩餘牌數應減少"
    );

    assert(
        game.currentRound !== null,
        "完成一局後應保留目前 Round"
    );

    assert(
        Number.isFinite(
            game.lastRoundAt
        ),
        "完成一局後應記錄 lastRoundAt"
    );

    details.push(
        "play() 完成一局：PASS"
    );


    /*
     * 測試 5：
     * History 與 Roadmap 自動同步
     */
    assert(
        game.roadmapAnalyzer
            .sourceCount === 1,
        "Roadmap 來源應有一局"
    );

    assert(
        game.roads.beadRoad.count === 1,
        "珠盤路應有一格"
    );

    assert(
        game.roads.bigRoad
            .totalRounds === 1,
        "大路總局數應為 1"
    );

    assert(
        game.roads.bigRoad.count ===
            (
                firstResult.winner === "Tie"
                    ? 0
                    : 1
            ),
        "大路格數應依 Tie 規則更新"
    );

    assert(
        game.validateConsistency()
            .valid === true,
        "完成一局後資料應保持一致"
    );

    details.push(
        "History／Roadmap 同步：PASS"
    );


    /*
     * 測試 6：
     * playRound() 與 play() 功能相同
     */
    const secondResult =
        game.playRound();

    assertWinner(
        secondResult.winner,
        "第二局結果"
    );

    assert(
        game.roundCount === 2,
        "playRound() 後應有兩局"
    );

    assert(
        game.lastResult ===
            secondResult,
        "playRound() 應更新 lastResult"
    );

    assert(
        game.validateConsistency()
            .valid === true,
        "playRound() 後應保持一致"
    );

    details.push(
        "playRound()：PASS"
    );


    /*
     * 測試 7：
     * playMany()
     */
    const beforeManyCount =
        game.roundCount;

    const manyResults =
        game.playMany(5);

    assert(
        Array.isArray(
            manyResults
        ),
        "playMany() 應回傳陣列"
    );

    assert(
        manyResults.length === 5,
        "牌數足夠時 playMany(5) 應完成五局"
    );

    for (
        const result of
        manyResults
    ) {

        assertWinner(
            result.winner,
            "playMany() 結果"
        );

    }

    assert(
        game.roundCount ===
            beforeManyCount + 5,
        "playMany() 應增加五局"
    );

    assert(
        game.history.count ===
            game.roadmapAnalyzer
                .sourceCount,
        "playMany() 後 History 與 Roadmap 應同步"
    );

    assert(
        game.validateConsistency()
            .valid === true,
        "playMany() 後一致性應通過"
    );

    details.push(
        "playMany()：PASS"
    );


    /*
     * 測試 8：
     * playMany(0)
     */
    const beforeZeroPlay =
        game.roundCount;

    const zeroResults =
        game.playMany(0);

    assert(
        zeroResults.length === 0,
        "playMany(0) 應回傳空陣列"
    );

    assert(
        game.roundCount ===
            beforeZeroPlay,
        "playMany(0) 不應改變局數"
    );

    assertThrows(
        () => {

            game.playMany(-1);

        },
        "playMany(-1) 應丟出錯誤"
    );

    assertThrows(
        () => {

            game.playMany(1.5);

        },
        "playMany() 非整數應丟出錯誤"
    );

    details.push(
        "playMany() 邊界：PASS"
    );


    /*
     * 測試 9：
     * statistics
     */
    const statistics =
        game.statistics;

    assert(
        statistics.rounds ===
            game.roundCount,
        "statistics.rounds 應與遊戲局數一致"
    );

    assert(
        statistics.remainingCards ===
            game.remainingCards,
        "statistics.remainingCards 應一致"
    );

    assert(
        statistics.usedCards ===
            game.usedCards,
        "statistics.usedCards 應一致"
    );

    assert(
        statistics.winners.player +
        statistics.winners.banker +
        statistics.winners.tie ===
            game.roundCount,
        "勝負統計總和應等於局數"
    );

    assert(
        statistics.lastWinner ===
            game.winner,
        "statistics.lastWinner 應一致"
    );

    assert(
        statistics.shoeNumber ===
            game.shoeNumber,
        "statistics.shoeNumber 應一致"
    );

    details.push(
        "遊戲統計：PASS"
    );


    /*
     * 測試 10：
     * Roadmap getters
     */
    assert(
        game.roads.beadRoad ===
            game.roadmapAnalyzer
                .beadRoad,
        "roads getter 應回傳珠盤路"
    );

    assert(
        game.roads.bigRoad ===
            game.roadmapAnalyzer
                .bigRoad,
        "roads getter 應回傳大路"
    );

    const matrices =
        game.roadMatrices;

    assert(
        Array.isArray(
            matrices.beadRoad
        ),
        "roadMatrices 應包含珠盤路矩陣"
    );

    assert(
        Array.isArray(
            matrices.bigRoad
        ),
        "roadMatrices 應包含大路矩陣"
    );

    assert(
        game.roadmapSummary
            .sourceRounds ===
            game.roundCount,
        "roadmapSummary 來源局數應一致"
    );

    assert(
        game.roadmapViewModel
            .summary
            .sourceRounds ===
            game.roundCount,
        "Roadmap ViewModel 局數應一致"
    );

    details.push(
        "Roadmap getters：PASS"
    );


    /*
     * 測試 11：
     * Game ViewModel
     */
    const viewModel =
        game.toViewModel();

    assert(
        viewModel.state ===
            game.state,
        "ViewModel state 應一致"
    );

    assert(
        viewModel.canPlay ===
            game.canPlay,
        "ViewModel canPlay 應一致"
    );

    assert(
        viewModel.finished ===
            game.finished,
        "ViewModel finished 應一致"
    );

    assert(
        viewModel.statistics.rounds ===
            game.roundCount,
        "ViewModel statistics 應一致"
    );

    assert(
        viewModel.lastResult !== null,
        "有牌局時 ViewModel 應包含 lastResult"
    );

    assert(
        viewModel.lastResult.winner ===
            game.winner,
        "ViewModel lastResult winner 應一致"
    );

    assert(
        viewModel.consistency.valid ===
            true,
        "ViewModel consistency 應通過"
    );

    details.push(
        "toViewModel()：PASS"
    );


    /*
     * 測試 12：
     * clearHistory()
     */
    const remainingBeforeClear =
        game.remainingCards;

    game.clearHistory();

    assert(
        game.history.count === 0,
        "clearHistory() 後 History 應為空"
    );

    assert(
        game.roundCount === 0,
        "clearHistory() 後 roundCount 應為 0"
    );

    assert(
        game.roadmapAnalyzer
            .sourceCount === 0,
        "clearHistory() 後 Roadmap 應為空"
    );

    assert(
        game.roads.beadRoad.count === 0,
        "clearHistory() 後珠盤路應為空"
    );

    assert(
        game.roads.bigRoad.count === 0,
        "clearHistory() 後大路應為空"
    );

    assert(
        game.lastResult === null,
        "clearHistory() 後 lastResult 應為 null"
    );

    assert(
        game.lastRoundAt === null,
        "clearHistory() 後 lastRoundAt 應為 null"
    );

    assert(
        game.remainingCards ===
            remainingBeforeClear,
        "clearHistory() 不應更換或重設牌靴"
    );

    assert(
        game.validateConsistency()
            .valid === true,
        "清空後一致性應通過"
    );

    details.push(
        "clearHistory()：PASS"
    );


    /*
     * 測試 13：
     * addResult()
     */
    const importGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    const importedPlayer =
        createResult(
            "Player",
            {
                playerPair: true,
                margin: 4
            }
        );

    const returnedResult =
        importGame.addResult(
            importedPlayer
        );

    assert(
        returnedResult ===
            importedPlayer,
        "addResult() 應回傳原結果"
    );

    assert(
        importGame.roundCount === 1,
        "addResult() 後應有一局"
    );

    assert(
        importGame.history.last ===
            importedPlayer,
        "匯入結果應加入 History"
    );

    assert(
        importGame.roads
            .beadRoad.count === 1,
        "匯入結果應更新珠盤路"
    );

    assert(
        importGame.roads
            .bigRoad.count === 1,
        "Player 結果應更新大路"
    );

    assert(
        importGame.validateConsistency()
            .valid === true,
        "addResult() 後一致性應通過"
    );

    details.push(
        "addResult()：PASS"
    );


    /*
     * 測試 14：
     * addResults()
     */
    importGame.addResults([

        createResult("Tie"),

        createResult(
            "Banker",
            {
                bankerPair: true,
                super6: true
            }
        )

    ]);

    assert(
        importGame.roundCount === 3,
        "addResults() 後應有三局"
    );

    assert(
        importGame.roads
            .beadRoad.count === 3,
        "addResults() 應同步珠盤路"
    );

    assert(
        importGame.roads
            .bigRoad.totalRounds === 3,
        "addResults() 應同步大路總局數"
    );

    assert(
        importGame.roads
            .bigRoad.count === 2,
        "一局 Tie 不應增加大路格數"
    );

    assert(
        importGame.roads
            .bigRoad.tieCount === 1,
        "大路應記錄一局 Tie"
    );

    assert(
        importGame.validateConsistency()
            .valid === true,
        "addResults() 後一致性應通過"
    );

    assertThrows(
        () => {

            importGame.addResults({});

        },
        "addResults() 非陣列應丟出錯誤"
    );

    assertThrows(
        () => {

            importGame.addResult(null);

        },
        "addResult(null) 應丟出錯誤"
    );

    details.push(
        "addResults()：PASS"
    );


    /*
     * 測試 15：
     * rebuildRoadmaps()
     */
    importGame.roadmapAnalyzer.clear();

    assert(
        importGame.validateConsistency()
            .valid === false,
        "清除 Roadmap 後一致性應失敗"
    );

    const rebuilt =
        importGame.rebuildRoadmaps();

    assert(
        rebuilt ===
            importGame.roadmapAnalyzer,
        "rebuildRoadmaps() 應回傳 RoadmapAnalyzer"
    );

    assert(
        importGame.roadmapAnalyzer
            .sourceCount ===
            importGame.history.count,
        "重建後 Roadmap 局數應與 History 一致"
    );

    assert(
        importGame.validateConsistency()
            .valid === true,
        "重建後一致性應恢復"
    );

    details.push(
        "rebuildRoadmaps()：PASS"
    );


    /*
     * 測試 16：
     * newShoe() 預設清除歷史
     */
    const shoeGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    shoeGame.play();

    const oldShoe =
        shoeGame.shoe;

    const oldShoeNumber =
        shoeGame.shoeNumber;

    shoeGame.newShoe();

    assert(
        shoeGame.shoe !== oldShoe,
        "newShoe() 應更換 Shoe"
    );

    assert(
        shoeGame.shoeNumber ===
            oldShoeNumber + 1,
        "newShoe() 應增加牌靴編號"
    );

    assert(
        shoeGame.roundCount === 0,
        "newShoe() 預設應清空 History"
    );

    assert(
        shoeGame.roadmapAnalyzer
            .sourceCount === 0,
        "newShoe() 預設應清空 Roadmap"
    );

    assert(
        shoeGame.lastResult === null,
        "newShoe() 後 lastResult 應為 null"
    );

    assert(
        shoeGame.state ===
            GameState.PLAYING,
        "newShoe() 後狀態應為 PLAYING"
    );

    assert(
        shoeGame.remainingCards === 52,
        "新的一副牌應有 52 張"
    );

    details.push(
        "newShoe() 清空歷史：PASS"
    );


    /*
     * 測試 17：
     * newShoe({ clearHistory:false })
     */
    shoeGame.play();
    shoeGame.play();

    const retainedCount =
        shoeGame.roundCount;

    const retainedTrend = [
        ...shoeGame.history.trend
    ];

    const retainedShoeNumber =
        shoeGame.shoeNumber;

    shoeGame.newShoe({

        clearHistory: false,

        shuffle: false,

        burn: false

    });

    assert(
        shoeGame.shoeNumber ===
            retainedShoeNumber + 1,
        "保留歷史換鞋仍應增加牌靴編號"
    );

    assert(
        shoeGame.roundCount ===
            retainedCount,
        "clearHistory=false 應保留歷史"
    );

    assert(
        JSON.stringify(
            shoeGame.history.trend
        ) ===
        JSON.stringify(
            retainedTrend
        ),
        "換鞋後應保留勝方趨勢"
    );

    assert(
        shoeGame.roadmapAnalyzer
            .sourceCount ===
            retainedCount,
        "換鞋後應保留 Roadmap"
    );

    assert(
        shoeGame.lastResult === null,
        "開始新鞋後 lastResult 應重設"
    );

    assert(
        shoeGame.validateConsistency()
            .valid === true,
        "保留歷史換鞋後應保持一致"
    );

    details.push(
        "newShoe() 保留歷史：PASS"
    );


    /*
     * 測試 18：
     * setShoe()
     */
    const replacementShoe =
        prepareShoe(1);

    const setShoeGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    setShoeGame.play();

    const setResult =
        setShoeGame.setShoe(
            replacementShoe
        );

    assert(
        setResult === setShoeGame,
        "setShoe() 應回傳 Game 本身"
    );

    assert(
        setShoeGame.shoe ===
            replacementShoe,
        "setShoe() 應使用指定牌靴"
    );

    assert(
        setShoeGame.dealer instanceof
            Dealer,
        "setShoe() 應重建 Dealer"
    );

    assert(
        setShoeGame.dealer.shoe ===
            replacementShoe,
        "新 Dealer 應使用指定牌靴"
    );

    assert(
        setShoeGame.roundCount === 0,
        "setShoe() 預設應清除歷史"
    );

    assert(
        setShoeGame.state ===
            GameState.PLAYING,
        "setShoe() 後狀態應為 PLAYING"
    );

    assert(
        setShoeGame.canPlay === true,
        "完整替換牌靴應可繼續遊戲"
    );

    assertThrows(
        () => {

            setShoeGame.setShoe(null);

        },
        "setShoe(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            setShoeGame.setShoe({});

        },
        "沒有 draw() 的牌靴應丟出錯誤"
    );

    details.push(
        "setShoe()：PASS"
    );


    /*
     * 測試 19：
     * setShoe() 保留歷史
     */
    setShoeGame.play();

    const setHistoryCount =
        setShoeGame.roundCount;

    const secondReplacement =
        prepareShoe(1);

    setShoeGame.setShoe(
        secondReplacement,
        {
            clearHistory: false
        }
    );

    assert(
        setShoeGame.roundCount ===
            setHistoryCount,
        "setShoe(clearHistory=false) 應保留歷史"
    );

    assert(
        setShoeGame.roadmapAnalyzer
            .sourceCount ===
            setHistoryCount,
        "保留歷史時 Roadmap 也應保留"
    );

    assert(
        setShoeGame.validateConsistency()
            .valid === true,
        "保留歷史替換牌靴後應保持一致"
    );

    details.push(
        "setShoe() 保留歷史：PASS"
    );


    /*
     * 測試 20：
     * 牌數不足
     */
    const shortShoe =
        prepareShoe(1);

    /*
     * 只保留五張，
     * 少於預設 minimumCards = 6。
     */
    shortShoe.cards =
        shortShoe.cards.slice(
            0,
            5
        );

    const shortGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    shortGame.setShoe(
        shortShoe
    );

    assert(
        shortGame.remainingCards === 5,
        "測試牌靴應只剩五張"
    );

    assert(
        shortGame.canPlay === false,
        "少於 minimumCards 時不可開始"
    );

    assertThrows(
        () => {

            shortGame.play();

        },
        "牌數不足時 play() 應丟出錯誤"
    );

    assert(
        shortGame.state ===
            GameState.SHOE_FINISHED,
        "牌數不足後狀態應為 SHOE_FINISHED"
    );

    assert(
        shortGame.finished === true,
        "牌數不足後 finished 應為 true"
    );

    assertThrows(
        () => {

            shortGame.play();

        },
        "已完成牌靴不得再次 play()"
    );

    details.push(
        "牌數不足與牌靴結束：PASS"
    );


    /*
     * 測試 21：
     * playMany() 在牌數不足時提前停止
     */
    const limitedShoe =
        prepareShoe(1);

    /*
     * 保留約可完成一局但不足很多局的牌。
     */
    limitedShoe.cards =
        limitedShoe.cards.slice(
            0,
            10
        );

    const limitedGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    limitedGame.setShoe(
        limitedShoe
    );

    const limitedResults =
        limitedGame.playMany(20);

    assert(
        limitedResults.length < 20,
        "牌數不足時 playMany() 應提前停止"
    );

    assert(
        limitedGame.roundCount ===
            limitedResults.length,
        "實際完成局數應與回傳結果數一致"
    );

    assert(
        limitedGame.validateConsistency()
            .valid === true,
        "提前停止後資料仍應一致"
    );

    details.push(
        "playMany() 提前停止：PASS"
    );


    /*
     * 測試 22：
     * 人為破壞一致性
     */
    const inconsistentGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    inconsistentGame.play();

    inconsistentGame
        .roadmapAnalyzer
        .sourceRounds
        .pop();

    const brokenConsistency =
        inconsistentGame
            .validateConsistency();

    assert(
        brokenConsistency.valid === false,
        "人為破壞資料後一致性應失敗"
    );

    assert(
        brokenConsistency.errors.length >
            0,
        "一致性失敗應包含錯誤訊息"
    );

    assert(
        brokenConsistency.errors.some(
            error =>
                error.includes(
                    "History count"
                )
        ),
        "應偵測 History 與 Roadmap 數量不符"
    );

    details.push(
        "一致性異常偵測：PASS"
    );


    /*
     * 測試 23：
     * JSON 匯出
     *
     * 必須使用真實 play() 產生 RoundResult，
     * 避免普通物件沒有 toJSON()。
     */
    const jsonGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false

        });

    jsonGame.playMany(3);

    const json =
        jsonGame.toJSON();

    assert(
        json.version === 2,
        "Game JSON version 應為 2"
    );

    assert(
        json.options.deckCount === 1,
        "JSON deckCount 應為 1"
    );

    assert(
        json.state ===
            jsonGame.state,
        "JSON state 應一致"
    );

    assert(
        json.shoeNumber ===
            jsonGame.shoeNumber,
        "JSON shoeNumber 應一致"
    );

    assert(
        json.shoe !== null,
        "JSON 應包含 Shoe"
    );

    assert(
        json.burn !== null,
        "JSON 應包含 Burn"
    );

    assert(
        json.dealer !== null,
        "JSON 應包含 Dealer"
    );

    assert(
        Array.isArray(
            json.history
        ),
        "JSON history 應為陣列"
    );

    assert(
        json.history.length === 3,
        "JSON history 應有三局"
    );

    assert(
        json.roadmap.sourceRounds
            .length === 3,
        "JSON roadmap 應有三局來源"
    );

    assert(
        json.lastResult !== null,
        "JSON 應包含最後結果"
    );

    details.push(
        "JSON 匯出：PASS"
    );


    /*
     * 測試 24：
     * JSON 還原
     */
    const restored =
        Game.fromJSON(
            json
        );

    assert(
        restored instanceof Game,
        "fromJSON() 應回傳 Game"
    );

    assert(
        restored.shoe instanceof Shoe,
        "還原後應有 Shoe"
    );

    assert(
        restored.dealer instanceof Dealer,
        "還原後應有 Dealer"
    );

    assert(
        restored.history instanceof History,
        "還原後應有 History"
    );

    assert(
        restored.roadmapAnalyzer instanceof
            RoadmapAnalyzer,
        "還原後應有 RoadmapAnalyzer"
    );

    assert(
        restored.roundCount ===
            jsonGame.roundCount,
        "還原後局數應一致"
    );

    assert(
        restored.remainingCards ===
            jsonGame.remainingCards,
        "還原後剩餘牌數應一致"
    );

    assert(
        restored.shoeNumber ===
            jsonGame.shoeNumber,
        "還原後牌靴編號應一致"
    );

    assert(
        restored.state ===
            jsonGame.state,
        "還原後狀態應一致"
    );

    assert(
        restored.lastWinner ===
            undefined,
        "Game 沒有 lastWinner getter"
    );

    assert(
        restored.winner ===
            jsonGame.winner,
        "還原後最後 winner 應一致"
    );

    assert(
        restored.lastResult ===
            restored.history.last,
        "還原後 lastResult 應為 History 最後一局"
    );

    assert(
        restored.roadmapAnalyzer
            .sourceCount ===
            restored.history.count,
        "還原後 Roadmap 與 History 應同步"
    );

    assert(
        restored.validateConsistency()
            .valid === true,
        "JSON 還原後一致性應通過"
    );

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 25：
     * 還原後可繼續遊戲
     */
    const restoredBeforePlay =
        restored.roundCount;

    if (restored.canPlay) {

        const restoredResult =
            restored.play();

        assertWinner(
            restoredResult.winner,
            "還原後新牌局"
        );

        assert(
            restored.roundCount ===
                restoredBeforePlay + 1,
            "還原後 play() 應增加一局"
        );

        assert(
            restored.validateConsistency()
                .valid === true,
            "還原後繼續遊戲仍應一致"
        );

    }

    details.push(
        "JSON 還原後繼續遊戲：PASS"
    );


    /*
     * 測試 26：
     * fromJSON() 非法資料
     */
    assertThrows(
        () => {

            Game.fromJSON(null);

        },
        "fromJSON(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            Game.fromJSON({});

        },
        "缺少 shoe 應丟出錯誤"
    );

    assertThrows(
        () => {

            Game.fromJSON({
                shoe: json.shoe,
                history: {}
            });

        },
        "history 非陣列應丟出錯誤"
    );

    details.push(
        "fromJSON() 非法資料：PASS"
    );


    /*
     * 測試 27：
     * Constructor 非法設定
     */
    assertThrows(
        () => {

            new Game({
                deckCount: 0
            });

        },
        "deckCount = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            new Game({
                minimumCards: 0
            });

        },
        "minimumCards = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            new Game({
                beadRows: 0
            });

        },
        "beadRows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            new Game({
                bigRoadRows: 0
            });

        },
        "bigRoadRows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            new Game({
                derivedRows: 0
            });

        },
        "derivedRows = 0 應丟出錯誤"
    );

    details.push(
        "非法設定驗證：PASS"
    );


    /*
     * 測試 28：
     * 自訂 Roadmap rows
     */
    const customGame =
        new Game({

            deckCount: 1,

            autoShuffle: false,

            autoBurn: false,

            beadRows: 4,

            bigRoadRows: 5,

            derivedRows: 3

        });

    assert(
        customGame.roads
            .beadRoad
            .options.rows === 4,
        "自訂 beadRows 應傳給 Bead Road"
    );

    assert(
        customGame.roads
            .bigRoad
            .options.rows === 5,
        "自訂 bigRoadRows 應傳給 Big Road"
    );

    assert(
        customGame.roads
            .bigEyeRoad
            .options.rows === 3,
        "自訂 derivedRows 應傳給 Big Eye Road"
    );

    assert(
        customGame.roads
            .smallRoad
            .options.rows === 3,
        "自訂 derivedRows 應傳給 Small Road"
    );

    assert(
        customGame.roads
            .cockroachRoad
            .options.rows === 3,
        "自訂 derivedRows 應傳給 Cockroach Road"
    );

    details.push(
        "自訂 Roadmap rows：PASS"
    );


    /*
     * 保存最終摘要
     */
    const finalSummary = {

        rounds:
            jsonGame.roundCount,

        remaining:
            jsonGame.remainingCards,

        used:
            jsonGame.usedCards,

        player:
            jsonGame.history
                .playerWins,

        banker:
            jsonGame.history
                .bankerWins,

        tie:
            jsonGame.history
                .ties,

        beadCells:
            jsonGame.roads
                .beadRoad.count,

        bigCells:
            jsonGame.roads
                .bigRoad.count,

        bigEyeCells:
            jsonGame.roads
                .bigEyeRoad.count,

        smallCells:
            jsonGame.roads
                .smallRoad.count,

        cockroachCells:
            jsonGame.roads
                .cockroachRoad.count

    };


    return [

        "Game 測試全部完成",

        "",

        ...details,

        "",

        "遊戲整合流程：",

        "Shoe",

        "  ↓",

        "Dealer.play()",

        "  ↓",

        "RoundResult",

        "  ↓",

        "History",

        "  ↓",

        "RoadmapAnalyzer",

        "",

        `測試局數：${finalSummary.rounds}`,

        `剩餘牌數：${finalSummary.remaining}`,

        `已使用牌數：${finalSummary.used}`,

        "",

        `Player：${finalSummary.player}`,

        `Banker：${finalSummary.banker}`,

        `Tie：${finalSummary.tie}`,

        "",

        `珠盤路格數：${finalSummary.beadCells}`,

        `大路格數：${finalSummary.bigCells}`,

        `大眼仔格數：${finalSummary.bigEyeCells}`,

        `小路格數：${finalSummary.smallCells}`,

        `曱甴路格數：${finalSummary.cockroachCells}`

    ].join("\n");

}
