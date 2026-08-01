/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Analyzer
 *
 * 分析層總控制器
 *
 * 負責整合：
 * - Probability
 * - EV
 * - Kelly
 * - Risk
 * - Confidence
 * - Ranking
 *
 * 不負責：
 * - 百家樂發牌規則
 * - 牌靴操作
 * - Monte Carlo 實際模擬
 * - Exact 實際列舉
 * - UI 顯示
 */

import EV from "./ev.js";
import Kelly from "./kelly.js";
import Risk from "./risk.js";
import Confidence from "./confidence.js";
import Ranking from "./ranking.js";


/**
 * 支援的下注項目
 */
const BET_CONFIG = Object.freeze({

    player: Object.freeze({
        label: "閒",
        netOdds: 1,
        pushKey: "tie"
    }),

    banker: Object.freeze({
        label: "莊",
        netOdds: 0.95,
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
        pushKey: null
    }),

    bankerDragonBonus: Object.freeze({
        label: "莊龍寶",
        netOdds: 30,
        pushKey: null
    })

});


export {
    BET_CONFIG
};


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
     *     kellyOptions,
     *     riskOptions,
     *     confidenceOptions,
     *     rankingOptions
     * }
     */
    constructor(context = {}) {

        this.setContext(context);

    }

    /**
     * 建立／更新分析環境
     */
    setContext(context = {}) {

        this.context = {
            ...context
        };

        this.ev = new EV(
            context.payouts ?? {}
        );

        this.kelly = new Kelly(
            context.kellyOptions ?? {}
        );

        this.risk = new Risk(
            context.riskOptions ?? {}
        );

        this.confidence = new Confidence(
            context.confidenceOptions ?? {}
        );

        this.ranking = new Ranking(
            context.rankingOptions ?? {}
        );

        return this;

    }

    /**
     * 驗證單一機率
     */
    validateProbability(
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
     * 取得結果中的機率物件
     *
     * 支援：
     *
     * {
     *     player: ...
     * }
     *
     * 或：
     *
     * {
     *     probability: {
     *         player: ...
     *     }
     * }
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
            typeof source.probability === "object"
        ) {
            return source.probability;
        }

        return source;

    }

    /**
     * 整理有效機率
     *
     * 尚未完成的 Side Bet 可以不存在，
     * Analyzer 會自動略過。
     */
    normalizeProbability(source) {

        const probability =
            this.extractProbability(
                source
            );

        if (!probability) {

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
                probability[name];

            if (
                value === undefined ||
                value === null
            ) {
                continue;
            }

            this.validateProbability(
                value,
                name
            );

            result[name] = value;

        }

        /**
         * 主注最少必須有：
         *
         * player
         * banker
         * tie
         */
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

        const mainTotal =
            result.player +
            result.banker +
            result.tie;

        /**
         * 容許浮點數誤差。
         */
        if (
            Math.abs(
                mainTotal - 1
            ) > 0.001
        ) {
            throw new RangeError(
                "Player, Banker and Tie probabilities must total approximately 1"
            );
        }

        return result;

    }

    /**
     * 選擇最終使用的機率
     *
     * 優先順序：
     *
     * 1. probability
     * 2. exact
     * 3. monteCarlo
     */
    resolveProbability({

        probability = null,

        exact = null,

        monteCarlo = null

    } = {}) {

        if (probability) {

            return {
                method: "provided",
                probability:
                    this.normalizeProbability(
                        probability
                    )
            };

        }

        if (exact) {

            return {
                method: "exact",
                probability:
                    this.normalizeProbability(
                        exact
                    )
            };

        }

        if (monteCarlo) {

            return {
                method: "monteCarlo",
                probability:
                    this.normalizeProbability(
                        monteCarlo
                    )
            };

        }

        throw new Error(
            "No probability source available"
        );

    }

    /**
     * 計算所有有效下注的 EV
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

            const calculator =
                this.ev[name];

            if (
                typeof calculator !==
                "function"
            ) {
                continue;
            }

            result[name] =
                calculator.call(
                    this.ev,
                    probability
                );

        }

        return result;

    }

    /**
     * 建立 Kelly／Risk 共用下注輸入
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
                    ? probability[
                        config.pushKey
                    ] ?? 0
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
     * 計算 Kelly
     */
    getKelly(
        probability,
        options = {}
    ) {

        const bets =
            this.buildBetInput(
                probability
            );

        return this.kelly.calculateAll(
            bets,
            options
        );

    }

    /**
     * 計算風險
     */
    getRisk(probability) {

        const bets =
            this.buildBetInput(
                probability
            );

        return this.risk.calculateAll(
            bets
        );

    }

    /**
     * 取得 Monte Carlo 樣本數
     */
    getSampleSize(monteCarlo) {

        if (!monteCarlo) {
            return null;
        }

        const sampleSize =
            monteCarlo.sampleSize ??
            monteCarlo.samples ??
            monteCarlo.simulations ??
            null;

        return (
            Number.isInteger(sampleSize) &&
            sampleSize > 0
        )
            ? sampleSize
            : null;

    }

    /**
     * 建立 Confidence 結果
     *
     * 有 Monte Carlo：
     * 使用正式統計信心分析。
     *
     * 沒有 Monte Carlo：
     * - Exact 結果：可信度設為 1
     * - 其他外部機率：暫用中性值 0.5
     */
    getConfidence({

        probability,

        monteCarlo = null,

        exact = null,

        method = "provided"

    }) {

        const monteCarloProbability =
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
                monteCarloProbability?.[
                    name
                ];

            const exactValue =
                exactProbability?.[
                    name
                ];

            /**
             * 有 Monte Carlo 樣本時，
             * 使用 Confidence Engine。
             */
            if (
                Number.isFinite(mcValue) &&
                sampleSize
            ) {

                result[name] =
                    this.confidence.calculate({

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
             * 沒有 Monte Carlo 時，
             * 先建立暫時可信度結果。
             */
            const isExact =
                method === "exact" ||
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

                statisticalConfidenceLevel:
                    null,

                sampleSize: null,

                standardError: null,

                normalMarginOfError: null,

                wilsonInterval: null,

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
     * 將所有模組整理成 Ranking 格式
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

            const kellyResult =
                kelly[name];

            const riskResult =
                risk[name];

            const confidenceResult =
                confidence[name];

            if (
                !Number.isFinite(evValue) ||
                !kellyResult ||
                !riskResult ||
                !confidenceResult
            ) {
                continue;
            }

            result[name] = {

                label:
                    config.label,

                probability:
                    probability[name],

                ev:
                    evValue,

                kelly:
                    kellyResult
                        .appliedKelly ?? 0,

                fullKelly:
                    kellyResult
                        .fullKelly ?? 0,

                amount:
                    kellyResult
                        .amount ?? 0,

                rawAmount:
                    kellyResult
                        .rawAmount ?? 0,

                capped:
                    kellyResult
                        .capped ?? false,

                risk:
                    riskResult
                        .relativeRisk ?? 0,

                riskLevel:
                    riskResult
                        .riskLevel ?? null,

                riskLabel:
                    riskResult
                        .riskLabel ?? null,

                variance:
                    riskResult
                        .variance ?? null,

                standardDeviation:
                    riskResult
                        .standardDeviation ??
                    null,

                confidence:
                    confidenceResult
                        .confidenceScore ?? 0,

                confidenceLevel:
                    confidenceResult
                        .confidenceLevel ??
                    null,

                confidenceLabel:
                    confidenceResult
                        .confidenceLabel ??
                    null,

                confidenceProvisional:
                    confidenceResult
                        .provisional ??
                    false

            };

        }

        return result;

    }

    /**
     * 計算排名
     */
    getRanking(rankingInput) {

        return this.ranking.calculate(
            rankingInput
        );

    }

    /**
     * 從已計算的排行榜找最佳下注
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
     * 完整分析
     *
     * 使用方式：
     *
     * analyzer.analyze({
     *     probability,
     *     monteCarlo,
     *     exact,
     *
     *     bankroll: 10000,
     *     fraction: 0.5
     * });
     */
    analyze({

        probability = null,

        monteCarlo = null,

        exact = null,

        bankroll = undefined,

        fraction = undefined,

        minBet = undefined,

        maxBet = undefined,

        maxBankrollRatio =
            undefined

    } = {}) {

        const resolved =
            this.resolveProbability({

                probability,

                monteCarlo,

                exact

            });

        const finalProbability =
            resolved.probability;

        const ev =
            this.getEV(
                finalProbability
            );

        /**
         * 只傳入有設定的 Kelly 選項，
         * 避免 undefined 覆蓋預設值。
         */
        const kellyOptions = {};

        if (
            bankroll !== undefined
        ) {
            kellyOptions.bankroll =
                bankroll;
        }

        if (
            fraction !== undefined
        ) {
            kellyOptions.fraction =
                fraction;
        }

        if (
            minBet !== undefined
        ) {
            kellyOptions.minBet =
                minBet;
        }

        if (
            maxBet !== undefined
        ) {
            kellyOptions.maxBet =
                maxBet;
        }

        if (
            maxBankrollRatio !==
            undefined
        ) {
            kellyOptions
                .maxBankrollRatio =
                maxBankrollRatio;
        }

        const kelly =
            this.getKelly(
                finalProbability,
                kellyOptions
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

                method:
                    resolved.method

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

        const best =
            this.getBestFromRanking(
                ranking
            );

        const overallConfidence =
            this.confidence.overall(
                confidence
            );

        return {

            method:
                resolved.method,

            probability:
                finalProbability,

            ev,

            kelly,

            risk,

            confidence,

            overallConfidence,

            rankingInput,

            ranking,

            best,

            shouldBet:
                best !== null,

            analyzedAt:
                new Date()
                    .toISOString()

        };

    }

    /**
     * 更新 Ranking 策略
     */
    setRankingStrategy(strategy) {

        this.ranking.setStrategy(
            strategy
        );

        return this;

    }

    /**
     * 更新 Ranking 自訂權重
     */
    setRankingWeights(weights) {

        this.ranking.setWeights(
            weights
        );

        return this;

    }

    /**
     * 更新 Kelly 設定
     */
    setKellyConfig(config) {

        this.kelly.setConfig(
            config
        );

        return this;

    }

    /**
     * 輸出 Analyzer 設定
     */
    toJSON() {

        return {

            ranking:
                this.ranking.toJSON(),

            confidence:
                this.confidence.toJSON(),

            risk:
                this.risk.toJSON(),

            kelly:
                {
                    ...this.kelly.config
                }

        };

    }

}
