/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Analyzer
 *
 * 分析層總控制器
 *
 * 流程：
 *
 * Monte Carlo / Exact
 *          ↓
 *     Probability
 *          ↓
 * EV → Kelly → Risk → Confidence
 *          ↓
 *       Ranking
 *          ↓
 *   Recommendation
 *
 * 不負責：
 * - 發牌規則
 * - 修改真實牌靴
 * - UI 顯示
 */

import MonteCarlo from "./monteCarlo.js";
import Exact from "./exact.js";

import EV from "./ev.js";
import Kelly from "./kelly.js";
import Risk from "./risk.js";
import Confidence from "./confidence.js";
import Ranking from "./ranking.js";
import Recommendation from "./recommendation.js";


/**
 * 支援的分析模式
 */
export const AnalysisMode = Object.freeze({

    MONTE_CARLO:
        "monteCarlo",

    EXACT:
        "exact",

    HYBRID:
        "hybrid"

});


/**
 * 支援的下注項目
 *
 * netOdds 是淨賠率。
 *
 * 注意：
 * 龍寶是分級賠率，目前 netOdds: 30
 * 只是暫時佔位，尚不能作為正式龍寶 EV。
 */
export const BET_CONFIG = Object.freeze({

    player: Object.freeze({

        label: "閒",

        netOdds: 1,

        /**
         * 閒遇到和局退回本金。
         */
        pushKey: "tie"

    }),

    banker: Object.freeze({

        label: "莊",

        netOdds: 0.95,

        /**
         * 莊遇到和局退回本金。
         */
        pushKey: "tie"

    }),

    tie: Object.freeze({

        label: "和",

        netOdds: 8,

        pushKey: null

    }),

    playerPair: Object.freeze({

        label: "閒對",

        netOdds: 11,

        pushKey: null

    }),

    bankerPair: Object.freeze({

        label: "莊對",

        netOdds: 11,

        pushKey: null

    }),

    super6: Object.freeze({

        label: "超級 6",

        netOdds: 12,

        pushKey: null

    }),

    playerDragonBonus: Object.freeze({

        label: "閒龍寶",

        netOdds: 30,

        pushKey: null,

        provisional: true

    }),

    bankerDragonBonus: Object.freeze({

        label: "莊龍寶",

        netOdds: 30,

        pushKey: null,

        provisional: true

    })

});


const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 預設採 Monte Carlo，
     * 較適合手機即時分析。
     */
    mode:
        AnalysisMode.MONTE_CARLO,

    /**
     * Monte Carlo 預設設定
     */
    monteCarlo: Object.freeze({

        simulations: 100000,

        batchSize: 1000

    }),

    /**
     * Exact 預設設定
     */
    exact: Object.freeze({

        batchSize: 8

    }),

    /**
     * 是否在輸出中保留中間資料。
     */
    includeDebugData: false

});


export default class Analyzer {

    /**
     * context 可包含：
     *
     * {
     *     shoe,
     *     history,
     *
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

        this.options = {

            ...DEFAULT_OPTIONS,

            monteCarlo: {

                ...DEFAULT_OPTIONS.monteCarlo

            },

            exact: {

                ...DEFAULT_OPTIONS.exact

            }

        };

        this.monteCarlo = null;

        this.exact = null;

        this.ev = null;

        this.kelly = null;

        this.risk = null;

        this.confidence = null;

        this.ranking = null;

        this.recommendation = null;

        if (
            context &&
            Object.keys(context).length > 0
        ) {

            this.setContext(
                context
            );

        }

    }

    /**
     * 建立或更新完整分析環境
     */
    setContext(context = {}) {

        this.context = {

            ...context

        };

        const analyzerOptions =
            context.analyzerOptions ?? {};

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

        /**
         * 機率引擎
         */
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

        /**
         * 後續分析引擎
         */
        this.ev =
            new EV(

                context.payouts ?? {}

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

                context
                    .confidenceOptions ??
                {}

            );

        this.ranking =
            new Ranking(

                context.rankingOptions ??
                {}

            );

        this.recommendation =
            new Recommendation(

                context
                    .recommendationOptions ??
                {}

            );

        return this;

    }

    /**
     * 更新 Shoe 與 History，
     * 不重建所有引擎。
     */
    updateGameContext({

        shoe = this.context.shoe,

        history = this.context.history

    } = {}) {

        this.context = {

            ...this.context,

            shoe,

            history

        };

        this.monteCarlo.setContext({

            ...this.monteCarlo.context,

            shoe

        });

        this.exact.setContext({

            ...this.exact.context,

            shoe

        });

        return this;

    }

    /**
     * Game v5 正式分析入口
     *
     * engine/game.js 會把完整遊戲環境傳入這裡。
     *
     * context 可包含：
     *
     * {
     *     shoe,
     *     history,
     *     payouts,
     *
     *     observableRemaining,
     *     physicalRemaining,
     *     unknownBurnedCount,
     *
     *     monteCarloOptions,
     *     exactOptions,
     *     kellyOptions,
     *     riskOptions,
     *     confidenceOptions,
     *     rankingOptions,
     *     recommendationOptions,
     *
     *     bankroll,
     *     fraction,
     *     minBet,
     *     maxBet,
     *     maxBankrollRatio,
     *
     *     analyzerOptions
     * }
     */
    async analyzeContext(
        context = {},
        runOptions = {}
    ) {

        if (
            !context ||
            typeof context !== "object" ||
            Array.isArray(context)
        ) {

            throw new TypeError(
                "Analyzer context must be an object"
            );

        }

        if (!context.shoe) {

            throw new Error(
                "Analyzer context requires a Shoe"
            );

        }

        /**
         * 每一局完成後 Shoe 都會改變，
         * 因此每次分析前重新更新整個 context。
         */
        this.setContext(
            context
        );

        const analyzerOptions =
            context.analyzerOptions ?? {};

        return this.analyze({

            mode:
                runOptions.mode ??
                analyzerOptions.mode ??
                this.options.mode,

            probability:
                runOptions.probability ??
                null,

            monteCarloResult:
                runOptions.monteCarloResult ??
                null,

            exactResult:
                runOptions.exactResult ??
                null,

            monteCarloOptions: {

                ...(
                    analyzerOptions.monteCarlo ??
                    {}
                ),

                ...(
                    context.monteCarloOptions ??
                    {}
                ),

                ...(
                    runOptions.monteCarloOptions ??
                    {}
                )

            },

            exactOptions: {

                ...(
                    analyzerOptions.exact ??
                    {}
                ),

                ...(
                    context.exactOptions ??
                    {}
                ),

                ...(
                    runOptions.exactOptions ??
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
                runOptions.maxBankrollRatio ??
                context.maxBankrollRatio ??
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
     * Game 整合別名
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
     * 驗證 Analyzer 設定
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

                "includeDebugData must be boolean"

            );

        }

    }

    /**
     * 驗證目前是否有 Shoe
     */
    validateContext() {

        if (!this.context.shoe) {

            throw new Error(

                "Analyzer requires a Shoe"

            );

        }

        if (
            !Array.isArray(
                this.context
                    .shoe
                    .cards
            )
        ) {

            throw new TypeError(

                "Analyzer context contains an invalid Shoe"

            );

        }

        if (
            this.context
                .shoe
                .cards
                .length < 6
        ) {

            throw new Error(

                "At least 6 remaining cards are required for analysis"

            );

        }

    }

    /**
     * 驗證機率值
     */
    validateProbabilityValue(
        value,
        name
    ) {

        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 1
        ) {

            throw new RangeError(

                `${name} probability must be between 0 and 1`

            );

        }

    }

    /**
     * 從分析結果取得 probability。
     */
    extractProbability(source) {

        if (
            !source ||
            typeof source !== "object" ||
            Array.isArray(source)
        ) {

            return null;

        }

        if (
            source.probability &&
            typeof source.probability ===
            "object" &&
            !Array.isArray(
                source.probability
            )
        ) {

            return source.probability;

        }

        return source;

    }

    /**
     * 整理並驗證機率。
     *
     * player / banker / tie 必須存在。
     * Side Bet 可以暫時缺少。
     */
    normalizeProbability(source) {

        const input =
            this.extractProbability(
                source
            );

        if (!input) {

            throw new Error(

                "Probability data is required"

            );

        }

        const result = {};

        for (
            const name of
            Object.keys(BET_CONFIG)
        ) {

            const value =
                input[name];

            if (
                value === undefined ||
                value === null
            ) {

                continue;

            }

            this.validateProbabilityValue(

                value,

                name

            );

            result[name] = value;

        }

        const required = [

            "player",

            "banker",

            "tie"

        ];

        for (const name of required) {

            if (
                !Number.isFinite(
                    result[name]
                )
            ) {

                throw new Error(

                    `Missing required probability: ${name}`

                );

            }

        }

        const total =

            result.player +

            result.banker +

            result.tie;

        if (
            Math.abs(
                total - 1
            ) > 0.001
        ) {

            throw new RangeError(

                "Player, Banker and Tie probabilities must total approximately 1"

            );

        }

        return result;

    }

    /**
     * 執行 Monte Carlo
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

        signal = null,

        onProgress = null

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
     * 同步執行 Monte Carlo
     *
     * 建議只用於測試或 Web Worker。
     */
    runMonteCarloSync({

        simulations =
            this.options
                .monteCarlo
                .simulations,

        random =
            Math.random

    } = {}) {

        return this.monteCarlo
            .calculateSync({

                simulations,

                random

            });

    }

    /**
     * 執行 Exact
     */
    async runExact({

        batchSize =
            this.options
                .exact
                .batchSize,

        signal = null,

        onProgress = null

    } = {}) {

        return this.exact
            .calculate({

                batchSize,

                signal,

                onProgress

            });

    }

    /**
     * 同步執行 Exact
     *
     * 建議只用於測試或 Web Worker。
     */
    runExactSync() {

        return this.exact
            .calculateSync();

    }

    /**
     * 執行指定機率分析模式。
     */
    async resolveAnalysis({

        mode =
            this.options.mode,

        probability = null,

        monteCarloResult = null,

        exactResult = null,

        monteCarloOptions = {},

        exactOptions = {},

        signal = null,

        onMonteCarloProgress = null,

        onExactProgress = null

    } = {}) {

        /**
         * 外部直接提供機率，
         * 適合測試。
         */
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

        /**
         * 使用已完成的結果，
         * 避免重複運算。
         */
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

            /**
             * 先執行 Monte Carlo，
             * 讓 UI 能先看到進度。
             */
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

            /**
             * Hybrid 最終使用 Exact 機率，
             * Monte Carlo 用於驗證及 Confidence。
             */
            return {

                method:
                    AnalysisMode.HYBRID,

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
     * 計算所有有效下注的 EV。
     */
    getEV(probability) {

        const result = {};

        for (
            const name of
            Object.keys(BET_CONFIG)
        ) {

            if (
                !Number.isFinite(
                    probability[name]
                )
            ) {

                continue;

            }

            const method =
                this.ev[name];

            if (
                typeof method !==
                "function"
            ) {

                continue;

            }

            result[name] =
                method.call(

                    this.ev,

                    probability

                );

        }

        return result;

    }

    /**
     * 建立 Kelly 與 Risk
     * 共用的下注參數。
     */
    buildBetInput(probability) {

        const bets = {};

        for (
            const [
                name,
                config
            ] of Object.entries(
                BET_CONFIG
            )
        ) {

            const winProbability =
                probability[name];

            if (
                !Number.isFinite(
                    winProbability
                )
            ) {

                continue;

            }

            const pushProbability =
                config.pushKey
                    ? (
                        probability[
                            config.pushKey
                        ] ?? 0
                    )
                    : 0;

            bets[name] = {

                winProbability,

                pushProbability,

                netOdds:
                    config.netOdds

            };

        }

        return bets;

    }

    /**
     * 建立 Kelly 執行選項。
     */
    buildKellyOptions({

        bankroll,

        fraction,

        minBet,

        maxBet,

        maxBankrollRatio

    } = {}) {

        const result = {};

        if (
            bankroll !== undefined
        ) {

            result.bankroll =
                bankroll;

        }

        if (
            fraction !== undefined
        ) {

            result.fraction =
                fraction;

        }

        if (
            minBet !== undefined
        ) {

            result.minBet =
                minBet;

        }

        if (
            maxBet !== undefined
        ) {

            result.maxBet =
                maxBet;

        }

        if (
            maxBankrollRatio !==
            undefined
        ) {

            result.maxBankrollRatio =
                maxBankrollRatio;

        }

        return result;

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
     * 取得 Monte Carlo 樣本數。
     */
    getSampleSize(monteCarlo) {

        if (!monteCarlo) {

            return null;

        }

        const value =

            monteCarlo.sampleSize ??

            monteCarlo.samples ??

            monteCarlo.simulations ??

            null;

        return (
            Number.isInteger(value) &&
            value > 0
        )
            ? value
            : null;

    }

    /**
     * 建立 Confidence 結果。
     */
    getConfidence({

        probability,

        monteCarlo = null,

        exact = null,

        method = "provided"

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
            Object.keys(BET_CONFIG)
        ) {

            if (
                !Number.isFinite(
                    probability[name]
                )
            ) {

                continue;

            }

            const mcValue =
                mcProbability?.[
                    name
                ];

            const exactValue =
                exactProbability?.[
                    name
                ];

            /**
             * 有 Monte Carlo 時，
             * 使用正式 Confidence 引擎。
             */
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

            /**
             * Exact 沒有抽樣誤差，
             * 但仍可能有程式或規則模型錯誤。
             *
             * 這裡給 1 代表：
             * 「在目前計算模型內為精確列舉」。
             */
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
                this.confidence.level(
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
     * 整理 Ranking 標準輸入。
     */
    buildRankingInput({

        probability,

        ev,

        kelly,

        risk,

        confidence

    }) {

        const result = {};

        for (
            const [
                name,
                config
            ] of Object.entries(
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

            const evValue =
                ev[name];

            const kellyValue =
                kelly[name];

            const riskValue =
                risk[name];

            const confidenceValue =
                confidence[name];

            if (
                !Number.isFinite(
                    evValue
                ) ||
                !kellyValue ||
                !riskValue ||
                !confidenceValue
            ) {

                continue;

            }

            result[name] = {

                label:
                    config.label,

                provisionalBet:
                    config.provisional ??
                    false,

                probability:
                    probability[name],

                ev:
                    evValue,

                kelly:
                    kellyValue
                        .appliedKelly ?? 0,

                fullKelly:
                    kellyValue
                        .fullKelly ?? 0,

                amount:
                    kellyValue
                        .amount ?? 0,

                rawAmount:
                    kellyValue
                        .rawAmount ?? 0,

                capped:
                    kellyValue
                        .capped ?? false,

                risk:
                    riskValue
                        .relativeRisk ?? 0,

                riskLevel:
                    riskValue
                        .riskLevel ?? null,

                riskLabel:
                    riskValue
                        .riskLabel ?? null,

                variance:
                    riskValue
                        .variance ?? null,

                standardDeviation:
                    riskValue
                        .standardDeviation ??
                    null,

                confidence:
                    confidenceValue
                        .confidenceScore ?? 0,

                confidenceLevel:
                    confidenceValue
                        .confidenceLevel ??
                    null,

                confidenceLabel:
                    confidenceValue
                        .confidenceLabel ??
                    null,

                confidenceProvisional:
                    confidenceValue
                        .provisional ??
                    false

            };

        }

        return result;

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
     * 取得最佳可下注項目。
     */
    getBestFromRanking(ranking) {

        return (

            ranking.find(
                item =>
                    item.eligible
            ) ??
            null

        );

    }

    /**
     * 產生最終 Recommendation。
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
     * 手機正式版建議使用這個方法。
     */
    async analyze({

        mode =
            this.options.mode,

        /**
         * 測試時可直接傳入機率。
         */
        probability = null,

        /**
         * 已計算結果可直接重用。
         */
        monteCarloResult = null,

        exactResult = null,

        monteCarloOptions = {},

        exactOptions = {},

        bankroll = undefined,

        fraction = undefined,

        minBet = undefined,

        maxBet = undefined,

        maxBankrollRatio =
            undefined,

        signal = null,

        onMonteCarloProgress =
            null,

        onExactProgress =
            null

    } = {}) {

        this.validateContext();

        const startedAt =
            Date.now();

        /**
         * 1. 機率分析
         */
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

        /**
         * 2. EV
         */
        const ev =
            this.getEV(
                finalProbability
            );

        /**
         * 3. Kelly
         */
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

        /**
         * 4. Risk
         */
        const risk =
            this.getRisk(
                finalProbability
            );

        /**
         * 5. Confidence
         */
        const confidence =
            this.getConfidence({

                probability:
                    finalProbability,

                monteCarlo:
                    resolved
                        .monteCarlo,

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

        /**
         * 6. Ranking
         */
        const rankingInput =
            this.buildRankingInput({

                probability:
                    finalProbability,

                ev,

                kelly,

                risk,

                confidence

            });

        const ranking =
            this.getRanking(
                rankingInput
            );

        const best =
            this.getBestFromRanking(
                ranking
            );

        /**
         * 7. Recommendation
         */
        const recommendation =
            this.getRecommendation(
                ranking
            );

        const completedAt =
            Date.now();

        const shoe =
            this.context.shoe;

        const observableRemaining =

            shoe.observableRemaining ??
            shoe.knownRemaining ??
            shoe.remaining ??
            shoe.cards?.length ??
            0;

        const physicalRemaining =

            shoe.physicalRemaining ??
            observableRemaining;

        const unknownBurnedCount =

            shoe.unknownBurnedCount ??
            0;


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

            kelly,

            risk,

            confidence,

            overallConfidence,

            ranking,

            best,

            recommendation,

            shouldBet:
                recommendation
                    ?.shouldBet ??
                false,

            /**
             * 舊版相容。
             *
             * remainingCards 顯示實體牌靴剩餘數。
             */
            remainingCards:
                physicalRemaining,

            /**
             * 機率引擎使用的可觀察牌池數量。
             */
            observableRemaining,

            /**
             * 賭桌牌靴實際剩餘數量。
             */
            physicalRemaining,

            /**
             * 身分未知的隱藏燒牌張數。
             */
            unknownBurnedCount,

            /**
             * 本分析是第幾局完成後產生。
             */
            generatedAfterRound:

                this.context.roundCount ??

                this.context.history
                    ?.count ??

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

            output.contextSummary = {

                roundCount:
                    output
                        .generatedAfterRound,

                observableRemaining:
                    output
                        .observableRemaining,

                physicalRemaining:
                    output
                        .physicalRemaining,

                unknownBurnedCount:
                    output
                        .unknownBurnedCount,

                historyCount:
                    this.context.history
                        ?.count ??
                    0,

                hasBurnInfo:
                    Boolean(
                        this.context.burn
                    )

            };

        }

        return output;

    }

    /**
     * 同步分析。
     *
     * 適合：
     * - 測試
     * - Web Worker
     *
     * 不建議在手機 UI 主執行緒執行 Exact。
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

        bankroll = undefined,

        fraction = undefined,

        minBet = undefined,

        maxBet = undefined,

        maxBankrollRatio =
            undefined

    } = {}) {

        this.validateContext();

        let monteCarlo = null;

        let exact = null;

        let method;

        let finalProbability;

        if (probability) {

            method =
                "provided";

            finalProbability =
                this.normalizeProbability(
                    probability
                );

        }
        else if (
            mode ===
            AnalysisMode.MONTE_CARLO
        ) {

            monteCarlo =
                this.runMonteCarloSync({

                    simulations,

                    random

                });

            method =
                AnalysisMode
                    .MONTE_CARLO;

            finalProbability =
                this.normalizeProbability(
                    monteCarlo
                );

        }
        else if (
            mode ===
            AnalysisMode.EXACT
        ) {

            exact =
                this.runExactSync();

            method =
                AnalysisMode.EXACT;

            finalProbability =
                this.normalizeProbability(
                    exact
                );

        }
        else if (
            mode ===
            AnalysisMode.HYBRID
        ) {

            monteCarlo =
                this.runMonteCarloSync({

                    simulations,

                    random

                });

            exact =
                this.runExactSync();

            method =
                AnalysisMode.HYBRID;

            finalProbability =
                this.normalizeProbability(
                    exact
                );

        }
        else {

            throw new Error(

                `Unknown analysis mode: ${mode}`

            );

        }

        const ev =
            this.getEV(
                finalProbability
            );

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

                monteCarlo,

                exact,

                method

            });

        const rankingInput =
            this.buildRankingInput({

                probability:
                    finalProbability,

                ev,

                kelly,

                risk,

                confidence

            });

        const ranking =
            this.getRanking(
                rankingInput
            );

        const recommendation =
            this.getRecommendation(
                ranking
            );

        return {

            method,

            probability:
                finalProbability,

            monteCarlo,

            exact,

            ev,

            kelly,

            risk,

            confidence,

            overallConfidence:
                this.confidence
                    .overall(
                        confidence
                    ),

            ranking,

            best:
                this.getBestFromRanking(
                    ranking
                ),

            recommendation,

            shouldBet:
                recommendation
                    .shouldBet,

            remainingCards:

                this.context.shoe
                    .physicalRemaining ??

                this.context.shoe
                    .remaining,

            observableRemaining:

                this.context.shoe
                    .observableRemaining ??

                this.context.shoe
                    .remaining,

            physicalRemaining:

                this.context.shoe
                    .physicalRemaining ??

                this.context.shoe
                    .remaining,

            unknownBurnedCount:

                this.context.shoe
                    .unknownBurnedCount ??
                0,

            generatedAfterRound:

                this.context.roundCount ??

                this.context.history
                    ?.count ??

                0,

            analyzedAt:
                new Date()
                    .toISOString()

        };

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
     * 設定 Ranking 權重。
     */
    setRankingWeights(weights) {

        this.ranking
            .setWeights(
                weights
            );

        return this;

    }

    /**
     * 設定 Kelly。
     */
    setKellyConfig(config) {

        this.kelly
            .setConfig(
                config
            );

        return this;

    }

    /**
     * 設定 Recommendation。
     */
    setRecommendationOptions(
        options
    ) {

        this.recommendation
            .updateOptions(
                options
            );

        return this;

    }

    /**
     * 中止判斷工具。
     */
    isAbortError(error) {

        return (
            error?.name ===
            "AbortError"
        );

    }

    /**
     * Analyzer 目前狀態摘要
     */
    get summary() {

        const shoe =
            this.context.shoe;

        return {

            mode:
                this.options.mode,

            hasShoe:
                Boolean(shoe),

            observableRemaining:

                shoe?.observableRemaining ??
                shoe?.remaining ??
                0,

            physicalRemaining:

                shoe?.physicalRemaining ??
                shoe?.remaining ??
                0,

            unknownBurnedCount:

                shoe?.unknownBurnedCount ??
                0,

            roundCount:

                this.context.roundCount ??

                this.context.history
                    ?.count ??

                0

        };

    }

    /**
     * 輸出 Analyzer 設定。
     */
    toJSON() {

        return {

            mode:
                this.options.mode,

            includeDebugData:
                this.options
                    .includeDebugData,

            monteCarlo:
                this.monteCarlo
                    .toJSON(),

            exact:
                this.exact
                    .toJSON(),

            kelly: {

                ...this.kelly.config

            },

            risk:
                this.risk.toJSON(),

            confidence:
                this.confidence
                    .toJSON(),

            ranking:
                this.ranking.toJSON(),

            recommendation:
                this.recommendation
                    .toJSON()

        };

    }

}
