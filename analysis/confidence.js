/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Confidence Analysis Engine
 *
 * 職責：
 * 1. 計算 Monte Carlo 標準誤
 * 2. 計算 Wilson 信賴區間
 * 3. 計算誤差範圍
 * 4. 比較 Exact 與 Monte Carlo 結果
 * 5. 計算樣本可信度
 * 6. 計算結果一致性
 * 7. 輸出綜合 Confidence Score
 *
 * 不負責：
 * - EV
 * - Kelly
 * - Risk
 * - Ranking
 * - Recommendation
 */

const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 信賴水準
     *
     * 目前支援：
     * 0.90
     * 0.95
     * 0.99
     */
    confidenceLevel: 0.95,

    /**
     * 理想誤差範圍
     *
     * 0.01 = ±1%
     */
    targetMarginOfError: 0.01,

    /**
     * Exact 與 Monte Carlo
     * 可接受的最大差距
     *
     * 0.02 = 2%
     */
    agreementTolerance: 0.02,

    /**
     * 綜合評分權重
     */
    weights: Object.freeze({
        sample: 0.4,
        precision: 0.3,
        agreement: 0.3
    })

});

const Z_SCORES = Object.freeze({
    0.90: 1.6448536269514722,
    0.95: 1.959963984540054,
    0.99: 2.5758293035489004
});

export default class Confidence {

    constructor(options = {}) {

        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,

            weights: {
                ...DEFAULT_OPTIONS.weights,
                ...(options.weights ?? {})
            }
        };

        this.validateOptions();

    }

    /**
     * 將數值限制在指定範圍
     */
    clamp(
        value,
        min = 0,
        max = 1
    ) {

        return Math.min(
            max,
            Math.max(min, value)
        );

    }

    /**
     * 驗證引擎設定
     */
    validateOptions() {

        const {
            confidenceLevel,
            targetMarginOfError,
            agreementTolerance,
            weights
        } = this.options;

        if (
            !Object.prototype.hasOwnProperty.call(
                Z_SCORES,
                confidenceLevel
            )
        ) {
            throw new RangeError(
                "confidenceLevel must be 0.90, 0.95, or 0.99"
            );
        }

        if (
            !Number.isFinite(targetMarginOfError) ||
            targetMarginOfError <= 0 ||
            targetMarginOfError > 1
        ) {
            throw new RangeError(
                "targetMarginOfError must be between 0 and 1"
            );
        }

        if (
            !Number.isFinite(agreementTolerance) ||
            agreementTolerance <= 0 ||
            agreementTolerance > 1
        ) {
            throw new RangeError(
                "agreementTolerance must be between 0 and 1"
            );
        }

        const {
            sample,
            precision,
            agreement
        } = weights;

        if (
            !Number.isFinite(sample) ||
            sample < 0 ||
            !Number.isFinite(precision) ||
            precision < 0 ||
            !Number.isFinite(agreement) ||
            agreement < 0
        ) {
            throw new RangeError(
                "Confidence weights must be non-negative finite numbers"
            );
        }

        const totalWeight =
            sample +
            precision +
            agreement;

        if (totalWeight <= 0) {
            throw new RangeError(
                "At least one confidence weight must be greater than 0"
            );
        }

    }

    /**
     * 驗證機率
     */
    validateProbability(
        probability,
        name = "probability"
    ) {

        if (
            !Number.isFinite(probability) ||
            probability < 0 ||
            probability > 1
        ) {
            throw new RangeError(
                `${name} must be between 0 and 1`
            );
        }

    }

    /**
     * 驗證樣本數
     */
    validateSampleSize(sampleSize) {

        if (
            !Number.isInteger(sampleSize) ||
            sampleSize <= 0
        ) {
            throw new RangeError(
                "sampleSize must be a positive integer"
            );
        }

    }

    /**
     * 取得目前信賴水準的 Z 值
     */
    get zScore() {

        return Z_SCORES[
            this.options.confidenceLevel
        ];

    }

    /**
     * 標準誤
     *
     * SE = sqrt(p(1-p) / n)
     */
    standardError(
        probability,
        sampleSize
    ) {

        this.validateProbability(probability);
        this.validateSampleSize(sampleSize);

        return Math.sqrt(
            (
                probability *
                (1 - probability)
            ) /
            sampleSize
        );

    }

    /**
     * 常態近似誤差範圍
     *
     * Margin of Error = Z × SE
     */
    marginOfError(
        probability,
        sampleSize
    ) {

        return (
            this.zScore *
            this.standardError(
                probability,
                sampleSize
            )
        );

    }

    /**
     * Wilson Score Interval
     *
     * 相較於單純 p ± Z × SE，
     * 在機率接近 0 或 1 時更穩定。
     */
    wilsonInterval(
        probability,
        sampleSize
    ) {

        this.validateProbability(probability);
        this.validateSampleSize(sampleSize);

        const z =
            this.zScore;

        const zSquared =
            z ** 2;

        const denominator =
            1 +
            zSquared / sampleSize;

        const center = (
            probability +
            zSquared /
            (2 * sampleSize)
        ) / denominator;

        const spread = (
            z *
            Math.sqrt(
                (
                    probability *
                    (1 - probability) /
                    sampleSize
                ) +
                (
                    zSquared /
                    (
                        4 *
                        sampleSize ** 2
                    )
                )
            )
        ) / denominator;

        return {
            lower:
                this.clamp(
                    center - spread
                ),

            upper:
                this.clamp(
                    center + spread
                ),

            center,

            width:
                spread * 2,

            margin:
                spread
        };

    }

    /**
     * 樣本數評分
     *
     * 使用最保守情況 p = 0.5，
     * 計算目前樣本數相對於目標誤差
     * 所需樣本數的完成程度。
     */
    sampleScore(sampleSize) {

        this.validateSampleSize(sampleSize);

        const target =
            this.options
                .targetMarginOfError;

        const requiredSampleSize =
            Math.ceil(
                (
                    this.zScore ** 2 *
                    0.25
                ) /
                target ** 2
            );

        return this.clamp(
            sampleSize /
            requiredSampleSize
        );

    }

    /**
     * 精確度評分
     *
     * 實際誤差越小，評分越高。
     */
    precisionScore(
        probability,
        sampleSize
    ) {

        const margin =
            this.wilsonInterval(
                probability,
                sampleSize
            ).margin;

        const target =
            this.options
                .targetMarginOfError;

        if (margin === 0) {
            return 1;
        }

        return this.clamp(
            target / margin
        );

    }

    /**
     * Exact 與 Monte Carlo
     * 絕對差距
     */
    agreementDifference(
        monteCarloProbability,
        exactProbability
    ) {

        this.validateProbability(
            monteCarloProbability,
            "monteCarloProbability"
        );

        this.validateProbability(
            exactProbability,
            "exactProbability"
        );

        return Math.abs(
            monteCarloProbability -
            exactProbability
        );

    }

    /**
     * Exact 與 Monte Carlo
     * 一致性評分
     *
     * 差距為 0 時為 1。
     * 差距達到 tolerance 時為 0。
     */
    agreementScore(
        monteCarloProbability,
        exactProbability
    ) {

        const difference =
            this.agreementDifference(
                monteCarloProbability,
                exactProbability
            );

        return this.clamp(
            1 -
            (
                difference /
                this.options
                    .agreementTolerance
            )
        );

    }

    /**
     * Exact 是否落在
     * Monte Carlo Wilson 區間內
     */
    containsExact({
        monteCarloProbability,
        exactProbability,
        sampleSize
    }) {

        const interval =
            this.wilsonInterval(
                monteCarloProbability,
                sampleSize
            );

        this.validateProbability(
            exactProbability,
            "exactProbability"
        );

        return (
            exactProbability >= interval.lower &&
            exactProbability <= interval.upper
        );

    }

    /**
     * 加權平均
     */
    weightedScore(scores) {

        let weightedTotal = 0;
        let totalWeight = 0;

        for (
            const {
                score,
                weight,
                available = true
            }
            of scores
        ) {

            if (!available) {
                continue;
            }

            weightedTotal +=
                score * weight;

            totalWeight +=
                weight;

        }

        if (totalWeight === 0) {
            return 0;
        }

        return this.clamp(
            weightedTotal /
            totalWeight
        );

    }

    /**
     * 信心等級
     */
    level(score) {

        if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > 1
        ) {
            throw new RangeError(
                "Confidence score must be between 0 and 1"
            );
        }

        if (score >= 0.9) {
            return "veryHigh";
        }

        if (score >= 0.75) {
            return "high";
        }

        if (score >= 0.55) {
            return "medium";
        }

        if (score >= 0.35) {
            return "low";
        }

        return "veryLow";

    }

    /**
     * 中文信心標籤
     */
    levelLabel(level) {

        const labels = {
            veryHigh: "極高可信度",
            high: "高可信度",
            medium: "中等可信度",
            low: "低可信度",
            veryLow: "極低可信度"
        };

        return (
            labels[level] ??
            "未知可信度"
        );

    }

    /**
     * 完整可信度分析
     *
     * exactProbability 為選填。
     *
     * Exact 尚未執行時，
     * 綜合分數只使用：
     *
     * - sampleScore
     * - precisionScore
     */
    calculate({

        name = null,

        monteCarloProbability,

        sampleSize,

        exactProbability = null

    }) {

        this.validateProbability(
            monteCarloProbability,
            "monteCarloProbability"
        );

        this.validateSampleSize(
            sampleSize
        );

        const hasExact =
            exactProbability !== null &&
            exactProbability !== undefined;

        if (hasExact) {
            this.validateProbability(
                exactProbability,
                "exactProbability"
            );
        }

        const standardError =
            this.standardError(
                monteCarloProbability,
                sampleSize
            );

        const normalMarginOfError =
            this.marginOfError(
                monteCarloProbability,
                sampleSize
            );

        const interval =
            this.wilsonInterval(
                monteCarloProbability,
                sampleSize
            );

        const sampleScore =
            this.sampleScore(
                sampleSize
            );

        const precisionScore =
            this.precisionScore(
                monteCarloProbability,
                sampleSize
            );

        const agreementDifference =
            hasExact
                ? this.agreementDifference(
                    monteCarloProbability,
                    exactProbability
                )
                : null;

        const agreementScore =
            hasExact
                ? this.agreementScore(
                    monteCarloProbability,
                    exactProbability
                )
                : null;

        const exactInsideInterval =
            hasExact
                ? this.containsExact({
                    monteCarloProbability,
                    exactProbability,
                    sampleSize
                })
                : null;

        const confidenceScore =
            this.weightedScore([
                {
                    score:
                        sampleScore,

                    weight:
                        this.options
                            .weights
                            .sample
                },
                {
                    score:
                        precisionScore,

                    weight:
                        this.options
                            .weights
                            .precision
                },
                {
                    score:
                        agreementScore ?? 0,

                    weight:
                        this.options
                            .weights
                            .agreement,

                    available:
                        hasExact
                }
            ]);

        const confidenceLevel =
            this.level(
                confidenceScore
            );

        return {
            name,

            monteCarloProbability,
            exactProbability,

            sampleSize,

            statisticalConfidenceLevel:
                this.options
                    .confidenceLevel,

            zScore:
                this.zScore,

            standardError,

            normalMarginOfError,

            wilsonInterval: {
                lower:
                    interval.lower,

                upper:
                    interval.upper,

                margin:
                    interval.margin,

                width:
                    interval.width
            },

            sampleScore,
            precisionScore,

            agreementDifference,
            agreementScore,
            exactInsideInterval,

            confidenceScore,

            confidencePercent:
                confidenceScore * 100,

            confidenceLevel,

            confidenceLabel:
                this.levelLabel(
                    confidenceLevel
                ),

            hasExact
        };

    }

    /**
     * 批次分析多個下注項目
     *
     * bets 格式：
     *
     * {
     *   player: {
     *     monteCarloProbability: 0.446,
     *     exactProbability: 0.445,
     *     sampleSize: 100000
     *   }
     * }
     */
    calculateAll(bets) {

        if (
            !bets ||
            typeof bets !== "object" ||
            Array.isArray(bets)
        ) {
            throw new TypeError(
                "bets must be an object"
            );
        }

        const results = {};

        for (
            const [name, input]
            of Object.entries(bets)
        ) {

            if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input)
            ) {
                throw new TypeError(
                    `Invalid confidence input: ${name}`
                );
            }

            results[name] =
                this.calculate({
                    name,
                    ...input
                });

        }

        return results;

    }

    /**
     * 計算整體分析可信度
     *
     * 使用各下注項目的平均分數。
     */
    overall(results) {

        const entries =
            Array.isArray(results)
                ? results
                : Object.values(
                    results ?? {}
                );

        if (entries.length === 0) {
            return {
                confidenceScore: 0,
                confidencePercent: 0,
                confidenceLevel:
                    "veryLow",
                confidenceLabel:
                    this.levelLabel(
                        "veryLow"
                    ),
                itemCount: 0
            };
        }

        const scores =
            entries
                .map(
                    item =>
                        item?.confidenceScore
                )
                .filter(
                    score =>
                        Number.isFinite(score)
                );

        if (scores.length === 0) {
            return {
                confidenceScore: 0,
                confidencePercent: 0,
                confidenceLevel:
                    "veryLow",
                confidenceLabel:
                    this.levelLabel(
                        "veryLow"
                    ),
                itemCount: 0
            };
        }

        const confidenceScore =
            scores.reduce(
                (sum, score) =>
                    sum + score,
                0
            ) /
            scores.length;

        const confidenceLevel =
            this.level(
                confidenceScore
            );

        return {
            confidenceScore,

            confidencePercent:
                confidenceScore * 100,

            confidenceLevel,

            confidenceLabel:
                this.levelLabel(
                    confidenceLevel
                ),

            itemCount:
                scores.length
        };

    }

    /**
     * 複製 Confidence 引擎
     */
    clone() {

        return new Confidence({
            confidenceLevel:
                this.options
                    .confidenceLevel,

            targetMarginOfError:
                this.options
                    .targetMarginOfError,

            agreementTolerance:
                this.options
                    .agreementTolerance,

            weights: {
                ...this.options.weights
            }
        });

    }

    /**
     * 輸出引擎設定
     */
    toJSON() {

        return {
            confidenceLevel:
                this.options
                    .confidenceLevel,

            targetMarginOfError:
                this.options
                    .targetMarginOfError,

            agreementTolerance:
                this.options
                    .agreementTolerance,

            weights: {
                ...this.options.weights
            }
        };

    }

}
