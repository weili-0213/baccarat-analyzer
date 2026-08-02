/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * tests/recommendation.test.js
 *
 * Recommendation 元件瀏覽器測試。
 *
 * 此版本只使用目前公開的：
 *
 * - default createRecommendation
 * - named Recommendation
 *
 * 測試重點：
 *
 * 1. constructor()
 * 2. mount()
 * 3. 空資料狀態
 * 4. setAnalysis()
 * 5. setRecommendation()
 * 6. shouldBet true / false
 * 7. Ranking
 * 8. setOptions()
 * 9. summary
 * 10. toJSON()
 * 11. fromJSON()
 * 12. clear()
 * 13. destroy()
 */

import createRecommendation, {
    Recommendation
} from "../components/Recommendation.js";


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


function assertThrows(
    callback,
    message
) {

    let caught =
        null;

    try {

        callback();

    }
    catch (error) {

        caught =
            error;

    }

    assert(
        caught instanceof Error,
        message
    );

    return caught;

}


function approximatelyEqual(
    left,
    right,
    tolerance = 1e-12
) {

    return (
        Math.abs(
            left - right
        ) <= tolerance
    );

}


function createRoot() {

    const root =
        document.createElement(
            "div"
        );

    root.className =
        "recommendationTestRoot";

    document.body.appendChild(
        root
    );

    return root;

}


function createAnalysis({

    shouldBet = true,

    bet = "banker",

    amount = 300,

    reason = null

} = {}) {

    const recommendation = {

        shouldBet,

        bet:
            shouldBet
                ? bet
                : null,

        key:
            shouldBet
                ? bet
                : null,

        name:
            shouldBet
                ? bet
                : null,

        amount:
            shouldBet
                ? amount
                : 0,

        ev:
            shouldBet
                ? 0.0085
                : null,

        kelly:
            shouldBet
                ? 0.031
                : null,

        risk:
            shouldBet
                ? 0.22
                : null,

        confidence:
            0.82,

        reason:
            reason ??
            (
                shouldBet

                    ? "莊家目前具有最高正期望值。"

                    : "目前沒有符合條件的正期望下注。"
            )

    };


    return {

        method:
            "mock",

        probability: {

            player:
                0.44,

            banker:
                0.47,

            tie:
                0.09

        },

        ev: {

            player:
                -0.012,

            banker:
                0.0085,

            tie:
                -0.13

        },

        kelly: {

            banker:
                0.031

        },

        risk: {

            banker:
                0.22

        },

        confidence: {

            overall:
                0.82

        },

        overallConfidence:
            0.82,

        ranking: [

            {
                key:
                    "banker",

                name:
                    "banker",

                score:
                    0.91,

                ev:
                    0.0085,

                confidence:
                    0.82
            },

            {
                key:
                    "player",

                name:
                    "player",

                score:
                    0.52,

                ev:
                    -0.012,

                confidence:
                    0.66
            },

            {
                key:
                    "small",

                name:
                    "small",

                score:
                    0.4,

                ev:
                    -0.02,

                confidence:
                    0.6
            },

            {
                key:
                    "tie",

                name:
                    "tie",

                score:
                    0.1,

                ev:
                    -0.13,

                confidence:
                    0.4
            }

        ],

        best: {

            key:
                bet,

            name:
                bet,

            bet,

            score:
                0.91,

            ev:
                shouldBet
                    ? 0.0085
                    : -0.01,

            value:
                shouldBet
                    ? 0.0085
                    : -0.01,

            kelly:
                shouldBet
                    ? 0.031
                    : 0,

            risk:
                0.22,

            confidence:
                0.82,

            amount:
                shouldBet
                    ? amount
                    : 0

        },

        shouldBet,

        recommendation

    };

}


function readRecommendedKey(component) {

    return (

        component.recommendedKey ??

        component.summary
            ?.recommendedKey ??

        component.data
            ?.recommendation
            ?.bet ??

        component.data
            ?.recommendation
            ?.key ??

        component.data
            ?.best
            ?.key ??

        null

    );

}


function readAmount(component) {

    return (

        component.recommendedAmount ??

        component.summary
            ?.amount ??

        component.data
            ?.recommendation
            ?.amount ??

        0

    );

}


function readReason(component) {

    return (

        component.reason ??

        component.summary
            ?.reason ??

        component.data
            ?.recommendation
            ?.reason ??

        ""

    );

}


export default function recommendationTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. constructor()
         */
        const unmounted =
            new Recommendation({

                autoMount:
                    false

            });

        assert(
            unmounted instanceof Recommendation,
            "Recommendation 建立失敗"
        );

        assert(
            unmounted.root === null,
            "未掛載時 root 應為 null"
        );

        assert(
            unmounted.hasData === false ||
            unmounted.summary?.hasData === false,
            "空資料時 hasData 應為 false"
        );

        messages.push(
            "✓ constructor() 正確"
        );


        /**
         * 2. 基本參數驗證
         */
        assertThrows(
            () =>
                new Recommendation({

                    analysis:
                        "invalid",

                    autoMount:
                        false

                }),
            "analysis 非物件時應拋出錯誤"
        );

        assertThrows(
            () =>
                new Recommendation({

                    recommendation:
                        "invalid",

                    autoMount:
                        false

                }),
            "recommendation 非物件時應拋出錯誤"
        );

        messages.push(
            "✓ 參數驗證正確"
        );


        /**
         * 3. 工廠函式與 mount()
         */
        const root =
            createRoot();

        roots.push(
            root
        );

        const component =
            createRecommendation({

                root,

                autoMount:
                    true

            });

        assert(
            component instanceof Recommendation,
            "工廠函式應回傳 Recommendation"
        );

        assert(
            root.children.length > 0,
            "mount() 後應建立 DOM"
        );

        messages.push(
            "✓ 工廠函式與 mount() 正確"
        );


        /**
         * 4. 空資料狀態
         */
        assert(
            root.textContent.includes(
                "尚未產生下注建議"
            ) ||
            root.textContent.includes(
                "尚無"
            ) ||
            root.textContent.includes(
                "沒有"
            ),
            "空資料提示未顯示"
        );

        messages.push(
            "✓ 空資料狀態正確"
        );


        /**
         * 5. setAnalysis()
         */
        const analysis =
            createAnalysis();

        component.setAnalysis(
            analysis
        );

        assert(
            component.hasData === true ||
            component.summary?.hasData === true,
            "setAnalysis() 後應有資料"
        );

        assert(
            readRecommendedKey(
                component
            ) === "banker",
            "setAnalysis() 後建議應為 banker"
        );

        assert(
            readAmount(
                component
            ) === 300,
            "建議金額錯誤"
        );

        assert(
            approximatelyEqual(
                component.confidence ??
                component.summary?.confidence ??
                component.data
                    ?.overallConfidence ??
                0,
                0.82
            ),
            "Confidence 錯誤"
        );

        assert(
            root.textContent.includes(
                "莊"
            ) ||
            root.textContent.includes(
                "banker"
            ),
            "建議下注名稱未顯示"
        );

        assert(
            root.textContent.includes(
                "300"
            ),
            "建議金額未顯示"
        );

        assert(
            root.textContent.includes(
                "莊家目前具有最高正期望值"
            ),
            "建議原因未顯示"
        );

        messages.push(
            "✓ setAnalysis() 正確"
        );


        /**
         * 6. shouldBet=true
         */
        assert(
            component.shouldBet === true ||
            component.summary?.shouldBet === true ||
            component.data?.shouldBet === true,
            "shouldBet 應為 true"
        );

        assert(
            root.textContent.includes(
                "建議下注"
            ) ||
            root.textContent.includes(
                "下注"
            ),
            "應顯示建議下注"
        );

        messages.push(
            "✓ shouldBet=true 正確"
        );


        /**
         * 7. setRecommendation()
         */
        component.setRecommendation({

            shouldBet:
                true,

            bet:
                "player",

            key:
                "player",

            name:
                "player",

            amount:
                200,

            ev:
                0.003,

            kelly:
                0.01,

            risk:
                0.18,

            confidence:
                0.71,

            reason:
                "測試改為建議閒家。"

        });

        assert(
            readRecommendedKey(
                component
            ) === "player",
            "setRecommendation() 後建議應為 player"
        );

        assert(
            readAmount(
                component
            ) === 200,
            "setRecommendation() 金額錯誤"
        );

        assert(
            readReason(
                component
            ) === "測試改為建議閒家。",
            "setRecommendation() reason 錯誤"
        );

        assert(
            root.textContent.includes(
                "測試改為建議閒家"
            ),
            "setRecommendation() 後 DOM 未更新"
        );

        messages.push(
            "✓ setRecommendation() 正確"
        );


        /**
         * 8. shouldBet=false
         */
        component.setAnalysis(
            createAnalysis({

                shouldBet:
                    false

            })
        );

        assert(
            component.shouldBet === false ||
            component.summary?.shouldBet === false ||
            component.data?.shouldBet === false,
            "shouldBet 應為 false"
        );

        assert(
            root.textContent.includes(
                "觀望"
            ) ||
            root.textContent.includes(
                "不下注"
            ),
            "shouldBet=false 時應顯示觀望或不下注"
        );

        messages.push(
            "✓ shouldBet=false 正確"
        );


        /**
         * 9. Ranking
         */
        component.setAnalysis(
            analysis
        );

        const rankingCount =

            component.data
                ?.ranking
                ?.length ??

            component.summary
                ?.rankingCount ??

            0;

        assert(
            rankingCount === 4,
            "Ranking 應有四筆"
        );

        assert(
            root.textContent.includes(
                "Ranking"
            ) ||
            root.textContent.includes(
                "排名"
            ),
            "Ranking 區塊未顯示"
        );

        messages.push(
            "✓ Ranking 正確"
        );


        /**
         * 10. Ranking 展開與收合
         */
        const toggle =
            root.querySelector(
                '[data-recommendation-action="toggle-ranking"]'
            ) ??
            root.querySelector(
                '[data-action="toggle-ranking"]'
            );

        if (toggle) {

            const before =
                Boolean(
                    component.state
                        ?.expanded
                );

            toggle.click();

            const after =
                Boolean(
                    component.state
                        ?.expanded
                );

            assert(
                before !== after,
                "Ranking 展開狀態應切換"
            );

            messages.push(
                "✓ Ranking 展開與收合正確"
            );

        }
        else {

            messages.push(
                "✓ Ranking 無展開按鈕，略過切換測試"
            );

        }


        /**
         * 11. setOptions()
         */
        component.setOptions({

            title:
                "自訂下注建議",

            subtitle:
                "測試副標題",

            compact:
                true,

            showRanking:
                false

        });

        assert(
            root.textContent.includes(
                "自訂下注建議"
            ),
            "title 未更新"
        );

        assert(
            root.textContent.includes(
                "測試副標題"
            ),
            "subtitle 未更新"
        );

        messages.push(
            "✓ setOptions() 正確"
        );


        /**
         * 12. summary
         */
        const summary =
            component.summary;

        assert(
            summary &&
            typeof summary === "object",
            "summary 應為物件"
        );

        assert(
            summary.mounted === true ||
            component.root === root,
            "summary mounted 錯誤"
        );

        messages.push(
            "✓ summary 正確"
        );


        /**
         * 13. toJSON()
         */
        component.setAnalysis(
            analysis
        );

        component.setRecommendation({

            shouldBet:
                true,

            bet:
                "player",

            key:
                "player",

            name:
                "player",

            amount:
                200,

            ev:
                0.003,

            kelly:
                0.01,

            risk:
                0.18,

            confidence:
                0.71,

            reason:
                "序列化測試。"

        });

        const json =
            component.toJSON();

        assert(
            json &&
            typeof json === "object",
            "toJSON() 應回傳物件"
        );

        assert(
            json.data &&
            typeof json.data === "object",
            "JSON 應包含 data"
        );

        assert(
            json.data
                .recommendation
                .bet === "player",
            "JSON recommendation.bet 錯誤"
        );

        assert(
            json.data
                .recommendation
                .amount === 200,
            "JSON recommendation.amount 錯誤"
        );

        messages.push(
            "✓ toJSON() 正確"
        );


        /**
         * 14. fromJSON()
         */
        const restoredRoot =
            createRoot();

        roots.push(
            restoredRoot
        );

        const restored =
            Recommendation.fromJSON(
                json,
                {
                    root:
                        restoredRoot
                }
            );

        assert(
            restored instanceof Recommendation,
            "fromJSON() 應回傳 Recommendation"
        );

        assert(
            readRecommendedKey(
                restored
            ) === "player",
            "還原後 recommendedKey 錯誤"
        );

        assert(
            readAmount(
                restored
            ) === 200,
            "還原後 amount 錯誤"
        );

        assert(
            readReason(
                restored
            ) === "序列化測試。",
            "還原後 reason 錯誤"
        );

        assert(
            restoredRoot.textContent.includes(
                "序列化測試"
            ),
            "還原後 DOM 未顯示 recommendation"
        );

        assertThrows(
            () =>
                Recommendation.fromJSON(
                    null
                ),
            "fromJSON(null) 應拋出錯誤"
        );

        messages.push(
            "✓ fromJSON() 正確"
        );


        /**
         * 15. clear()
         */
        restored.clear();

        assert(
            restored.hasData === false ||
            restored.summary?.hasData === false,
            "clear() 後 hasData 應為 false"
        );

        messages.push(
            "✓ clear() 正確"
        );


        /**
         * 16. destroy()
         */
        restored.destroy();

        assert(
            restoredRoot.innerHTML === "",
            "destroy() 應清空 root"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        return `
${messages.join("\n")}

Recommendation 測試完成

目前建議：
選項：${readRecommendedKey(component)}
金額：${readAmount(component)}
Confidence：${component.confidence ?? component.summary?.confidence ?? "N/A"}

序列化還原：
選項：${readRecommendedKey(restored)}
金額：${readAmount(restored)}
`;

    }
    finally {

        for (
            const root of
            roots
        ) {

            root?.remove();

        }

    }

}
