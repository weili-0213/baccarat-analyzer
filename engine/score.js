/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Score Helper
 */

import Card from "./card.js";

/**
 * 單張牌點數
 */
export function cardValue(card) {

    if (!(card instanceof Card)) {
        throw new Error("Invalid Card");
    }

    return card.baccaratValue;

}

/**
 * 手牌點數
 */
export function baccaratScore(cards) {

    let total = 0;

    for (const card of cards) {
        total += cardValue(card);
    }

    return total % 10;

}

/**
 * Natural
 */
export function isNatural(cards) {

    if (cards.length !== 2) {
        return false;
    }

    const score = baccaratScore(cards);

    return score === 8 || score === 9;

}

/**
 * 比較兩手牌
 *
 * 回傳：
 * 1  Player Win
 * 0  Tie
 * -1 Banker Win
 */
export function compareHands(playerCards, bankerCards) {

    const player = baccaratScore(playerCards);
    const banker = baccaratScore(bankerCards);

    if (player > banker) return 1;
    if (player < banker) return -1;

    return 0;

}

/**
 * 勝差
 */
export function scoreMargin(playerCards, bankerCards) {

    return Math.abs(
        baccaratScore(playerCards) -
        baccaratScore(bankerCards)
    );

}
