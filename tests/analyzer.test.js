/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Analyzer Test
 *
 * 測試：
 *
 * 1. Analyzer 建立
 * 2. 無 Shoe 時拒絕分析
 * 3. setContext()
 * 4. analyze() 使用外部機率
 * 5. analyzeContext()
 * 6. run() 別名
 * 7. Monte Carlo 模式
 * 8. Exact 模式
 * 9. Probability / EV / Kelly / Risk
 * 10. Confidence / Ranking / Recommendation
 * 11. 新版 Shoe 剩餘牌資訊
 * 12. 未知燒牌
 * 13. 不修改原始 Shoe
 * 14. summary
 * 15. setMode()
 * 16. updateGameContext()
 */

import Analyzer, {
    ANALYZER_VERSION,
    AnalysisMode,
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
} from "../analysis/analyzer.js";

import AnalyzerCoordinator
    from "../analysis/AnalyzerCoordinator.js";

import PipelineManager
    from "../analysis/pipeline/PipelineManager.js";

import Shoe
    from "../engine/shoe.js";

import History
    from "../engine/history.js";


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
    tolerance = 1e-9
) {

    return (
        Math.abs(
            left - right
        ) <= tolerance
    );

}


/**
 * 建立可重現亂數
 */
function createSeededRandom(
    seed = 123456789
) {

    let state =
        seed >>> 0;

    return function random() {

        state = (

            state * 1664525 +

            1013904223

        ) >>> 0;

        return (
            state /
            4294967296
        );

    };

}


/**
 * 建立測試 Shoe
 */
function createTestShoe() {

    const shoe =
        new Shoe(1);

    /**
     * 使用完整一副牌，
     * 可同時支援 Monte Carlo 與 Exact。
     */
    shoe.unknownBurnedCount = 0;

    return shoe;

}


/**
 * 建立 Game 形式的分析 context
 */
function createContext(
    shoe,
    history = new History()
) {

    return {

        shoe,

        history,

        cards:
            shoe.peek(),

        observableCards:
            shoe.peek(),

        observableRemaining:
            shoe.observableRemaining,

        physicalRemaining:
            shoe.physicalRemaining,

        unknownBurnedCount:
            shoe.unknownBurnedCount,

        shoeSummary: {

            ...shoe.summary

        },

        burn: {

            confirmed:
                true,

            hiddenCount:
                shoe.unknownBurnedCount

        },

        historyItems:
            history.getAll(),

        roadmapAnalyzer:
            null,

        roadmap:
            null,

        roundCount:
            history.count,

        lastResult:
            history.last,

        payouts:
            {},

        monteCarloOptions: {

            simulations:
                100,

            batchSize:
                20

        },

        exactOptions: {

            batchSize:
                20

        },

        kellyOptions:
            {},

        riskOptions:
            {},

        confidenceOptions:
            {},

        rankingOptions:
            {},

        recommendationOptions:
            {},

        bankroll:
            10000,

        fraction:
            0.25,

        minBet:
            100,

        maxBet:
            1000,

        maxBankrollRatio:
            0.05,

        analyzerOptions: {

            mode:
                AnalysisMode.MONTE_CARLO,

            monteCarlo: {

                simulations:
                    100,

                batchSize:
                    20

            },

            exact: {

                batchSize:
                    20

            },

            bankroll:
                10000,

            fraction:
                0.25,

            minBet:
                100,

            maxBet:
                1000,

            maxBankrollRatio:
                0.05

        }

    };

}


/**
 * Shoe 快照
 */
function snapshotShoe(shoe) {

    return JSON.stringify(
        shoe.toJSON()
    );

}


/**
 * 驗證物件包含欄位
 */
function assertHasKeys(
    object,
    keys,
    label
) {

    assert(
        object &&
        typeof object ===
            "object",
        `${label} 必須是物件`
    );

    for (
        const key of
        keys
    ) {

        assert(
            key in object,
            `${label} 缺少欄位：${key}`
        );

    }

}


/**
 * 驗證機率範圍
 */
function assertProbabilityRange(
    probability
) {

    for (
        const [
            name,
            value
        ] of Object.entries(
            probability
        )
    ) {

        assert(
            Number.isFinite(value),
            `${name} 機率必須是有限數字`
        );

        assert(
            value >= 0 &&
            value <= 1,
            `${name} 機率必須介於 0～1`
        );

    }

}


/**
 * Analyzer 完整測試
 */
export default async function analyzerTest() {

    const messages = [];


    /**
     * 1. 可在沒有 context 時建立。
     */
    const emptyAnalyzer =
        new Analyzer();

    assert(
        emptyAnalyzer instanceof
            Analyzer,
        "Analyzer 建立失敗"
    );

    assert(
        emptyAnalyzer.context &&
        typeof emptyAnalyzer.context ===
            "object",
        "Analyzer 應具有 context"
    );

    assert(
        ANALYZER_VERSION ===
            "3.7.1",
        "Analyzer Facade 版本錯誤"
    );

    assert(
        emptyAnalyzer.coordinator instanceof
            AnalyzerCoordinator,
        "AnalyzerCoordinator 未建立"
    );

    assert(
        emptyAnalyzer.pipelineManager instanceof
            PipelineManager,
        "PipelineManager 未建立"
    );

    messages.push(
        "✓ Analyzer V3.7.1 Facade 與 Coordinator 建立正確"
    );


    /**
     * 2. 無 Shoe 時不可分析。
     */
    let missingShoeError =
        null;

    try {

        await emptyAnalyzer.analyze({

            probability: {

                player:
                    0.45,

                banker:
                    0.46,

                tie:
                    0.09

            }

        });

    }
    catch (error) {

        missingShoeError =
            error;

    }

    assert(
        missingShoeError instanceof Error,
        "沒有 Shoe 時應拒絕分析"
    );

    messages.push(
        "✓ 無 Shoe 時會拒絕分析"
    );


    /**
     * 3. setContext()。
     */
    const shoe =
        createTestShoe();

    const history =
        new History();

    const context =
        createContext(
            shoe,
            history
        );

    const analyzer =
        new Analyzer();

    analyzer.setContext(
        context
    );

    assert(
        analyzer.context.shoe ===
            shoe,
        "setContext() 沒有保存 Shoe"
    );

    assert(
        analyzer.context.history ===
            history,
        "setContext() 沒有保存 History"
    );

    assert(
        analyzer.monteCarlo !== null,
        "setContext() 應建立 MonteCarlo"
    );

    assert(
        analyzer.exact !== null,
        "setContext() 應建立 Exact"
    );

    messages.push(
        "✓ setContext() 與分析模組建立正確"
    );


    /**
     * 4. 使用外部提供的機率執行完整管線。
     */
    const providedProbability = {

        player:
            0.446,

        banker:
            0.458,

        tie:
            0.096,

        playerPair:
            0.074,

        bankerPair:
            0.075,

        super6:
            0.053,

        playerDragonBonus:
            0.031,

        bankerDragonBonus:
            0.034

    };

    const beforeProvided =
        snapshotShoe(shoe);

    const providedResult =
        await analyzer.analyze({

            probability:
                providedProbability,

            bankroll:
                10000,

            fraction:
                0.25,

            minBet:
                100,

            maxBet:
                1000,

            maxBankrollRatio:
                0.05

        });

    const afterProvided =
        snapshotShoe(shoe);

    assert(
        beforeProvided ===
            afterProvided,
        "使用外部機率分析不應修改 Shoe"
    );

    assert(
        providedResult.method ===
            "provided",
        "外部機率分析 method 應為 provided"
    );

    assert(
        approximatelyEqual(

            providedResult
                .probability
                .player +

            providedResult
                .probability
                .banker +

            providedResult
                .probability
                .tie,

            1

        ),
        "主結果機率總和必須為 1"
    );

    assertProbabilityRange(
        providedResult.probability
    );

    messages.push(
        "✓ 外部機率可完成 Analyzer 全管線"
    );


    /**
     * 5. 驗證完整輸出結構。
     */
    assertHasKeys(

        providedResult,

        [
            "method",
            "probability",
            "ev",
            "evStatus",
            "kelly",
            "risk",
            "confidence",
            "overallConfidence",
            "ranking",
            "mainRanking",
            "sideBetAnalysis",
            "best",
            "recommendation",
            "shouldBet",
            "remainingCards",
            "observableRemaining",
            "physicalRemaining",
            "unknownBurnedCount",
            "roundCount",
            "generatedAfterRound",
            "durationMs",
            "analyzedAt"
        ],

        "Analyzer result"

    );

    assert(
        Array.isArray(
            providedResult.ranking
        ),
        "ranking 應為陣列"
    );

    assert(
        providedResult.recommendation &&
        typeof providedResult
            .recommendation ===
            "object",
        "recommendation 應為物件"
    );

    assert(
        typeof providedResult
            .shouldBet ===
            "boolean",
        "shouldBet 應為 boolean"
    );

    assert(
        Array.isArray(
            providedResult.mainRanking
        ),
        "mainRanking 應為陣列"
    );

    assert(
        providedResult.ranking ===
            providedResult.mainRanking,
        "ranking 應維持為 mainRanking 的相容別名"
    );

    assert(
        providedResult.sideBetAnalysis &&
        typeof providedResult
            .sideBetAnalysis ===
            "object",
        "sideBetAnalysis 應為物件"
    );

    assert(
        providedResult.pipeline &&
        providedResult.pipeline.completed ===
            1 &&
        providedResult.pipeline.failed ===
            0,
        "Coordinator Pipeline metadata 錯誤"
    );

    assert(
        providedResult.pipeline
            .execution[0]
            .name ===
            "legacy-analysis-core",
        "Facade Compatibility Pipeline 名稱錯誤"
    );

    messages.push(
        "✓ Probability、EV、Kelly、Risk、Confidence、Ranking、Recommendation 與 Facade Pipeline 輸出完整"
    );


    /**
     * 6. 主注與邊注必須完全分離。
     */
    const mainRankingNames =
        providedResult
            .mainRanking
            .map(
                item =>
                    item.name
            );

    assert(
        mainRankingNames.every(
            name =>
                MAIN_RECOMMENDATION_BETS
                    .includes(name)
        ),
        "mainRanking 只能包含 player、banker、tie"
    );

    assert(
        mainRankingNames.every(
            name =>
                !SIDE_BETS.includes(name)
        ),
        "mainRanking 不可包含任何邊注"
    );

    for (
        const name of
        SIDE_BETS
    ) {

        assert(
            name in
                providedResult
                    .sideBetAnalysis,
            `sideBetAnalysis 缺少 ${name}`
        );

        assert(
            providedResult
                .sideBetAnalysis[
                    name
                ]
                .recommendationEligible ===
                false,
            `${name} 不可成為主推薦`
        );

    }

    assert(
        providedResult
            .ev
            .playerDragonBonus === 0 &&
        providedResult
            .ev
            .bankerDragonBonus === 0,
        "Dragon Bonus 未完成分級 EV 前必須固定為 0"
    );

    assert(
        providedResult
            .evStatus
            .playerDragonBonus ===
            "unavailable",
        "閒龍寶 EV 狀態應為 unavailable"
    );

    assert(
        providedResult
            .evStatus
            .bankerDragonBonus ===
            "unavailable",
        "莊龍寶 EV 狀態應為 unavailable"
    );

    assert(
        providedResult
            .sideBetAnalysis
            .playerDragonBonus
            .available === false &&
        providedResult
            .sideBetAnalysis
            .playerDragonBonus
            .ev === null,
        "閒龍寶應顯示為不可用，EV 應為 null"
    );

    assert(
        providedResult
            .sideBetAnalysis
            .bankerDragonBonus
            .available === false &&
        providedResult
            .sideBetAnalysis
            .bankerDragonBonus
            .ev === null,
        "莊龍寶應顯示為不可用，EV 應為 null"
    );

    assert(
        providedResult.best === null ||
        MAIN_RECOMMENDATION_BETS
            .includes(
                providedResult
                    .best
                    .name
            ),
        "best 只能是主注或 null"
    );

    assert(
        providedResult
            .recommendation
            .bet === null ||
        MAIN_RECOMMENDATION_BETS
            .includes(
                providedResult
                    .recommendation
                    .bet
            ),
        "Recommendation 不可推薦邊注"
    );

    /**
     * 此組機率的三個主注 EV 都不是正值。
     * 即使龍寶機率存在，也必須選擇不下注。
     */
    assert(
        providedResult.shouldBet ===
            false,
        "主注皆無正 EV 時應建議不下注"
    );

    assert(
        providedResult
            .recommendation
            .bet === null,
        "主注皆無正 EV 時 recommendation.bet 應為 null"
    );

    messages.push(
        "✓ 主注與邊注分離，Dragon Bonus 不會進入推薦"
    );


    /**
     * 7. 新版 Shoe 欄位。
     */


    /**
     * 7. 新版 Shoe 欄位。
     */
    assert(
        providedResult
            .remainingCards ===
            shoe.physicalRemaining,
        "remainingCards 應等於物理剩餘牌數"
    );

    assert(
        providedResult
            .observableRemaining ===
            shoe.observableRemaining,
        "observableRemaining 錯誤"
    );

    assert(
        providedResult
            .physicalRemaining ===
            shoe.physicalRemaining,
        "physicalRemaining 錯誤"
    );

    assert(
        providedResult
            .unknownBurnedCount ===
            shoe.unknownBurnedCount,
        "unknownBurnedCount 錯誤"
    );

    assert(
        providedResult
            .generatedAfterRound === 0,
        "空 History 應在第 0 局後產生分析"
    );

    messages.push(
        "✓ 新版 Shoe 與局數資訊正確"
    );


    /**
     * 8. analyzeContext()。
     */
    const contextResult =
        await analyzer.analyzeContext(

            context,

            {
                probability:
                    providedProbability
            }

        );

    assert(
        contextResult.method ===
            "provided",
        "analyzeContext() 應使用提供的機率"
    );

    assert(
        contextResult
            .observableRemaining ===
            shoe.observableRemaining,
        "analyzeContext() Shoe 資訊錯誤"
    );

    messages.push(
        "✓ analyzeContext() 正確"
    );


    /**
     * 9. run() 別名。
     */
    const runResult =
        await analyzer.run(

            context,

            {
                probability:
                    providedProbability
            }

        );

    assert(
        runResult.method ===
            "provided",
        "run() 應呼叫 analyzeContext()"
    );

    messages.push(
        "✓ run() 整合別名正確"
    );


    /**
     * 10. Monte Carlo 模式。
     */
    const beforeMonteCarlo =
        snapshotShoe(shoe);

    const monteCarloResult =
        await analyzer.analyzeContext(

            context,

            {
                mode:
                    AnalysisMode
                        .MONTE_CARLO,

                monteCarloOptions: {

                    simulations:
                        100,

                    batchSize:
                        20,

                    random:
                        createSeededRandom(
                            20260802
                        )

                }

            }

        );

    const afterMonteCarlo =
        snapshotShoe(shoe);

    assert(
        beforeMonteCarlo ===
            afterMonteCarlo,
        "Monte Carlo 分析不應修改原 Shoe"
    );

    assert(
        monteCarloResult.method ===
            AnalysisMode
                .MONTE_CARLO,
        "Monte Carlo method 錯誤"
    );

    assert(
        monteCarloResult
            .monteCarlo
            .simulations === 100,
        "Monte Carlo simulations 錯誤"
    );

    assert(
        approximatelyEqual(

            monteCarloResult
                .probability
                .player +

            monteCarloResult
                .probability
                .banker +

            monteCarloResult
                .probability
                .tie,

            1

        ),
        "Monte Carlo 主結果機率總和錯誤"
    );

    messages.push(
        "✓ Monte Carlo 模式正確"
    );


    /**
     * 11. Exact 模式。
     *
     * 使用完整一副牌進行精確列舉。
     */
    const beforeExact =
        snapshotShoe(shoe);

    const exactResult =
        await analyzer.analyzeContext(

            context,

            {
                mode:
                    AnalysisMode.EXACT,

                exactOptions: {

                    batchSize:
                        30

                }

            }

        );

    const afterExact =
        snapshotShoe(shoe);

    assert(
        beforeExact ===
            afterExact,
        "Exact 分析不應修改原 Shoe"
    );

    assert(
        exactResult.method ===
            AnalysisMode.EXACT,
        "Exact method 錯誤"
    );

    assert(
        exactResult.exact &&
        exactResult.exact.method ===
            "exact",
        "缺少 Exact 原始結果"
    );

    assert(
        approximatelyEqual(

            exactResult
                .probability
                .player +

            exactResult
                .probability
                .banker +

            exactResult
                .probability
                .tie,

            1,

            1e-8

        ),
        "Exact 主結果機率總和錯誤"
    );

    messages.push(
        "✓ Exact 模式正確"
    );


    /**
     * 12. setMode()。
     */
    analyzer.setMode(
        AnalysisMode.MONTE_CARLO
    );

    assert(
        analyzer.options.mode ===
            AnalysisMode.MONTE_CARLO,
        "setMode() 沒有更新模式"
    );

    let invalidModeError =
        null;

    try {

        analyzer.setMode(
            "invalid-mode"
        );

    }
    catch (error) {

        invalidModeError =
            error;

    }

    assert(
        invalidModeError instanceof Error,
        "非法模式應拋出錯誤"
    );

    messages.push(
        "✓ setMode() 與非法模式驗證正確"
    );


    /**
     * 13. updateGameContext()。
     */
    const updatedShoe =
        createTestShoe();

    updatedShoe.remove({

        rank:
            "A",

        suit:
            "S"

    });

    const updatedHistory =
        new History();

    analyzer.updateGameContext({

        shoe:
            updatedShoe,

        history:
            updatedHistory,

        payouts:
            {}

    });

    assert(
        analyzer.context.shoe ===
            updatedShoe,
        "updateGameContext() 沒有更新 Shoe"
    );

    assert(
        analyzer.context.history ===
            updatedHistory,
        "updateGameContext() 沒有更新 History"
    );

    assert(
        analyzer.summary
            .observableRemaining ===
            updatedShoe
                .observableRemaining,
        "summary 沒有反映新 Shoe"
    );

    messages.push(
        "✓ updateGameContext() 正確"
    );


    /**
     * 14. 未知燒牌與 summary。
     */
    updatedShoe
        .registerUnknownBurn(
            2
        );

    analyzer.updateGameContext({

        shoe:
            updatedShoe,

        history:
            updatedHistory,

        payouts:
            {}

    });

    const summary =
        analyzer.summary;

    assert(
        summary.hasShoe === true,
        "summary.hasShoe 應為 true"
    );

    assert(
        summary.observableRemaining ===
            updatedShoe
                .observableRemaining,
        "summary.observableRemaining 錯誤"
    );

    assert(
        summary.physicalRemaining ===
            updatedShoe
                .physicalRemaining,
        "summary.physicalRemaining 錯誤"
    );

    assert(
        summary.unknownBurnedCount === 2,
        "summary.unknownBurnedCount 錯誤"
    );

    assert(
        summary.roundCount === 0,
        "summary.roundCount 錯誤"
    );

    assert(
        summary.version ===
            "3.7.1" &&
        summary.facade ===
            true &&
        summary.coordinator
            ?.version ===
            "3.7.0" &&
        summary.pipeline
            ?.size ===
            1,
        "V3.7.1 Facade summary 錯誤"
    );

    messages.push(
        "✓ 未知燒牌、Facade 與 summary 正確"
    );


    return `
${messages.join("\n")}

Analyzer V3.7.1 Facade Integration 測試完成

Provided：
Player：${providedResult.probability.player}
Banker：${providedResult.probability.banker}
Tie：${providedResult.probability.tie}

Monte Carlo：
Player：${monteCarloResult.probability.player}
Banker：${monteCarloResult.probability.banker}
Tie：${monteCarloResult.probability.tie}

Exact：
Player：${exactResult.probability.player}
Banker：${exactResult.probability.banker}
Tie：${exactResult.probability.tie}

主注 Ranking 數量：${providedResult.mainRanking.length}
邊注分析數量：${Object.keys(providedResult.sideBetAnalysis).length}
閒龍寶 EV 狀態：${providedResult.evStatus.playerDragonBonus}
莊龍寶 EV 狀態：${providedResult.evStatus.bankerDragonBonus}
建議下注：${providedResult.shouldBet}
建議選項：${providedResult.recommendation.bet ?? "不下注"}

可觀察牌數：${summary.observableRemaining}
物理剩餘牌數：${summary.physicalRemaining}
未知燒牌數：${summary.unknownBurnedCount}
`;
}
