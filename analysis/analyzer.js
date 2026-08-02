/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Analyzer
 *
 * 分析層總控制器
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
import Ranking, {
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
} from "./ranking.js";
import Recommendation from "./recommendation.js";
import dragonBonus from "./dragonBonus.js";


/**
 * 分析模式
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
 * 支援下注項目
 *
 * netOdds 為淨賠率。
 */
export const BET_CONFIG = Object.freeze({

    player: Object.freeze({

        label:
            "閒",

        group:
            "main",

        netOdds:
            1,

        pushKey:
            "tie",

        recommendationEligible:
            true,

        analysisAvailable:
            true

    }),

    banker: Object.freeze({

        label:
            "莊",

        group:
            "main",

        netOdds:
            0.95,

        pushKey:
            "tie",

        recommendationEligible:
            true,

        analysisAvailable:
            true

    }),

    tie: Object.freeze({

        label:
            "和",

        group:
            "main",

        netOdds:
            8,

        pushKey:
            null,

        recommendationEligible:
            true,

        analysisAvailable:
            true

    }),

    playerPair: Object.freeze({

        label:
            "閒對",

        group:
            "side",

        netOdds:
            11,

        pushKey:
            null,

        recommendationEligible:
            false,

        analysisAvailable:
            true

    }),

    bankerPair: Object.freeze({

        label:
            "莊對",

        group:
            "side",

        netOdds:
            11,

        pushKey:
            null,

        recommendationEligible:
            false,

        analysisAvailable:
            true

    }),

    super6: Object.freeze({

        label:
            "超級 6",

        group:
            "side",

        netOdds:
            12,

        pushKey:
            null,

        recommendationEligible:
            false,

        analysisAvailable:
            true

    }),

    playerDragonBonus: Object.freeze({

        label:
            "閒龍寶",

        group:
            "side",

        netOdds:
            null,

        pushKey:
            null,

        provisional:
            true,

        recommendationEligible:
            false,

        analysisAvailable:
            false

    }),

    bankerDragonBonus: Object.freeze({

        label:
            "莊龍寶",

        group:
            "side",

        netOdds:
            null,

        pushKey:
            null,

        provisional:
            true,

        recommendationEligible:
            false,

        analysisAvailable:
            false

    })

});


export {
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
};


const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 手機即時分析預設使用 Monte Carlo。
     */
    mode:
        AnalysisMode.MONTE_CARLO,

    monteCarlo: Object.freeze({

        simulations:
            100000,

        batchSize:
            1000

    }),

    exact: Object.freeze({

        batchSize:
            8

    }),

    includeDebugData:
        false

});


function isObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


export default class Analyzer {

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

        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 1
        ) {

            throw new RangeError(
                `${name} probability must be between 0 and 1.`
            );

        }

    }


    /**
     * 從分析結果取出 probability。
     */
    extractProbability(source) {

        if (!isObject(source)) {

            return null;

        }

        if (
            isObject(
                source.probability
            )
        ) {

            return source.probability;

        }

        return source;

    }


    /**
     * 整理並驗證機率。
     */
    normalizeProbability(source) {

        const input =
            this.extractProbability(
                source
            );

        if (!input) {

            throw new Error(
                "Probability data is required."
            );

        }

        const result = {};

        for (
            const name of
            Object.keys(
                BET_CONFIG
            )
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

            result[name] =
                value;

        }

        for (
            const name of
            [
                "player",
                "banker",
                "tie"
            ]
        ) {

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
                "Player, Banker and Tie probabilities must total approximately 1."
            );

        }

        return result;

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

        const bets = {};

        for (
            const [
                name,
                config
            ] of Object.entries(
                BET_CONFIG
            )
        ) {

            if (
                config.analysisAvailable ===
                    false ||
                !Number.isFinite(
                    config.netOdds
                )
            ) {

                continue;

            }

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
     * 建立 Kelly 選項。
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
     * Monte Carlo 樣本數。
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

                group:
                    config.group,

                recommendationEligible:
                    config.recommendationEligible ===
                    true,

                analysisAvailable:
                    config.analysisAvailable !==
                    false,

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

        const dragon =
            dragonBonus();

        const result = {};

        for (
            const name of
            SIDE_BETS
        ) {

            const config =
                BET_CONFIG[name];

            const available =
                config.analysisAvailable !==
                false &&
                evStatus[name] ===
                    "available";

            result[name] = {

                name,

                label:
                    config.label,

                group:
                    "side",

                probability:
                    Number.isFinite(
                        probability[name]
                    )
                        ? probability[name]
                        : null,

                ev:
                    available &&
                    Number.isFinite(
                        ev[name]
                    )
                        ? ev[name]
                        : null,

                evStatus:
                    evStatus[name] ??
                    "unavailable",

                available,

                provisional:
                    config.provisional ??
                    false,

                recommendationEligible:
                    false,

                kelly:
                    available
                        ? (
                            kelly[name]
                                ?.appliedKelly ??
                            0
                        )
                        : 0,

                amount:
                    0,

                risk:
                    available
                        ? (
                            risk[name]
                                ?.relativeRisk ??
                            null
                        )
                        : null,

                confidence:
                    confidence[name]
                        ?.confidenceScore ??
                    null,

                reason:
                    name ===
                        "playerDragonBonus"
                        ? dragon.player.reason
                        : name ===
                            "bankerDragonBonus"
                            ? dragon.banker.reason
                            : null

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
     * 最佳可下注項目。
     */
    getBestFromRanking(ranking) {

        if (!Array.isArray(ranking)) {

            return null;

        }

        return (

            ranking.find(
                item =>
                    item.eligible &&
                    MAIN_RECOMMENDATION_BETS
                        .includes(
                            item.name
                        )
            ) ??

            null

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
     */
    get summary() {

        return {

            mode:
                this.options.mode,

            hasShoe:
                Boolean(
                    this.context.shoe
                ),

            observableRemaining:
                this.context.shoe
                    ?.observableRemaining ??
                this.context.shoe
                    ?.remaining ??
                0,

            physicalRemaining:
                this.context.shoe
                    ?.physicalRemaining ??
                this.context.shoe
                    ?.remaining ??
                0,

            unknownBurnedCount:
                this.context.shoe
                    ?.unknownBurnedCount ??
                0,

            roundCount:
                this.context.history
                    ?.count ??
                0,

            remainingCards:
                this.context.shoe
                    ?.observableRemaining ??
                this.context.shoe
                    ?.remaining ??
                0,

            remainingPhysicalCards:
                this.context.shoe
                    ?.physicalRemaining ??
                this.context.shoe
                    ?.remaining ??
                0,

            rounds:
                this.context.history
                    ?.count ??
                0

        };

    }

}
