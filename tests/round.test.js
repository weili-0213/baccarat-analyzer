/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Round Test
 */

import Card from "../engine/card.js";
import Round, {
    RoundState
} from "../engine/round.js";


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
 * 測試指定錯誤必須發生
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


export default async function roundTest() {

    const details = [];

    /*
     * 測試 1：
     * 建立空 Round
     */
    const emptyRound =
        new Round();

    assert(
        emptyRound.state ===
            RoundState.ACTIVE,
        "新 Round 應為 ACTIVE"
    );

    assert(
        emptyRound.finished === false,
        "新 Round 不應完成"
    );

    assert(
        emptyRound.result === null,
        "新 Round 的 result 應為 null"
    );

    assert(
        emptyRound.player.count === 0,
        "新 Round 的 Player 應為空手牌"
    );

    assert(
        emptyRound.banker.count === 0,
        "新 Round 的 Banker 應為空手牌"
    );

    details.push(
        "建立 Round：PASS"
    );


    /*
     * 測試 2：
     * Player 勝
     *
     * Player:
     * 4 + 5 = 9
     *
     * Banker:
     * 2 + 3 = 5
     */
    const playerWinRound =
        new Round();

    playerWinRound.deal(
        "player",
        card("4", "S")
    );

    playerWinRound.deal(
        "banker",
        card("2", "H")
    );

    playerWinRound.deal(
        "player",
        card("5", "D")
    );

    playerWinRound.deal(
        "banker",
        card("3", "C")
    );

    assert(
        playerWinRound.playerScore === 9,
        "Player 點數應為 9"
    );

    assert(
        playerWinRound.bankerScore === 5,
        "Banker 點數應為 5"
    );

    assert(
        playerWinRound.isNatural === true,
        "Player 兩張 9 點應為 Natural"
    );

    const playerWinResult =
        playerWinRound.finish();

    assert(
        playerWinResult.winner ===
            "Player",
        "此局應為 Player 勝"
    );

    assert(
        playerWinRound.finished === true,
        "finish() 後 Round 應完成"
    );

    assert(
        playerWinRound.state ===
            RoundState.FINISHED,
        "finish() 後 state 應為 FINISHED"
    );

    assert(
        playerWinRound.result ===
            playerWinResult,
        "Round.result 應等於 finish() 回傳值"
    );

    assert(
        playerWinRound.winner ===
            "Player",
        "Round.winner 應為 Player"
    );

    details.push(
        "Player 勝與 Natural：PASS"
    );


    /*
     * 測試 3：
     * 重複 finish()
     *
     * 必須回傳同一物件。
     */
    const repeatedResult =
        playerWinRound.finish();

    assert(
        repeatedResult ===
            playerWinResult,
        "重複 finish() 應回傳同一 RoundResult"
    );

    details.push(
        "重複 finish()：PASS"
    );


    /*
     * 測試 4：
     * 完成後禁止繼續發牌
     */
    assertThrows(
        () => {

            playerWinRound.deal(
                "player",
                card("A", "S")
            );

        },
        "完成後繼續發牌應丟出錯誤"
    );

    details.push(
        "完成後禁止發牌：PASS"
    );


    /*
     * 測試 5：
     * Banker 勝
     *
     * Player:
     * 2 + 3 = 5
     *
     * Banker:
     * 4 + 3 = 7
     */
    const bankerWinRound =
        new Round();

    bankerWinRound.deal(
        "player",
        card("2", "S")
    );

    bankerWinRound.deal(
        "banker",
        card("4", "H")
    );

    bankerWinRound.deal(
        "player",
        card("3", "D")
    );

    bankerWinRound.deal(
        "banker",
        card("3", "C")
    );

    const bankerWinResult =
        bankerWinRound.finish();

    assert(
        bankerWinResult.winner ===
            "Banker",
        "此局應為 Banker 勝"
    );

    assert(
        bankerWinResult.playerScore === 5,
        "Player 點數應為 5"
    );

    assert(
        bankerWinResult.bankerScore === 7,
        "Banker 點數應為 7"
    );

    details.push(
        "Banker 勝：PASS"
    );


    /*
     * 測試 6：
     * Tie
     *
     * Player:
     * 2 + 4 = 6
     *
     * Banker:
     * A + 5 = 6
     */
    const tieRound =
        new Round();

    tieRound.deal(
        "player",
        card("2", "S")
    );

    tieRound.deal(
        "banker",
        card("A", "H")
    );

    tieRound.deal(
        "player",
        card("4", "D")
    );

    tieRound.deal(
        "banker",
        card("5", "C")
    );

    const tieResult =
        tieRound.finish();

    assert(
        tieResult.winner === "Tie",
        "此局應為 Tie"
    );

    assert(
        tieResult.margin === 0,
        "Tie 的 margin 應為 0"
    );

    details.push(
        "Tie：PASS"
    );


    /*
     * 測試 7：
     * Player Pair
     */
    const pairRound =
        new Round();

    pairRound.deal(
        "player",
        card("7", "S")
    );

    pairRound.deal(
        "banker",
        card("2", "H")
    );

    pairRound.deal(
        "player",
        card("7", "D")
    );

    pairRound.deal(
        "banker",
        card("4", "C")
    );

    const pairResult =
        pairRound.finish();

    assert(
        pairResult.playerPair === true,
        "Player 應為 Pair"
    );

    assert(
        pairResult.bankerPair === false,
        "Banker 不應為 Pair"
    );

    details.push(
        "Pair：PASS"
    );


    /*
     * 測試 8：
     * 第三張牌
     *
     * Player:
     * A + 2 + 6 = 9
     *
     * Banker:
     * 3 + 4 = 7
     */
    const thirdCardRound =
        new Round();

    thirdCardRound.deal(
        "player",
        card("A", "S")
    );

    thirdCardRound.deal(
        "banker",
        card("3", "H")
    );

    thirdCardRound.deal(
        "player",
        card("2", "D")
    );

    thirdCardRound.deal(
        "banker",
        card("4", "C")
    );

    thirdCardRound.deal(
        "player",
        card("6", "H")
    );

    assert(
        thirdCardRound.player.count === 3,
        "Player 應有三張牌"
    );

    assert(
        thirdCardRound.playerScore === 9,
        "Player 三張牌後應為 9 點"
    );

    const thirdCardResult =
        thirdCardRound.finish();

    assert(
        thirdCardResult.winner ===
            "Player",
        "第三張牌測試應為 Player 勝"
    );

    details.push(
        "第三張牌：PASS"
    );


    /*
     * 測試 9：
     * 每方最多三張
     */
    assertThrows(
        () => {

            thirdCardRound.deal(
                "player",
                card("8", "C")
            );

        },
        "完成後或超過三張應禁止發牌"
    );

    details.push(
        "手牌上限：PASS"
    );


    /*
     * 測試 10：
     * 非法 side
     */
    const invalidSideRound =
        new Round();

    assertThrows(
        () => {

            invalidSideRound.deal(
                "tie",
                card("A", "S")
            );

        },
        "非法 side 應丟出錯誤"
    );

    details.push(
        "非法 side 驗證：PASS"
    );


    /*
     * 測試 11：
     * 不足四張時不可 finish
     */
    const incompleteRound =
        new Round();

    incompleteRound.deal(
        "player",
        card("A", "S")
    );

    incompleteRound.deal(
        "banker",
        card("2", "H")
    );

    assertThrows(
        () => {

            incompleteRound.finish();

        },
        "雙方未滿兩張時不可 finish"
    );

    details.push(
        "未完成牌局驗證：PASS"
    );


    /*
     * 測試 12：
     * JSON
     */
    const json =
        pairRound.toJSON();

    assert(
        json.state ===
            RoundState.FINISHED,
        "JSON state 應為 FINISHED"
    );

    assert(
        json.player.cards.length === 2,
        "JSON Player 應有兩張牌"
    );

    assert(
        json.banker.cards.length === 2,
        "JSON Banker 應有兩張牌"
    );

    const restored =
        Round.fromJSON(json);

    assert(
        restored.finished === true,
        "還原後 Round 應為 FINISHED"
    );

    assert(
        restored.playerScore ===
            pairRound.playerScore,
        "還原後 Player 點數應一致"
    );

    assert(
        restored.bankerScore ===
            pairRound.bankerScore,
        "還原後 Banker 點數應一致"
    );

    assert(
        restored.result.winner ===
            pairRound.result.winner,
        "還原後 Winner 應一致"
    );

    assert(
        restored.result.playerPair ===
            true,
        "還原後 Player Pair 應一致"
    );

    details.push(
        "JSON 還原：PASS"
    );


    return [
        "Round 測試全部完成",
        "",
        ...details,
        "",
        `Player 勝案例：${playerWinResult.playerScore} - ${playerWinResult.bankerScore}`,
        `Banker 勝案例：${bankerWinResult.playerScore} - ${bankerWinResult.bankerScore}`,
        `Tie 案例：${tieResult.playerScore} - ${tieResult.bankerScore}`,
        `Pair 案例：Player Pair = ${pairResult.playerPair}`
    ].join("\n");

}
