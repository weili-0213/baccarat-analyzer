/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * History v5 Test
 */

import Card from "../engine/card.js";
import Round from "../engine/round.js";
import History from "../engine/history.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(message);

    }

}


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


export default async function historyTest() {

    const details = [];

    /*
     * 測試 1：
     * 初始狀態
     */
    const history =
        new History();

    assert(
        history.count === 0,
        "History 初始 count 應為 0"
    );

    assert(
        history.isEmpty === true,
        "新 History 應為空"
    );

    assert(
        history.last === null,
        "空 History 的 last 應為 null"
    );

    assert(
        history.get(0) === null,
        "空 History 的 get(0) 應為 null"
    );

    details.push(
        "建立 History：PASS"
    );


    /*
     * 第一局：
     * Player 勝、Player Pair、Player Natural
     *
     * Player：4 + 4 = 8
     * Banker：2 + 3 = 5
     */
    const playerResult =
        createResult({

            playerCards: [
                card("4", "S"),
                card("4", "D")
            ],

            bankerCards: [
                card("2", "H"),
                card("3", "C")
            ]

        });

    assert(
        playerResult.winner === "Player",
        "第一局應為 Player 勝"
    );

    assert(
        playerResult.playerPair === true,
        "第一局應為 Player Pair"
    );

    assert(
        playerResult.playerNatural === true,
        "第一局應為 Player Natural"
    );

    history.add(
        playerResult
    );


    /*
     * 第二局：
     * Banker 勝 6 點、Super 6
     *
     * Player：A + 3 = 4
     * Banker：2 + 4 = 6
     */
    const bankerResult =
        createResult({

            playerCards: [
                card("A", "S"),
                card("3", "D")
            ],

            bankerCards: [
                card("2", "H"),
                card("4", "C")
            ]

        });

    assert(
        bankerResult.winner === "Banker",
        "第二局應為 Banker 勝"
    );

    assert(
        bankerResult.bankerScore === 6,
        "第二局 Banker 應為 6 點"
    );

    assert(
        bankerResult.super6 === true,
        "第二局應為 Super 6"
    );

    history.add(
        bankerResult
    );


    /*
     * 第三局：
     * Tie
     *
     * Player：2 + 5 = 7
     * Banker：3 + 4 = 7
     */
    const tieResult =
        createResult({

            playerCards: [
                card("2", "S"),
                card("5", "D")
            ],

            bankerCards: [
                card("3", "H"),
                card("4", "C")
            ]

        });

    assert(
        tieResult.winner === "Tie",
        "第三局應為 Tie"
    );

    history.add(
        tieResult
    );


    /*
     * 第四局：
     * Banker Pair、Banker Natural
     *
     * Player：2 + 3 = 5
     * Banker：4 + 4 = 8
     */
    const bankerNaturalResult =
        createResult({

            playerCards: [
                card("2", "C", 2),
                card("3", "D", 2)
            ],

            bankerCards: [
                card("4", "S", 2),
                card("4", "H", 2)
            ]

        });

    history.add(
        bankerNaturalResult
    );

    assert(
        history.count === 4,
        "新增四局後 count 應為 4"
    );

    assert(
        history.isEmpty === false,
        "新增紀錄後不應為空"
    );

    details.push(
        "新增四局：PASS"
    );


    /*
     * getAll()
     */
    const all =
        history.getAll();

    assert(
        Array.isArray(all),
        "getAll() 應回傳陣列"
    );

    assert(
        all.length === 4,
        "getAll() 應包含四局"
    );

    assert(
        all !== history.rounds,
        "getAll() 應回傳陣列副本"
    );

    details.push(
        "getAll()：PASS"
    );


    /*
     * last / get()
     */
    assert(
        history.last ===
            bankerNaturalResult,
        "last 應為第四局"
    );

    assert(
        history.get(0) ===
            playerResult,
        "get(0) 應為第一局"
    );

    assert(
        history.get(99) === null,
        "不存在的 index 應回傳 null"
    );

    details.push(
        "last / get()：PASS"
    );


    /*
     * lastRounds()
     */
    const recent =
        history.lastRounds(2);

    assert(
        recent.length === 2,
        "lastRounds(2) 應回傳兩局"
    );

    assert(
        recent[0] === tieResult,
        "最近兩局第一筆應為 Tie"
    );

    assert(
        recent[1] ===
            bankerNaturalResult,
        "最近兩局第二筆應為 Banker Natural"
    );

    details.push(
        "lastRounds()：PASS"
    );


    /*
     * 勝負統計
     */
    assert(
        history.playerWins === 1,
        "Player 勝局數應為 1"
    );

    assert(
        history.bankerWins === 2,
        "Banker 勝局數應為 2"
    );

    assert(
        history.ties === 1,
        "Tie 局數應為 1"
    );

    details.push(
        "勝負統計：PASS"
    );


    /*
     * Pair 統計
     */
    assert(
        history.playerPairs === 1,
        "Player Pair 次數應為 1"
    );

    assert(
        history.bankerPairs === 1,
        "Banker Pair 次數應為 1"
    );

    details.push(
        "Pair 統計：PASS"
    );


    /*
     * Natural 統計
     */
    assert(
        history.playerNaturals === 1,
        "Player Natural 次數應為 1"
    );

    assert(
        history.bankerNaturals === 1,
        "Banker Natural 次數應為 1"
    );

    details.push(
        "Natural 統計：PASS"
    );


    /*
     * Super 6
     */
    assert(
        history.super6Count === 1,
        "Super 6 次數應為 1"
    );

    details.push(
        "Super 6 統計：PASS"
    );


    /*
     * Dragon Bonus
     *
     * 你的 History v5 定義是：
     * margin >= 4
     */
    const expectedDragonBonus =
        history.getAll()
            .filter(
                result =>
                    result.margin >= 4
            )
            .length;

    assert(
        history.dragonBonusCount ===
            expectedDragonBonus,
        "Dragon Bonus 統計應與 margin >= 4 一致"
    );

    details.push(
        "Dragon Bonus 統計：PASS"
    );


    /*
     * Win Rate
     */
    const winRate =
        history.winRate;

    assert(
        winRate.player === 1 / 4,
        "Player 勝率應為 25%"
    );

    assert(
        winRate.banker === 2 / 4,
        "Banker 勝率應為 50%"
    );

    assert(
        winRate.tie === 1 / 4,
        "Tie 勝率應為 25%"
    );

    assert(
        Math.abs(
            (
                winRate.player +
                winRate.banker +
                winRate.tie
            ) - 1
        ) < 0.000001,
        "勝率總和應為 1"
    );

    details.push(
        "勝率：PASS"
    );


    /*
     * Trend
     */
    const expectedTrend = [
        "Player",
        "Banker",
        "Tie",
        "Banker"
    ];

    assert(
        JSON.stringify(
            history.trend
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
     * Streak
     *
     * 最後只有一局 Banker，
     * 因為前一局是 Tie。
     */
    assert(
        history.streak !== null,
        "非空 History 應有 streak"
    );

    assert(
        history.streak.winner ===
            "Banker",
        "目前連續勝方應為 Banker"
    );

    assert(
        history.streak.count === 1,
        "目前 Banker streak 應為 1"
    );

    details.push(
        "Streak：PASS"
    );


    /*
     * Roadmap Data
     */
    const roadmap =
        history.roadmapData;

    assert(
        Array.isArray(roadmap),
        "roadmapData 應為陣列"
    );

    assert(
        roadmap.length === 4,
        "roadmapData 應包含四局"
    );

    assert(
        roadmap[0].winner ===
            "Player",
        "Roadmap 第一局應為 Player"
    );

    assert(
        roadmap[0].playerPair ===
            true,
        "Roadmap 應保留 Player Pair"
    );

    assert(
        roadmap[1].super6 ===
            true,
        "Roadmap 應保留 Super 6"
    );

    details.push(
        "Roadmap Data：PASS"
    );


    /*
     * JSON
     *
     * History v5 目前只有 toJSON()，
     * 尚未提供 fromJSON()。
     */
    const json =
        history.toJSON();

    assert(
        Array.isArray(json),
        "History.toJSON() 應回傳陣列"
    );

    assert(
        json.length === 4,
        "JSON 應包含四局"
    );

    assert(
        json[0].winner === "Player",
        "JSON 第一局應為 Player"
    );

    assert(
        json[1].super6 === true,
        "JSON 第二局應為 Super 6"
    );

    details.push(
        "toJSON()：PASS"
    );


    /*
     * Clear
     */
    history.clear();

    assert(
        history.count === 0,
        "clear() 後 count 應為 0"
    );

    assert(
        history.isEmpty === true,
        "clear() 後應為空"
    );

    assert(
        history.last === null,
        "clear() 後 last 應為 null"
    );

    assert(
        history.streak === null,
        "clear() 後 streak 應為 null"
    );

    assert(
        history.winRate.player === 0 &&
        history.winRate.banker === 0 &&
        history.winRate.tie === 0,
        "空 History 的勝率應全部為 0"
    );

    details.push(
        "clear()：PASS"
    );


    return [

        "History v5 測試全部完成",

        "",

        ...details,

        "",

        "測試前總局數：4",

        "Player 勝：1",

        "Banker 勝：2",

        "Tie：1",

        "Player Pair：1",

        "Banker Pair：1",

        "Player Natural：1",

        "Banker Natural：1",

        "Super 6：1",

        `Dragon Bonus：${expectedDragonBonus}`

    ].join("\n");

}
