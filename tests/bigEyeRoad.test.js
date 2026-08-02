/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Big Eye Road Test
 *
 * 大眼仔路測試
 */

import BigEyeRoad, {
    DerivedRoadColor
} from "../roadmap/bigEyeRoad.js";

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
 * 驗證函式必須丟出錯誤
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
 * 將 streak 長度轉成 Player／Banker 序列
 *
 * 例如：
 *
 * [3, 2, 1]
 *
 * 轉成：
 *
 * Player Player Player
 * Banker Banker
 * Player
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
 * 建立 BigRoad
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
 * 取得衍生路顏色序列
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


export default async function bigEyeRoadTest() {

    const details = [];


    /*
     * 測試 1：
     * 初始狀態
     */
    const emptyRoad =
        new BigEyeRoad();

    assert(
        emptyRoad.count === 0,
        "新大眼仔路 count 應為 0"
    );

    assert(
        emptyRoad.isEmpty === true,
        "新大眼仔路應為空"
    );

    assert(
        emptyRoad.columns === 0,
        "新大眼仔路 columns 應為 0"
    );

    assert(
        emptyRoad.last === null,
        "新大眼仔路 last 應為 null"
    );

    assert(
        emptyRoad.lastColor === null,
        "新大眼仔路 lastColor 應為 null"
    );

    assert(
        emptyRoad.currentStreak === null,
        "新大眼仔路不應有 streak"
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
        "建立 BigEyeRoad：PASS"
    );


    /*
     * 測試 2：
     * 第一條大路不產生大眼仔。
     */
    const firstStreakRoad =
        new BigEyeRoad();

    firstStreakRoad.build(
        createBigRoad([5])
    );

    assert(
        firstStreakRoad.count === 0,
        "只有第一條大路時不應產生大眼仔"
    );

    details.push(
        "第一條大路不產生結果：PASS"
    );


    /*
     * 測試 3：
     * 第二條大路第二格開始。
     *
     * 大路 streak：
     *
     * 第一條長度 3
     * 第二條長度 3
     *
     * 第二條：
     * depth 1 → 尚不產生
     * depth 2 → Red
     * depth 3 → Red
     */
    const secondColumnRoad =
        new BigEyeRoad();

    secondColumnRoad.build(
        createBigRoad([
            3,
            3
        ])
    );

    assert(
        secondColumnRoad.count === 2,
        "第二條 streak 的第二、三格應產生兩個結果"
    );

    assertColors(
        secondColumnRoad,
        [
            DerivedRoadColor.RED,
            DerivedRoadColor.RED
        ],
        "第二條 streak 的延伸結果不正確"
    );

    assert(
        secondColumnRoad.get(0)
            .sourceStreakIndex === 1,
        "第一個結果應來自第二條 streak"
    );

    assert(
        secondColumnRoad.get(0)
            .sourceDepth === 2,
        "第一個結果應來自第二格"
    );

    details.push(
        "第二條第二格開始：PASS"
    );


    /*
     * 測試 4：
     * 第三條第一格開始。
     *
     * streak 長度：
     * 1, 1, 1
     *
     * 第三條第一格比較前兩條：
     * 1 === 1 → Red
     */
    const thirdColumnRoad =
        new BigEyeRoad();

    thirdColumnRoad.build(
        createBigRoad([
            1,
            1,
            1
        ])
    );

    assert(
        thirdColumnRoad.count === 1,
        "第三條第一格應產生一個大眼仔結果"
    );

    assertColors(
        thirdColumnRoad,
        [
            DerivedRoadColor.RED
        ],
        "等長 streak 應產生 Red"
    );

    assert(
        thirdColumnRoad.get(0)
            .sourceStreakIndex === 2,
        "結果應來自第三條 streak"
    );

    assert(
        thirdColumnRoad.get(0)
            .sourceDepth === 1,
        "結果應來自第三條第一格"
    );

    details.push(
        "第三條第一格開始：PASS"
    );


    /*
     * 測試 5：
     * 新 streak 比較等長 → Red。
     *
     * streak：
     * 3, 3, 1
     *
     * 第三條第一格比較：
     * 第二條 3
     * 第一條 3
     *
     * 結果 Red。
     */
    const equalLengthRoad =
        new BigEyeRoad();

    equalLengthRoad.build(
        createBigRoad([
            3,
            3,
            1
        ])
    );

    assertColors(
        equalLengthRoad,
        [
            DerivedRoadColor.RED,
            DerivedRoadColor.RED,
            DerivedRoadColor.RED
        ],
        "等長欄比較應產生 Red"
    );

    assert(
        equalLengthRoad.lastColor ===
            DerivedRoadColor.RED,
        "最後顏色應為 Red"
    );

    details.push(
        "等長比較 Red：PASS"
    );


    /*
     * 測試 6：
     * 新 streak 比較不等長 → Blue。
     *
     * streak：
     * 3, 2, 1
     *
     * 第二條 depth 2：
     * 2 <= 3 → Red
     *
     * 第三條 depth 1：
     * 第二條長度 2 !== 第一條長度 3
     * → Blue
     */
    const unequalLengthRoad =
        new BigEyeRoad();

    unequalLengthRoad.build(
        createBigRoad([
            3,
            2,
            1
        ])
    );

    assertColors(
        unequalLengthRoad,
        [
            DerivedRoadColor.RED,
            DerivedRoadColor.BLUE
        ],
        "不等長欄比較應產生 Blue"
    );

    details.push(
        "不等長比較 Blue：PASS"
    );


    /*
     * 測試 7：
     * 同一 streak 延伸規則。
     *
     * streak：
     * 第一條長度 2
     * 第二條長度 4
     *
     * 第二條：
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
        new BigEyeRoad();

    continuationRoad.build(
        createBigRoad([
            2,
            4
        ])
    );

    assertColors(
        continuationRoad,
        [
            DerivedRoadColor.RED,
            DerivedRoadColor.BLUE,
            DerivedRoadColor.RED
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
     * Tie 不應建立新的大路格，
     * 因此也不應直接產生大眼仔格。
     */
    const tieSource = [

        resultEntry("Player"),

        resultEntry("Player"),

        resultEntry("Player"),

        resultEntry("Tie"),

        resultEntry("Banker"),

        resultEntry("Banker")

    ];

    const tieBigRoad =
        new BigRoad()
            .build(tieSource);

    const tieDerivedRoad =
        new BigEyeRoad()
            .build(tieBigRoad);

    assert(
        tieBigRoad.totalRounds === 6,
        "來源大路總局數應包含 Tie"
    );

    assert(
        tieBigRoad.count === 5,
        "Tie 不應增加大路格數"
    );

    assert(
        tieDerivedRoad.sourceRoundCount === 6,
        "大眼仔應保存包含 Tie 的來源局數"
    );

    assert(
        tieDerivedRoad.sourceCellCount === 5,
        "大眼仔來源格數應排除 Tie"
    );

    assert(
        tieDerivedRoad.count === 1,
        "Tie 不應直接產生大眼仔格"
    );

    details.push(
        "Tie 不直接產生結果：PASS"
    );


    /*
     * 測試 9：
     * 直接 addColor() 與紅色向下排列。
     */
    const colorRoad =
        new BigEyeRoad();

    colorRoad.addColor(
        DerivedRoadColor.RED,
        {
            sourceIndex: 10,
            sourceRoundIndex: 12,
            sourceRow: 1,
            sourceColumn: 2,
            sourceBaseColumn: 2,
            sourceWinner: "Player",
            sourceDepth: 2,
            sourceStreakIndex: 2
        }
    );

    colorRoad.addColor(
        DerivedRoadColor.RED
    );

    colorRoad.addColor(
        DerivedRoadColor.RED
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
            .sourceIndex === 10,
        "sourceIndex 應被保存"
    );

    assert(
        colorRoad.get(0)
            .sourceRoundIndex === 12,
        "sourceRoundIndex 應被保存"
    );

    assert(
        colorRoad.get(0)
            .sourceWinner === "Player",
        "sourceWinner 應被保存"
    );

    details.push(
        "addColor() 與向下排列：PASS"
    );


    /*
     * 測試 10：
     * 顏色改變後換欄。
     *
     * R R B B R
     *
     * Row 0：R | B | R
     * Row 1：R | B
     */
    const colorChangeRoad =
        new BigEyeRoad();

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
     * 六列到底後向右。
     */
    const bottomRoad =
        new BigEyeRoad();

    for (
        let index = 0;
        index < 7;
        index++
    ) {

        bottomRoad.addColor(
            DerivedRoadColor.RED
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
        "第七個 Red 到底右移"
    );

    assert(
        bottomRoad.currentStreak.color ===
            DerivedRoadColor.RED,
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
     * 下方碰撞後向右。
     *
     * 先建立七個 Red，
     * 再建立六個 Blue。
     *
     * 第六個 Blue 原本要進入 (5,1)，
     * 但該位置已有 Red，
     * 因此移到 (4,2)。
     */
    const collisionRoad =
        new BigEyeRoad();

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
     * 位置查詢。
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
     * toMatrix() 應回傳副本。
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
        "Blue";

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
     * 顏色統計與摘要。
     */
    const summaryRoad =
        new BigEyeRoad();

    summaryRoad.addColor("Red");
    summaryRoad.addColor("Red");
    summaryRoad.addColor("Blue");
    summaryRoad.addColor("Red");

    summaryRoad.sourceCellCount =
        12;

    summaryRoad.sourceRoundCount =
        14;

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
        summary.sourceCells === 12,
        "summary.sourceCells 應為 12"
    );

    assert(
        summary.sourceRounds === 14,
        "summary.sourceRounds 應為 14"
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
     * 從陣列 build()。
     */
    const arrayRoad =
        new BigEyeRoad();

    arrayRoad.build(
        createWinnerSequence([
            3,
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
        arrayRoad.sourceCellCount === 6,
        "陣列來源應建立六個大路格"
    );

    assert(
        arrayRoad.sourceRoundCount === 6,
        "陣列來源總局數應為 6"
    );

    details.push(
        "陣列 build()：PASS"
    );


    /*
     * 測試 17：
     * 直接從 BigRoad build()。
     */
    const sourceBigRoad =
        createBigRoad([
            2,
            4
        ]);

    const fromBigRoad =
        new BigEyeRoad();

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
     * 從真實 History v5 build()。
     *
     * 建立 streak：
     * Player × 2
     * Banker × 2
     * Player × 1
     *
     * 預期：
     * 第二條 depth 2 → Red
     * 第三條第一格比較 2 與 2 → Red
     */
    const history =
        new History();

    const playerResult1 =
        createRoundResult({

            playerCards: [
                card("4", "S", 1),
                card("5", "D", 1)
            ],

            bankerCards: [
                card("2", "H", 1),
                card("3", "C", 1)
            ]

        });

    const playerResult2 =
        createRoundResult({

            playerCards: [
                card("3", "S", 2),
                card("4", "D", 2)
            ],

            bankerCards: [
                card("A", "H", 2),
                card("2", "C", 2)
            ]

        });

    const bankerResult1 =
        createRoundResult({

            playerCards: [
                card("A", "S", 3),
                card("3", "D", 3)
            ],

            bankerCards: [
                card("2", "H", 3),
                card("4", "C", 3)
            ]

        });

    const bankerResult2 =
        createRoundResult({

            playerCards: [
                card("2", "S", 4),
                card("3", "D", 4)
            ],

            bankerCards: [
                card("4", "H", 4),
                card("3", "C", 4)
            ]

        });

    const playerResult3 =
        createRoundResult({

            playerCards: [
                card("4", "S", 5),
                card("5", "D", 5)
            ],

            bankerCards: [
                card("A", "H", 5),
                card("2", "C", 5)
            ]

        });

    history
        .add(playerResult1)
        .add(playerResult2)
        .add(bankerResult1)
        .add(bankerResult2)
        .add(playerResult3);

    const historyRoad =
        new BigEyeRoad();

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
        historyRoad.sourceRoundCount === 5,
        "History 來源局數應為 5"
    );

    assert(
        historyRoad.sourceCellCount === 5,
        "History 來源大路格數應為 5"
    );

    details.push(
        "History build()：PASS"
    );


    /*
     * 測試 19：
     * 非法 build() 不應清除現有資料。
     */
    const safeRoad =
        new BigEyeRoad();

    safeRoad.build(
        createBigRoad([
            3,
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
        "非法陣列不應改變大眼仔資料"
    );

    details.push(
        "安全 build()：PASS"
    );


    /*
     * 測試 20：
     * JSON 還原。
     */
    const jsonRoad =
        new BigEyeRoad();

    jsonRoad.sourceCellCount =
        20;

    jsonRoad.sourceRoundCount =
        23;

    jsonRoad.addColor(
        "Red",
        {
            sourceIndex: 4,
            sourceRoundIndex: 5,
            sourceRow: 1,
            sourceColumn: 1,
            sourceBaseColumn: 1,
            sourceWinner: "Banker",
            sourceDepth: 2,
            sourceStreakIndex: 1
        }
    );

    jsonRoad.addColor(
        "Red",
        {
            sourceIndex: 5,
            sourceRoundIndex: 6,
            sourceRow: 2,
            sourceColumn: 1,
            sourceBaseColumn: 1,
            sourceWinner: "Banker",
            sourceDepth: 3,
            sourceStreakIndex: 1
        }
    );

    jsonRoad.addColor(
        "Blue",
        {
            sourceIndex: 6,
            sourceRoundIndex: 7,
            sourceRow: 0,
            sourceColumn: 2,
            sourceBaseColumn: 2,
            sourceWinner: "Player",
            sourceDepth: 1,
            sourceStreakIndex: 2
        }
    );

    const json =
        jsonRoad.toJSON();

    assert(
        json.rows === 6,
        "JSON rows 應為 6"
    );

    assert(
        json.sourceCellCount === 20,
        "JSON sourceCellCount 應為 20"
    );

    assert(
        json.sourceRoundCount === 23,
        "JSON sourceRoundCount 應為 23"
    );

    assert(
        json.entries.length === 3,
        "JSON entries 應有三筆"
    );

    const restored =
        BigEyeRoad.fromJSON(
            json
        );

    assert(
        restored instanceof BigEyeRoad,
        "fromJSON() 應回傳 BigEyeRoad"
    );

    assert(
        restored.count === 3,
        "JSON 還原後 count 應為 3"
    );

    assert(
        restored.sourceCellCount === 20,
        "還原 sourceCellCount 應為 20"
    );

    assert(
        restored.sourceRoundCount === 23,
        "還原 sourceRoundCount 應為 23"
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
            `JSON 還原第 ${index} 格 row 應一致`
        );

        assert(
            restoredEntry.column ===
                original.column,
            `JSON 還原第 ${index} 格 column 應一致`
        );

        assert(
            restoredEntry.color ===
                original.color,
            `JSON 還原第 ${index} 格 color 應一致`
        );

        assert(
            restoredEntry.sourceIndex ===
                original.sourceIndex,
            `JSON 還原第 ${index} 格來源 index 應一致`
        );

        assert(
            restoredEntry.sourceDepth ===
                original.sourceDepth,
            `JSON 還原第 ${index} 格來源深度應一致`
        );

    }

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 21：
     * 自訂 rows。
     */
    const fourRowRoad =
        new BigEyeRoad({
            rows: 4
        });

    for (
        let index = 0;
        index < 5;
        index++
    ) {

        fourRowRoad.addColor("Blue");

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
     * 非法資料驗證。
     */
    const invalidRoad =
        new BigEyeRoad();

    assertThrows(
        () => {

            new BigEyeRoad({
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

            BigEyeRoad.fromJSON(null);

        },
        "fromJSON(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            BigEyeRoad.fromJSON({
                rows: 6
            });

        },
        "缺少 entries 應丟出錯誤"
    );

    assertThrows(
        () => {

            BigEyeRoad.fromJSON({
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
     * clear() 前保存摘要。
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

        "Big Eye Road 測試全部完成",

        "",

        ...details,

        "",

        "主要規則案例：",

        "[3, 3, 1] → Red, Red, Red",

        "[3, 2, 1] → Red, Blue",

        "[2, 4] → Red, Blue, Red",

        "",

        "紅藍排列案例：",

        "Row 0：Red | Blue | Red",

        "Row 1：Red | Blue | 空",

        "",

        `摘要格數：${finalSummary.cells}`,

        `欄數：${finalSummary.columns}`,

        `Red：${finalSummary.red}`,

        `Blue：${finalSummary.blue}`,

        `來源大路格數：${finalSummary.sourceCells}`,

        `來源總局數：${finalSummary.sourceRounds}`,

        `目前連續：${finalSummary.currentStreak?.color ?? "無"} ${finalSummary.currentStreak?.count ?? 0}`

    ].join("\n");

}
