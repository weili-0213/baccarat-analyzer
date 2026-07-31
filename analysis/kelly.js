/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Kelly Criterion v5
 *
 * Bet Decision Engine
 *
 * 功能：
 * 1. Kelly
 * 2. Fraction Kelly
 * 3. EV
 * 4. ROI
 * 5. Risk
 * 6. Confidence
 * 7. Score
 * 8. Ranking
 */

import { calculateEV } from "./ev.js";

export function calculateKelly(probability, odds) {

    const b = odds;
    const p = probability;
    const q = 1 - p;

    return (b * p - q) / b;

}

export function safeKelly(probability, odds) {

    return Math.max(
        0,
        calculateKelly(probability, odds)
    );

}

export function fractionalKelly(
    probability,
    odds,
    fraction = 0.5
){

    return (
        safeKelly(probability, odds)
        * fraction
    );

}

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
 * ROI
 */

export function expectedROI(
    probability,
    odds
){

    return calculateEV(
        probability,
        odds
    );

}

/**
 * Risk
 *
 * EV越高
 * Kelly越小
 * 代表越安全
 */

export function riskScore(

    probability,

    odds

){

    const ev =
        expectedEV(
            probability,
            odds
        );

    const k =
        safeKelly(
            probability,
            odds
        );

    return Math.max(

        0,

        1 - (ev + k)

    );

}

/**
 * Confidence
 *
 * EV + Kelly
 */

export function confidenceScore(

    probability,

    odds

){

    const ev =
        expectedEV(
            probability,
            odds
        );

    const k =
        safeKelly(
            probability,
            odds
        );

    return Math.max(

        0,

        ev + k

    );

}

/**
 * 綜合評分
 */

export function recommendationScore({

    probability,

    odds,

    evWeight = 0.5,

    kellyWeight = 0.3,

    confidenceWeight = 0.2

}){

    const ev =
        expectedEV(
            probability,
            odds
        );

    const k =
        safeKelly(
            probability,
            odds
        );

    const c =
        confidenceScore(
            probability,
            odds
        );

    return (

        ev * evWeight +

        k * kellyWeight +

        c * confidenceWeight

    );

}

/**
 * 完整分析
 */

export function analyzeBet({

    name,

    bankroll,

    probability,

    odds,

    fraction = 0.5

}){

    const ev =
        expectedEV(
            probability,
            odds
        );

    const kelly =
        safeKelly(
            probability,
            odds
        );

    const confidence =
        confidenceScore(
            probability,
            odds
        );

    const risk =
        riskScore(
            probability,
            odds
        );

    return {

        name,

        probability,

        odds,

        ev,

        roi: ev,

        kelly,

        halfKelly:
            kelly * 0.5,

        quarterKelly:
            kelly * 0.25,

        suggestedBet:
            recommendedBet({

                bankroll,

                probability,

                odds,

                fraction

            }),

        confidence,

        risk,

        score:
            recommendationScore({

                probability,

                odds

            })

    };

}

/**
 * 分析全部下注
 */

export function analyzeAll({

    bankroll,

    bets

}){

    return bets

        .map(

            bet =>

                analyzeBet({

                    bankroll,

                    ...bet

                })

        )

        .sort(

            (a,b)=>b.score-a.score

        );

}

/**
 * 最佳下注
 */

export function bestBet(results){

    return results[0] ?? null;

}

/**
 * 前N名推薦
 */

export function topRecommendations(

    results,

    count = 3

){

    return results.slice(

        0,

        count

    );

}

/**
 * 不建議下注
 */

export function rejectedBets(results){

    return results.filter(

        bet =>

            bet.ev <= 0

    );

}
