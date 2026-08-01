/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Bead Road Test
 *
 * 珠盤路測試
 */

import BeadRoad, {
    BeadRoadWinner
} from "../roadmap/beadRoad.js";

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
 * 建立測試用珠盤路資料
 */
function entry(
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
function createResult({

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


export default async function beadRoadTest() {

    const details = [];


    /*
     * 測試 1：
     * 初始狀態
     */
    const beadRoad =
        new BeadRoad();

    assert(
        beadRoad.count === 0,
        "新珠盤路 count 應為 0"
    );

    assert(
        beadRoad.isEmpty === true,
        "新珠盤路應為空"
    );

    assert(
        beadRoad.columns === 0,
        "空珠盤路 columns 應為 0"
    );

    assert(
        beadRoad.last === null,
        "空珠盤路 last 應為 null"
    );

    details.push(
        "建立 BeadRoad：PASS"
    );


    /*
     * 測試 2：
     * 加入前六局
     */
    const firstSix = [

        entry(
            BeadRoadWinner.PLAYER,
            {
                playerPair: true,
                margin: 3
            }
        ),

        entry(
            BeadRoadWinner.BANKER,
            {
                bankerPair: true,
                margin: 2
            }
        ),

        entry(
            BeadRoadWinner.TIE
        ),

        entry(
            BeadRoadWinner.PLAYER,
            {
                playerNatural: true,
                margin: 4
            }
        ),

        entry(
            BeadRoadWinner.BANKER,
            {
                super6: true,
                margin: 2
            }
        ),

        entry(
            BeadRoadWinner.PLAYER
        )

    ];

    const added =
        beadRoad.addAll(
            firstSix
        );

    assert(
        added.length === 6,
        "addAll() 應回傳六筆資料"
    );

    assert(
        beadRoad.count === 6,
        "加入六局後 count 應為 6"
    );

    assert(
        beadRoad.columns === 1,
        "六局應只佔一欄"
    );

    for (
        let index = 0;
        index < 6;
        index++
    ) {

        const current =
            beadRoad.get(index);

        assert(
            current.row === index,
            `第 ${index + 1} 局 row 應為 ${index}`
        );

        assert(
            current.column === 0,
            `第 ${index + 1} 局 column 應為 0`
        );

        assert(
            current.index === index,
            `第 ${index + 1} 局 index 不正確`
        );

    }

    details.push(
        "前六局排列：PASS"
    );


    /*
     * 測試 3：
     * 第七局換到第二欄第一列
     */
    const seventh =
        beadRoad.add(
            entry(
                BeadRoadWinner.BANKER
            )
        );

    assert(
        seventh.index === 6,
        "第七局 index 應為 6"
    );

    assert(
        seventh.row === 0,
        "第七局 row 應為 0"
    );

    assert(
        seventh.column === 1,
        "第七局 column 應為 1"
    );

    assert(
        beadRoad.columns === 2,
        "七局應佔兩欄"
    );

    details.push(
        "第七局換欄：PASS"
    );


    /*
     * 測試 4：
     * getPosition()
     */
    assert(
        beadRoad.getPosition(0).row === 0 &&
        beadRoad.getPosition(0).column === 0,
        "index 0 位置錯誤"
    );

    assert(
        beadRoad.getPosition(5).row === 5 &&
        beadRoad.getPosition(5).column === 0,
        "index 5 位置錯誤"
    );

    assert(
        beadRoad.getPosition(6).row === 0 &&
        beadRoad.getPosition(6).column === 1,
        "index 6 位置錯誤"
    );

    assert(
        beadRoad.getPosition(13).row === 1 &&
        beadRoad.getPosition(13).column === 2,
        "index 13 位置錯誤"
    );

    assertThrows(
        () => {

            beadRoad.getPosition(-1);

        },
        "負數 index 應丟出錯誤"
    );

    details.push(
        "getPosition()：PASS"
    );


    /*
     * 測試 5：
     * getCell()
     */
    const firstCell =
        beadRoad.getCell(
            0,
            0
        );

    assert(
        firstCell.winner ===
            BeadRoadWinner.PLAYER,
        "第一格應為 Player"
    );

    assert(
        firstCell.playerPair === true,
        "第一格應保留 Player Pair"
    );

    const seventhCell =
        beadRoad.getCell(
            0,
            1
        );

    assert(
        seventhCell === seventh,
        "第二欄第一格應為第七局"
    );

    assert(
        beadRoad.getCell(5, 1) === null,
        "不存在的格子應回傳 null"
    );

    assert(
        beadRoad.getCell(-1, 0) === null,
        "非法 row 應回傳 null"
    );

    assert(
        beadRoad.getCell(6, 0) === null,
        "超出 rows 應回傳 null"
    );

    assert(
        beadRoad.getCell(0, -1) === null,
        "非法 column 應回傳 null"
    );

    details.push(
        "getCell()：PASS"
    );


    /*
     * 測試 6：
     * getColumn()
     */
    const firstColumn =
        beadRoad.getColumn(0);

    assert(
        firstColumn.length === 6,
        "第一欄應有六個位置"
    );

    assert(
        firstColumn.every(
            cell => cell !== null
        ),
        "第一欄六格都應有資料"
    );

    const secondColumn =
        beadRoad.getColumn(1);

    assert(
        secondColumn.length === 6,
        "第二欄也應回傳六個位置"
    );

    assert(
        secondColumn[0] === seventh,
        "第二欄第一格應為第七局"
    );

    assert(
        secondColumn[1] === null,
        "第二欄第二格應為空"
    );

    assert(
        beadRoad.getColumn(-1).length === 0,
        "非法欄位應回傳空陣列"
    );

    details.push(
        "getColumn()：PASS"
    );


    /*
     * 測試 7：
     * toMatrix()
     */
    const matrix =
        beadRoad.toMatrix();

    assert(
        matrix.length === 6,
        "矩陣應有六列"
    );

    assert(
        matrix[0].length === 2,
        "矩陣應有兩欄"
    );

    assert(
        matrix[0][0].winner ===
            BeadRoadWinner.PLAYER,
        "matrix[0][0] 應為 Player"
    );

    assert(
        matrix[5][0].winner ===
            BeadRoadWinner.PLAYER,
        "matrix[5][0] 應為第六局 Player"
    );

    assert(
        matrix[0][1].winner ===
            BeadRoadWinner.BANKER,
        "matrix[0][1] 應為第七局 Banker"
    );

    assert(
        matrix[1][1] === null,
        "matrix[1][1] 應為空"
    );

    assert(
        matrix[0][0] !==
            beadRoad.get(0),
        "toMatrix() 應複製 entry"
    );

    details.push(
        "toMatrix()：PASS"
    );


    /*
     * 測試 8：
     * 統計
     */
    assert(
        beadRoad.playerCount === 3,
        "Player 次數應為 3"
    );

    assert(
        beadRoad.bankerCount === 3,
        "Banker 次數應為 3"
    );

    assert(
        beadRoad.tieCount === 1,
        "Tie 次數應為 1"
    );

    assert(
        beadRoad.playerPairCount === 1,
        "Player Pair 次數應為 1"
    );

    assert(
        beadRoad.bankerPairCount === 1,
        "Banker Pair 次數應為 1"
    );

    assert(
        beadRoad.super6Count === 1,
        "Super 6 次數應為 1"
    );

    const summary =
        beadRoad.summary;

    assert(
        summary.rounds === 7,
        "summary.rounds 應為 7"
    );

    assert(
        summary.rows === 6,
        "summary.rows 應為 6"
    );

    assert(
        summary.columns === 2,
        "summary.columns 應為 2"
    );

    assert(
        summary.player === 3 &&
        summary.banker === 3 &&
        summary.tie === 1,
        "summary 勝負統計錯誤"
    );

    details.push(
        "統計摘要：PASS"
    );


    /*
     * 測試 9：
     * normalizeEntry()
     */
    const normalizedRoad =
        new BeadRoad();

    const normalized =
        normalizedRoad.add({
            winner: "Player"
        });

    assert(
        normalized.playerPair === false &&
        normalized.bankerPair === false &&
        normalized.super6 === false,
        "未提供的標記應為 false"
    );

    assert(
        normalized.margin === 0,
        "未提供 margin 應為 0"
    );

    details.push(
        "資料正規化：PASS"
    );


    /*
     * 測試 10：
     * 從陣列 build()
     */
    const arrayRoad =
        new BeadRoad();

    arrayRoad.build([
        entry("Player"),
        entry("Banker"),
        entry("Tie")
    ]);

    assert(
        arrayRoad.count === 3,
        "從陣列 build() 應有三筆"
    );

    assert(
        arrayRoad.get(2).winner ===
            "Tie",
        "陣列 build() 第三筆應為 Tie"
    );

    arrayRoad.build([
        entry("Banker")
    ]);

    assert(
        arrayRoad.count === 1,
        "重新 build() 應清除舊資料"
    );

    details.push(
        "陣列 build()：PASS"
    );


    /*
     * 測試 11：
     * 從真實 History v5 建立
     */
    const history =
        new History();

    const playerResult =
        createResult({

            playerCards: [
                card("4", "S"),
                card("5", "D")
            ],

            bankerCards: [
                card("2", "H"),
                card("3", "C")
            ]

        });

    const bankerResult =
        createResult({

            playerCards: [
                card("A", "S", 2),
                card("3", "D", 2)
            ],

            bankerCards: [
                card("2", "H", 2),
                card("4", "C", 2)
            ]

        });

    const tieResult =
        createResult({

            playerCards: [
                card("2", "S", 3),
                card("5", "D", 3)
            ],

            bankerCards: [
                card("3", "H", 3),
                card("4", "C", 3)
            ]

        });

    history
        .add(playerResult)
        .add(bankerResult)
        .add(tieResult);

    const historyRoad =
        new BeadRoad();

    historyRoad.build(
        history
    );

    assert(
        historyRoad.count === 3,
        "從 History build() 應有三筆"
    );

    assert(
        historyRoad.get(0).winner ===
            "Player",
        "History 第一局應為 Player"
    );

    assert(
        historyRoad.get(1).winner ===
            "Banker",
        "History 第二局應為 Banker"
    );

    assert(
        historyRoad.get(2).winner ===
            "Tie",
        "History 第三局應為 Tie"
    );

    details.push(
        "History build()：PASS"
    );


    /*
     * 測試 12：
     * JSON
     */
    const json =
        beadRoad.toJSON();

    assert(
        json.rows === 6,
        "JSON rows 應為 6"
    );

    assert(
        Array.isArray(json.entries),
        "JSON entries 應為陣列"
    );

    assert(
        json.entries.length === 7,
        "JSON entries 應有七筆"
    );

    const restored =
        BeadRoad.fromJSON(
            json
        );

    assert(
        restored instanceof BeadRoad,
        "fromJSON() 應回傳 BeadRoad"
    );

    assert(
        restored.count === 7,
        "JSON 還原後 count 應為 7"
    );

    assert(
        restored.columns === 2,
        "JSON 還原後 columns 應為 2"
    );

    assert(
        restored.get(0).winner ===
            "Player",
        "JSON 還原第一局應為 Player"
    );

    assert(
        restored.get(0).playerPair ===
            true,
        "JSON 還原應保留 Player Pair"
    );

    assert(
        restored.get(4).super6 ===
            true,
        "JSON 還原應保留 Super 6"
    );

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 13：
     * 自訂 rows
     */
    const fourRowRoad =
        new BeadRoad({
            rows: 4
        });

    fourRowRoad.addAll([
        entry("Player"),
        entry("Banker"),
        entry("Tie"),
        entry("Player"),
        entry("Banker")
    ]);

    assert(
        fourRowRoad.columns === 2,
        "五局、四列應佔兩欄"
    );

    assert(
        fourRowRoad.get(4).row === 0 &&
        fourRowRoad.get(4).column === 1,
        "第五局應位於第二欄第一列"
    );

    details.push(
        "自訂 rows：PASS"
    );


    /*
     * 測試 14：
     * 非法資料
     */
    assertThrows(
        () => {

            new BeadRoad({
                rows: 0
            });

        },
        "rows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            beadRoad.add({
                winner: "Unknown"
            });

        },
        "非法 winner 應丟出錯誤"
    );

    assertThrows(
        () => {

            beadRoad.add(null);

        },
        "null entry 應丟出錯誤"
    );

    assertThrows(
        () => {

            beadRoad.addAll({});

        },
        "addAll() 非陣列應丟出錯誤"
    );

    assertThrows(
        () => {

            beadRoad.build({});

        },
        "不支援的 build source 應丟出錯誤"
    );

    assertThrows(
        () => {

            BeadRoad.fromJSON({
                rows: 6
            });

        },
        "缺少 JSON entries 應丟出錯誤"
    );

    details.push(
        "非法資料驗證：PASS"
    );


    /*
     * 在 clear() 前保存最終統計。
     *
     * 避免清除後輸出全部變成 0。
     */
    const finalSummary = {

        ...beadRoad.summary

    };


    /*
     * 測試 15：
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

    details.push(
        "clear()：PASS"
    );


    return [

        "Bead Road 測試全部完成",

        "",

        ...details,

        "",

        "測試排列：",

        "Row 0：Player | Banker",

        "Row 1：Banker | 空",

        "Row 2：Tie    | 空",

        "Row 3：Player | 空",

        "Row 4：Banker | 空",

        "Row 5：Player | 空",

        "",

        `總局數：${finalSummary.rounds}`,

        `欄數：${finalSummary.columns}`,

        `Player：${finalSummary.player}`,

        `Banker：${finalSummary.banker}`,

        `Tie：${finalSummary.tie}`,

        `Player Pair：${finalSummary.playerPair}`,

        `Banker Pair：${finalSummary.bankerPair}`,

        `Super 6：${finalSummary.super6}`

    ].join("\n");

}
