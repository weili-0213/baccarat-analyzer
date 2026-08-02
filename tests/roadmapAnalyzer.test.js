/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Roadmap Analyzer Test
 *
 * 路單統一分析中心測試
 */

import RoadmapAnalyzer, {
    RoadmapType
} from "../roadmap/roadmapAnalyzer.js";

import BeadRoad
    from "../roadmap/beadRoad.js";

import BigRoad
    from "../roadmap/bigRoad.js";

import BigEyeRoad
    from "../roadmap/bigEyeRoad.js";

import SmallRoad
    from "../roadmap/smallRoad.js";

import CockroachRoad
    from "../roadmap/cockroachRoad.js";

import History
    from "../engine/history.js";


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
 * 建立單局測試資料
 */
function resultEntry(
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
 * 建立主要測試來源
 *
 * 排除 Tie 後，大路 streak 為：
 *
 * [2, 1, 2, 2, 1]
 *
 * 原始局序：
 *
 * 0 Player
 * 1 Tie
 * 2 Player
 * 3 Banker
 * 4 Player
 * 5 Player
 * 6 Banker
 * 7 Banker
 * 8 Player
 *
 * 統計：
 *
 * Player：5
 * Banker：3
 * Tie：1
 *
 * 非 Tie 格數：8
 * 原始總局數：9
 */
function createSource() {

    return [

        resultEntry(
            "Player",
            {
                playerPair: true,
                playerNatural: true,
                margin: 4
            }
        ),

        resultEntry(
            "Tie",
            {
                bankerPair: true
            }
        ),

        resultEntry("Player"),

        resultEntry(
            "Banker",
            {
                super6: true,
                margin: 2
            }
        ),

        resultEntry("Player"),

        resultEntry("Player"),

        resultEntry("Banker"),

        resultEntry("Banker"),

        resultEntry("Player")

    ];

}


/**
 * 取得衍生路顏色
 */
function getColors(road) {

    return road.entries.map(
        entry =>
            entry.color
    );

}


/**
 * 驗證顏色序列
 */
function assertColors(
    road,
    expected,
    message
) {

    const actual =
        getColors(road);

    assert(
        JSON.stringify(actual) ===
            JSON.stringify(expected),
        [
            message,
            `預期：${expected.join(", ")}`,
            `實際：${actual.join(", ")}`
        ].join("\n")
    );

}


/**
 * 比較來源資料
 */
function assertRoundEquals(
    actual,
    expected,
    message
) {

    assert(
        actual.winner ===
            expected.winner,
        `${message}：winner 不一致`
    );

    assert(
        actual.playerPair ===
            Boolean(expected.playerPair),
        `${message}：playerPair 不一致`
    );

    assert(
        actual.bankerPair ===
            Boolean(expected.bankerPair),
        `${message}：bankerPair 不一致`
    );

    assert(
        actual.super6 ===
            Boolean(expected.super6),
        `${message}：super6 不一致`
    );

    assert(
        actual.margin ===
            (
                Number.isFinite(
                    expected.margin
                )
                    ? expected.margin
                    : 0
            ),
        `${message}：margin 不一致`
    );

    assert(
        actual.playerNatural ===
            Boolean(
                expected.playerNatural
            ),
        `${message}：playerNatural 不一致`
    );

    assert(
        actual.bankerNatural ===
            Boolean(
                expected.bankerNatural
            ),
        `${message}：bankerNatural 不一致`
    );

}


export default async function roadmapAnalyzerTest() {

    const details = [];


    /*
     * 測試 1：
     * 初始狀態
     */
    const emptyAnalyzer =
        new RoadmapAnalyzer();

    assert(
        emptyAnalyzer.isEmpty === true,
        "新 Analyzer 應為空"
    );

    assert(
        emptyAnalyzer.sourceCount === 0,
        "初始 sourceCount 應為 0"
    );

    assert(
        emptyAnalyzer.lastSourceRound === null,
        "初始 lastSourceRound 應為 null"
    );

    assert(
        emptyAnalyzer.lastWinner === null,
        "初始 lastWinner 應為 null"
    );

    assert(
        emptyAnalyzer.currentWinnerStreak === null,
        "初始 winner streak 應為 null"
    );

    assert(
        emptyAnalyzer.revision === 0,
        "初始 revision 應為 0"
    );

    assert(
        emptyAnalyzer.lastUpdatedAt === null,
        "初始 lastUpdatedAt 應為 null"
    );

    assert(
        emptyAnalyzer.beadRoad instanceof
            BeadRoad,
        "應建立 BeadRoad"
    );

    assert(
        emptyAnalyzer.bigRoad instanceof
            BigRoad,
        "應建立 BigRoad"
    );

    assert(
        emptyAnalyzer.bigEyeRoad instanceof
            BigEyeRoad,
        "應建立 BigEyeRoad"
    );

    assert(
        emptyAnalyzer.smallRoad instanceof
            SmallRoad,
        "應建立 SmallRoad"
    );

    assert(
        emptyAnalyzer.cockroachRoad instanceof
            CockroachRoad,
        "應建立 CockroachRoad"
    );

    details.push(
        "建立 RoadmapAnalyzer：PASS"
    );


    /*
     * 測試 2：
     * 從陣列建立全部路單
     */
    const source =
        createSource();

    const analyzer =
        new RoadmapAnalyzer();

    const buildResult =
        analyzer.build(source);

    assert(
        buildResult === analyzer,
        "build() 應回傳 Analyzer 本身"
    );

    assert(
        analyzer.isEmpty === false,
        "build() 後不應為空"
    );

    assert(
        analyzer.sourceCount === 9,
        "來源總局數應為 9"
    );

    assert(
        analyzer.revision === 1,
        "第一次 build() 後 revision 應為 1"
    );

    assert(
        Number.isFinite(
            analyzer.lastUpdatedAt
        ),
        "build() 後應記錄更新時間"
    );

    assert(
        analyzer.lastWinner === "Player",
        "最後勝方應為 Player"
    );

    assertRoundEquals(
        analyzer.lastSourceRound,
        source.at(-1),
        "最後來源資料"
    );

    details.push(
        "陣列 build()：PASS"
    );


    /*
     * 測試 3：
     * 五種路單同步建立
     */
    assert(
        analyzer.beadRoad.count === 9,
        "珠盤路應有九格"
    );

    assert(
        analyzer.bigRoad.totalRounds === 9,
        "大路總局數應為 9"
    );

    assert(
        analyzer.bigRoad.count === 8,
        "大路非 Tie 格數應為 8"
    );

    assert(
        analyzer.bigRoad.tieCount === 1,
        "大路 Tie 數應為 1"
    );

    assert(
        analyzer.bigEyeRoad
            .sourceCellCount === 8,
        "大眼仔來源格數應為 8"
    );

    assert(
        analyzer.smallRoad
            .sourceCellCount === 8,
        "小路來源格數應為 8"
    );

    assert(
        analyzer.cockroachRoad
            .sourceCellCount === 8,
        "曱甴路來源格數應為 8"
    );

    assert(
        analyzer.bigEyeRoad
            .sourceRoundCount === 9,
        "大眼仔來源局數應為 9"
    );

    assert(
        analyzer.smallRoad
            .sourceRoundCount === 9,
        "小路來源局數應為 9"
    );

    assert(
        analyzer.cockroachRoad
            .sourceRoundCount === 9,
        "曱甴路來源局數應為 9"
    );

    details.push(
        "五種路單同步建立：PASS"
    );


    /*
     * 測試 4：
     * Tie 在珠盤路占格，
     * 在大路不占格。
     */
    assert(
        analyzer.beadRoad
            .get(1)
            .winner === "Tie",
        "珠盤路第二格應為 Tie"
    );

    assert(
        analyzer.bigRoad
            .get(0)
            .winner === "Player",
        "大路第一格應為 Player"
    );

    assert(
        analyzer.bigRoad
            .get(0)
            .tieCount === 1,
        "Tie 應附加到第一個 Player 格"
    );

    assert(
        analyzer.bigRoad
            .get(0)
            .ties[0]
            .roundIndex === 1,
        "附加 Tie 的 roundIndex 應為 1"
    );

    assert(
        analyzer.bigRoad
            .get(0)
            .tieBankerPairCount === 1,
        "Tie 局 Banker Pair 應被保存"
    );

    details.push(
        "Tie 路單行為：PASS"
    );


    /*
     * 測試 5：
     * 勝負統計
     */
    const winnerSummary =
        analyzer.winnerSummary;

    assert(
        winnerSummary.rounds === 9,
        "總局數應為 9"
    );

    assert(
        winnerSummary.player === 5,
        "Player 應為 5"
    );

    assert(
        winnerSummary.banker === 3,
        "Banker 應為 3"
    );

    assert(
        winnerSummary.tie === 1,
        "Tie 應為 1"
    );

    details.push(
        "勝負統計：PASS"
    );


    /*
     * 測試 6：
     * Pair 與特殊結果統計
     */
    const specialSummary =
        analyzer.specialSummary;

    assert(
        specialSummary.playerPair === 1,
        "Player Pair 應為 1"
    );

    assert(
        specialSummary.bankerPair === 1,
        "Banker Pair 應為 1"
    );

    assert(
        specialSummary.super6 === 1,
        "Super 6 應為 1"
    );

    assert(
        specialSummary.playerNatural === 1,
        "Player Natural 應為 1"
    );

    assert(
        specialSummary.bankerNatural === 0,
        "Banker Natural 應為 0"
    );

    assert(
        specialSummary.dragonBonus === 1,
        "Dragon Bonus 應為 1"
    );

    details.push(
        "特殊結果統計：PASS"
    );


    /*
     * 測試 7：
     * 三種衍生路結果
     *
     * 大路 streak：
     *
     * [2, 1, 2, 2, 1]
     */
    assertColors(
        analyzer.bigEyeRoad,
        [
            "Blue",
            "Blue",
            "Blue",
            "Red",
            "Red"
        ],
        "大眼仔顏色不正確"
    );

    assertColors(
        analyzer.smallRoad,
        [
            "Red",
            "Red",
            "Blue",
            "Blue"
        ],
        "小路顏色不正確"
    );

    assertColors(
        analyzer.cockroachRoad,
        [
            "Red",
            "Red"
        ],
        "曱甴路顏色不正確"
    );

    const derivedSummary =
        analyzer.derivedSummary;

    assert(
        derivedSummary.bigEyeRoad
            .cells === 5,
        "大眼仔應有五格"
    );

    assert(
        derivedSummary.bigEyeRoad
            .red === 2,
        "大眼仔 Red 應為 2"
    );

    assert(
        derivedSummary.bigEyeRoad
            .blue === 3,
        "大眼仔 Blue 應為 3"
    );

    assert(
        derivedSummary.smallRoad
            .cells === 4,
        "小路應有四格"
    );

    assert(
        derivedSummary.smallRoad
            .red === 2,
        "小路 Red 應為 2"
    );

    assert(
        derivedSummary.smallRoad
            .blue === 2,
        "小路 Blue 應為 2"
    );

    assert(
        derivedSummary.cockroachRoad
            .cells === 2,
        "曱甴路應有兩格"
    );

    assert(
        derivedSummary.cockroachRoad
            .red === 2,
        "曱甴路 Red 應為 2"
    );

    assert(
        derivedSummary.cockroachRoad
            .blue === 0,
        "曱甴路 Blue 應為 0"
    );

    details.push(
        "衍生路統計：PASS"
    );


    /*
     * 測試 8：
     * getRoad()
     */
    assert(
        analyzer.getRoad(
            RoadmapType.BEAD
        ) === analyzer.beadRoad,
        "應取得 Bead Road"
    );

    assert(
        analyzer.getRoad(
            RoadmapType.BIG
        ) === analyzer.bigRoad,
        "應取得 Big Road"
    );

    assert(
        analyzer.getRoad(
            RoadmapType.BIG_EYE
        ) === analyzer.bigEyeRoad,
        "應取得 Big Eye Road"
    );

    assert(
        analyzer.getRoad(
            RoadmapType.SMALL
        ) === analyzer.smallRoad,
        "應取得 Small Road"
    );

    assert(
        analyzer.getRoad(
            RoadmapType.COCKROACH
        ) === analyzer.cockroachRoad,
        "應取得 Cockroach Road"
    );

    assert(
        analyzer.getRoad(
            "Unknown"
        ) === null,
        "未知 Road 類型應回傳 null"
    );

    details.push(
        "getRoad()：PASS"
    );


    /*
     * 測試 9：
     * roads getter
     */
    const roads =
        analyzer.roads;

    assert(
        roads.beadRoad ===
            analyzer.beadRoad,
        "roads.beadRoad 不正確"
    );

    assert(
        roads.bigRoad ===
            analyzer.bigRoad,
        "roads.bigRoad 不正確"
    );

    assert(
        roads.bigEyeRoad ===
            analyzer.bigEyeRoad,
        "roads.bigEyeRoad 不正確"
    );

    assert(
        roads.smallRoad ===
            analyzer.smallRoad,
        "roads.smallRoad 不正確"
    );

    assert(
        roads.cockroachRoad ===
            analyzer.cockroachRoad,
        "roads.cockroachRoad 不正確"
    );

    details.push(
        "roads getter：PASS"
    );


    /*
     * 測試 10：
     * 所有矩陣
     */
    const matrices =
        analyzer.matrices;

    assert(
        Array.isArray(
            matrices.beadRoad
        ),
        "Bead Road matrix 應為陣列"
    );

    assert(
        matrices.beadRoad.length === 6,
        "Bead Road matrix 應有六列"
    );

    assert(
        matrices.bigRoad.length === 6,
        "Big Road matrix 應有六列"
    );

    assert(
        matrices.bigEyeRoad.length === 6,
        "Big Eye Road matrix 應有六列"
    );

    assert(
        matrices.smallRoad.length === 6,
        "Small Road matrix 應有六列"
    );

    assert(
        matrices.cockroachRoad.length === 6,
        "Cockroach Road matrix 應有六列"
    );

    assert(
        matrices.beadRoad[0][0] !==
            analyzer.beadRoad.get(0),
        "矩陣格子應為副本"
    );

    const originalWinner =
        analyzer.beadRoad
            .get(0)
            .winner;

    matrices.beadRoad[0][0]
        .winner =
        "Banker";

    assert(
        analyzer.beadRoad
            .get(0)
            .winner === originalWinner,
        "修改矩陣不應影響原路單"
    );

    details.push(
        "matrices getter：PASS"
    );


    /*
     * 測試 11：
     * trend
     */
    const expectedTrend = [

        "Player",
        "Tie",
        "Player",
        "Banker",
        "Player",
        "Player",
        "Banker",
        "Banker",
        "Player"

    ];

    assert(
        JSON.stringify(
            analyzer.trend
        ) ===
        JSON.stringify(
            expectedTrend
        ),
        "Trend 順序不正確"
    );

    details.push(
        "Trend：PASS"
    );


    /*
     * 測試 12：
     * 最近 N 局
     */
    const recent =
        analyzer.lastRounds(3);

    assert(
        recent.length === 3,
        "lastRounds(3) 應回傳三局"
    );

    assert(
        recent[0].winner === "Banker",
        "最近三局第一筆應為 Banker"
    );

    assert(
        recent[1].winner === "Banker",
        "最近三局第二筆應為 Banker"
    );

    assert(
        recent[2].winner === "Player",
        "最近三局第三筆應為 Player"
    );

    assert(
        recent[0] !==
            analyzer.sourceRounds[6],
        "lastRounds() 應回傳副本"
    );

    const sourceWinner =
        analyzer.sourceRounds[6]
            .winner;

    recent[0].winner =
        "Tie";

    assert(
        analyzer.sourceRounds[6]
            .winner === sourceWinner,
        "修改 recentRounds 不應影響來源"
    );

    assertThrows(
        () => {

            analyzer.lastRounds(-1);

        },
        "負數 count 應丟出錯誤"
    );

    details.push(
        "lastRounds()：PASS"
    );


    /*
     * 測試 13：
     * 目前勝方 streak
     */
    assert(
        analyzer.currentWinnerStreak
            .winner === "Player",
        "目前勝方應為 Player"
    );

    assert(
        analyzer.currentWinnerStreak
            .count === 1,
        "目前 Player streak 應為 1"
    );

    details.push(
        "Winner Streak：PASS"
    );


    /*
     * 測試 14：
     * 一致性檢查
     */
    const consistency =
        analyzer.validateConsistency();

    assert(
        consistency.valid === true,
        "正常路單一致性應通過"
    );

    assert(
        Array.isArray(
            consistency.errors
        ),
        "consistency.errors 應為陣列"
    );

    assert(
        consistency.errors.length === 0,
        "正常路單不應有一致性錯誤"
    );

    details.push(
        "一致性檢查：PASS"
    );


    /*
     * 測試 15：
     * 完整 summary
     */
    const summary =
        analyzer.summary;

    assert(
        summary.sourceRounds === 9,
        "summary.sourceRounds 應為 9"
    );

    assert(
        summary.revision === 1,
        "summary.revision 應為 1"
    );

    assert(
        summary.lastWinner === "Player",
        "summary.lastWinner 應為 Player"
    );

    assert(
        summary.currentWinnerStreak
            .winner === "Player",
        "summary winner streak 應為 Player"
    );

    assert(
        summary.winners.player === 5,
        "summary Player 應為 5"
    );

    assert(
        summary.specials.super6 === 1,
        "summary Super 6 應為 1"
    );

    assert(
        summary.roads.bigRoad
            .cells === 8,
        "summary 大路格數應為 8"
    );

    assert(
        summary.derived.smallRoad
            .cells === 4,
        "summary 小路格數應為 4"
    );

    assert(
        summary.consistency.valid === true,
        "summary consistency 應通過"
    );

    details.push(
        "完整 Summary：PASS"
    );


    /*
     * 測試 16：
     * toViewModel()
     */
    const viewModel =
        analyzer.toViewModel();

    assert(
        viewModel.summary
            .sourceRounds === 9,
        "ViewModel summary 不正確"
    );

    assert(
        Array.isArray(
            viewModel.matrices.bigRoad
        ),
        "ViewModel 應包含 Big Road matrix"
    );

    assert(
        JSON.stringify(
            viewModel.trend
        ) ===
        JSON.stringify(
            expectedTrend
        ),
        "ViewModel trend 不正確"
    );

    assert(
        viewModel.recentRounds
            .length === 9,
        "不足 20 局時應回傳全部最近局"
    );

    details.push(
        "toViewModel()：PASS"
    );


    /*
     * 測試 17：
     * analyze() 是 build() 別名
     */
    const analyzeAlias =
        new RoadmapAnalyzer();

    const analyzeResult =
        analyzeAlias.analyze(source);

    assert(
        analyzeResult ===
            analyzeAlias,
        "analyze() 應回傳 Analyzer 本身"
    );

    assert(
        analyzeAlias.sourceCount === 9,
        "analyze() 應建立九局"
    );

    assert(
        analyzeAlias.bigRoad
            .count === 8,
        "analyze() 應建立八個大路格"
    );

    details.push(
        "analyze()：PASS"
    );


    /*
     * 測試 18：
     * 從 History v5 建立
     */
    const history =
        new History();

    for (const item of source) {

        history.add(item);

    }

    const historyAnalyzer =
        new RoadmapAnalyzer();

    historyAnalyzer.build(
        history
    );

    assert(
        historyAnalyzer.sourceCount === 9,
        "History build() 應有九局"
    );

    assert(
        historyAnalyzer.beadRoad
            .count === 9,
        "History 珠盤路應有九格"
    );

    assert(
        historyAnalyzer.bigRoad
            .count === 8,
        "History 大路應有八格"
    );

    assertColors(
        historyAnalyzer.smallRoad,
        [
            "Red",
            "Red",
            "Blue",
            "Blue"
        ],
        "History 建立的小路不正確"
    );

    details.push(
        "History build()：PASS"
    );


    /*
     * 測試 19：
     * add() 同步更新全部路單
     */
    const incrementalAnalyzer =
        new RoadmapAnalyzer();

    incrementalAnalyzer.build(
        source.slice(0, 5)
    );

    const beforeAddRevision =
        incrementalAnalyzer.revision;

    const addResult =
        incrementalAnalyzer.add(
            source[5]
        );

    assert(
        addResult ===
            incrementalAnalyzer,
        "add() 應回傳 Analyzer 本身"
    );

    assert(
        incrementalAnalyzer
            .sourceCount === 6,
        "add() 後來源應為六局"
    );

    assert(
        incrementalAnalyzer
            .revision ===
        beforeAddRevision + 1,
        "add() 後 revision 應增加 1"
    );

    assert(
        incrementalAnalyzer
            .beadRoad.count === 6,
        "add() 後珠盤路應為六格"
    );

    assert(
        incrementalAnalyzer
            .bigRoad.totalRounds === 6,
        "add() 後大路局數應為六局"
    );

    assert(
        incrementalAnalyzer
            .validateConsistency()
            .valid === true,
        "add() 後五路應保持一致"
    );

    details.push(
        "add() 同步更新：PASS"
    );


    /*
     * 測試 20：
     * addAll() 同步更新
     */
    const beforeAddAllRevision =
        incrementalAnalyzer.revision;

    incrementalAnalyzer.addAll(
        source.slice(6)
    );

    assert(
        incrementalAnalyzer
            .sourceCount === 9,
        "addAll() 後來源應為九局"
    );

    assert(
        incrementalAnalyzer
            .revision ===
        beforeAddAllRevision + 1,
        "addAll() 後 revision 應增加 1"
    );

    assert(
        incrementalAnalyzer
            .bigRoad.count === 8,
        "addAll() 後大路應為八格"
    );

    assertColors(
        incrementalAnalyzer
            .cockroachRoad,
        [
            "Red",
            "Red"
        ],
        "addAll() 後曱甴路不正確"
    );

    assert(
        incrementalAnalyzer
            .validateConsistency()
            .valid === true,
        "addAll() 後五路應保持一致"
    );

    details.push(
        "addAll() 同步更新：PASS"
    );


    /*
     * 測試 21：
     * addAll() 非陣列
     */
    const beforeInvalidAddAll = {

        count:
            incrementalAnalyzer
                .sourceCount,

        revision:
            incrementalAnalyzer
                .revision,

        lastWinner:
            incrementalAnalyzer
                .lastWinner

    };

    assertThrows(
        () => {

            incrementalAnalyzer
                .addAll({});

        },
        "addAll() 非陣列應丟出錯誤"
    );

    assert(
        incrementalAnalyzer
            .sourceCount ===
        beforeInvalidAddAll.count,
        "非法 addAll() 不應改變來源"
    );

    assert(
        incrementalAnalyzer
            .revision ===
        beforeInvalidAddAll.revision,
        "非法 addAll() 不應改變 revision"
    );

    assert(
        incrementalAnalyzer
            .lastWinner ===
        beforeInvalidAddAll.lastWinner,
        "非法 addAll() 不應改變最後勝方"
    );

    details.push(
        "安全 addAll()：PASS"
    );


    /*
     * 測試 22：
     * 非法 build() 不破壞既有資料
     */
    const safeAnalyzer =
        new RoadmapAnalyzer();

    safeAnalyzer.build(source);

    const beforeInvalidBuild = {

        sourceCount:
            safeAnalyzer.sourceCount,

        revision:
            safeAnalyzer.revision,

        lastWinner:
            safeAnalyzer.lastWinner,

        beadCount:
            safeAnalyzer.beadRoad.count,

        bigCount:
            safeAnalyzer.bigRoad.count,

        bigEyeCount:
            safeAnalyzer.bigEyeRoad.count,

        smallCount:
            safeAnalyzer.smallRoad.count,

        cockroachCount:
            safeAnalyzer.cockroachRoad.count

    };

    assertThrows(
        () => {

            safeAnalyzer.build({});

        },
        "不支援來源應丟出錯誤"
    );

    assert(
        safeAnalyzer.sourceCount ===
            beforeInvalidBuild.sourceCount,
        "非法 build() 不應改變來源局數"
    );

    assert(
        safeAnalyzer.revision ===
            beforeInvalidBuild.revision,
        "非法 build() 不應改變 revision"
    );

    assert(
        safeAnalyzer.lastWinner ===
            beforeInvalidBuild.lastWinner,
        "非法 build() 不應改變最後勝方"
    );

    assert(
        safeAnalyzer.beadRoad.count ===
            beforeInvalidBuild.beadCount,
        "非法 build() 不應清除珠盤路"
    );

    assert(
        safeAnalyzer.bigRoad.count ===
            beforeInvalidBuild.bigCount,
        "非法 build() 不應清除大路"
    );

    assert(
        safeAnalyzer.bigEyeRoad.count ===
            beforeInvalidBuild.bigEyeCount,
        "非法 build() 不應清除大眼仔"
    );

    assert(
        safeAnalyzer.smallRoad.count ===
            beforeInvalidBuild.smallCount,
        "非法 build() 不應清除小路"
    );

    assert(
        safeAnalyzer.cockroachRoad.count ===
            beforeInvalidBuild.cockroachCount,
        "非法 build() 不應清除曱甴路"
    );

    assertThrows(
        () => {

            safeAnalyzer.build([

                resultEntry("Player"),

                resultEntry("Unknown")

            ]);

        },
        "非法 winner 應丟出錯誤"
    );

    assert(
        safeAnalyzer.sourceCount ===
            beforeInvalidBuild.sourceCount,
        "非法陣列不應改變 Analyzer"
    );

    details.push(
        "安全 build()：PASS"
    );


    /*
     * 測試 23：
     * 人為破壞資料後，
     * 一致性檢查應失敗
     */
    const inconsistentAnalyzer =
        new RoadmapAnalyzer();

    inconsistentAnalyzer.build(source);

    inconsistentAnalyzer
        .bigRoad
        .roundCount--;

    const invalidConsistency =
        inconsistentAnalyzer
            .validateConsistency();

    assert(
        invalidConsistency.valid === false,
        "資料被破壞後一致性應失敗"
    );

    assert(
        invalidConsistency.errors.length >
            0,
        "一致性失敗應提供錯誤內容"
    );

    assert(
        invalidConsistency.errors.some(
            message =>
                message.includes(
                    "Big Road total rounds"
                )
        ),
        "應偵測 Big Road 總局數錯誤"
    );

    details.push(
        "一致性異常偵測：PASS"
    );


    /*
     * 測試 24：
     * JSON 匯出
     */
    const json =
        analyzer.toJSON();

    assert(
        json.version === 1,
        "JSON version 應為 1"
    );

    assert(
        json.options.beadRows === 6,
        "JSON beadRows 應為 6"
    );

    assert(
        json.options.bigRoadRows === 6,
        "JSON bigRoadRows 應為 6"
    );

    assert(
        json.options.derivedRows === 6,
        "JSON derivedRows 應為 6"
    );

    assert(
        json.revision === 1,
        "JSON revision 應為 1"
    );

    assert(
        json.lastUpdatedAt ===
            analyzer.lastUpdatedAt,
        "JSON 更新時間應一致"
    );

    assert(
        json.sourceRounds.length === 9,
        "JSON sourceRounds 應有九筆"
    );

    assert(
        json.roads.beadRoad
            .entries.length === 9,
        "JSON 應包含珠盤路"
    );

    assert(
        json.roads.bigRoad
            .entries.length === 8,
        "JSON 應包含大路"
    );

    assert(
        json.roads.bigEyeRoad
            .entries.length === 5,
        "JSON 應包含大眼仔"
    );

    assert(
        json.roads.smallRoad
            .entries.length === 4,
        "JSON 應包含小路"
    );

    assert(
        json.roads.cockroachRoad
            .entries.length === 2,
        "JSON 應包含曱甴路"
    );

    details.push(
        "JSON 匯出：PASS"
    );


    /*
     * 測試 25：
     * JSON 還原
     */
    const restored =
        RoadmapAnalyzer.fromJSON(
            json
        );

    assert(
        restored instanceof
            RoadmapAnalyzer,
        "fromJSON() 應回傳 RoadmapAnalyzer"
    );

    assert(
        restored.sourceCount ===
            analyzer.sourceCount,
        "JSON 還原後來源局數應一致"
    );

    assert(
        restored.revision ===
            analyzer.revision,
        "JSON 還原後 revision 應一致"
    );

    assert(
        restored.lastUpdatedAt ===
            analyzer.lastUpdatedAt,
        "JSON 還原後更新時間應一致"
    );

    assert(
        restored.lastWinner ===
            analyzer.lastWinner,
        "JSON 還原後最後勝方應一致"
    );

    assert(
        restored.beadRoad.count ===
            analyzer.beadRoad.count,
        "JSON 還原後珠盤路應一致"
    );

    assert(
        restored.bigRoad.count ===
            analyzer.bigRoad.count,
        "JSON 還原後大路應一致"
    );

    assertColors(
        restored.bigEyeRoad,
        getColors(
            analyzer.bigEyeRoad
        ),
        "JSON 還原後大眼仔應一致"
    );

    assertColors(
        restored.smallRoad,
        getColors(
            analyzer.smallRoad
        ),
        "JSON 還原後小路應一致"
    );

    assertColors(
        restored.cockroachRoad,
        getColors(
            analyzer.cockroachRoad
        ),
        "JSON 還原後曱甴路應一致"
    );

    for (
        let index = 0;
        index < analyzer.sourceCount;
        index++
    ) {

        assertRoundEquals(
            restored.sourceRounds[index],
            analyzer.sourceRounds[index],
            `JSON 來源第 ${index} 局`
        );

    }

    assert(
        restored.validateConsistency()
            .valid === true,
        "JSON 還原後一致性應通過"
    );

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 26：
     * 自訂 rows
     */
    const customAnalyzer =
        new RoadmapAnalyzer({

            beadRows: 4,

            bigRoadRows: 5,

            derivedRows: 3

        });

    customAnalyzer.build(source);

    assert(
        customAnalyzer.options
            .beadRows === 4,
        "自訂 beadRows 應為 4"
    );

    assert(
        customAnalyzer.beadRoad
            .options.rows === 4,
        "Bead Road rows 應為 4"
    );

    assert(
        customAnalyzer.bigRoad
            .options.rows === 5,
        "Big Road rows 應為 5"
    );

    assert(
        customAnalyzer.bigEyeRoad
            .options.rows === 3,
        "Big Eye Road rows 應為 3"
    );

    assert(
        customAnalyzer.smallRoad
            .options.rows === 3,
        "Small Road rows 應為 3"
    );

    assert(
        customAnalyzer.cockroachRoad
            .options.rows === 3,
        "Cockroach Road rows 應為 3"
    );

    const customRestored =
        RoadmapAnalyzer.fromJSON(
            customAnalyzer.toJSON()
        );

    assert(
        customRestored.beadRoad
            .options.rows === 4,
        "JSON 應保留 beadRows"
    );

    assert(
        customRestored.bigRoad
            .options.rows === 5,
        "JSON 應保留 bigRoadRows"
    );

    assert(
        customRestored.smallRoad
            .options.rows === 3,
        "JSON 應保留 derivedRows"
    );

    details.push(
        "自訂 rows：PASS"
    );


    /*
     * 測試 27：
     * 非法資料驗證
     */
    assertThrows(
        () => {

            new RoadmapAnalyzer({
                beadRows: 0
            });

        },
        "beadRows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            new RoadmapAnalyzer({
                bigRoadRows: 0
            });

        },
        "bigRoadRows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            new RoadmapAnalyzer({
                derivedRows: 0
            });

        },
        "derivedRows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            emptyAnalyzer.build(null);

        },
        "build(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            emptyAnalyzer.add(null);

        },
        "add(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            RoadmapAnalyzer.fromJSON(
                null
            );

        },
        "fromJSON(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            RoadmapAnalyzer.fromJSON({
                version: 1
            });

        },
        "缺少 sourceRounds 應丟出錯誤"
    );

    assertThrows(
        () => {

            RoadmapAnalyzer.fromJSON({
                sourceRounds: [
                    resultEntry("Unknown")
                ]
            });

        },
        "JSON 非法 winner 應丟出錯誤"
    );

    details.push(
        "非法資料驗證：PASS"
    );


    /*
     * clear() 前保存最終摘要
     */
    const finalSummary = {

        sourceRounds:
            analyzer.sourceCount,

        beadCells:
            analyzer.beadRoad.count,

        bigCells:
            analyzer.bigRoad.count,

        bigEyeCells:
            analyzer.bigEyeRoad.count,

        smallCells:
            analyzer.smallRoad.count,

        cockroachCells:
            analyzer.cockroachRoad.count,

        player:
            analyzer.winnerSummary.player,

        banker:
            analyzer.winnerSummary.banker,

        tie:
            analyzer.winnerSummary.tie,

        revision:
            analyzer.revision

    };


    /*
     * 測試 28：
     * clear()
     */
    restored.clear();

    assert(
        restored.isEmpty === true,
        "clear() 後應為空"
    );

    assert(
        restored.sourceCount === 0,
        "clear() 後 sourceCount 應為 0"
    );

    assert(
        restored.revision === 0,
        "clear() 後 revision 應為 0"
    );

    assert(
        restored.lastUpdatedAt === null,
        "clear() 後更新時間應為 null"
    );

    assert(
        restored.lastWinner === null,
        "clear() 後最後勝方應為 null"
    );

    assert(
        restored.beadRoad.count === 0,
        "clear() 後珠盤路應為空"
    );

    assert(
        restored.bigRoad.count === 0,
        "clear() 後大路應為空"
    );

    assert(
        restored.bigEyeRoad.count === 0,
        "clear() 後大眼仔應為空"
    );

    assert(
        restored.smallRoad.count === 0,
        "clear() 後小路應為空"
    );

    assert(
        restored.cockroachRoad.count === 0,
        "clear() 後曱甴路應為空"
    );

    assert(
        restored.validateConsistency()
            .valid === true,
        "清空後一致性仍應通過"
    );

    details.push(
        "clear()：PASS"
    );


    return [

        "Roadmap Analyzer 測試全部完成",

        "",

        ...details,

        "",

        "主要大路結構：",

        "[2, 1, 2, 2, 1]",

        "",

        "衍生路：",

        "Big Eye：Blue, Blue, Blue, Red, Red",

        "Small：Red, Red, Blue, Blue",

        "Cockroach：Red, Red",

        "",

        `來源總局數：${finalSummary.sourceRounds}`,

        `珠盤路格數：${finalSummary.beadCells}`,

        `大路格數：${finalSummary.bigCells}`,

        `大眼仔格數：${finalSummary.bigEyeCells}`,

        `小路格數：${finalSummary.smallCells}`,

        `曱甴路格數：${finalSummary.cockroachCells}`,

        "",

        `Player：${finalSummary.player}`,

        `Banker：${finalSummary.banker}`,

        `Tie：${finalSummary.tie}`,

        `Revision：${finalSummary.revision}`

    ].join("\n");

}
