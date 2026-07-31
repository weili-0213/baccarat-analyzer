/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Kelly Criterion v4
 *
 * 支援：
 * Player
 * Banker
 * Tie
 * Player Pair
 * Banker Pair
 * Super 6
 * Dragon Bonus
 * 任意 Side Bet
 */

import { calculateEV } from "./ev.js";

/**
 * Kelly Formula
 *
 * b = 賠率
 * p = 勝率
 *
 * f = (bp-q)/b
 */
export function calculateKelly(probability, odds) {

    const p = probability;
    const q = 1 - probability;
    const b = odds;

    return (b * p - q) / b;

}

/**
 * Kelly不能小於0
 */
export function safeKelly(probability, odds) {

    return Math.max(
        0,
        calculateKelly(probability, odds)
    );

}

/**
 * Fraction Kelly
 */
export function fractionalKelly(
    probability,
    odds,
    fraction = 0.5
){

    return (
        safeKelly(
            probability,
            odds
        ) * fraction
    );

}

/**
 * 建議下注金額
 */
export function recommendedBet({

    bankroll,

    probability,

    odds,

    fraction = 0.5

}){

    return bankroll *

        fractionalKelly(
            probability,
            odds,
            fraction
        );

}

/**
 * 限制下注比例
 *
 * 預設最多5%
 */
export function cappedBet({

    bankroll,

    probability,

    odds,

    fraction = 0.5,

    maxPercent = 0.05

}){

    const bet =
        recommendedBet({

            bankroll,

            probability,

            odds,

            fraction

        });

    return Math.min(

        bet,

        bankroll * maxPercent

    );

}

/**
 * EV
 */
export function expectedEV(
    probability,
    odds
){

    return calculateEV(
        probability,
        odds
    );

}

/**
 * 是否值得下注
 */
export function shouldBet(
    probability,
    odds
){

    return expectedEV(
        probability,
        odds
    ) > 0;

}

/**
 * 單一投注分析
 */
export function analyzeBet({

    name,

    probability,

    odds,

    bankroll,

    fraction = 0.5

}){

    return {

        name,

        probability,

        odds,

        ev:
            expectedEV(
                probability,
                odds
            ),

        kelly:
            safeKelly(
                probability,
                odds
            ),

        halfKelly:
            fractionalKelly(
                probability,
                odds,
                0.5
            ),

        quarterKelly:
            fractionalKelly(
                probability,
                odds,
                0.25
            ),

        suggestedBet:
            recommendedBet({

                bankroll,

                probability,

                odds,

                fraction

            }),

        cappedBet:
            cappedBet({

                bankroll,

                probability,

                odds,

                fraction

            }),

        shouldBet:
            shouldBet(
                probability,
                odds
            )

    };

}

/**
 * 多個下注一起分析
 */
export function analyzeAll({

    bankroll,

    bets,

    fraction = 0.5

}){

    return bets.map(

        bet =>

            analyzeBet({

                bankroll,

                fraction,

                ...bet

            })

    );

}

/**
 * 找最佳下注
 */
export function bestBet(results){

    if(results.length === 0){

        return null;

    }

    return [...results]

        .sort(

            (a,b)=>b.ev-a.ev

        )[0];

}
