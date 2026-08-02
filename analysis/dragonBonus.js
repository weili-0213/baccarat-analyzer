/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * analysis/dragonBonus.js
 *
 * Dragon Bonus EV 狀態說明。
 *
 * Dragon Bonus 採分級賠率，必須使用：
 *
 * - Natural 勝
 * - 勝 4 點
 * - 勝 5 點
 * - 勝 6 點
 * - 勝 7 點
 * - 勝 8 點
 * - 勝 9 點
 *
 * 各情境機率乘上對應淨賠率後，再扣除輸掉機率。
 *
 * 在分析器尚未提供完整分差機率分布前，
 * Dragon Bonus 不可產生正式 EV，也不可加入 Recommendation。
 */

export const DRAGON_BONUS_STATUS =
    Object.freeze({

        UNAVAILABLE:
            "unavailable",

        AVAILABLE:
            "available"

    });


export const DRAGON_BONUS_REASON =
    "Dragon Bonus requires a complete margin-of-victory probability distribution.";


export function createUnavailableDragonBonus(
    side
) {

    if (
        side !== "player" &&
        side !== "banker"
    ) {

        throw new Error(
            `Invalid Dragon Bonus side: ${side}`
        );

    }


    return {

        side,

        status:
            DRAGON_BONUS_STATUS.UNAVAILABLE,

        available:
            false,

        provisional:
            true,

        recommendationEligible:
            false,

        ev:
            0,

        reason:
            DRAGON_BONUS_REASON

    };

}


export default function dragonBonus() {

    return {

        player:
            createUnavailableDragonBonus(
                "player"
            ),

        banker:
            createUnavailableDragonBonus(
                "banker"
            )

    };

}
