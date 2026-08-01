/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Dealer Test
 */

import Shoe
    from "../engine/shoe.js";

import Burn
    from "../engine/burn.js";

import Dealer
    from "../engine/dealer.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(
            message
        );

    }

}


export default async function dealerTest() {

    const shoe =
        new Shoe(8);

    const burn =
        new Burn(shoe);

    const burnResult =
        burn.execute();

    const dealer =
        new Dealer(shoe);

    const result =
        dealer.play();


    assert(

        result !== null,

        "Dealer.play() 必須回傳 RoundResult"

    );


    assert(

        [
            "player",
            "banker",
            "tie"
        ].includes(
            result.winner
                .toLowerCase()
        ),

        "Winner 必須是 Player、Banker 或 Tie"

    );


    assert(

        dealer.finished === true,

        "Dealer 應該進入 FINISHED 狀態"

    );


    assert(

        dealer.result === result,

        "Dealer.result 應與 play() 回傳結果相同"

    );


    assert(

        dealer.currentRound
            .result === result,

        "Round.result 應與 play() 回傳結果相同"

    );


    assert(

        dealer.playerHand.count >= 2 &&
        dealer.playerHand.count <= 3,

        "Player 手牌必須為 2 或 3 張"

    );


    assert(

        dealer.bankerHand.count >= 2 &&
        dealer.bankerHand.count <= 3,

        "Banker 手牌必須為 2 或 3 張"

    );


    assert(

        dealer.playerScore >= 0 &&
        dealer.playerScore <= 9,

        "Player 點數必須介於 0 到 9"

    );


    assert(

        dealer.bankerScore >= 0 &&
        dealer.bankerScore <= 9,

        "Banker 點數必須介於 0 到 9"

    );


    assert(

        shoe.remaining < shoe.total,

        "完成燒牌與一局後，剩餘牌數應減少"

    );


    return [

        `燒牌指示牌：${burnResult.indicator.toString()}`,

        `燒牌張數：${burnResult.amount}`,

        `閒家：${dealer.playerHand.toString()}`,

        `閒家點數：${dealer.playerScore}`,

        `莊家：${dealer.bankerHand.toString()}`,

        `莊家點數：${dealer.bankerScore}`,

        `勝方：${result.winner}`,

        `剩餘牌數：${shoe.remaining}`

    ].join("\n");

}
