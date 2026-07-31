/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Validator
 *
 * 驗證百家樂資料是否合法
 *
 */

import Card from "./card.js";
import Hand from "./hand.js";


/**
 * 是否為 Card
 */
export function isCard(card) {

    return card instanceof Card;

}


/**
 * 是否為 Hand
 */
export function isHand(hand) {

    return hand instanceof Hand;

}


/**
 * 驗證 Card
 */
export function validateCard(card) {

    if (!isCard(card)) {

        throw new Error("Invalid Card");

    }

    return true;

}


/**
 * 驗證 Hand
 */
export function validateHand(hand) {

    if (!isHand(hand)) {

        throw new Error("Invalid Hand");

    }

    return true;

}


/**
 * 驗證牌數
 *
 * 百家樂只能 2 或 3 張
 */
export function validateHandSize(hand) {

    validateHand(hand);

    if (
        hand.count < 2 ||
        hand.count > 3
    ) {

        throw new Error(
            `Invalid hand size : ${hand.count}`
        );

    }

    return true;

}


/**
 * 驗證是否兩張起始牌
 */
export function validateInitialHand(hand) {

    validateHand(hand);

    if (hand.count !== 2) {

        throw new Error(
            "Initial hand must contain exactly 2 cards"
        );

    }

    return true;

}


/**
 * 驗證是否完成一局
 *
 * Player / Banker
 * 都只能 2 或 3 張
 */
export function validateRound(
    player,
    banker
) {

    validateHandSize(player);
    validateHandSize(banker);

    return true;

}


/**
 * 驗證是否可以開始一局
 *
 * 至少需要四張牌
 */
export function validateShoe(shoe) {

    if (!shoe) {

        throw new Error("Shoe required");

    }

    if (shoe.remaining < 4) {

        throw new Error(
            "Not enough cards in shoe"
        );

    }

    return true;

}


/**
 * 是否有足夠牌可以發
 */
export function hasEnoughCards(
    shoe,
    amount = 1
) {

    if (!shoe) {

        return false;

    }

    return shoe.remaining >= amount;

}
