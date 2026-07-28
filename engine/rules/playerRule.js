/**
 * 閒家補牌規則
 *
 * Natural 8/9 不補牌
 * 0~5 補牌
 * 6~7 停牌
 */

export function playerMustDraw(hand) {

    if (hand.isNatural) {
        return false;
    }

    return hand.value <= 5;

}
