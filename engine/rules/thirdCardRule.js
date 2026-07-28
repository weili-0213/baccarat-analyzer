/**
 * 莊家第三張補牌表
 */

export function bankerThirdCardRule(
    bankerValue,
    playerThirdCard
) {

    if (!playerThirdCard) {
        throw new Error("Player third card required");
    }

    const rank = playerThirdCard.rank;

    if (bankerValue <= 2) {
        return true;
    }

    if (bankerValue === 3) {
        return rank !== "8";
    }

    if (bankerValue === 4) {
        return [
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
        ].includes(rank);
    }

    if (bankerValue === 5) {
        return [
            "4",
            "5",
            "6",
            "7"
        ].includes(rank);
    }

    if (bankerValue === 6) {
        return [
            "6",
            "7"
        ].includes(rank);
    }

    return false;

}
│   ├── round.js
 * Baccarat Analyzer
 *
 * Baccarat Rules
 */

import Hand from "./hand.js";
import RoundResult from "./roundResult.js";
import { drawTo } from "./draw.js";
import { playerMustDraw } from "./rules/playerRule.js";
import { bankerMustDraw } from "./rules/bankerRule.js";


export function playRound(shoe){

    const player = new Hand();
    const banker = new Hand();


    drawTo(player, shoe);
    drawTo(banker, shoe);

    drawTo(player, shoe);
    drawTo(banker, shoe);


    if(player.isNatural || banker.isNatural){

        return new RoundResult(
            player,
            banker
        );

    }


    if(playerMustDraw(player)){

        drawTo(player, shoe);

    }


    const playerThird =
        player.count === 3
        ?
        player.lastCard
        :
        null;



    if(
        bankerMustDraw(
            banker,
            playerThird
        )
    ){

        drawTo(banker, shoe);

    }


    return new RoundResult(
        player,
        banker
    );

}    
