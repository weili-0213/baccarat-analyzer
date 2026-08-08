/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Analyzer Legacy Core
 *
 * V3.7.1 相容核心：保留已通過測試的分析行為。
 *
 * 流程：
 *
 * Monte Carlo / Exact
 *          ↓
 *      Probability
 *          ↓
 * EV → Kelly → Risk → Confidence
 *          ↓
 *       Ranking
 *          ↓
 *   Recommendation
 *
 * 此版本可直接接收 engine/game.js 建立的完整 context。
 */

import MonteCarlo from "./monteCarlo.js";
import Exact from "./exact.js";
import EV from "./ev.js";
import Kelly from "./kelly.js";
import Risk from "./risk.js";
import Confidence from "./confidence.js";
import Ranking from "./ranking.js";
import Recommendation from "./recommendation.js";
import dragonBonus from "./dragonBonus.js";
import {
    ANALYZER_ARCHITECTURE_VERSION,
    ANALYZER_LEGACY_CORE_COMPATIBILITY_VERSION,
    AnalysisMode,
    BET_CONFIG,
    DEFAULT_ANALYZER_OPTIONS as DEFAULT_OPTIONS,
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
} from "./core/AnalyzerContracts.js";
import {
    extractProbability as extractProbabilityValue,
    getSampleSize as resolveSampleSize,
    normalizeProbability as normalizeProbabilityValue,
    validateProbabilityValue as assertProbabilityValue
} from "./core/AnalyzerProbabilityService.js";
import {
    buildBetInput as createBetInput,
    buildKellyOptions as createKellyOptions
} from "./core/AnalyzerBetService.js";
import {
    buildRankingInput as createRankingInput,
    buildSideBetAnalysis as createSideBetAnalysis,
    getBestFromRanking as selectBestFromRanking
} from "./core/AnalyzerRankingService.js";


export {
    ANALYZER_ARCHITECTURE_VERSION,
    ANALYZER_LEGACY_CORE_COMPATIBILITY_VERSION,
    AnalysisMode,
    BET_CONFIG,
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
};


function isObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


export default class AnalyzerLegacyCore {

    /**
     * context 可包含：
     *
     * {
     *     shoe,
     *     history,
     *     payouts,
     *
     *     monteCarloOptions,
     *     exactOptions,
     *     kellyOptions,
     *     riskOptions,
     *     confidenceOptions,
     *     rankingOptions,
     *     recommendationOptions,
     *
     *     analyzerOptions
     * }
     */
    constructor(context = {}) {

        this.context = {};

        this.options = {};

        this.monteCarlo = null;

        this.exact = null;

        this.ev = null;

        this.kelly = null;

        this.risk = null;

        this.confidence = null;

        this.ranking = null;

        this.recommendation = null;

        this.setContext(
            context
        );

    }


    /**
     * 建立或更新完整分析環境
     */
    setContext(context = {}) {

        if (!isObject(context)) {

            throw new TypeError(
                "Analyzer context must be an object."
            );

        }

        this.context = {

            ...context

        };

        const analyzerOptions =

            context.analyzerOptions ??
            {};

        this.options = {

            ...DEFAULT_OPTIONS,

            ...analyzerOptions,

            monteCarlo: {

                ...DEFAULT_OPTIONS
                    .monteCarlo,

                ...(
                    analyzerOptions
                        .monteCarlo ??
                    {}
                ),

                ...(
                    context
                        .monteCarloOptions ??
                    {}
                )

            },

            exact: {

                ...DEFAULT_OPTIONS
                    .exact,

                ...(
                    analyzerOptions
                        .exact ??
                    {}
                ),

                ...(
                    context
                        .exactOptions ??
                    {}
                )

            }

        };

        this.validateOptions();

        this.monteCarlo =
            new MonteCarlo(

                {
                    shoe:
                        context.shoe
                },

                this.options
                    .monteCarlo

            );

        this.exact =
            new Exact(

                {
                    shoe:
                        context.shoe
                },

                this.options
                    .exact

            );

        this.ev =
            new EV(
                context.payouts ??
                {}
            );

        this.kelly =
            new Kelly(
                context.kellyOptions ??
                {}
            );

        this.risk =
            new Risk(
                context.riskOptions ??
                {}
            );

        this.confidence =
            new Confidence(
                context.confidenceOptions ??
                {}
            );

        this.ranking =
            new Ranking({

                ...(
                    context.rankingOptions ??
                    {}
                ),

                allowedNames:
                    MAIN_RECOMMENDATION_BETS

            });

        this.recommendation =
            new Recommendation({

                ...(
                    context.recommendationOptions ??
                    {}
                ),

                allowedBets:
                    MAIN_RECOMMENDATION_BETS

            });

        return this;

    }


    /**
     * 只更新遊戲中的 Shoe 與 History。
     */
    updateGameContext({

        shoe =
            this.context.shoe,

        history =
            this.context.history

    } = {}) {

        this.context = {

            ...this.context,

            shoe,

            history

        };

        if (
            this.monteCarlo &&
            typeof this.monteCarlo
                .setContext ===
                "function"
        ) {

            this.monteCarlo
                .setContext({

                    ...(
                        this.monteCarlo
                            .context ??
                        {}
                    ),

                    shoe

                });

        }

        if (
            this.exact &&
            typeof this.exact
                .setContext ===
                "function"
        ) {

            this.exact
                .setContext({

                    ...(
                        this.exact
                            .context ??
                        {}
                    ),

                    shoe

                });

        }

        return this;

    }


    /**
     * 驗證 Analyzer 設定。
     */
    validateOptions() {

        if (
            !Object.values(
                AnalysisMode
            ).includes(
                this.options.mode
            )
        ) {

            throw new Error(
                `Unknown analysis mode: ${this.options.mode}`
            );

        }

        if (
            typeof this.options
                .includeDebugData !==
            "boolean"
        ) {

            throw new TypeError(
                "includeDebugData must be boolean."
            );

        }

        return true;

    }


    /**
     * 驗證目前分析環境。
     */
    validateContext() {

        const shoe =
            this.context.shoe;

        if (!shoe) {

            throw new Error(
                "Analyzer requires a Shoe."
            );

        }

        if (
            !Array.isArray(
                shoe.cards
            )
        ) {

            throw new TypeError(
                "Analyzer context contains an invalid Shoe."
            );

        }

        /**
         * 一局最多六張牌。
         *
         * unknownBurnedCount 不代表已知牌面，
         * 因此機率引擎仍使用 shoe.cards 的可觀察牌池。
         */
        if (
            shoe.cards.length < 6
        ) {

            throw new Error(
                "At least 6 observable cards are required for analysis."
            );

        }

        return true;

    }


    /**
     * 檢查機率值。
     */
    validateProbabilityValue(
        value,
        name
    ) {

        return assertProbabilityValue(
            value,
            name
        );

    }


    /**
     * 從分析結果取出 probability。
     */
    extractProbability(source) {

        return extractProbabilityValue(
            source
        );

    }


    /**
     * 整理並驗證機率。
     */
    normalizeProbability(source) {

        return normalizeProbabilityValue(
            source
        );

    }


    /**
     * 執行 Monte Carlo。
     */
    async runMonteCarlo({

        simulations =
            this.options
                .monteCarlo
                .simulations,

        batchSize =
            this.options
                .monteCarlo
                .batchSize,

        random =
            Math.random,

        signal =
            null,

        onProgress =
            null

    } = {}) {

        return this.monteCarlo
            .calculate({

                simulations,

                batchSize,

                random,

                signal,

                onProgress

            });

    }


    /**
     * 執行 Exact。
     */
    async runExact({

        batchSize =
            this.options
                .exact
                .batchSize,

        signal =
            null,

        onProgress =
            null

    } = {}) {

        return this.exact
            .calculate({

                batchSize,

                signal,

                onProgress

            });

    }


    /**
     * 依模式取得機率。
     */
    async resolveAnalysis({

        mode =
            this.options.mode,

        probability =
            null,

        monteCarloResult =
            null,

        exactResult =
            null,

        monteCarloOptions =
            {},

        exactOptions =
            {},

        signal =
            null,

        onMonteCarloProgress =
            null,

        onExactProgress =
            null

    } = {}) {

        if (probability) {

            return {

                method:
                    "provided",

                probability:
                    this.normalizeProbability(
                        probability
                    ),

                monteCarlo:
                    monteCarloResult,

                exact:
                    exactResult

            };

        }

        if (
            mode ===
            AnalysisMode.MONTE_CARLO
        ) {

            const monteCarlo =

                monteCarloResult ??

                await this.runMonteCarlo({

                    ...monteCarloOptions,

                    signal,

                    onProgress:
                        onMonteCarloProgress

                });

            return {

                method:
                    AnalysisMode
                        .MONTE_CARLO,

                probability:
                    this.normalizeProbability(
                        monteCarlo
                    ),

                monteCarlo,

                exact:
                    exactResult

            };

        }

        if (
            mode ===
            AnalysisMode.EXACT
        ) {

            const exact =

                exactResult ??

                await this.runExact({

                    ...exactOptions,

                    signal,

                    onProgress:
                        onExactProgress

                });

            return {

                method:
                    AnalysisMode.EXACT,

                probability:
                    this.normalizeProbability(
                        exact
                    ),

                monteCarlo:
                    monteCarloResult,

                exact

            };

        }

        if (
            mode ===
            AnalysisMode.HYBRID
        ) {

            const monteCarlo =

                monteCarloResult ??

                await this.runMonteCarlo({

                    ...monteCarloOptions,

                    signal,

                    onProgress:
                        onMonteCarloProgress

                });

            const exact =

                exactResult ??

                await this.runExact({

                    ...exactOptions,

                    signal,

                    onProgress:
                        onExactProgress

                });

            return {

                method:
                    AnalysisMode.HYBRID,

                /**
                 * Hybrid 最終採 Exact 機率。
                 */
                probability:
                    this.normalizeProbability(
                        exact
                    ),

                monteCarlo,

                exact

            };

        }

        throw new Error(
            `Unknown analysis mode: ${mode}`
        );

    }


    /**
     * 計算全部 EV。
     *
     * Dragon Bonus 尚未具備完整分差機率，
     * 因此保留欄位但固定為 0，並由 evStatus 標示 unavailable。
     */
    getEV(probability) {

        const result =
            this.ev.all(
                probability
            );

        return {

            ...result,

            playerDragonBonus:
                0,

            bankerDragonBonus:
                0

        };

    }


    /**
     * 建立 EV 可用狀態。
     */
    getEVStatus() {

        const result = {};

        for (
            const name of
            Object.keys(
                BET_CONFIG
            )
        ) {

            result[name] =
                this.ev.getStatus(
                    name
                );

        }

        return result;

    }


    /**
     * 建立 Kelly 與 Risk 共用輸入。
     */
    buildBetInput(probability) {

        return createBetInput(
            probability,
            this.ev
        );

    }


    /**
     * 建立 Kelly 選項。
     */
    buildKellyOptions({

        bankroll,

        fraction,

        minBet,

        maxBet,

        maxBankrollRatio

    } = {}) {

        return createKellyOptions({
            bankroll,
            fraction,
            minBet,
            maxBet,
            maxBankrollRatio
        });

    }


    /**
     * 計算 Kelly。
     */
    getKelly(
        probability,
        options = {}
    ) {

        return this.kelly
            .calculateAll(

                this.buildBetInput(
                    probability
                ),

                options

            );

    }


    /**
     * 計算 Risk。
     */
    getRisk(probability) {

        return this.risk
            .calculateAll(

                this.buildBetInput(
                    probability
                )

            );

    }


    /**
     * Monte Carlo 樣本數。
     */
    getSampleSize(monteCarlo) {

        return resolveSampleSize(
            monteCarlo
        );

    }


    /**
     * 建立 Confidence。
     */
    getConfidence({

        probability,

        monteCarlo =
            null,

        exact =
            null,

        method =
            "provided"

    }) {

        const mcProbability =
            this.extractProbability(
                monteCarlo
            );

        const exactProbability =
            this.extractProbability(
                exact
            );

        const sampleSize =
            this.getSampleSize(
                monteCarlo
            );

        const result = {};

        for (
            const name of
            Object.keys(
                BET_CONFIG
            )
        ) {

            if (
                !Number.isFinite(
                    probability[name]
                )
            ) {

                continue;

            }

            const mcValue =
                mcProbability?.[name];

            const exactValue =
                exactProbability?.[name];

            if (
                Number.isFinite(
                    mcValue
                ) &&
                sampleSize
            ) {

                result[name] =
                    this.confidence
                        .calculate({

                            name,

                            monteCarloProbability:
                                mcValue,

                            exactProbability:
                                Number.isFinite(
                                    exactValue
                                )
                                    ? exactValue
                                    : null,

                            sampleSize

                        });

                continue;

            }

            const isExact =

                method ===
                    AnalysisMode.EXACT ||

                method ===
                    AnalysisMode.HYBRID ||

                Number.isFinite(
                    exactValue
                );

            const confidenceScore =
                isExact
                    ? 1
                    : 0.5;

            const confidenceLevel =
                this.confidence
                    .level(
                        confidenceScore
                    );

            result[name] = {

                name,

                confidenceScore,

                confidencePercent:
                    confidenceScore * 100,

                confidenceLevel,

                confidenceLabel:
                    this.confidence
                        .levelLabel(
                            confidenceLevel
                        ),

                sampleSize:
                    null,

                standardError:
                    null,

                normalMarginOfError:
                    null,

                wilsonInterval:
                    null,

                agreementDifference:
                    null,

                agreementScore:
                    null,

                exactInsideInterval:
                    null,

                hasExact:
                    isExact,

                provisional:
                    !isExact

            };

        }

        return result;

    }


    /**
     * 建立 Ranking 輸入。
     */
    buildRankingInput({

        probability,

        ev,

        kelly,

        risk,

        confidence

    }) {

        return createRankingInput({
            probability,
            ev,
            kelly,
            risk,
            confidence
        });

    }


    /**
     * 建立邊注分析。
     *
     * 邊注只供完整分析畫面參考，
     * 不會進入主推薦 Ranking。
     */
    buildSideBetAnalysis({

        probability,

        ev,

        evStatus,

        kelly,

        risk,

        confidence

    }) {

        return createSideBetAnalysis({
            probability,
            ev,
            evStatus,
            kelly,
            risk,
            confidence,
            dragon:
                dragonBonus()
        });

    }


    /**
     * 執行 Ranking。
     */
    getRanking(rankingInput) {

        return this.ranking
            .calculate(
                rankingInput
            );

    }


    /**
     * 最佳可下注項目。
     */
    getBestFromRanking(ranking) {

        return selectBestFromRanking(
            ranking
        );

    }


    /**
     * 產生 Recommendation。
     */
    getRecommendation(ranking) {

        return this.recommendation
            .calculate(
                ranking
            );

    }


    /**
     * 完整非同步分析。
     *
     * 這個方法接收「單次執行選項」。
     */
    async analyze({

        mode =
            this.options.mode,

        probability =
            null,

        monteCarloResult =
            null,

        exactResult =
            null,

        monteCarloOptions =
            {},

        exactOptions =
            {},

        bankroll =
            undefined,

        fraction =
            undefined,

        minBet =
            undefined,

        maxBet =
            undefined,

        maxBankrollRatio =
            undefined,

        signal =
            null,

        onMonteCarloProgress =
            null,

        onExactProgress =
            null

    } = {}) {

        this.validateContext();

        const startedAt =
            Date.now();

        const resolved =
            await this.resolveAnalysis({

                mode,

                probability,

                monteCarloResult,

                exactResult,

                monteCarloOptions,

                exactOptions,

                signal,

                onMonteCarloProgress,

                onExactProgress

            });

        const finalProbability =
            resolved.probability;

        const ev =
            this.getEV(
                finalProbability
            );

        const evStatus =
            this.getEVStatus();

        const kelly =
            this.getKelly(

                finalProbability,

                this.buildKellyOptions({

                    bankroll,

                    fraction,

                    minBet,

                    maxBet,

                    maxBankrollRatio

                })

            );

        const risk =
            this.getRisk(
                finalProbability
            );

        const confidence =
            this.getConfidence({

                probability:
                    finalProbability,

                monteCarlo:
                    resolved.monteCarlo,

                exact:
                    resolved.exact,

                method:
                    resolved.method

            });

        const overallConfidence =
            this.confidence
                .overall(
                    confidence
                );

        const rankingInput =
            this.buildRankingInput({

                probability:
                    finalProbability,

                ev,

                kelly,

                risk,

                confidence

            });

        const mainRanking =
            this.getRanking(
                rankingInput
            );

        const ranking =
            mainRanking;

        const sideBetAnalysis =
            this.buildSideBetAnalysis({

                probability:
                    finalProbability,

                ev,

                evStatus,

                kelly,

                risk,

                confidence

            });

        const best =
            this.getBestFromRanking(
                mainRanking
            );

        const recommendation =
            this.getRecommendation(
                mainRanking
            );

        const completedAt =
            Date.now();

        const shoe =
            this.context.shoe;

        const output = {

            method:
                resolved.method,

            probability:
                finalProbability,

            monteCarlo:
                resolved.monteCarlo,

            exact:
                resolved.exact,

            ev,

            evStatus,

            kelly,

            risk,

            confidence,

            overallConfidence,

            /**
             * 舊版相容：ranking 仍指向主注排名。
             */
            ranking,

            mainRanking,

            sideBetAnalysis,

            best,

            recommendation,

            shouldBet:
                recommendation
                    ?.shouldBet ??
                false,

            /**
             * 可觀察牌池數量。
             */
            observableRemaining:
                shoe.observableRemaining ??
                shoe.remaining,

            /**
             * 舊版相容
             */
            remainingCards:
                shoe.observableRemaining ??
                shoe.remaining,

            /**
             * 實體牌數
             */
            physicalRemaining:
                shoe.physicalRemaining ??
                shoe.remaining,

            /**
             * 舊版相容
             */
            remainingPhysicalCards:
                shoe.physicalRemaining ??
                shoe.remaining,

            unknownBurnedCount:
                shoe.unknownBurnedCount ??
                0,

            roundCount:
                this.context.roundCount ??
                this.context.history?.count ??
                0,

            /**
             * 產生本次分析時已完成的局數。
             * 舊版 Dashboard 與測試相容欄位。
             */
            generatedAfterRound:
                this.context.roundCount ??
                this.context.history?.count ??
                0,

            /**
             * 舊版相容
             */
            rounds:
                this.context.roundCount ??
                this.context.history?.count ??
                0,

            durationMs:
                completedAt -
                startedAt,

            analyzedAt:
                new Date(
                    completedAt
                ).toISOString()

        };

        if (
            this.options
                .includeDebugData
        ) {

            output.rankingInput =
                rankingInput;

            output.mainRecommendationBets =
                [
                    ...MAIN_RECOMMENDATION_BETS
                ];

            output.sideBetNames =
                [
                    ...SIDE_BETS
                ];

            output.contextSummary = {

                observableRemaining:
                    output
                        .observableRemaining,

                physicalRemaining:
                    output
                        .physicalRemaining,

                unknownBurnedCount:
                    output
                        .unknownBurnedCount,

                roundCount:
                    output.roundCount

            };

        }

        return output;

    }


    /**
     * Game 的正式整合入口。
     *
     * context 是 engine/game.js 建立的完整環境。
     * runOptions 是本次分析的執行設定。
     */
    async analyzeContext(
        context = {},
        runOptions = {}
    ) {

        if (!isObject(context)) {

            throw new TypeError(
                "Analyzer context must be an object."
            );

        }

        if (!context.shoe) {

            throw new Error(
                "Analyzer context requires a Shoe."
            );

        }

        this.setContext(
            context
        );

        const analyzerOptions =
            context.analyzerOptions ??
            {};

        return this.analyze({

            mode:
                runOptions.mode ??
                analyzerOptions.mode ??
                this.options.mode,

            probability:
                runOptions.probability ??
                null,

            monteCarloResult:
                runOptions
                    .monteCarloResult ??
                null,

            exactResult:
                runOptions
                    .exactResult ??
                null,

            monteCarloOptions: {

                ...(
                    context
                        .monteCarloOptions ??
                    {}
                ),

                ...(
                    runOptions
                        .monteCarloOptions ??
                    {}
                )

            },

            exactOptions: {

                ...(
                    context
                        .exactOptions ??
                    {}
                ),

                ...(
                    runOptions
                        .exactOptions ??
                    {}
                )

            },

            bankroll:
                runOptions.bankroll ??
                context.bankroll ??
                analyzerOptions.bankroll,

            fraction:
                runOptions.fraction ??
                context.fraction ??
                analyzerOptions.fraction,

            minBet:
                runOptions.minBet ??
                context.minBet ??
                analyzerOptions.minBet,

            maxBet:
                runOptions.maxBet ??
                context.maxBet ??
                analyzerOptions.maxBet,

            maxBankrollRatio:
                runOptions
                    .maxBankrollRatio ??
                context
                    .maxBankrollRatio ??
                analyzerOptions
                    .maxBankrollRatio,

            signal:
                runOptions.signal ??
                null,

            onMonteCarloProgress:
                runOptions
                    .onMonteCarloProgress ??
                null,

            onExactProgress:
                runOptions
                    .onExactProgress ??
                null

        });

    }


    /**
     * Game 整合別名。
     */
    async run(
        context = {},
        runOptions = {}
    ) {

        return this.analyzeContext(
            context,
            runOptions
        );

    }


    /**
     * 設定預設分析模式。
     */
    setMode(mode) {

        if (
            !Object.values(
                AnalysisMode
            ).includes(mode)
        ) {

            throw new Error(
                `Unknown analysis mode: ${mode}`
            );

        }

        this.options.mode =
            mode;

        return this;

    }


    /**
     * 設定 Ranking 策略。
     */
    setRankingStrategy(strategy) {

        this.ranking
            .setStrategy(
                strategy
            );

        return this;

    }


    /**
     * 取得目前設定。
     */
    getOptions() {

        return {

            ...this.options,

            monteCarlo: {

                ...this.options
                    .monteCarlo

            },

            exact: {

                ...this.options
                    .exact

            }

        };

    }


    /**
     * 取得簡化資訊。
     *
     * 同時保留新版與舊版欄位名稱，
     * 讓 Dashboard、Game 與既有測試保持相容。
     */
    get summary() {

        const shoe =
            this.context.shoe;

        const roundCount =
            this.context.roundCount ??
            this.context.history
                ?.count ??
            0;

        const observableRemaining =
            shoe?.observableRemaining ??
            shoe?.remaining ??
            0;

        const physicalRemaining =
            shoe?.physicalRemaining ??
            shoe?.remaining ??
            0;

        return {

            architectureVersion:
                ANALYZER_ARCHITECTURE_VERSION,

            mode:
                this.options.mode,

            hasShoe:
                Boolean(shoe),

            /**
             * 新版欄位。
             */
            observableRemaining,

            physicalRemaining,

            roundCount,

            /**
             * 舊版相容欄位。
             */
            remainingCards:
                observableRemaining,

            remainingPhysicalCards:
                physicalRemaining,

            generatedAfterRound:
                roundCount,

            rounds:
                roundCount,

            unknownBurnedCount:
                shoe?.unknownBurnedCount ??
                0

        };

    }

}
