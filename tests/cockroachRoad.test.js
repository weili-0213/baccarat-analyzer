/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Cockroach Road Test
 *
 * 曱甴路測試
 */

import CockroachRoad, {
    CockroachRoadColor
} from "../roadmap/cockroachRoad.js";

import BigRoad
    from "../roadmap/bigRoad.js";

import History
    from "../engine/history.js";

import Card
    from "../engine/card.js";

import Round
    from "../engine/round.js";


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
 * 建立大路來源資料
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
 * 將 streak 長度轉換成勝方序列
 *
 * 例如：
 *
 * [3, 2, 1]
 *
 * 轉成：
 *
 * Player × 3
 * Banker × 2
 * Player × 1
 */
function createWinnerSequence(
    streakLengths
) {

    const results = [];

    let winner = "Player";

    for (
        const length of
        streakLengths
    ) {

        if (
            !Number.isInteger(length) ||
            length < 1
        ) {

            throw new Error(
                "Streak length must be a positive integer."
            );

        }

        for (
            let index = 0;
            index < length;
            index++
        ) {

            results.push(
                resultEntry(winner)
            );

        }

        winner =
            winner === "Player"
                ? "Banker"
                : "Player";

    }

    return results;

}


/**
 * 依 streak 長度建立 BigRoad
 */
function createBigRoad(
    streakLengths
) {

    return new BigRoad()
        .build(
            createWinnerSequence(
                streakLengths
            )
        );

}


/**
 * 取得顏色序列
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
 * 驗證格子位置
 */
function assertPosition(
    road,
    index,
    expectedRow,
    expectedColumn,
    message
) {

    const current =
        road.get(index);

    assert(
        current !== null,
        `${message}：格子不存在`
    );

    assert(
        current.row === expectedRow,
        `${message}：row 應為 ${expectedRow}，實際為 ${current.row}`
    );

    assert(
        current.column === expectedColumn,
        `${message}：column 應為 ${expectedColumn}，實際為 ${current.column}`
    );

}


/**
 * 建立牌
 */
function card(
    rank,
    suit,
    deck = 1
) {

    return new Card(
        rank,
        suit,
        deck
    );

}


/**
 * 使用真實牌面建立 RoundResult
 */
function createRoundResult({

    playerCards,

    bankerCards

}) {

    const round =
        new Round();

    round.deal(
        "player",
        playerCards[0]
    );

    round.deal(
        "banker",
        bankerCards[0]
    );

    round.deal(
        "player",
        playerCards[1]
    );

    round.deal(
        "banker",
        bankerCards[1]
    );

    if (playerCards[2]) {

        round.deal(
            "player",
            playerCards[2]
        );

    }

    if (bankerCards[2]) {

        round.deal(
            "banker",
            bankerCards[2]
        );

    }

    return round.finish();

}


export default async function cockroachRoadTest() {

    const details = [];


    /*
     * 測試 1：
     * 初始狀態
     */
    const emptyRoad =
        new CockroachRoad();

    assert(
        emptyRoad.count === 0,
        "新曱甴路 count 應為 0"
    );

    assert(
        emptyRoad.isEmpty === true,
        "新曱甴路應為空"
    );

    assert(
        emptyRoad.columns === 0,
        "新曱甴路 columns 應為 0"
    );

    assert(
        emptyRoad.last === null,
        "新曱甴路 last 應為 null"
    );

    assert(
        emptyRoad.lastColor === null,
        "新曱甴路 lastColor 應為 null"
    );

    assert(
        emptyRoad.currentStreak === null,
        "新曱甴路不應有 streak"
    );

    assert(
        emptyRoad.sourceCellCount === 0,
        "初始 sourceCellCount 應為 0"
    );

    assert(
        emptyRoad.sourceRoundCount === 0,
        "初始 sourceRoundCount 應為 0"
    );

    details.push(
        "建立 CockroachRoad：PASS"
    );


    /*
     * 測試 2：
     * 前三條大路不產生曱甴路
     */
    const firstThreeRoad =
        new CockroachRoad();

    firstThreeRoad.build(
        createBigRoad([
            4,
            4,
            4
        ])
    );

    assert(
        firstThreeRoad.count === 0,
        "只有前三條大路時不應產生曱甴路"
    );

    details.push(
        "前三條大路不產生結果：PASS"
    );


    /*
     * 測試 3：
     * 第四條大路第二格開始
     *
     * 第一條長度：3
     * 第二條長度：1
     * 第三條長度：1
     * 第四條長度：3
     *
     * 第四條：
     *
     * depth 1 → 尚不產生
     * depth 2 → 與第一條比較，Red
     * depth 3 → 與第一條比較，Red
     */
    const fourthStreakRoad =
        new CockroachRoad();

    fourthStreakRoad.build(
        createBigRoad([
            3,
            1,
            1,
            3
        ])
    );

    assert(
        fourthStreakRoad.count === 2,
        "第四條第二、三格應產生兩個結果"
    );

    assertColors(
        fourthStreakRoad,
        [
            CockroachRoadColor.RED,
            CockroachRoadColor.RED
        ],
        "第四條延伸顏色不正確"
    );

    assert(
        fourthStreakRoad.get(0)
            .sourceStreakIndex === 3,
        "第一個結果應來自第四條 streak"
    );

    assert(
        fourthStreakRoad.get(0)
            .sourceDepth === 2,
        "第一個結果應來自第四條第二格"
    );

    details.push(
        "第四條第二格開始：PASS"
    );


    /*
     * 測試 4：
     * 第五條第一格開始
     *
     * streak 長度：
     *
     * 1, 1, 1, 1, 1
     *
     * 第五條第一格比較：
     *
     * 第四條長度 1
     * 第一條長度 1
     *
     * 結果 Red
     */
    const fifthStreakRoad =
        new CockroachRoad();

    fifthStreakRoad.build(
        createBigRoad([
            1,
            1,
            1,
            1,
            1
        ])
    );

    assert(
        fifthStreakRoad.count === 1,
        "第五條第一格應產生一個結果"
    );

    assertColors(
        fifthStreakRoad,
        [
            CockroachRoadColor.RED
        ],
        "第五條等長比較應產生 Red"
    );

    assert(
        fifthStreakRoad.get(0)
            .sourceStreakIndex === 4,
        "結果應來自第五條 streak"
    );

    assert(
        fifthStreakRoad.get(0)
            .sourceDepth === 1,
        "結果應來自第五條第一格"
    );

    details.push(
        "第五條第一格開始：PASS"
    );


    /*
     * 測試 5：
     * 間隔三條等長比較 → Red
     *
     * streak：
     *
     * 3, 2, 1, 3, 1
     *
     * 第四條 depth 2、3：
     * 與第一條長度 3 比較
     * → Red、Red
     *
     * 第五條第一格：
     * 比較第四條 3 與第一條 3
     * → Red
     */
    const equalLengthRoad =
        new CockroachRoad();

    equalLengthRoad.build(
        createBigRoad([
            3,
            2,
            1,
            3,
            1
        ])
    );

    assertColors(
        equalLengthRoad,
        [
            CockroachRoadColor.RED,
            CockroachRoadColor.RED,
            CockroachRoadColor.RED
        ],
        "間隔三條的等長比較應產生 Red"
    );

    details.push(
        "等長比較 Red：PASS"
    );


    /*
     * 測試 6：
     * 間隔三條不等長比較 → Blue
     *
     * streak：
     *
     * 3, 2, 1, 2, 1
     *
     * 第四條 depth 2：
     * 與第一條長度 3 比較
     * → Red
     *
     * 第五條第一格：
     * 比較第四條長度 2
     * 與第一條長度 3
     * → Blue
     */
    const unequalLengthRoad =
        new CockroachRoad();

    unequalLengthRoad.build(
        createBigRoad([
            3,
            2,
            1,
            2,
            1
        ])
    );

    assertColors(
        unequalLengthRoad,
        [
            CockroachRoadColor.RED,
            CockroachRoadColor.BLUE
        ],
        "間隔三條不等長比較應產生 Blue"
    );

    details.push(
        "不等長比較 Blue：PASS"
    );


    /*
     * 測試 7：
     * 同一 streak 延伸規則
     *
     * 第一條長度：2
     * 第二條長度：1
     * 第三條長度：1
     * 第四條長度：4
     *
     * 第四條與第一條比較：
     *
     * depth 2 <= 2
     * → Red
     *
     * depth 3 === 2 + 1
     * → Blue
     *
     * depth 4 > 2 + 1
     * → Red
     */
    const continuationRoad =
        new CockroachRoad();

    continuationRoad.build(
        createBigRoad([
            2,
            1,
            1,
            4
        ])
    );

    assertColors(
        continuationRoad,
        [
            CockroachRoadColor.RED,
            CockroachRoadColor.BLUE,
            CockroachRoadColor.RED
        ],
        "延伸規則應為 Red、Blue、Red"
    );

    assert(
        continuationRoad.get(0)
            .sourceDepth === 2,
        "第一格來源深度應為 2"
    );

    assert(
        continuationRoad.get(1)
            .sourceDepth === 3,
        "第二格來源深度應為 3"
    );

    assert(
        continuationRoad.get(2)
            .sourceDepth === 4,
        "第三格來源深度應為 4"
    );

    details.push(
        "延伸 Red／Blue／Red：PASS"
    );


    /*
     * 測試 8：
     * Tie 不直接產生曱甴路格
     *
     * 原始局序形成大路 streak：
     *
     * [2, 1, 1, 2, 1]
     *
     * Tie 不占大路格。
     *
     * 曱甴路：
     *
     * 第四條 depth 2 → Red
     * 第五條 depth 1 → Red
     */
    const tieSource = [

        resultEntry("Player"),
        resultEntry("Player"),

        resultEntry("Banker"),

        resultEntry("Player"),

        resultEntry("Banker"),
        resultEntry("Tie"),
        resultEntry("Banker"),

        resultEntry("Player")

    ];

    const tieBigRoad =
        new BigRoad()
            .build(tieSource);

    const tieCockroachRoad =
        new CockroachRoad()
            .build(tieBigRoad);

    assert(
        tieBigRoad.totalRounds === 8,
        "來源總局數應包含 Tie"
    );

    assert(
        tieBigRoad.count === 7,
        "Tie 不應增加大路格數"
    );

    assert(
        tieBigRoad.tieCount === 1,
        "來源大路應記錄一局 Tie"
    );

    assert(
        tieCockroachRoad.sourceRoundCount === 8,
        "曱甴路應保存包含 Tie 的來源局數"
    );

    assert(
        tieCockroachRoad.sourceCellCount === 7,
        "曱甴路來源格數應排除 Tie"
    );

    assert(
        tieCockroachRoad.count === 2,
        "此大路結構應產生兩個曱甴路格"
    );

    assertColors(
        tieCockroachRoad,
        [
            CockroachRoadColor.RED,
            CockroachRoadColor.RED
        ],
        "Tie 來源案例的顏色不正確"
    );

    /*
     * Tie 是原始局序 index 5。
     *
     * 衍生路來源不得直接指向 Tie。
     */
    assert(
        tieCockroachRoad.entries.every(
            item =>
                item.sourceRoundIndex !== 5
        ),
        "Tie 不應直接成為曱甴路格的來源"
    );

    details.push(
        "Tie 不直接產生結果：PASS"
    );


    /*
     * 測試 9：
     * addColor() 與同色向下排列
     */
    const colorRoad =
        new CockroachRoad();

    colorRoad.addColor(
        CockroachRoadColor.RED,
        {
            sourceIndex: 12,
            sourceRoundIndex: 15,
            sourceRow: 1,
            sourceColumn: 3,
            sourceBaseColumn: 3,
            sourceWinner: "Banker",
            sourceDepth: 2,
            sourceStreakIndex: 3
        }
    );

    colorRoad.addColor(
        CockroachRoadColor.RED
    );

    colorRoad.addColor(
        CockroachRoadColor.RED
    );

    assertPosition(
        colorRoad,
        0,
        0,
        0,
        "第一個 Red"
    );

    assertPosition(
        colorRoad,
        1,
        1,
        0,
        "第二個 Red"
    );

    assertPosition(
        colorRoad,
        2,
        2,
        0,
        "第三個 Red"
    );

    assert(
        colorRoad.get(0)
            .sourceIndex === 12,
        "sourceIndex 應被保存"
    );

    assert(
        colorRoad.get(0)
            .sourceRoundIndex === 15,
        "sourceRoundIndex 應被保存"
    );

    assert(
        colorRoad.get(0)
            .sourceWinner === "Banker",
        "sourceWinner 應被保存"
    );

    assert(
        colorRoad.get(0)
            .sourceStreakIndex === 3,
        "sourceStreakIndex 應被保存"
    );

    details.push(
        "addColor() 與向下排列：PASS"
    );


    /*
     * 測試 10：
     * 顏色改變後換欄
     *
     * R R B B R
     *
     * Row 0：R | B | R
     * Row 1：R | B
     */
    const colorChangeRoad =
        new CockroachRoad();

    colorChangeRoad.addColor("Red");
    colorChangeRoad.addColor("Red");
    colorChangeRoad.addColor("Blue");
    colorChangeRoad.addColor("Blue");
    colorChangeRoad.addColor("Red");

    assertPosition(
        colorChangeRoad,
        0,
        0,
        0,
        "第一個 Red"
    );

    assertPosition(
        colorChangeRoad,
        1,
        1,
        0,
        "第二個 Red"
    );

    assertPosition(
        colorChangeRoad,
        2,
        0,
        1,
        "第一個 Blue"
    );

    assertPosition(
        colorChangeRoad,
        3,
        1,
        1,
        "第二個 Blue"
    );

    assertPosition(
        colorChangeRoad,
        4,
        0,
        2,
        "下一個 Red"
    );

    assert(
        colorChangeRoad.columns === 3,
        "顏色切換後應使用三欄"
    );

    details.push(
        "顏色改變換欄：PASS"
    );


    /*
     * 測試 11：
     * 六列到底後向右
     */
    const bottomRoad =
        new CockroachRoad();

    for (
        let index = 0;
        index < 7;
        index++
    ) {

        bottomRoad.addColor(
            CockroachRoadColor.RED
        );

    }

    for (
        let index = 0;
        index < 6;
        index++
    ) {

        assertPosition(
            bottomRoad,
            index,
            index,
            0,
            `第 ${index + 1} 個 Red`
        );

    }

    assertPosition(
        bottomRoad,
        6,
        5,
        1,
        "第七個 Red 到底後右移"
    );

    assert(
        bottomRoad.currentStreak.color ===
            CockroachRoadColor.RED,
        "目前 streak 應為 Red"
    );

    assert(
        bottomRoad.currentStreak.count === 7,
        "目前 Red streak 應為 7"
    );

    details.push(
        "到底後向右：PASS"
    );


    /*
     * 測試 12：
     * 碰撞後向右
     *
     * 先建立七個 Red，
     * 再建立六個 Blue。
     *
     * 第六個 Blue 原本要進入 (5,1)，
     * 但該位置已有 Red，
     * 因此移到 (4,2)。
     */
    const collisionRoad =
        new CockroachRoad();

    for (
        let index = 0;
        index < 7;
        index++
    ) {

        collisionRoad.addColor("Red");

    }

    for (
        let index = 0;
        index < 6;
        index++
    ) {

        collisionRoad.addColor("Blue");

    }

    assertPosition(
        collisionRoad,
        7,
        0,
        1,
        "第一個 Blue"
    );

    assertPosition(
        collisionRoad,
        11,
        4,
        1,
        "第五個 Blue"
    );

    assertPosition(
        collisionRoad,
        12,
        4,
        2,
        "第六個 Blue 碰撞後右移"
    );

    assert(
        collisionRoad.getCell(
            5,
            1
        ).color === "Red",
        "(5,1) 應保留原本的 Red"
    );

    assert(
        collisionRoad.getCell(
            4,
            2
        ).color === "Blue",
        "(4,2) 應為右移後的 Blue"
    );

    details.push(
        "碰撞後向右：PASS"
    );


    /*
     * 測試 13：
     * 位置查詢
     */
    assert(
        colorChangeRoad.hasCell(
            0,
            0
        ) === true,
        "(0,0) 應有格子"
    );

    assert(
        colorChangeRoad.hasCell(
            5,
            5
        ) === false,
        "(5,5) 應無格子"
    );

    assert(
        colorChangeRoad.getCell(
            0,
            1
        ).color === "Blue",
        "(0,1) 應為 Blue"
    );

    assert(
        colorChangeRoad.getCell(
            -1,
            0
        ) === null,
        "非法 row 應回傳 null"
    );

    assert(
        colorChangeRoad.getCell(
            6,
            0
        ) === null,
        "超出 rows 應回傳 null"
    );

    assert(
        colorChangeRoad.getCell(
            0,
            -1
        ) === null,
        "非法 column 應回傳 null"
    );

    const firstColumn =
        colorChangeRoad.getColumn(0);

    assert(
        firstColumn.length === 6,
        "getColumn() 應回傳六列"
    );

    assert(
        firstColumn[0].color === "Red",
        "第一欄第一格應為 Red"
    );

    assert(
        firstColumn[2] === null,
        "第一欄第三列應為空"
    );

    assert(
        colorChangeRoad
            .getColumn(-1)
            .length === 0,
        "非法欄位應回傳空陣列"
    );

    details.push(
        "位置查詢：PASS"
    );


    /*
     * 測試 14：
     * toMatrix() 應回傳副本
     */
    const matrix =
        colorChangeRoad.toMatrix();

    assert(
        matrix.length === 6,
        "矩陣應有六列"
    );

    assert(
        matrix[0].length === 3,
        "矩陣應有三欄"
    );

    assert(
        matrix[0][0].color === "Red",
        "matrix[0][0] 應為 Red"
    );

    assert(
        matrix[0][1].color === "Blue",
        "matrix[0][1] 應為 Blue"
    );

    assert(
        matrix[0][2].color === "Red",
        "matrix[0][2] 應為 Red"
    );

    assert(
        matrix[0][0] !==
            colorChangeRoad.get(0),
        "矩陣格子應為副本"
    );

    const originalColor =
        colorChangeRoad.get(0)
            .color;

    matrix[0][0].color =
        originalColor === "Red"
            ? "Blue"
            : "Red";

    assert(
        colorChangeRoad.get(0)
            .color === originalColor,
        "修改矩陣不應影響原始資料"
    );

    details.push(
        "toMatrix()：PASS"
    );


    /*
     * 測試 15：
     * 顏色統計與摘要
     */
    const summaryRoad =
        new CockroachRoad();

    summaryRoad.addColor("Red");
    summaryRoad.addColor("Red");
    summaryRoad.addColor("Blue");
    summaryRoad.addColor("Red");

    summaryRoad.sourceCellCount =
        20;

    summaryRoad.sourceRoundCount =
        24;

    assert(
        summaryRoad.redCount === 3,
        "Red 次數應為 3"
    );

    assert(
        summaryRoad.blueCount === 1,
        "Blue 次數應為 1"
    );

    const summary =
        summaryRoad.summary;

    assert(
        summary.cells === 4,
        "summary.cells 應為 4"
    );

    assert(
        summary.rows === 6,
        "summary.rows 應為 6"
    );

    assert(
        summary.columns === 3,
        "summary.columns 應為 3"
    );

    assert(
        summary.red === 3,
        "summary.red 應為 3"
    );

    assert(
        summary.blue === 1,
        "summary.blue 應為 1"
    );

    assert(
        summary.sourceCells === 20,
        "summary.sourceCells 應為 20"
    );

    assert(
        summary.sourceRounds === 24,
        "summary.sourceRounds 應為 24"
    );

    assert(
        summary.comparisonGap === 3,
        "Cockroach Road comparisonGap 應為 3"
    );

    assert(
        summary.currentStreak.color ===
            "Red",
        "目前 streak 應為 Red"
    );

    assert(
        summary.currentStreak.count === 1,
        "最後 Red streak 應為 1"
    );

    details.push(
        "統計摘要：PASS"
    );


    /*
     * 測試 16：
     * 從陣列 build()
     */
    const arrayRoad =
        new CockroachRoad();

    arrayRoad.build(
        createWinnerSequence([
            3,
            2,
            1,
            2,
            1
        ])
    );

    assertColors(
        arrayRoad,
        [
            "Red",
            "Blue"
        ],
        "陣列 build() 顏色錯誤"
    );

    assert(
        arrayRoad.sourceCellCount === 9,
        "陣列來源應建立九個大路格"
    );

    assert(
        arrayRoad.sourceRoundCount === 9,
        "陣列來源總局數應為 9"
    );

    details.push(
        "陣列 build()：PASS"
    );


    /*
     * 測試 17：
     * 直接從 BigRoad build()
     */
    const sourceBigRoad =
        createBigRoad([
            2,
            1,
            1,
            4
        ]);

    const fromBigRoad =
        new CockroachRoad();

    fromBigRoad.build(
        sourceBigRoad
    );

    assertColors(
        fromBigRoad,
        [
            "Red",
            "Blue",
            "Red"
        ],
        "BigRoad build() 顏色錯誤"
    );

    assert(
        fromBigRoad.sourceCellCount ===
            sourceBigRoad.count,
        "sourceCellCount 應與 BigRoad 一致"
    );

    assert(
        fromBigRoad.sourceRoundCount ===
            sourceBigRoad.totalRounds,
        "sourceRoundCount 應與 BigRoad 一致"
    );

    details.push(
        "BigRoad build()：PASS"
    );


    /*
     * 測試 18：
     * 從真實 History v5 build()
     *
     * streak：
     *
     * Player × 2
     * Banker × 1
     * Player × 1
     * Banker × 2
     * Player × 1
     *
     * 曱甴路：
     *
     * 第四條 depth 2 與第一條比較 → Red
     * 第五條第一格比較第四條與第一條 → Red
     */
    const history =
        new History();

    const results = [

        createRoundResult({
            playerCards: [
                card("4", "S", 1),
                card("5", "D", 1)
            ],
            bankerCards: [
                card("2", "H", 1),
                card("3", "C", 1)
            ]
        }),

        createRoundResult({
            playerCards: [
                card("3", "S", 2),
                card("4", "D", 2)
            ],
            bankerCards: [
                card("A", "H", 2),
                card("2", "C", 2)
            ]
        }),

        createRoundResult({
            playerCards: [
                card("A", "S", 3),
                card("3", "D", 3)
            ],
            bankerCards: [
                card("2", "H", 3),
                card("4", "C", 3)
            ]
        }),

        createRoundResult({
            playerCards: [
                card("4", "S", 4),
                card("5", "D", 4)
            ],
            bankerCards: [
                card("A", "H", 4),
                card("2", "C", 4)
            ]
        }),

        createRoundResult({
            playerCards: [
                card("2", "S", 5),
                card("3", "D", 5)
            ],
            bankerCards: [
                card("4", "H", 5),
                card("3", "C", 5)
            ]
        }),

        createRoundResult({
            playerCards: [
                card("A", "S", 6),
                card("3", "D", 6)
            ],
            bankerCards: [
                card("2", "H", 6),
                card("4", "C", 6)
            ]
        }),

        createRoundResult({
            playerCards: [
                card("4", "S", 7),
                card("5", "D", 7)
            ],
            bankerCards: [
                card("A", "H", 7),
                card("2", "C", 7)
            ]
        })

    ];

    for (const result of results) {

        history.add(result);

    }

    const historyRoad =
        new CockroachRoad();

    historyRoad.build(
        history
    );

    assertColors(
        historyRoad,
        [
            "Red",
            "Red"
        ],
        "History build() 顏色錯誤"
    );

    assert(
        historyRoad.sourceRoundCount === 7,
        "History 來源局數應為 7"
    );

    assert(
        historyRoad.sourceCellCount === 7,
        "History 來源大路格數應為 7"
    );

    details.push(
        "History build()：PASS"
    );


    /*
     * 測試 19：
     * 非法 build() 不應清除原資料
     */
    const safeRoad =
        new CockroachRoad();

    safeRoad.build(
        createBigRoad([
            3,
            2,
            1,
            2,
            1
        ])
    );

    const beforeInvalidBuild = {

        count:
            safeRoad.count,

        lastColor:
            safeRoad.lastColor,

        sourceCells:
            safeRoad.sourceCellCount,

        sourceRounds:
            safeRoad.sourceRoundCount

    };

    assertThrows(
        () => {

            safeRoad.build({});

        },
        "不支援來源應丟出錯誤"
    );

    assert(
        safeRoad.count ===
            beforeInvalidBuild.count,
        "非法 build() 不應清除格子"
    );

    assert(
        safeRoad.lastColor ===
            beforeInvalidBuild.lastColor,
        "非法 build() 不應改變最後顏色"
    );

    assert(
        safeRoad.sourceCellCount ===
            beforeInvalidBuild.sourceCells,
        "非法 build() 不應改變來源格數"
    );

    assert(
        safeRoad.sourceRoundCount ===
            beforeInvalidBuild.sourceRounds,
        "非法 build() 不應改變來源局數"
    );

    assertThrows(
        () => {

            safeRoad.build([
                resultEntry("Player"),
                resultEntry("Unknown")
            ]);

        },
        "非法 winner 應丟出錯誤"
    );

    assert(
        safeRoad.count ===
            beforeInvalidBuild.count,
        "非法陣列不應改變曱甴路資料"
    );

    details.push(
        "安全 build()：PASS"
    );


    /*
     * 測試 20：
     * JSON 還原
     */
    const jsonRoad =
        new CockroachRoad();

    jsonRoad.sourceCellCount =
        28;

    jsonRoad.sourceRoundCount =
        32;

    jsonRoad.addColor(
        "Red",
        {
            sourceIndex: 8,
            sourceRoundIndex: 10,
            sourceRow: 1,
            sourceColumn: 3,
            sourceBaseColumn: 3,
            sourceWinner: "Banker",
            sourceDepth: 2,
            sourceStreakIndex: 3
        }
    );

    jsonRoad.addColor(
        "Red",
        {
            sourceIndex: 9,
            sourceRoundIndex: 11,
            sourceRow: 2,
            sourceColumn: 3,
            sourceBaseColumn: 3,
            sourceWinner: "Banker",
            sourceDepth: 3,
            sourceStreakIndex: 3
        }
    );

    jsonRoad.addColor(
        "Blue",
        {
            sourceIndex: 10,
            sourceRoundIndex: 12,
            sourceRow: 0,
            sourceColumn: 4,
            sourceBaseColumn: 4,
            sourceWinner: "Player",
            sourceDepth: 1,
            sourceStreakIndex: 4
        }
    );

    const json =
        jsonRoad.toJSON();

    assert(
        json.rows === 6,
        "JSON rows 應為 6"
    );

    assert(
        json.comparisonGap === 3,
        "JSON comparisonGap 應為 3"
    );

    assert(
        json.sourceCellCount === 28,
        "JSON sourceCellCount 應為 28"
    );

    assert(
        json.sourceRoundCount === 32,
        "JSON sourceRoundCount 應為 32"
    );

    assert(
        json.entries.length === 3,
        "JSON entries 應有三筆"
    );

    const restored =
        CockroachRoad.fromJSON(
            json
        );

    assert(
        restored instanceof CockroachRoad,
        "fromJSON() 應回傳 CockroachRoad"
    );

    assert(
        restored.count === 3,
        "JSON 還原後 count 應為 3"
    );

    assert(
        restored.sourceCellCount === 28,
        "還原 sourceCellCount 應為 28"
    );

    assert(
        restored.sourceRoundCount === 32,
        "還原 sourceRoundCount 應為 32"
    );

    assertColors(
        restored,
        [
            "Red",
            "Red",
            "Blue"
        ],
        "JSON 還原顏色順序錯誤"
    );

    for (
        let index = 0;
        index < jsonRoad.count;
        index++
    ) {

        const original =
            jsonRoad.get(index);

        const restoredEntry =
            restored.get(index);

        assert(
            restoredEntry.row ===
                original.row,
            `JSON 第 ${index} 格 row 應一致`
        );

        assert(
            restoredEntry.column ===
                original.column,
            `JSON 第 ${index} 格 column 應一致`
        );

        assert(
            restoredEntry.color ===
                original.color,
            `JSON 第 ${index} 格 color 應一致`
        );

        assert(
            restoredEntry.sourceIndex ===
                original.sourceIndex,
            `JSON 第 ${index} 格 sourceIndex 應一致`
        );

        assert(
            restoredEntry.sourceDepth ===
                original.sourceDepth,
            `JSON 第 ${index} 格 sourceDepth 應一致`
        );

        assert(
            restoredEntry.sourceStreakIndex ===
                original.sourceStreakIndex,
            `JSON 第 ${index} 格 streakIndex 應一致`
        );

    }

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 21：
     * 自訂 rows
     */
    const fourRowRoad =
        new CockroachRoad({
            rows: 4
        });

    for (
        let index = 0;
        index < 5;
        index++
    ) {

        fourRowRoad.addColor(
            "Blue"
        );

    }

    assertPosition(
        fourRowRoad,
        0,
        0,
        0,
        "四列第一格"
    );

    assertPosition(
        fourRowRoad,
        3,
        3,
        0,
        "四列第四格"
    );

    assertPosition(
        fourRowRoad,
        4,
        3,
        1,
        "四列第五格應向右"
    );

    assert(
        fourRowRoad.columns === 2,
        "四列五格應使用兩欄"
    );

    details.push(
        "自訂 rows：PASS"
    );


    /*
     * 測試 22：
     * 非法資料驗證
     */
    const invalidRoad =
        new CockroachRoad();

    assertThrows(
        () => {

            new CockroachRoad({
                rows: 0
            });

        },
        "rows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            invalidRoad.addColor(
                "Unknown"
            );

        },
        "非法顏色應丟出錯誤"
    );

    assertThrows(
        () => {

            invalidRoad.build(null);

        },
        "build(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            CockroachRoad.fromJSON(null);

        },
        "fromJSON(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            CockroachRoad.fromJSON({
                rows: 6
            });

        },
        "缺少 entries 應丟出錯誤"
    );

    assertThrows(
        () => {

            CockroachRoad.fromJSON({
                rows: 6,
                entries: [
                    {
                        color: "Unknown"
                    }
                ]
            });

        },
        "JSON 非法顏色應丟出錯誤"
    );

    details.push(
        "非法資料驗證：PASS"
    );


    /*
     * clear() 前保存摘要
     */
    const finalSummary = {

        ...summaryRoad.summary,

        currentStreak:
            summaryRoad.currentStreak
                ? {
                    ...summaryRoad.currentStreak
                }
                : null

    };


    /*
     * 測試 23：
     * clear()
     */
    restored.clear();

    assert(
        restored.count === 0,
        "clear() 後 count 應為 0"
    );

    assert(
        restored.isEmpty === true,
        "clear() 後應為空"
    );

    assert(
        restored.columns === 0,
        "clear() 後 columns 應為 0"
    );

    assert(
        restored.last === null,
        "clear() 後 last 應為 null"
    );

    assert(
        restored.lastColor === null,
        "clear() 後 lastColor 應為 null"
    );

    assert(
        restored.currentStreak === null,
        "clear() 後 currentStreak 應為 null"
    );

    assert(
        restored.sourceCellCount === 0,
        "clear() 後 sourceCellCount 應為 0"
    );

    assert(
        restored.sourceRoundCount === 0,
        "clear() 後 sourceRoundCount 應為 0"
    );

    details.push(
        "clear()：PASS"
    );


    return [

        "Cockroach Road 測試全部完成",

        "",

        ...details,

        "",

        "主要規則案例：",

        "[3, 2, 1, 3, 1] → Red, Red, Red",

        "[3, 2, 1, 2, 1] → Red, Blue",

        "[2, 1, 1, 4] → Red, Blue, Red",

        "",

        "紅藍排列案例：",

        "Row 0：Red | Blue | Red",

        "Row 1：Red | Blue | 空",

        "",

        `摘要格數：${finalSummary.cells}`,

        `欄數：${finalSummary.columns}`,

        `Red：${finalSummary.red}`,

        `Blue：${finalSummary.blue}`,

        `比較間隔：${finalSummary.comparisonGap}`,

        `來源大路格數：${finalSummary.sourceCells}`,

        `來源總局數：${finalSummary.sourceRounds}`,

        `目前連續：${finalSummary.currentStreak?.color ?? "無"} ${finalSummary.currentStreak?.count ?? 0}`

    ].join("\n");

}
