/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Score Helper
 *
 * 百家樂點數計算
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
 * 計算手牌點數
 */
export function baccaratScore(cards) {

    if (!Array.isArray(cards)) {
        throw new Error("Cards must be an array");
    }

    let total = 0;

    for (const card of cards) {

        total += cardValue(card);

    }

    return total % 10;
}

/**
 * 是否 Natural
 */
export function isNatural(cards) {

    if (cards.length !== 2) {
        return false;
    }

    const score = baccaratScore(cards);

    return score === 8 || score === 9;

}
