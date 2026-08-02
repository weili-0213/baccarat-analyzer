/**
 * Baccarat Analyzer V3.4
 * tests/recommendationEngine.test.js
 */

import Recommendation, {
    ACTION,
    RECOMMENDATION_ENGINE_VERSION
} from "../analysis/recommendation.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(
            message
        );

    }

}


function item(
    name,
    {
        ev,
        kelly,
        amount,
        confidence = 0.85,
        risk = 0.2,
        score = 0.8,
        eligible = true
    }
) {

    return {

        name,

        label:
            name,

        probability:
            0.45,

        ev,

        kelly,

        amount,

        confidence,

        risk,

        score,

        eligible,

        recommendationEligible:
            true

    };

}


export default async function recommendationEngineTest() {

    const messages =
        [];


    const engine =
        new Recommendation({

            minimumEV:
                0,

            minimumConfidence:
                0.6,

            minBet:
                100,

            maxBet:
                10000,

            roundTo:
                100,

            candidateCount:
                3

        });


    assert(
        RECOMMENDATION_ENGINE_VERSION ===
            "3.4.0",
        "Recommendation Engine 版本錯誤"
    );

    messages.push(
        "✓ V3.4 版本正確"
    );


    const recommendation =
        engine.calculate([

            item(
                "banker",
                {
                    ev:
                        0.018,

                    kelly:
                        0.04,

                    amount:
                        550
                }
            ),

            item(
                "player",
                {
                    ev:
                        0.011,

                    kelly:
                        0.025,

                    amount:
                        360
                }
            ),

            item(
                "tie",
                {
                    ev:
                        0.006,

                    kelly:
                        0.01,

                    amount:
                        180
                }
            )

        ]);


    assert(
        recommendation.action ===
            ACTION.BET,
        "正 EV 候選應建議下注"
    );

    assert(
        recommendation.bet ===
            "banker",
        "應選最高 EV 候選"
    );

    assert(
        recommendation.amount ===
            500,
        "下注金額應依 roundTo 向下取整"
    );

    assert(
        recommendation.candidates
            .length ===
            3,
        "應輸出 Top 3"
    );

    assert(
        recommendation.candidates[0]
            .ev >
        recommendation.candidates[1]
            .ev,
        "候選應依 EV 排序"
    );

    assert(
        recommendation.candidates[0]
            .recommendationRank ===
            1,
        "第一候選排名錯誤"
    );

    messages.push(
        "✓ Top 3 EV 排名正確"
    );

    messages.push(
        "✓ Kelly 金額限制正確"
    );


    const capped =
        engine.calculate([

            item(
                "banker",
                {
                    ev:
                        0.02,

                    kelly:
                        0.2,

                    amount:
                        25000
                }
            )

        ]);


    assert(
        capped.amount ===
            10000,
        "下注金額不得超過 maxBet"
    );

    messages.push(
        "✓ 最高下注限制正確"
    );


    const belowMinimum =
        engine.calculate([

            item(
                "player",
                {
                    ev:
                        0.01,

                    kelly:
                        0.005,

                    amount:
                        80
                }
            )

        ]);


    assert(
        belowMinimum.shouldBet ===
            false,
        "低於最低下注應不下注"
    );

    messages.push(
        "✓ 最低下注限制正確"
    );


    const skip =
        engine.calculate([

            item(
                "player",
                {
                    ev:
                        -0.01,

                    kelly:
                        0,

                    amount:
                        0
                }
            ),

            item(
                "banker",
                {
                    ev:
                        0,

                    kelly:
                        0,

                    amount:
                        0
                }
            )

        ]);


    assert(
        skip.action ===
            ACTION.SKIP,
        "全部非正 EV 時應不下注"
    );

    assert(
        skip.label ===
            "不下注",
        "不下注標籤錯誤"
    );

    assert(
        skip.candidates.length ===
            0,
        "不下注時候選應為空"
    );

    messages.push(
        "✓ 不下注策略正確"
    );


    const json =
        engine.toJSON();


    assert(
        json.minBet ===
            100 &&
        json.maxBet ===
            10000 &&
        json.roundTo ===
            100,
        "序列化下注限制錯誤"
    );

    messages.push(
        "✓ 設定序列化正確"
    );


    return `

${messages.join("\n")}

Recommendation Engine V3.4 測試完成

Top 3：通過
EV 排序：通過
Kelly 金額：通過
下注限制：通過
不下注策略：通過

`;

}
