/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * History Test
 *
 * 使用真實 Round 與 Card 建立結果，
 * 不直接修改 RoundResult 的 getter。
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
 * 透過真實手牌建立 RoundResult
 *
 * 發牌順序：
 * Player 1
 * Banker 1
 * Player 2
 * Banker 2
 * Player 3（選填）
 * Banker 3（選填）
 */
function createResult({

    playerCards,

    bankerCards

}) {

    const round =
        new Round();

    if (
        !Array.isArray(playerCards) ||
        playerCards.length < 2 ||
        playerCards.length > 3
    ) {

        throw new Error(
            "Player cards must contain 2 or 3 cards."
        );

    }

    if (
        !Array.isArray(bankerCards) ||
        bankerCards.length < 2 ||
        bankerCards.length > 3
    ) {

        throw new Error(
            "Banker cards must contain 2 or 3 cards."
        );

    }

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
 * 兼容 last getter 與 last() 方法
 */
function getLast(history) {

    if (
        typeof history.last ===
        "function"
    ) {

        return history.last();

    }

    return history.last ?? null;

}


/**
 * 兼容 statistics()、getStatistics()、
 * stats getter 與 summary getter。
 */
function getStatistics(history) {

    if (
        typeof history.statistics ===
        "function"
    ) {

        return history.statistics();

    }

    if (
        typeof history.getStatistics ===
        "function"
    ) {

        return history.getStatistics();

    }

    if (
        history.stats &&
        typeof history.stats ===
        "object"
    ) {

        return history.stats;

    }

    if (
        history.summary &&
        typeof history.summary ===
        "object"
    ) {

        return history.summary;

    }

    throw new Error(
        "History does not provide statistics(), getStatistics(), stats, or summary."
    );

}


/**
 * 從可能的欄位名稱中取得統計值
 */
function readStat(
    stats,
    names
) {

    for (const name of names) {

        if (
            Number.isFinite(
                stats?.[name]
            )
        ) {

            return stats[name];

        }

    }

    throw new Error(
        `Missing statistics field: ${names.join(" / ")}`
    );

}


export default async function historyTest() {

    const details = [];

    /*
     * 測試 1：
     * 建立空 History
     */
    const history =
        new History();

    assert(
        history.count === 0,
        "History 初始 count 應為 0"
    );

    assert(
        getLast(history) === null,
        "空 History 的 last 應為 null"
    );

    details.push(
        "建立 History：PASS"
    );


    /*
     * 測試 2：
     * Player 勝、Player Pair、Natural
     *
     * Player：
     * 4 + 4 = 8
     * Pair + Natural
     *
     * Banker：
     * 2 + 3 = 5
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
        playerResult.winner ===
            "Player",
        "第一局應為 Player 勝"
    );

    assert(
        playerResult.playerPair ===
            true,
        "第一局應有 Player Pair"
    );

    assert(
        playerResult.playerNatural ===
            true,
        "第一局 Player 應為 Natural"
    );

    history.add(
        playerResult
    );


    /*
     * 測試 3：
     * Banker 勝 6 點、Super 6
     *
     * Player：
     * A + 3 = 4
     *
     * Banker：
     * 2 + 4 = 6
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
        bankerResult.winner ===
            "Banker",
        "第二局應為 Banker 勝"
    );

    assert(
        bankerResult.bankerScore ===
            6,
        "第二局 Banker 應為 6 點"
    );

    assert(
        bankerResult.super6 ===
            true,
        "第二局應為 Super 6"
    );

    history.add(
        bankerResult
    );


    /*
     * 測試 4：
     * Tie
     *
     * Player：
     * 2 + 5 = 7
     *
     * Banker：
     * 3 + 4 = 7
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
        tieResult.winner ===
            "Tie",
        "第三局應為 Tie"
    );

    history.add(
        tieResult
    );

    assert(
        history.count === 3,
        "新增三局後 count 應為 3"
    );

    details.push(
        "新增三局結果：PASS"
    );


    /*
     * 測試 5：
     * last
     */
    const last =
        getLast(history);

    assert(
        last === tieResult,
        "最後一局應為新增的 Tie Result"
    );

    assert(
        last.winner === "Tie",
        "最後一局勝方應為 Tie"
    );

    details.push(
        "last：PASS"
    );


    /*
     * 測試 6：
     * 統計
     */
    const stats =
        getStatistics(
            history
        );

    const playerWins =
        readStat(
            stats,
            [
                "playerWins",
                "player",
                "playerCount"
            ]
        );

    const bankerWins =
        readStat(
            stats,
            [
                "bankerWins",
                "banker",
                "bankerCount"
            ]
        );

    const ties =
        readStat(
            stats,
            [
                "ties",
                "tie",
                "tieCount"
            ]
        );

    assert(
        playerWins === 1,
        "Player 勝局數應為 1"
    );

    assert(
        bankerWins === 1,
        "Banker 勝局數應為 1"
    );

    assert(
        ties === 1,
        "Tie 局數應為 1"
    );

    details.push(
        "勝負統計：PASS"
    );


    /*
     * 測試 7：
     * Pair、Natural、Super 6 統計
     *
     * 不同 History 版本可能使用不同欄位名稱。
     */
    const playerPairs =
        readStat(
            stats,
            [
                "playerPairs",
                "playerPair",
                "playerPairCount"
            ]
        );

    const bankerPairs =
        readStat(
            stats,
            [
                "bankerPairs",
                "bankerPair",
                "bankerPairCount"
            ]
        );

    const naturals =
        readStat(
            stats,
            [
                "naturals",
                "natural",
                "naturalCount"
            ]
        );

    const super6Count =
        readStat(
            stats,
            [
                "super6",
                "super6Count"
            ]
        );

    assert(
        playerPairs === 1,
        "Player Pair 次數應為 1"
    );

    assert(
        bankerPairs === 0,
        "Banker Pair 次數應為 0"
    );

    assert(
        naturals === 1,
        "Natural 次數應為 1"
    );

    assert(
        super6Count === 1,
        "Super 6 次數應為 1"
    );

    details.push(
        "Pair／Natural／Super 6：PASS"
    );


    /*
     * 測試 8：
     * JSON 輸出
     */
    const json =
        history.toJSON();

    assert(
        json !== null &&
        typeof json === "object",
        "History.toJSON() 應回傳物件"
    );

    const restored =
        History.fromJSON(
            json
        );

    assert(
        restored instanceof History,
        "fromJSON() 應回傳 History"
    );

    assert(
        restored.count === 3,
        "JSON 還原後 count 應為 3"
    );

    assert(
        getLast(restored)
            .winner === "Tie",
        "JSON 還原後最後一局應為 Tie"
    );

    const restoredStats =
        getStatistics(
            restored
        );

    assert(
        readStat(
            restoredStats,
            [
                "playerWins",
                "player",
                "playerCount"
            ]
        ) === 1,
        "JSON 還原後 Player 統計應一致"
    );

    assert(
        readStat(
            restoredStats,
            [
                "bankerWins",
                "banker",
                "bankerCount"
            ]
        ) === 1,
        "JSON 還原後 Banker 統計應一致"
    );

    assert(
        readStat(
            restoredStats,
            [
                "ties",
                "tie",
                "tieCount"
            ]
        ) === 1,
        "JSON 還原後 Tie 統計應一致"
    );

    details.push(
        "JSON 還原：PASS"
    );


    /*
     * 測試 9：
     * Clear
     */
    restored.clear();

    assert(
        restored.count === 0,
        "clear() 後 count 應為 0"
    );

    assert(
        getLast(restored) === null,
        "clear() 後 last 應為 null"
    );

    details.push(
        "clear()：PASS"
    );


    return [

        "History 測試全部完成",

        "",

        ...details,

        "",

        `總局數：${history.count}`,

        `Player 勝：${playerWins}`,

        `Banker 勝：${bankerWins}`,

        `Tie：${ties}`,

        `Player Pair：${playerPairs}`,

        `Banker Pair：${bankerPairs}`,

        `Natural：${naturals}`,

        `Super 6：${super6Count}`

    ].join("\n");

}
