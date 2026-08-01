/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Game Controller
 *
 * 遊戲核心管理器
 *
 * 負責整合：
 * - Shoe
 * - Burn
 * - Dealer
 * - CurrentRound
 * - History
 * - Analyzer
 *
 * 不負責：
 * - 實際百家樂補牌規則
 * - 機率數學計算
 * - UI 顯示
 */

import Shoe from "./shoe.js";
import Burn from "./burn.js";
import Dealer from "./dealer.js";
import CurrentRound from "./currentRound.js";
import History from "./history.js";

import Analyzer, {
    AnalysisMode
} from "../analysis/analyzer.js";


const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 牌靴副數
     */
    deckCount: 8,

    /**
     * 初始本金
     */
    bankroll: 10000,

    /**
     * Kelly 使用比例
     *
     * 0.5 = Half Kelly
     */
    kellyFraction: 0.5,

    /**
     * 最低下注
     */
    minBet: 100,

    /**
     * 最高下注
     */
    maxBet: 5000,

    /**
     * 單局最多使用本金比例
     */
    maxBankrollRatio: 0.05,

    /**
     * 預設分析方式
     */
    analysisMode:
        AnalysisMode.MONTE_CARLO,

    /**
     * Monte Carlo 設定
     */
    monteCarlo: Object.freeze({

        simulations: 100000,

        batchSize: 1000

    }),

    /**
     * Exact 設定
     */
    exact: Object.freeze({

        batchSize: 8

    }),

    /**
     * Ranking 設定
     */
    ranking: Object.freeze({

        strategy: "balanced",

        minimumEV: 0,

        minimumConfidence: 0.6,

        requirePositiveKelly: true

    }),

    /**
     * Recommendation 設定
     */
    recommendation: Object.freeze({

        minimumEV: 0,

        minimumConfidence: 0.6,

        minimumScore: 0.5,

        requirePositiveKelly: true,

        requirePositiveAmount: true,

        allowProvisionalConfidence: false,

        candidateCount: 3

    })

});


export {
    AnalysisMode
};


export default class Game {

    constructor(options = {}) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options,

            monteCarlo: {

                ...DEFAULT_OPTIONS
                    .monteCarlo,

                ...(options.monteCarlo ?? {})

            },

            exact: {

                ...DEFAULT_OPTIONS
                    .exact,

                ...(options.exact ?? {})

            },

            ranking: {

                ...DEFAULT_OPTIONS
                    .ranking,

                ...(options.ranking ?? {})

            },

            recommendation: {

                ...DEFAULT_OPTIONS
                    .recommendation,

                ...(
                    options
                        .recommendation ??
                    {}
                )

            }

        };

        this.validateOptions();

        /**
         * 遊戲狀態
         */
        this.started = false;

        this.analysisRunning = false;

        this.lastAnalysis = null;

        this.analysisController = null;

        /**
         * 建立第一副牌靴。
         */
        this.newShoe();

    }

    /**
     * 驗證 Game 設定
     */
    validateOptions() {

        const {
            deckCount,
            bankroll,
            kellyFraction,
            minBet,
            maxBet,
            maxBankrollRatio,
            analysisMode
        } = this.options;

        if (
            !Number.isInteger(deckCount) ||
            deckCount < 1
        ) {

            throw new RangeError(
                "deckCount must be a positive integer"
            );

        }

        if (
            !Number.isFinite(bankroll) ||
            bankroll < 0
        ) {

            throw new RangeError(
                "bankroll must be a non-negative number"
            );

        }

        if (
            !Number.isFinite(
                kellyFraction
            ) ||
            kellyFraction < 0 ||
            kellyFraction > 1
        ) {

            throw new RangeError(
                "kellyFraction must be between 0 and 1"
            );

        }

        if (
            !Number.isFinite(minBet) ||
            minBet < 0
        ) {

            throw new RangeError(
                "minBet must be a non-negative number"
            );

        }

        if (
            maxBet !== Infinity &&
            (
                !Number.isFinite(maxBet) ||
                maxBet < minBet
            )
        ) {

            throw new RangeError(
                "maxBet must be greater than or equal to minBet"
            );

        }

        if (
            !Number.isFinite(
                maxBankrollRatio
            ) ||
            maxBankrollRatio < 0 ||
            maxBankrollRatio > 1
        ) {

            throw new RangeError(
                "maxBankrollRatio must be between 0 and 1"
            );

        }

        if (
            !Object.values(
                AnalysisMode
            ).includes(
                analysisMode
            )
        ) {

            throw new Error(
                `Unknown analysis mode: ${analysisMode}`
            );

        }

    }

    /**
     * 建立 Analyzer
     */
    createAnalyzer() {

        return new Analyzer({

            shoe:
                this.shoe,

            history:
                this.history,

            analyzerOptions: {

                mode:
                    this.options
                        .analysisMode,

                monteCarlo: {

                    ...this.options
                        .monteCarlo

                },

                exact: {

                    ...this.options
                        .exact

                }

            },

            kellyOptions: {

                bankroll:
                    this.options
                        .bankroll,

                fraction:
                    this.options
                        .kellyFraction,

                minBet:
                    this.options
                        .minBet,

                maxBet:
                    this.options
                        .maxBet,

                maxBankrollRatio:
                    this.options
                        .maxBankrollRatio

            },

            rankingOptions: {

                ...this.options
                    .ranking

            },

            recommendationOptions: {

                ...this.options
                    .recommendation

            }

        });

    }

    /**
     * 建立新牌靴
     *
     * 會清除：
     * - 燒牌狀態
     * - 目前牌局
     * - 歷史紀錄
     * - 上一次分析
     */
    newShoe(
        deckCount =
            this.options.deckCount
    ) {

        if (
            !Number.isInteger(deckCount) ||
            deckCount < 1
        ) {

            throw new RangeError(
                "deckCount must be a positive integer"
            );

        }

        /**
         * 若正在分析，
         * 先取消。
         */
        this.cancelAnalysis();

        this.options.deckCount =
            deckCount;

        this.shoe =
            new Shoe(
                deckCount
            );

        this.burn =
            new Burn(
                this.shoe
            );

        this.dealer =
            new Dealer(
                this.shoe
            );

        this.currentRound =
            new CurrentRound();

        this.history =
            new History();

        this.started = false;

        this.analysisRunning =
            false;

        this.lastAnalysis =
            null;

        this.analysisController =
            null;

        this.analyzer =
            this.createAnalyzer();

        return this;

    }

    /**
     * 開始牌靴
     *
     * 執行開靴燒牌。
     */
    start() {

        if (this.started) {

            throw new Error(
                "Game already started"
            );

        }

        if (!this.shoe) {

            throw new Error(
                "Shoe has not been created"
            );

        }

        const burnResult =
            this.burn.execute();

        this.started = true;

        /**
         * 燒牌後剩餘牌靴改變，
         * 更新 Analyzer context。
         */
        this.syncAnalyzerContext();

        return {

            started:
                true,

            indicator:
                burnResult.indicator,

            amount:
                burnResult.amount,

            remainingCards:
                this.remainingCards

        };

    }

    /**
     * 是否已開始
     */
    get isStarted() {

        return this.started;

    }

    /**
     * 是否正在分析
     */
    get isAnalyzing() {

        return this.analysisRunning;

    }

    /**
     * 從 Dealer 輸出取得 RoundResult
     *
     * 支援：
     * 1. Dealer.play() 直接回傳 RoundResult
     * 2. Dealer.play() 回傳 Round，
     *    Round.result 是 RoundResult
     */
    extractRoundResult(output) {

        if (!output) {

            throw new Error(
                "Dealer returned no round result"
            );

        }

        if (
            typeof output.winner ===
            "string"
        ) {

            return output;

        }

        if (
            output.result &&
            typeof output.result.winner ===
            "string"
        ) {

            return output.result;

        }

        throw new Error(
            "Unable to extract RoundResult from Dealer output"
        );

    }

    /**
     * 更新 CurrentRound
     *
     * 為了兼容不同版本 CurrentRound：
     * - set(result)
     * - complete(result)
     * - result 屬性
     */
    updateCurrentRound(result) {

        if (
            typeof this.currentRound.set ===
            "function"
        ) {

            this.currentRound.set(
                result
            );

            return;

        }

        if (
            typeof this.currentRound.complete ===
            "function"
        ) {

            this.currentRound.complete(
                result
            );

            return;

        }

        /**
         * 若 CurrentRound 沒有 set/complete，
         * 最後使用直接指定。
         */
        this.currentRound.result =
            result;

    }

    /**
     * 進行一局
     */
    play() {

        if (!this.started) {

            throw new Error(
                "Game has not started"
            );

        }

        if (this.analysisRunning) {

            throw new Error(
                "Cannot play while analysis is running"
            );

        }

        if (
            this.remainingCards < 6
        ) {

            throw new Error(
                "Not enough cards remaining to safely play another round"
            );

        }

        const dealerOutput =
            this.dealer.play();

        const result =
            this.extractRoundResult(
                dealerOutput
            );

        this.updateCurrentRound(
            result
        );

        this.history.add(
            result
        );

        /**
         * 真實牌靴已經改變，
         * 下一次分析必須使用最新 Shoe。
         */
        this.syncAnalyzerContext();

        /**
         * 前一局分析已失效。
         */
        this.lastAnalysis =
            null;

        return result;

    }

    /**
     * 同步 Analyzer 的 Shoe 與 History
     */
    syncAnalyzerContext() {

        if (!this.analyzer) {

            this.analyzer =
                this.createAnalyzer();

            return this;

        }

        this.analyzer
            .updateGameContext({

                shoe:
                    this.shoe,

                history:
                    this.history

            });

        return this;

    }

    /**
     * 非同步分析下一局
     *
     * 手機正式版應使用這個方法。
     */
    async analyze({

        mode =
            this.options
                .analysisMode,

        probability = null,

        monteCarloResult = null,

        exactResult = null,

        monteCarloOptions = {},

        exactOptions = {},

        bankroll =
            this.options.bankroll,

        fraction =
            this.options
                .kellyFraction,

        minBet =
            this.options.minBet,

        maxBet =
            this.options.maxBet,

        maxBankrollRatio =
            this.options
                .maxBankrollRatio,

        signal = null,

        onMonteCarloProgress =
            null,

        onExactProgress =
            null

    } = {}) {

        if (!this.started) {

            throw new Error(
                "Game has not been started"
            );

        }

        if (this.analysisRunning) {

            throw new Error(
                "Analysis is already running"
            );

        }

        if (
            this.remainingCards < 6
        ) {

            throw new Error(
                "Not enough cards remaining for analysis"
            );

        }

        this.syncAnalyzerContext();

        this.analysisRunning =
            true;

        /**
         * 若外部沒有傳 signal，
         * Game 自己建立 AbortController。
         */
        this.analysisController =
            signal
                ? null
                : new AbortController();

        const activeSignal =
            signal ??
            this.analysisController
                ?.signal ??
            null;

        try {

            const result =
                await this.analyzer
                    .analyze({

                        mode,

                        probability,

                        monteCarloResult,

                        exactResult,

                        monteCarloOptions,

                        exactOptions,

                        bankroll,

                        fraction,

                        minBet,

                        maxBet,

                        maxBankrollRatio,

                        signal:
                            activeSignal,

                        onMonteCarloProgress,

                        onExactProgress

                    });

            this.lastAnalysis =
                result;

            return result;

        }
        finally {

            this.analysisRunning =
                false;

            this.analysisController =
                null;

        }

    }

    /**
     * 同步分析
     *
     * 適合：
     * - 測試
     * - Web Worker
     *
     * 不建議手機主執行緒執行大量模擬或 Exact。
     */
    analyzeSync({

        mode =
            AnalysisMode
                .MONTE_CARLO,

        probability = null,

        simulations =
            this.options
                .monteCarlo
                .simulations,

        random =
            Math.random,

        bankroll =
            this.options.bankroll,

        fraction =
            this.options
                .kellyFraction,

        minBet =
            this.options.minBet,

        maxBet =
            this.options.maxBet,

        maxBankrollRatio =
            this.options
                .maxBankrollRatio

    } = {}) {

        if (!this.started) {

            throw new Error(
                "Game has not been started"
            );

        }

        if (this.analysisRunning) {

            throw new Error(
                "Analysis is already running"
            );

        }

        this.syncAnalyzerContext();

        this.analysisRunning =
            true;

        try {

            const result =
                this.analyzer
                    .analyzeSync({

                        mode,

                        probability,

                        simulations,

                        random,

                        bankroll,

                        fraction,

                        minBet,

                        maxBet,

                        maxBankrollRatio

                    });

            this.lastAnalysis =
                result;

            return result;

        }
        finally {

            this.analysisRunning =
                false;

        }

    }

    /**
     * 取消目前分析
     */
    cancelAnalysis() {

        if (
            this.analysisController
        ) {

            this.analysisController
                .abort();

        }

        return this;

    }

    /**
     * 是否為取消分析錯誤
     */
    isAbortError(error) {

        return (
            error?.name ===
            "AbortError"
        );

    }

    /**
     * 設定預設分析模式
     */
    setAnalysisMode(mode) {

        if (
            !Object.values(
                AnalysisMode
            ).includes(mode)
        ) {

            throw new Error(
                `Unknown analysis mode: ${mode}`
            );

        }

        this.options.analysisMode =
            mode;

        this.analyzer.setMode(
            mode
        );

        return this;

    }

    /**
     * 更新本金
     */
    setBankroll(bankroll) {

        if (
            !Number.isFinite(bankroll) ||
            bankroll < 0
        ) {

            throw new RangeError(
                "bankroll must be a non-negative number"
            );

        }

        this.options.bankroll =
            bankroll;

        this.analyzer
            .setKellyConfig({

                ...this.analyzer
                    .kelly
                    .config,

                bankroll

            });

        return this;

    }

    /**
     * 更新 Kelly 比例
     */
    setKellyFraction(fraction) {

        if (
            !Number.isFinite(fraction) ||
            fraction < 0 ||
            fraction > 1
        ) {

            throw new RangeError(
                "Kelly fraction must be between 0 and 1"
            );

        }

        this.options
            .kellyFraction =
            fraction;

        this.analyzer
            .setKellyConfig({

                ...this.analyzer
                    .kelly
                    .config,

                fraction

            });

        return this;

    }

    /**
     * 更新下注限制
     */
    setBetLimits({

        minBet =
            this.options.minBet,

        maxBet =
            this.options.maxBet,

        maxBankrollRatio =
            this.options
                .maxBankrollRatio

    } = {}) {

        if (
            !Number.isFinite(minBet) ||
            minBet < 0
        ) {

            throw new RangeError(
                "minBet must be a non-negative number"
            );

        }

        if (
            maxBet !== Infinity &&
            (
                !Number.isFinite(maxBet) ||
                maxBet < minBet
            )
        ) {

            throw new RangeError(
                "maxBet must be greater than or equal to minBet"
            );

        }

        if (
            !Number.isFinite(
                maxBankrollRatio
            ) ||
            maxBankrollRatio < 0 ||
            maxBankrollRatio > 1
        ) {

            throw new RangeError(
                "maxBankrollRatio must be between 0 and 1"
            );

        }

        this.options.minBet =
            minBet;

        this.options.maxBet =
            maxBet;

        this.options
            .maxBankrollRatio =
            maxBankrollRatio;

        this.analyzer
            .setKellyConfig({

                ...this.analyzer
                    .kelly
                    .config,

                minBet,

                maxBet,

                maxBankrollRatio

            });

        return this;

    }

    /**
     * 更新 Ranking 策略
     */
    setRankingStrategy(strategy) {

        this.options
            .ranking
            .strategy =
            strategy;

        this.analyzer
            .setRankingStrategy(
                strategy
            );

        return this;

    }

    /**
     * 更新 Recommendation 設定
     */
    setRecommendationOptions(
        options = {}
    ) {

        this.options
            .recommendation = {

                ...this.options
                    .recommendation,

                ...options

            };

        this.analyzer
            .setRecommendationOptions(
                options
            );

        return this;

    }

    /**
     * 剩餘牌數
     */
    get remainingCards() {

        return (
            this.shoe?.remaining ??
            0
        );

    }

    /**
     * 已使用牌數
     */
    get usedCards() {

        return (
            this.shoe?.used ??
            0
        );

    }

    /**
     * 已完成局數
     */
    get rounds() {

        return (
            this.history?.count ??
            0
        );

    }

    /**
     * 最近一局
     */
    get lastResult() {

        if (!this.history) {

            return null;

        }

        /**
         * 兼容 History v5：
         * last 是 getter。
         */
        if (
            this.history.last !==
            undefined &&
            typeof this.history.last !==
            "function"
        ) {

            return this.history.last;

        }

        /**
         * 兼容舊版：
         * last() 是方法。
         */
        if (
            typeof this.history.last ===
            "function"
        ) {

            return this.history.last();

        }

        return null;

    }

    /**
     * 燒牌資訊
     */
    get burnInfo() {

        return (
            this.burn?.info ??
            null
        );

    }

    /**
     * 重新開靴
     */
    reset() {

        return this.newShoe(
            this.options.deckCount
        );

    }

    /**
     * 遊戲摘要
     */
    get summary() {

        return {

            started:
                this.started,

            deckCount:
                this.options
                    .deckCount,

            remainingCards:
                this.remainingCards,

            usedCards:
                this.usedCards,

            rounds:
                this.rounds,

            bankroll:
                this.options
                    .bankroll,

            analysisMode:
                this.options
                    .analysisMode,

            analysisRunning:
                this.analysisRunning,

            hasAnalysis:
                this.lastAnalysis !==
                null,

            burn:
                this.burnInfo

        };

    }

    /**
     * JSON 輸出
     */
    toJSON() {

        return {

            options: {

                deckCount:
                    this.options
                        .deckCount,

                bankroll:
                    this.options
                        .bankroll,

                kellyFraction:
                    this.options
                        .kellyFraction,

                minBet:
                    this.options
                        .minBet,

                maxBet:
                    this.options
                        .maxBet,

                maxBankrollRatio:
                    this.options
                        .maxBankrollRatio,

                analysisMode:
                    this.options
                        .analysisMode

            },

            started:
                this.started,

            shoe:
                this.shoe
                    ?.toJSON() ??
                null,

            burn:
                this.burn
                    ?.toJSON() ??
                null,

            history:
                this.history
                    ?.toJSON() ??
                null,

            currentRound:
                this.currentRound
                    ?.toJSON?.() ??
                null,

            lastAnalysis:
                this.lastAnalysis,

            summary:
                this.summary

        };

    }

}
