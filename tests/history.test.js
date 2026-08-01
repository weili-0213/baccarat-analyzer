/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * History Test
 */

import History from "../engine/history.js";
import RoundResult from "../engine/roundResult.js";
import Hand from "../engine/hand.js";
import Card from "../engine/card.js";

function assert(condition, message) {

    if (!condition) {

        throw new Error(message);

    }

}

/**
 * 建立 RoundResult
 */
function createResult({

    winner,

    playerScore,

    bankerScore,

    playerPair = false,

    bankerPair = false,

    natural = false,

    super6 = false

}) {

    const player = new Hand();
    const banker = new Hand();

    player.add(new Card("A", "S"));
    banker.add(new Card("2", "H"));

    const result = new RoundResult(
        player,
        banker
    );

    // 覆寫測試資料
    result.winner = winner;
    result.playerScore = playerScore;
    result.bankerScore = bankerScore;
    result.playerPair = playerPair;
    result.bankerPair = bankerPair;
    result.natural = natural;
    result.super6 = super6;

    return result;

}

export default async function historyTest() {

    const details = [];

    /**
     * 建立
     */

    const history = new History();

    assert(
        history.count === 0,
        "History 初始 count 應為 0"
    );

    details.push("建立 History：PASS");


    /**
     * 新增三局
     */

    history.add(

        createResult({

            winner: "Player",

            playerScore: 8,

            bankerScore: 5,

            playerPair: true,

            natural: true

        })

    );

    history.add(

        createResult({

            winner: "Banker",

            playerScore: 4,

            bankerScore: 6,

            super6: true

        })

    );

    history.add(

        createResult({

            winner: "Tie",

            playerScore: 7,

            bankerScore: 7

        })

    );

    assert(
        history.count === 3,
        "History count 應為 3"
    );

    details.push("新增 RoundResult：PASS");


    /**
     * last
     */

    assert(

        history.last.winner === "Tie",

        "最後一局應為 Tie"

    );

    details.push("last：PASS");


    /**
     * 勝率統計
     */

    const stats = history.statistics();

    assert(
        stats.playerWins === 1,
        "Player Wins 應為 1"
    );

    assert(
        stats.bankerWins === 1,
        "Banker Wins 應為 1"
    );

    assert(
        stats.ties === 1,
        "Tie 應為 1"
    );

    details.push("勝負統計：PASS");


    /**
     * Pair
     */

    assert(
        stats.playerPairs === 1,
        "Player Pair 應為 1"
    );

    assert(
        stats.bankerPairs === 0,
        "Banker Pair 應為 0"
    );

    details.push("Pair：PASS");


    /**
     * Natural
     */

    assert(
        stats.naturals === 1,
        "Natural 應為 1"
    );

    details.push("Natural：PASS");


    /**
     * Super 6
     */

    assert(
        stats.super6 === 1,
        "Super6 應為 1"
    );

    details.push("Super6：PASS");


    /**
     * JSON
     */

    const json = history.toJSON();

    const restored =
        History.fromJSON(json);

    assert(
        restored.count === 3,
        "JSON 還原 count 應為 3"
    );

    assert(
        restored.last.winner === "Tie",
        "JSON 還原最後一局應為 Tie"
    );

    details.push("JSON：PASS");


    /**
     * Clear
     */

    restored.clear();

    assert(
        restored.count === 0,
        "clear() 後 count 應為 0"
    );

    details.push("Clear：PASS");


    return [

        "History 測試全部完成",

        "",

        ...details,

        "",

        `總局數：${history.count}`,

        `Player：${stats.playerWins}`,

        `Banker：${stats.bankerWins}`,

        `Tie：${stats.ties}`,

        `Natural：${stats.naturals}`,

        `Player Pair：${stats.playerPairs}`,

        `Super6：${stats.super6}`

    ].join("\n");

}
