/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Recommendation Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. mount()
 * 3. 空資料狀態
 * 4. setAnalysis()
 * 5. update()
 * 6. setRecommendation()
 * 7. shouldBet = true
 * 8. shouldBet = false
 * 9. 建議下注名稱
 * 10. 建議下注金額
 * 11. EV / Kelly / Risk
 * 12. Confidence
 * 13. Reason
 * 14. Ranking
 * 15. 展開 / 收合 Ranking
 * 16. setOptions()
 * 17. clear()
 * 18. summary
 * 19. toJSON()
 * 20. fromJSON()
 * 21. destroy()
 */

import createRecommendation, {
    Recommendation,
    BET_LABELS
} from "../components/Recommendation.js";


/**
 * 斷言工具
 */
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


/**
 * 浮點近似比較
 */
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


/**
 * 預期同步錯誤
 */
function assertThrows(
    callback,
    message
) {

    let error =
        null;

    try {

        callback();

    }
    catch (caught) {

        error =
            caught;

    }

    assert(
        error instanceof Error,
        message
    );

    return error;

}


/**
 * 建立測試 Root
 */
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


/**
 * 移除測試 Root
 */
function removeRoot(root) {

    root?.remove();

}


/**
 * 建立完整分析結果
 */
function createAnalysis({

    shouldBet = true

} = {}) {

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

            player:
                0,

            banker:
                0.031,

            tie:
                0

        },

        risk: {

            player:
                0.55,

            banker:
                0.22,

            tie:
                0.85

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
                "banker",

            name:
                "banker",

            score:
                0.91,

            ev:
                0.0085,

            kelly:
                0.031,

            risk:
                0.22,

            confidence:
                0.82,

            amount:
                300
        },

        shouldBet,

        recommendation: {

            shouldBet,

            bet:
                shouldBet
                    ? "banker"
                    : null,

            amount:
                shouldBet
                    ? 300
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
                shouldBet

                    ? "莊家目前具有最高正期望值。"

                    : "目前沒有符合條件的正期望下注。"

        }

    };

}


/**
 * Recommendation 完整測試
 */
export default function recommendationTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. BET_LABELS。
         */
        assert(
            BET_LABELS.player ===
                "閒",
            "BET_LABELS.player 錯誤"
        );

        assert(
            BET_LABELS.banker ===
                "莊",
            "BET_LABELS.banker 錯誤"
        );

        assert(
            BET_LABELS.tie ===
                "和",
            "BET_LABELS.tie 錯誤"
        );

        messages.push(
            "✓ BET_LABELS 正確"
        );


        /**
         * 2. constructor()。
         */
        const unmounted =
            new Recommendation({

                autoMount:
                    false

            });

        assert(
            unmounted instanceof
                Recommendation,
            "Recommendation 建立失敗"
        );

        assert(
            unmounted.root === null,
            "未指定 root 時 root 應為 null"
        );

        assert(
            unmounted.summary.mounted ===
                false,
            "未掛載時 mounted 應為 false"
        );

        assert(
            unmounted.hasData ===
                false,
            "空資料時 hasData 應為 false"
        );

        messages.push(
            "✓ constructor() 正確"
        );


        /**
         * 3. 非法參數。
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

        assertThrows(
            () =>
                new Recommendation({

                    ranking:
                        null,

                    autoMount:
                        false

                }),
            "ranking 非陣列時應拋出錯誤"
        );

        assertThrows(
            () =>
                new Recommendation({

                    rankingLimit:
                        -1,

                    autoMount:
                        false

                }),
            "非法 rankingLimit 應拋出錯誤"
        );

        messages.push(
            "✓ 建構參數驗證正確"
        );


        /**
         * 4. 工廠函式與 mount()。
         */
        const root =
            createRoot();

        roots.push(root);

        const component =
            createRecommendation({

                root,

                autoMount:
                    true

            });

        assert(
            component instanceof
                Recommendation,
            "工廠函式應回傳 Recommendation"
        );

        assert(
            component.summary.mounted ===
                true,
            "mount() 後 mounted 應為 true"
        );

        assert(
            root.querySelector(
                "[data-recommendation]"
            ),
            "掛載後應建立 Recommendation DOM"
        );

        messages.push(
            "✓ 工廠函式與 mount() 正確"
        );


        /**
         * 5. 空資料狀態。
         */
        assert(
            root.querySelector(
                ".recommendationEmpty"
            ),
            "空資料時應顯示 empty 狀態"
        );

        assert(
            root.textContent.includes(
                "尚未產生下注建議"
            ),
            "空資料提示錯誤"
        );

        assert(
            component.summary.hasData ===
                false,
            "空資料 summary.hasData 應為 false"
        );

        messages.push(
            "✓ 空資料狀態正確"
        );


        /**
         * 6. setAnalysis() 與 shouldBet=true。
         */
        const analysis =
            createAnalysis({

                shouldBet:
                    true

            });

        component.setAnalysis(
            analysis
        );

        assert(
            component.hasData ===
                true,
            "setAnalysis() 後應有資料"
        );

        assert(
            component.shouldBet ===
                true,
            "shouldBet 應為 true"
        );

        assert(
            root.querySelector(
                "[data-recommendation]"
            )
                .classList
                .contains(
                    "bet"
                ),
            "建議下注時應具有 bet class"
        );

        assert(
            root.textContent.includes(
                "建議下注"
            ),
            "應顯示建議下注"
        );

        messages.push(
            "✓ setAnalysis() 與 shouldBet=true 正確"
        );


        /**
         * 7. 建議下注名稱。
         */
        assert(
            component.recommendedKey ===
                "banker",
            "recommendedKey 應為 banker"
        );

        assert(
            component.recommendedLabel ===
                "莊",
            "recommendedLabel 應為莊"
        );

        assert(
            root.textContent.includes(
                "莊"
            ),
            "DOM 應顯示莊"
        );

        messages.push(
            "✓ 建議下注名稱正確"
        );


        /**
         * 8. 金額、EV、Kelly、Risk。
         */
        assert(
            component.recommendedAmount ===
                300,
            "recommendedAmount 錯誤"
        );

        assert(
            approximatelyEqual(
                component.recommendedEV,
                0.0085
            ),
            "recommendedEV 錯誤"
        );

        assert(
            approximatelyEqual(
                component.recommendedKelly,
                0.031
            ),
            "recommendedKelly 錯誤"
        );

        assert(
            approximatelyEqual(
                component.recommendedRisk,
                0.22
            ),
            "recommendedRisk 錯誤"
        );

        assert(
            root.textContent.includes(
                "300"
            ),
            "DOM 應顯示建議金額"
        );

        assert(
            root.textContent.includes(
                "+0.0085"
            ),
            "DOM 應顯示 EV"
        );

        assert(
            root.textContent.includes(
                "3.10%"
            ),
            "DOM 應顯示 Kelly"
        );

        assert(
            root.textContent.includes(
                "22.00%"
            ),
            "DOM 應顯示 Risk"
        );

        messages.push(
            "✓ 金額、EV、Kelly、Risk 正確"
        );


        /**
         * 9. Confidence。
         */
        assert(
            approximatelyEqual(
                component.confidence,
                0.82
            ),
            "confidence 錯誤"
        );

        assert(
            root.textContent.includes(
                "82.00%"
            ),
            "DOM 應顯示 Confidence"
        );

        const confidenceFill =
            root.querySelector(
                ".recommendationConfidenceFill"
            );

        assert(
            confidenceFill.style.width ===
                "82%",
            "Confidence 進度條寬度錯誤"
        );

        messages.push(
            "✓ Confidence 正確"
        );


        /**
         * 10. Reason。
         */
        assert(
            component.reason ===
                "莊家目前具有最高正期望值。",
            "reason 錯誤"
        );

        assert(
            root.textContent.includes(
                "莊家目前具有最高正期望值"
            ),
            "DOM 應顯示 reason"
        );

        messages.push(
            "✓ Reason 正確"
        );


        /**
         * 11. Ranking。
         */
        assert(
            component.data
                .ranking
                .length === 4,
            "Ranking 數量應為 4"
        );

        assert(
            component.rankingItems
                .length === 3,
            "預設只應顯示前三名"
        );

        assert(
            root.querySelectorAll(
                ".recommendationRankingItem"
            ).length === 3,
            "DOM 預設應顯示三個排名"
        );

        assert(
            root.textContent.includes(
                "Score"
            ),
            "Ranking 應顯示 Score"
        );

        assert(
            root.textContent.includes(
                "EV +0.85%"
            ),
            "Ranking 應顯示 EV"
        );

        messages.push(
            "✓ Ranking 顯示正確"
        );


        /**
         * 12. 展開 / 收合 Ranking。
         */
        const toggle =
            root.querySelector(
                '[data-recommendation-action="toggle-ranking"]'
            );

        assert(
            toggle,
            "應存在 Ranking 展開按鈕"
        );

        toggle.click();

        assert(
            component.summary.expanded ===
                true,
            "點擊後 expanded 應為 true"
        );

        assert(
            root.querySelectorAll(
                ".recommendationRankingItem"
            ).length === 4,
            "展開後應顯示全部 Ranking"
        );

        assert(
            root.textContent.includes(
                "收合"
            ),
            "展開後按鈕應顯示收合"
        );

        root.querySelector(
            '[data-recommendation-action="toggle-ranking"]'
        ).click();

        assert(
            component.summary.expanded ===
                false,
            "再次點擊後 expanded 應為 false"
        );

        assert(
            root.querySelectorAll(
                ".recommendationRankingItem"
            ).length === 3,
            "收合後應回到前三名"
        );

        messages.push(
            "✓ Ranking 展開與收合正確"
        );


        /**
         * 13. update()。
         */
        const noBetAnalysis =
            createAnalysis({

                shouldBet:
                    false

            });

        component.update(
            noBetAnalysis
        );

        assert(
            component.shouldBet ===
                false,
            "update() 後 shouldBet 應為 false"
        );

        assert(
            root.querySelector(
                "[data-recommendation]"
            )
                .classList
                .contains(
                    "noBet"
                ),
            "觀望時應具有 noBet class"
        );

        assert(
            root.textContent.includes(
                "建議觀望"
            ),
            "應顯示建議觀望"
        );

        assert(
            root.textContent.includes(
                "不下注"
            ),
            "觀望時應顯示不下注"
        );

        assert(
            root.textContent.includes(
                "目前沒有符合條件的正期望下注"
            ),
            "觀望原因顯示錯誤"
        );

        messages.push(
            "✓ update() 與 shouldBet=false 正確"
        );


        /**
         * 14. setRecommendation()。
         */
        component.setRecommendation({

            shouldBet:
                true,

            bet:
                "player",

            amount:
                200,

            ev:
                0.003,

            confidence:
                0.71,

            reason:
                "測試改為建議閒家。"

        });

        assert(
            component.shouldBet ===
                true,
            "setRecommendation() 應更新 shouldBet"
        );

        assert(
            component.recommendedKey ===
                "player",
            "setRecommendation() 應更新 bet"
        );

        assert(
            component.recommendedLabel ===
                "閒",
            "Player 中文標籤錯誤"
        );

        assert(
            component.recommendedAmount ===
                200,
            "setRecommendation() 金額錯誤"
        );

        assert(
            root.textContent.includes(
                "測試改為建議閒家"
            ),
            "setRecommendation() reason 未顯示"
        );

        assertThrows(
            () =>
                component.setRecommendation(
                    "invalid"
                ),
            "setRecommendation() 非物件應拋出錯誤"
        );

        messages.push(
            "✓ setRecommendation() 正確"
        );


        /**
         * 15. 建議資料 fallback。
         */
        const fallbackRoot =
            createRoot();

        roots.push(
            fallbackRoot
        );

        const fallback =
            new Recommendation({

                root:
                    fallbackRoot,

                best: {

                    key:
                        "super6",

                    value:
                        0.02,

                    amount:
                        100,

                    confidence:
                        0.66

                },

                ranking: [

                    {
                        key:
                            "super6",

                        value:
                            0.02
                    }

                ]

            });

        assert(
            fallback.recommendedKey ===
                "super6",
            "缺少 recommendation 時應使用 best"
        );

        assert(
            fallback.recommendedLabel ===
                "幸運 6",
            "best 中文標籤錯誤"
        );

        assert(
            fallback.shouldBet ===
                true,
            "best EV > 0 時應推斷 shouldBet=true"
        );

        messages.push(
            "✓ Best fallback 與自動 shouldBet 正確"
        );


        /**
         * 16. setOptions()。
         */
        component.setOptions({

            title:
                "自訂下注建議",

            subtitle:
                "測試副標題",

            emptyText:
                "沒有建議",

            compact:
                true,

            showConfidence:
                false,

            showMetrics:
                false,

            showRanking:
                false,

            rankingLimit:
                2,

            percentDigits:
                1,

            numberDigits:
                3

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

        assert(
            root.querySelector(
                "[data-recommendation]"
            )
                .classList
                .contains(
                    "compact"
                ),
            "compact 選項未生效"
        );

        assert(
            !root.querySelector(
                ".recommendationConfidence"
            ),
            "showConfidence=false 時不應顯示信心"
        );

        assert(
            !root.querySelector(
                ".recommendationMetrics"
            ),
            "showMetrics=false 時不應顯示 Metrics"
        );

        assert(
            !root.querySelector(
                ".recommendationRanking"
            ),
            "showRanking=false 時不應顯示 Ranking"
        );

        assertThrows(
            () =>
                component.setOptions({

                    rankingLimit:
                        -1

                }),
            "非法 rankingLimit 應拋出錯誤"
        );

        assertThrows(
            () =>
                component.setOptions({

                    percentDigits:
                        10

                }),
            "非法 percentDigits 應拋出錯誤"
        );

        assertThrows(
            () =>
                component.setOptions({

                    numberDigits:
                        10

                }),
            "非法 numberDigits 應拋出錯誤"
        );

        messages.push(
            "✓ setOptions() 正確"
        );


        /**
         * 17. summary。
         */
        const summary =
            component.summary;

        assert(
            summary.hasData ===
                true,
            "summary.hasData 錯誤"
        );

        assert(
            summary.shouldBet ===
                true,
            "summary.shouldBet 錯誤"
        );

        assert(
            summary.recommendedKey ===
                "player",
            "summary.recommendedKey 錯誤"
        );

        assert(
            summary.recommendedLabel ===
                "閒",
            "summary.recommendedLabel 錯誤"
        );

        assert(
            summary.amount === 200,
            "summary.amount 錯誤"
        );

        assert(
            approximatelyEqual(
                summary.ev,
                0.003
            ),
            "summary.ev 錯誤"
        );

        assert(
            summary.rankingCount === 4,
            "summary.rankingCount 錯誤"
        );

        assert(
            summary.mounted ===
                true,
            "summary.mounted 錯誤"
        );

        messages.push(
            "✓ summary 正確"
        );


        /**
         * 18. toJSON()。
         */
        const json =
            component.toJSON();

        assert(
            json &&
            typeof json ===
                "object",
            "toJSON() 應回傳物件"
        );

        assert(
            json.data
                .recommendation
                .bet ===
                "player",
            "JSON recommendation 錯誤"
        );

        assert(
            json.data
                .ranking
                .length === 4,
            "JSON ranking 錯誤"
        );

        assert(
            json.options.title ===
                "自訂下注建議",
            "JSON options 錯誤"
        );

        messages.push(
            "✓ toJSON() 正確"
        );


        /**
         * 19. fromJSON()。
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
            restored instanceof
                Recommendation,
            "fromJSON() 應回傳 Recommendation"
        );

        assert(
            restored.recommendedKey ===
                "player",
            "還原後 recommendedKey 錯誤"
        );

        assert(
            restored.recommendedLabel ===
                "閒",
            "還原後 recommendedLabel 錯誤"
        );

        assert(
            restored.recommendedAmount ===
                200,
            "還原後 amount 錯誤"
        );

        assert(
            restored.options.title ===
                "自訂下注建議",
            "還原後 title 錯誤"
        );

        assert(
            restored.summary.mounted ===
                true,
            "還原後應已掛載"
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
         * 20. clear()。
         */
        restored.clear();

        assert(
            restored.hasData ===
                false,
            "clear() 後 hasData 應為 false"
        );

        assert(
            restored.summary
                .rankingCount === 0,
            "clear() 後 rankingCount 應為 0"
        );

        assert(
            restoredRoot.textContent
                .includes(
                    "沒有建議"
                ),
            "clear() 後應顯示自訂 emptyText"
        );

        messages.push(
            "✓ clear() 正確"
        );


        /**
         * 21. destroy()。
         */
        restored.destroy();

        assert(
            restored.summary.mounted ===
                false,
            "destroy() 後 mounted 應為 false"
        );

        assert(
            restoredRoot.innerHTML ===
                "",
            "destroy() 應清空 root"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        return `
${messages.join("\n")}

Recommendation 測試完成

建議下注範例：
選項：${BET_LABELS.banker}
金額：${analysis.recommendation.amount}
EV：${analysis.recommendation.ev}
Kelly：${analysis.recommendation.kelly}
Risk：${analysis.recommendation.risk}
Confidence：${analysis.overallConfidence}

Ranking 數量：${analysis.ranking.length}

更新後：
選項：${summary.recommendedLabel}
金額：${summary.amount}
EV：${summary.ev}
原因：${summary.reason}
`;

    }
    finally {

        for (
            const root of
            roots
        ) {

            removeRoot(
                root
            );

        }

    }

}
