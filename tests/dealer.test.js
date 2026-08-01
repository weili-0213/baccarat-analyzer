/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Dealer Test
 *
 * 測試：
 * 1. Shoe
 * 2. Burn
 * 3. Dealer
 * 4. Round
 * 5. RoundResult
 */

import Shoe from "../engine/shoe.js";
import Burn from "../engine/burn.js";
import Dealer from "../engine/dealer.js";

export default async function dealerTest() {

    console.log("========== Dealer Test ==========");

    //
    // 建立牌靴
    //
    const shoe = new Shoe(8);

    shoe.shuffle();

    console.log("Deck Count :", shoe.deckCount);
    console.log("Total Cards :", shoe.total);

    //
    // 開靴燒牌
    //
    const burn = new Burn(shoe);

    const burnResult = burn.execute();

    console.log(
        "Burn Card :",
        burnResult.indicator.toString()
    );

    console.log(
        "Burn Count:",
        burnResult.amount
    );

    //
    // 建立 Dealer
    //
    const dealer = new Dealer(shoe);

    //
    // 完成一局
    //
    const result = dealer.play();

    console.log("");

    console.log("Winner :", result.winner);

    console.log("");

    console.log(
        "Player Cards :",
        dealer.playerHand.toString()
    );

    console.log(
        "Player Score :",
        dealer.playerScore
    );

    console.log("");

    console.log(
        "Banker Cards :",
        dealer.bankerHand.toString()
    );

    console.log(
        "Banker Score :",
        dealer.bankerScore
    );

    console.log("");

    console.log(
        "Dealer Finished :",
        dealer.finished
    );

    console.log(
        "Dealer.result === result :",
        dealer.result === result
    );

    console.log(
        "Round.result === result :",
        dealer.currentRound.result === result
    );

    console.log("");

    //
    // Assertions
    //

    console.assert(

        dealer.finished === true,

        "Dealer 應該完成"

    );

    console.assert(

        dealer.result === result,

        "Dealer.result 應等於回傳 Result"

    );

    console.assert(

        dealer.currentRound.result === result,

        "Round.result 應等於回傳 Result"

    );

    console.assert(

        dealer.playerHand.count >= 2,

        "Player 至少兩張牌"

    );

    console.assert(

        dealer.bankerHand.count >= 2,

        "Banker 至少兩張牌"

    );

    console.assert(

        ["player","banker","tie"].includes(
            result.winner?.toLowerCase()
        ),

        "Winner 必須為 player、banker 或 tie"

    );

    console.log("");

    console.log("✅ Dealer Test PASS");

}
