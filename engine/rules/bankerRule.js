import { bankerThirdCardRule } from "./thirdCardRule.js";

/**
 * 莊家補牌規則
 */

export function bankerMustDraw(
    hand,
    playerThirdCard = null
) {

    if (hand.isNatural) {
        return false;
    }

    if (!playerThirdCard) {
        return hand.value <= 5;
    }

    return bankerThirdCardRule(
        hand.value,
        playerThirdCard
    );

}
