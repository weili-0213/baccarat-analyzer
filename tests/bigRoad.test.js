/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Big Road Test
 *
 * 大路測試
 */

import BigRoad, {
    BigRoadWinner
} from "../roadmap/bigRoad.js";

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
 * 建立大路測試資料
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


export default async function bigRoadTest() {

    const details = [];


    /*
     * 測試 1：
     * 初始狀態
     */
    const bigRoad =
        new BigRoad();

    assert(
        bigRoad.count === 0,
        "新大路 count 應為 0"
    );

    assert(
        bigRoad.totalRounds === 0,
        "新大路 totalRounds 應為 0"
    );

    assert(
        bigRoad.isEmpty === true,
        "新大路應為空"
    );

    assert(
        bigRoad.columns === 0,
        "新大路 columns 應為 0"
    );

    assert(
        bigRoad.last === null,
        "新大路 last 應為 null"
    );

    assert(
        bigRoad.lastWinner === null,
        "新大路 lastWinner 應為 null"
    );

    assert(
        bigRoad.pendingTieCount === 0,
        "新大路不應有 pending Tie"
    );

    assert(
        bigRoad.currentStreak === null,
        "新大路不應有 streak"
    );

    details.push(
        "建立 BigRoad：PASS"
    );


    /*
     * 測試 2：
     * 同勝方向下排列
     *
     * Player
     * Player
     * Player
     *
     * 應位於：
     * (0,0)
     * (1,0)
     * (2,0)
     */
    const verticalRoad =
        new BigRoad();

    verticalRoad.addAll([

        entry("Player"),

        entry("Player"),

        entry("Player")

    ]);

    assert(
        verticalRoad.count === 3,
        "三局 Player 應建立三格"
    );

    assert(
        verticalRoad.totalRounds === 3,
        "totalRounds 應為 3"
    );

    assertPosition(
        verticalRoad,
        0,
        0,
        0,
        "第一局 Player"
    );

    assertPosition(
        verticalRoad,
        1,
        1,
        0,
        "第二局 Player"
    );

    assertPosition(
        verticalRoad,
        2,
        2,
        0,
        "第三局 Player"
    );

    assert(
        verticalRoad.get(0).newStreak === true,
        "第一格應為新 streak"
    );

    assert(
        verticalRoad.get(1).newStreak === false,
        "第二格不應為新 streak"
    );

    assert(
        verticalRoad.get(2).baseColumn === 0,
        "第一條龍的 baseColumn 應為 0"
    );

    details.push(
        "同勝方向下排列：PASS"
    );


    /*
     * 測試 3：
     * 勝方改變後換欄
     *
     * P P P B B P
     *
     * P B P
     * P B
     * P
     */
    const changeRoad =
        new BigRoad();

    changeRoad.addAll([

        entry("Player"),

        entry("Player"),

        entry("Player"),

        entry("Banker"),

        entry("Banker"),

        entry("Player")

    ]);

    assertPosition(
        changeRoad,
        0,
        0,
        0,
        "第一局 Player"
    );

    assertPosition(
        changeRoad,
        1,
        1,
        0,
        "第二局 Player"
    );

    assertPosition(
        changeRoad,
        2,
        2,
        0,
        "第三局 Player"
    );

    assertPosition(
        changeRoad,
        3,
        0,
        1,
        "第一局 Banker"
    );

    assertPosition(
        changeRoad,
        4,
        1,
        1,
        "第二局 Banker"
    );

    assertPosition(
        changeRoad,
        5,
        0,
        2,
        "下一條 Player"
    );

    assert(
        changeRoad.get(3).newStreak === true,
        "勝方改變時應建立新 streak"
    );

    assert(
        changeRoad.get(3).baseColumn === 1,
        "Banker streak 的 baseColumn 應為 1"
    );

    assert(
        changeRoad.get(5).baseColumn === 2,
        "第二條 Player streak 的 baseColumn 應為 2"
    );

    assert(
        changeRoad.columns === 3,
        "此排列應使用三欄"
    );

    details.push(
        "勝方改變換欄：PASS"
    );


    /*
     * 測試 4：
     * 六列到底後向右
     *
     * 連續七局 Player：
     *
     * P
     * P
     * P
     * P
     * P
     * P P
     */
    const bottomRoad =
        new BigRoad();

    bottomRoad.addAll(
        Array.from(
            {
                length: 7
            },
            () =>
                entry("Player")
        )
    );

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
            `連續 Player 第 ${index + 1} 格`
        );

    }

    assertPosition(
        bottomRoad,
        6,
        5,
        1,
        "第七局 Player 到底向右"
    );

    assert(
        bottomRoad.columns === 2,
        "七局連 Player 應使用兩欄"
    );

    assert(
        bottomRoad.currentStreak.winner ===
            "Player",
        "目前 streak 勝方應為 Player"
    );

    assert(
        bottomRoad.currentStreak.count === 7,
        "目前 Player streak 應為 7"
    );

    details.push(
        "到底後向右：PASS"
    );


    /*
     * 測試 5：
     * 到底後持續向右
     */
    bottomRoad.addAll([

        entry("Player"),

        entry("Player")

    ]);

    assertPosition(
        bottomRoad,
        7,
        5,
        2,
        "第八局 Player"
    );

    assertPosition(
        bottomRoad,
        8,
        5,
        3,
        "第九局 Player"
    );

    assert(
        bottomRoad.columns === 4,
        "九局連 Player 應使用四欄"
    );

    details.push(
        "長龍持續向右：PASS"
    );


    /*
     * 測試 6：
     * 下方碰撞後向右
     *
     * 先建立七局 Player：
     *
     * P
     * P
     * P
     * P
     * P
     * P P
     *
     * 再建立六局 Banker。
     *
     * Banker 第六格原本想進入 (5,1)，
     * 但該格已有 Player，因此應移到 (4,2)。
     */
    const collisionRoad =
        new BigRoad();

    collisionRoad.addAll(
        Array.from(
            {
                length: 7
            },
            () =>
                entry("Player")
        )
    );

    collisionRoad.addAll(
        Array.from(
            {
                length: 6
            },
            () =>
                entry("Banker")
        )
    );

    assertPosition(
        collisionRoad,
        7,
        0,
        1,
        "第一局 Banker"
    );

    assertPosition(
        collisionRoad,
        8,
        1,
        1,
        "第二局 Banker"
    );

    assertPosition(
        collisionRoad,
        9,
        2,
        1,
        "第三局 Banker"
    );

    assertPosition(
        collisionRoad,
        10,
        3,
        1,
        "第四局 Banker"
    );

    assertPosition(
        collisionRoad,
        11,
        4,
        1,
        "第五局 Banker"
    );

    assertPosition(
        collisionRoad,
        12,
        4,
        2,
        "第六局 Banker 碰撞後向右"
    );

    assert(
        collisionRoad.getCell(
            5,
            1
        ).winner === "Player",
        "(5,1) 應保留原本的 Player"
    );

    assert(
        collisionRoad.getCell(
            4,
            2
        ).winner === "Banker",
        "(4,2) 應為碰撞後右移的 Banker"
    );

    details.push(
        "碰撞後向右：PASS"
    );


    /*
     * 測試 7：
     * Tie 不建立新格
     */
    const tieRoad =
        new BigRoad();

    const firstPlayer =
        tieRoad.add(
            entry(
                "Player",
                {
                    playerPair: true,
                    margin: 4
                }
            )
        );

    const tieReturn =
        tieRoad.add(
            entry(
                "Tie",
                {
                    bankerPair: true
                }
            )
        );

    assert(
        tieRoad.count === 1,
        "Tie 不應建立新格"
    );

    assert(
        tieRoad.totalRounds === 2,
        "Player 加 Tie 應有兩個原始局數"
    );

    assert(
        tieReturn === firstPlayer,
        "Tie add() 應回傳被附加的格子"
    );

    assert(
        firstPlayer.tieCount === 1,
        "第一格 tieCount 應為 1"
    );

    assert(
        firstPlayer.ties.length === 1,
        "第一格 ties 應有一筆"
    );

    assert(
        firstPlayer.ties[0]
            .roundIndex === 1,
        "Tie roundIndex 應為 1"
    );

    assert(
        firstPlayer.tieBankerPairCount === 1,
        "Tie 局的 Banker Pair 應被保留"
    );

    assert(
        tieRoad.tieCount === 1,
        "Tie 統計應為 1"
    );

    assert(
        tieRoad.bankerPairCount === 1,
        "Tie 局 Banker Pair 統計應為 1"
    );

    details.push(
        "Tie 附加：PASS"
    );


    /*
     * 測試 8：
     * 多個 Tie 附加到同一格
     */
    tieRoad.add(
        entry("Tie")
    );

    tieRoad.add(
        entry(
            "Tie",
            {
                playerPair: true
            }
        )
    );

    assert(
        tieRoad.count === 1,
        "多個 Tie 仍不應增加格數"
    );

    assert(
        tieRoad.totalRounds === 4,
        "一局 Player 加三局 Tie 應為四局"
    );

    assert(
        firstPlayer.tieCount === 3,
        "第一格 tieCount 應為 3"
    );

    assert(
        firstPlayer.tiePlayerPairCount === 1,
        "Tie Player Pair 次數應為 1"
    );

    assert(
        tieRoad.playerPairCount === 2,
        "主格 Player Pair 加 Tie Player Pair 應為 2"
    );

    details.push(
        "多個 Tie 疊加：PASS"
    );


    /*
     * 測試 9：
     * 開局 Tie
     *
     * Tie
     * Tie
     * Banker
     *
     * 前兩個 Tie 應暫存，
     * 第一個 Banker 出現後附加。
     */
    const openingTieRoad =
        new BigRoad();

    const openingTie1 =
        openingTieRoad.add(
            entry(
                "Tie",
                {
                    playerPair: true
                }
            )
        );

    const openingTie2 =
        openingTieRoad.add(
            entry("Tie")
        );

    assert(
        openingTie1 === null,
        "開局 Tie 尚無格子時應回傳 null"
    );

    assert(
        openingTie2 === null,
        "第二個開局 Tie 也應回傳 null"
    );

    assert(
        openingTieRoad.count === 0,
        "只有開局 Tie 時格數應為 0"
    );

    assert(
        openingTieRoad.totalRounds === 2,
        "兩個開局 Tie 的 totalRounds 應為 2"
    );

    assert(
        openingTieRoad.pendingTieCount === 2,
        "應暫存兩個開局 Tie"
    );

    assert(
        openingTieRoad.tieCount === 2,
        "開局 Tie 統計應為 2"
    );

    const firstBanker =
        openingTieRoad.add(
            entry("Banker")
        );

    assert(
        openingTieRoad.count === 1,
        "Banker 出現後應建立第一格"
    );

    assert(
        openingTieRoad.pendingTieCount === 0,
        "開局 Tie 應全部完成附加"
    );

    assert(
        firstBanker.tieCount === 2,
        "第一個 Banker 應附加兩個 Tie"
    );

    assert(
        firstBanker.ties[0]
            .roundIndex === 0,
        "第一個開局 Tie roundIndex 應為 0"
    );

    assert(
        firstBanker.ties[1]
            .roundIndex === 1,
        "第二個開局 Tie roundIndex 應為 1"
    );

    assert(
        firstBanker.roundIndex === 2,
        "第一個 Banker roundIndex 應為 2"
    );

    assert(
        openingTieRoad.playerPairCount === 1,
        "開局 Tie 的 Player Pair 應被統計"
    );

    details.push(
        "開局 Tie：PASS"
    );


    /*
     * 測試 10：
     * Tie 不會中斷 streak
     */
    const streakRoad =
        new BigRoad();

    streakRoad.addAll([

        entry("Banker"),

        entry("Banker"),

        entry("Tie"),

        entry("Banker")

    ]);

    assert(
        streakRoad.currentStreak.winner ===
            "Banker",
        "streak 勝方應為 Banker"
    );

    assert(
        streakRoad.currentStreak.count === 3,
        "Tie 不應中斷三局 Banker streak"
    );

    assert(
        streakRoad.count === 3,
        "三局 Banker 加一局 Tie 應只有三格"
    );

    assert(
        streakRoad.totalRounds === 4,
        "原始局數應為 4"
    );

    details.push(
        "Tie 不會中斷 streak：PASS"
    );


    /*
     * 測試 11：
     * getCell()、hasCell()、getColumn()
     */
    assert(
        changeRoad.hasCell(
            0,
            0
        ) === true,
        "(0,0) 應有格子"
    );

    assert(
        changeRoad.hasCell(
            5,
            5
        ) === false,
        "(5,5) 應沒有格子"
    );

    assert(
        changeRoad.getCell(
            0,
            1
        ).winner === "Banker",
        "(0,1) 應為 Banker"
    );

    assert(
        changeRoad.getCell(
            -1,
            0
        ) === null,
        "非法 row 應回傳 null"
    );

    assert(
        changeRoad.getCell(
            6,
            0
        ) === null,
        "超出 rows 應回傳 null"
    );

    assert(
        changeRoad.getCell(
            0,
            -1
        ) === null,
        "非法 column 應回傳 null"
    );

    const firstColumn =
        changeRoad.getColumn(0);

    assert(
        firstColumn.length === 6,
        "getColumn() 應回傳六列"
    );

    assert(
        firstColumn[0]
            .winner === "Player",
        "第一欄第一格應為 Player"
    );

    assert(
        firstColumn[3] === null,
        "第一欄第四列應為空"
    );

    assert(
        changeRoad.getColumn(-1)
            .length === 0,
        "非法欄位應回傳空陣列"
    );

    details.push(
        "位置查詢：PASS"
    );


    /*
     * 測試 12：
     * toMatrix()
     */
    const tieMatrix =
        tieRoad.toMatrix();

    assert(
        tieMatrix.length === 6,
        "矩陣應有六列"
    );

    assert(
        tieMatrix[0].length === 1,
        "Tie Road 矩陣應只有一欄"
    );

    assert(
        tieMatrix[0][0]
            .winner === "Player",
        "矩陣第一格應為 Player"
    );

    assert(
        tieMatrix[0][0]
            .tieCount === 3,
        "矩陣應保留三個 Tie"
    );

    assert(
        tieMatrix[0][0] !==
            tieRoad.get(0),
        "矩陣格子應為副本"
    );

    assert(
        tieMatrix[0][0].ties !==
            tieRoad.get(0).ties,
        "矩陣 ties 陣列應為副本"
    );

    tieMatrix[0][0]
        .ties[0]
        .playerPair =
        false;

    assert(
        tieRoad.get(0)
            .ties[0]
            .playerPair !==
            tieMatrix[0][0]
                .ties[0]
                .playerPair,
        "修改矩陣 Tie 不應影響原始資料"
    );

    details.push(
        "toMatrix()：PASS"
    );


    /*
     * 測試 13：
     * 統計摘要
     */
    const summaryRoad =
        new BigRoad();

    summaryRoad.addAll([

        entry(
            "Player",
            {
                playerPair: true
            }
        ),

        entry("Player"),

        entry(
            "Tie",
            {
                bankerPair: true
            }
        ),

        entry(
            "Banker",
            {
                super6: true
            }
        ),

        entry("Tie")

    ]);

    const summary =
        summaryRoad.summary;

    assert(
        summary.rounds === 5,
        "summary.rounds 應為 5"
    );

    assert(
        summary.cells === 3,
        "summary.cells 應為 3"
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
        summary.player === 2,
        "summary.player 應為 2"
    );

    assert(
        summary.banker === 1,
        "summary.banker 應為 1"
    );

    assert(
        summary.tie === 2,
        "summary.tie 應為 2"
    );

    assert(
        summary.playerPair === 1,
        "summary.playerPair 應為 1"
    );

    assert(
        summary.bankerPair === 1,
        "summary.bankerPair 應為 1"
    );

    assert(
        summary.super6 === 1,
        "summary.super6 應為 1"
    );

    assert(
        summary.pendingTies === 0,
        "summary.pendingTies 應為 0"
    );

    assert(
        summary.currentStreak
            .winner === "Banker",
        "最後 streak 應為 Banker"
    );

    assert(
        summary.currentStreak
            .count === 1,
        "最後 Banker streak 應為 1"
    );

    details.push(
        "統計摘要：PASS"
    );


    /*
     * 測試 14：
     * 從陣列 build()
     */
    const arrayRoad =
        new BigRoad();

    arrayRoad.build([

        entry("Player"),

        entry("Player"),

        entry("Tie"),

        entry("Banker")

    ]);

    assert(
        arrayRoad.totalRounds === 4,
        "陣列 build() 應有四局"
    );

    assert(
        arrayRoad.count === 3,
        "陣列 build() 應建立三格"
    );

    assert(
        arrayRoad.get(1)
            .tieCount === 1,
        "Tie 應附加到第二個 Player"
    );

    assert(
        arrayRoad.get(2)
            .winner === "Banker",
        "第三格應為 Banker"
    );

    details.push(
        "陣列 build()：PASS"
    );


    /*
     * 測試 15：
     * 非法 build() 不應清除舊資料
     */
    const beforeInvalidBuild = {

        rounds:
            arrayRoad.totalRounds,

        cells:
            arrayRoad.count,

        winner:
            arrayRoad.lastWinner

    };

    assertThrows(
        () => {

            arrayRoad.build({});

        },
        "不支援的來源應丟出錯誤"
    );

    assert(
        arrayRoad.totalRounds ===
            beforeInvalidBuild.rounds,
        "非法 build() 不應改變原始局數"
    );

    assert(
        arrayRoad.count ===
            beforeInvalidBuild.cells,
        "非法 build() 不應清除格子"
    );

    assert(
        arrayRoad.lastWinner ===
            beforeInvalidBuild.winner,
        "非法 build() 不應改變最後勝方"
    );

    assertThrows(
        () => {

            arrayRoad.build([
                entry("Player"),
                entry("Unknown")
            ]);

        },
        "包含非法 winner 的陣列應丟出錯誤"
    );

    assert(
        arrayRoad.totalRounds ===
            beforeInvalidBuild.rounds,
        "非法陣列 build() 不應改變資料"
    );

    details.push(
        "安全 build()：PASS"
    );


    /*
     * 測試 16：
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

    const tieResult =
        createResult({

            playerCards: [
                card("2", "S", 2),
                card("5", "D", 2)
            ],

            bankerCards: [
                card("3", "H", 2),
                card("4", "C", 2)
            ]

        });

    const bankerResult =
        createResult({

            playerCards: [
                card("A", "S", 3),
                card("3", "D", 3)
            ],

            bankerCards: [
                card("2", "H", 3),
                card("4", "C", 3)
            ]

        });

    history
        .add(playerResult)
        .add(tieResult)
        .add(bankerResult);

    const historyRoad =
        new BigRoad();

    historyRoad.build(
        history
    );

    assert(
        historyRoad.totalRounds === 3,
        "History build() 應有三局"
    );

    assert(
        historyRoad.count === 2,
        "History 的 Tie 不應建立新格"
    );

    assert(
        historyRoad.get(0)
            .winner === "Player",
        "History 第一格應為 Player"
    );

    assert(
        historyRoad.get(0)
            .tieCount === 1,
        "History Tie 應附加到 Player"
    );

    assert(
        historyRoad.get(1)
            .winner === "Banker",
        "History 第二格應為 Banker"
    );

    details.push(
        "History build()：PASS"
    );


    /*
     * 測試 17：
     * JSON 還原
     *
     * 使用包含：
     * - 開局 Tie
     * - Player
     * - 附加 Tie
     * - Banker
     * - 長 Banker
     */
    const jsonRoad =
        new BigRoad();

    jsonRoad.addAll([

        entry(
            "Tie",
            {
                playerPair: true
            }
        ),

        entry("Tie"),

        entry(
            "Player",
            {
                playerPair: true,
                playerNatural: true,
                margin: 4
            }
        ),

        entry(
            "Tie",
            {
                bankerPair: true
            }
        ),

        entry(
            "Banker",
            {
                super6: true,
                margin: 2
            }
        ),

        entry("Banker"),

        entry("Banker")

    ]);

    const json =
        jsonRoad.toJSON();

    assert(
        json.rows === 6,
        "JSON rows 應為 6"
    );

    assert(
        json.roundCount === 7,
        "JSON roundCount 應為 7"
    );

    assert(
        Array.isArray(
            json.entries
        ),
        "JSON entries 應為陣列"
    );

    assert(
        json.entries.length === 4,
        "JSON 應有四個非 Tie 格"
    );

    assert(
        Array.isArray(
            json.pendingTies
        ),
        "JSON pendingTies 應為陣列"
    );

    const restored =
        BigRoad.fromJSON(
            json
        );

    assert(
        restored instanceof BigRoad,
        "fromJSON() 應回傳 BigRoad"
    );

    assert(
        restored.totalRounds ===
            jsonRoad.totalRounds,
        "JSON 還原後 totalRounds 應一致"
    );

    assert(
        restored.count ===
            jsonRoad.count,
        "JSON 還原後 count 應一致"
    );

    assert(
        restored.columns ===
            jsonRoad.columns,
        "JSON 還原後 columns 應一致"
    );

    assert(
        restored.playerCount ===
            jsonRoad.playerCount,
        "JSON 還原後 Player 統計應一致"
    );

    assert(
        restored.bankerCount ===
            jsonRoad.bankerCount,
        "JSON 還原後 Banker 統計應一致"
    );

    assert(
        restored.tieCount ===
            jsonRoad.tieCount,
        "JSON 還原後 Tie 統計應一致"
    );

    assert(
        restored.playerPairCount ===
            jsonRoad.playerPairCount,
        "JSON 還原後 Player Pair 應一致"
    );

    assert(
        restored.bankerPairCount ===
            jsonRoad.bankerPairCount,
        "JSON 還原後 Banker Pair 應一致"
    );

    assert(
        restored.super6Count ===
            jsonRoad.super6Count,
        "JSON 還原後 Super 6 應一致"
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
            restoredEntry.winner ===
                original.winner,
            `JSON 還原第 ${index} 格 winner 應一致`
        );

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
            restoredEntry.tieCount ===
                original.tieCount,
            `JSON 還原第 ${index} 格 Tie 數應一致`
        );

    }

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 18：
     * 只有開局 Tie 的 JSON
     */
    const pendingOnlyRoad =
        new BigRoad();

    pendingOnlyRoad.addAll([

        entry(
            "Tie",
            {
                playerPair: true
            }
        ),

        entry(
            "Tie",
            {
                bankerPair: true
            }
        )

    ]);

    const pendingRestored =
        BigRoad.fromJSON(
            pendingOnlyRoad.toJSON()
        );

    assert(
        pendingRestored.count === 0,
        "只有 Tie 的大路還原後格數應為 0"
    );

    assert(
        pendingRestored.totalRounds === 2,
        "只有 Tie 的大路還原後局數應為 2"
    );

    assert(
        pendingRestored.pendingTieCount === 2,
        "只有 Tie 的大路應還原兩個 pending Tie"
    );

    assert(
        pendingRestored.playerPairCount === 1,
        "pending Tie Player Pair 應還原"
    );

    assert(
        pendingRestored.bankerPairCount === 1,
        "pending Tie Banker Pair 應還原"
    );

    details.push(
        "Pending Tie JSON：PASS"
    );


    /*
     * 測試 19：
     * 自訂 rows
     */
    const fourRowRoad =
        new BigRoad({
            rows: 4
        });

    fourRowRoad.addAll(
        Array.from(
            {
                length: 5
            },
            () =>
                entry("Banker")
        )
    );

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
        "四列五局應佔兩欄"
    );

    details.push(
        "自訂 rows：PASS"
    );


    /*
     * 測試 20：
     * 非法資料
     */
    const invalidRoad =
        new BigRoad();

    assertThrows(
        () => {

            new BigRoad({
                rows: 0
            });

        },
        "rows = 0 應丟出錯誤"
    );

    assertThrows(
        () => {

            invalidRoad.add(null);

        },
        "null round 應丟出錯誤"
    );

    assertThrows(
        () => {

            invalidRoad.add({
                winner: "Unknown"
            });

        },
        "非法 winner 應丟出錯誤"
    );

    assertThrows(
        () => {

            invalidRoad.addAll({});

        },
        "addAll() 非陣列應丟出錯誤"
    );

    assertThrows(
        () => {

            invalidRoad.build(null);

        },
        "build(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            BigRoad.fromJSON(null);

        },
        "fromJSON(null) 應丟出錯誤"
    );

    assertThrows(
        () => {

            BigRoad.fromJSON({
                rows: 6
            });

        },
        "缺少 entries 應丟出錯誤"
    );

    assertThrows(
        () => {

            BigRoad.fromJSON({
                rows: 6,
                entries: [],
                pendingTies: {}
            });

        },
        "pendingTies 非陣列應丟出錯誤"
    );

    details.push(
        "非法資料驗證：PASS"
    );


    /*
     * 在 clear() 前保存輸出摘要。
     */
    const finalSummary = {

        ...summaryRoad.summary,

        currentStreak:
            summaryRoad.summary
                .currentStreak
                ? {
                    ...summaryRoad.summary
                        .currentStreak
                }
                : null

    };


    /*
     * 測試 21：
     * clear()
     */
    restored.clear();

    assert(
        restored.count === 0,
        "clear() 後 count 應為 0"
    );

    assert(
        restored.totalRounds === 0,
        "clear() 後 totalRounds 應為 0"
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
        restored.pendingTieCount === 0,
        "clear() 後 pending Tie 應為 0"
    );

    assert(
        restored.currentStreak === null,
        "clear() 後 currentStreak 應為 null"
    );

    details.push(
        "clear()：PASS"
    );


    return [

        "Big Road 測試全部完成",

        "",

        ...details,

        "",

        "基本排列：P P P B B P",

        "Row 0：Player | Banker | Player",

        "Row 1：Player | Banker | 空",

        "Row 2：Player | 空    | 空",

        "",

        "碰撞測試：",

        "七局 Player 後接六局 Banker，",

        "最後一個 Banker 因 (5,1) 已被 Player 佔用，",

        "移到 (4,2)。",

        "",

        `摘要總局數：${finalSummary.rounds}`,

        `大路格數：${finalSummary.cells}`,

        `欄數：${finalSummary.columns}`,

        `Player：${finalSummary.player}`,

        `Banker：${finalSummary.banker}`,

        `Tie：${finalSummary.tie}`,

        `Player Pair：${finalSummary.playerPair}`,

        `Banker Pair：${finalSummary.bankerPair}`,

        `Super 6：${finalSummary.super6}`,

        `目前連續：${finalSummary.currentStreak?.winner ?? "無"} ${finalSummary.currentStreak?.count ?? 0}`

    ].join("\n");

}
