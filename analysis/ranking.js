/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Ranking Engine v2
 *
 * 職責：
 * 1. 整合 EV、Kelly、Risk、Confidence
 * 2. 將不同尺度的指標正規化至 0～1
 * 3. 根據策略權重計算綜合分數
 * 4. 產生下注項目排名
 *
 * 不負責：
 * - 計算機率
 * - 計算 EV
 * - 計算 Kelly
 * - 計算 Risk
 * - 計算 Confidence
 * - 最終下注建議
 */

const STRATEGIES = Object.freeze({

    /**
     * 保守型
     *
     * 偏重風險與可信度
     */
    conservative: Object.freeze({
        ev: 0.25,
        kelly: 0.15,
        confidence: 0.30,
        risk: 0.30
    }),

    /**
     * 平衡型
     */
    balanced: Object.freeze({
        ev: 0.40,
        kelly: 0.20,
        confidence: 0.20,
        risk: 0.20
    }),

    /**
     * 積極型
     *
     * 偏重 EV 與 Kelly
     */
    aggressive: Object.freeze({
        ev: 0.50,
        kelly: 0.30,
        confidence: 0.10,
        risk: 0.10
    })

});

const DEFAULT_OPTIONS = Object.freeze({

    strategy: "balanced",

    /**
     * 最低 EV 門檻
     *
     * 0 代表必須是正 EV
     */
    minimumEV: 0,

    /**
     * 最低可信度
     */
    minimumConfidence: 0,

    /**
     * 是否要求 Kelly 大於 0
     */
    requirePositiveKelly: true

});

export {
    STRATEGIES
};

export default class Ranking {

    constructor(options = {}) {

        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        this.customWeights =
            options.weights
                ? { ...options.weights }
                : null;

        this.validateOptions();

    }

    /**
     * 限制數值在指定範圍內
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
     * 驗證設定
     */
    validateOptions() {

        const {
            strategy,
            minimumEV,
            minimumConfidence,
            requirePositiveKelly
        } = this.options;

        if (
            !Object.prototype.hasOwnProperty.call(
                STRATEGIES,
                strategy
            ) &&
            !this.customWeights
        ) {
            throw new Error(
                `Unknown ranking strategy: ${strategy}`
            );
        }

        if (
            !Number.isFinite(minimumEV)
        ) {
            throw new TypeError(
                "minimumEV must be a finite number"
            );
        }

        if (
            !Number.isFinite(minimumConfidence) ||
            minimumConfidence < 0 ||
            minimumConfidence > 1
        ) {
            throw new RangeError(
                "minimumConfidence must be between 0 and 1"
            );
        }

        if (
            typeof requirePositiveKelly !==
            "boolean"
        ) {
            throw new TypeError(
                "requirePositiveKelly must be boolean"
            );
        }

        this.validateWeights(
            this.weights
        );

    }

    /**
     * 驗證權重
     */
    validateWeights(weights) {

        const requiredKeys = [
            "ev",
            "kelly",
            "confidence",
            "risk"
        ];

        for (const key of requiredKeys) {

            if (
                !Number.isFinite(weights[key]) ||
                weights[key] < 0
            ) {
                throw new RangeError(
                    `Invalid ranking weight: ${key}`
                );
            }

        }

        const total =
            requiredKeys.reduce(
                (sum, key) =>
                    sum + weights[key],
                0
            );

        if (total <= 0) {
            throw new RangeError(
                "At least one ranking weight must be greater than 0"
            );
        }

    }

    /**
     * 目前使用的原始權重
     */
    get weights() {

        if (this.customWeights) {

            return {
                ...STRATEGIES.balanced,
                ...this.customWeights
            };

        }

        return {
            ...STRATEGIES[
                this.options.strategy
            ]
        };

    }

    /**
     * 將權重正規化，使總和為 1
     */
    get normalizedWeights() {

        const weights =
            this.weights;

        const total =
            Object.values(weights)
                .reduce(
                    (sum, value) =>
                        sum + value,
                    0
                );

        return {

            ev:
                weights.ev / total,

            kelly:
                weights.kelly / total,

            confidence:
                weights.confidence / total,

            risk:
                weights.risk / total

        };

    }

    /**
     * 更新策略
     */
    setStrategy(strategy) {

        if (
            !Object.prototype.hasOwnProperty.call(
                STRATEGIES,
                strategy
            )
        ) {
            throw new Error(
                `Unknown ranking strategy: ${strategy}`
            );
        }

        this.options.strategy =
            strategy;

        this.customWeights =
            null;

        return this;

    }

    /**
     * 設定自訂權重
     */
    setWeights(weights) {

        const merged = {
            ...STRATEGIES.balanced,
            ...weights
        };

        this.validateWeights(
            merged
        );

        this.customWeights =
            merged;

        return this;

    }

    /**
     * 驗證輸入項目
     */
    validateItem(name, item) {

        if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
        ) {
            throw new TypeError(
                `Invalid ranking item: ${name}`
            );
        }

        const requiredValues = {
            ev: item.ev,
            kelly: item.kelly,
            risk: item.risk,
            confidence: item.confidence
        };

        for (
            const [key, value]
            of Object.entries(
                requiredValues
            )
        ) {

            if (!Number.isFinite(value)) {

                throw new TypeError(
                    `${name}.${key} must be a finite number`
                );

            }

        }

        if (
            item.kelly < 0
        ) {
            throw new RangeError(
                `${name}.kelly cannot be negative`
            );
        }

        if (
            item.risk < 0
        ) {
            throw new RangeError(
                `${name}.risk cannot be negative`
            );
        }

        if (
            item.confidence < 0 ||
            item.confidence > 1
        ) {
            throw new RangeError(
                `${name}.confidence must be between 0 and 1`
            );
        }

    }

    /**
     * 驗證全部排名資料
     */
    validateData(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            throw new TypeError(
                "Ranking data must be an object"
            );
        }

        const entries =
            Object.entries(data);

        if (entries.length === 0) {
            return;
        }

        for (
            const [name, item]
            of entries
        ) {

            this.validateItem(
                name,
                item
            );

        }

    }

    /**
     * Min-Max 正規化
     *
     * higherIsBetter:
     * true  = 數值越高越好
     * false = 數值越低越好
     */
    normalizeValues(
        values,
        higherIsBetter = true
    ) {

        if (values.length === 0) {
            return [];
        }

        const minimum =
            Math.min(...values);

        const maximum =
            Math.max(...values);

        /**
         * 所有數值相同時，
         * 給予中性分數 0.5。
         */
        if (maximum === minimum) {

            return values.map(
                () => 0.5
            );

        }

        return values.map(value => {

            const normalized =
                (
                    value - minimum
                ) /
                (
                    maximum - minimum
                );

            return higherIsBetter
                ? normalized
                : 1 - normalized;

        });

    }

    /**
     * 判斷該下注是否符合基本條件
     */
    isEligible(item) {

        if (
            item.ev <=
            this.options.minimumEV
        ) {
            return false;
        }

        if (
            item.confidence <
            this.options
                .minimumConfidence
        ) {
            return false;
        }

        if (
            this.options
                .requirePositiveKelly &&
            item.kelly <= 0
        ) {
            return false;
        }

        return true;

    }

    /**
     * 建立正規化指標
     */
    normalize(data) {

        this.validateData(data);

        const entries =
            Object.entries(data);

        if (entries.length === 0) {
            return {};
        }

        const evValues =
            entries.map(
                ([, item]) =>
                    item.ev
            );

        const kellyValues =
            entries.map(
                ([, item]) =>
                    item.kelly
            );

        const confidenceValues =
            entries.map(
                ([, item]) =>
                    item.confidence
            );

        const riskValues =
            entries.map(
                ([, item]) =>
                    item.risk
            );

        const normalizedEV =
            this.normalizeValues(
                evValues,
                true
            );

        const normalizedKelly =
            this.normalizeValues(
                kellyValues,
                true
            );

        const normalizedConfidence =
            this.normalizeValues(
                confidenceValues,
                true
            );

        /**
         * Risk 越低越好，
         * 因此使用反向正規化。
         */
        const normalizedRisk =
            this.normalizeValues(
                riskValues,
                false
            );

        const normalized = {};

        entries.forEach(
            ([name], index) => {

                normalized[name] = {

                    ev:
                        normalizedEV[
                            index
                        ],

                    kelly:
                        normalizedKelly[
                            index
                        ],

                    confidence:
                        normalizedConfidence[
                            index
                        ],

                    risk:
                        normalizedRisk[
                            index
                        ]

                };

            }
        );

        return normalized;

    }

    /**
     * 計算單一項目的綜合分數
     */
    score(normalizedItem) {

        const weights =
            this.normalizedWeights;

        return this.clamp(

            (
                normalizedItem.ev *
                weights.ev
            ) +
            (
                normalizedItem.kelly *
                weights.kelly
            ) +
            (
                normalizedItem
                    .confidence *
                weights.confidence
            ) +
            (
                normalizedItem.risk *
                weights.risk
            )

        );

    }

    /**
     * 計算完整排名
     *
     * data 格式：
     *
     * {
     *   player: {
     *     ev: 0.012,
     *     kelly: 0.015,
     *     risk: 0.28,
     *     confidence: 0.95,
     *     amount: 150
     *   }
     * }
     */
    calculate(data) {

        this.validateData(data);

        const entries =
            Object.entries(data);

        if (entries.length === 0) {
            return [];
        }

        const normalized =
            this.normalize(data);

        const result =
            entries.map(
                ([name, item]) => {

                    const normalizedItem =
                        normalized[name];

                    const score =
                        this.score(
                            normalizedItem
                        );

                    return {

                        name,

                        ...item,

                        normalized: {
                            ...normalizedItem
                        },

                        score,

                        scorePercent:
                            score * 100,

                        eligible:
                            this.isEligible(
                                item
                            ),

                        positiveEV:
                            item.ev > 0

                    };

                }
            );

        /**
         * 排序規則：
         *
         * 1. 可下注項目排前面
         * 2. 綜合分數由高到低
         * 3. 分數相同時 EV 高者優先
         * 4. EV 相同時 Risk 低者優先
         */
        result.sort((a, b) => {

            if (
                a.eligible !==
                b.eligible
            ) {
                return (
                    Number(b.eligible) -
                    Number(a.eligible)
                );
            }

            if (
                b.score !==
                a.score
            ) {
                return (
                    b.score -
                    a.score
                );
            }

            if (
                b.ev !==
                a.ev
            ) {
                return b.ev - a.ev;
            }

            return a.risk - b.risk;

        });

        result.forEach(
            (item, index) => {

                item.rank =
                    index + 1;

            }
        );

        return result;

    }

    /**
     * 最佳可下注項目
     *
     * 若所有項目都是負 EV，
     * 或未通過其他門檻，
     * 回傳 null。
     */
    best(data) {

        const result =
            this.calculate(data);

        return (
            result.find(
                item =>
                    item.eligible
            ) ??
            null
        );

    }

    /**
     * 前 N 名
     */
    top(
        data,
        count = 3,
        options = {}
    ) {

        if (
            !Number.isInteger(count) ||
            count < 1
        ) {
            throw new RangeError(
                "count must be a positive integer"
            );
        }

        const {
            eligibleOnly = true
        } = options;

        let result =
            this.calculate(data);

        if (eligibleOnly) {

            result =
                result.filter(
                    item =>
                        item.eligible
                );

        }

        return result.slice(
            0,
            count
        );

    }

    /**
     * 不符合下注條件的項目
     */
    rejected(data) {

        return this.calculate(data)
            .filter(
                item =>
                    !item.eligible
            );

    }

    /**
     * 只有正 EV 的項目
     */
    positiveEV(data) {

        return this.calculate(data)
            .filter(
                item =>
                    item.ev > 0
            );

    }

    /**
     * 輸出目前設定
     */
    toJSON() {

        return {

            strategy:
                this.options.strategy,

            weights:
                this.normalizedWeights,

            minimumEV:
                this.options.minimumEV,

            minimumConfidence:
                this.options
                    .minimumConfidence,

            requirePositiveKelly:
                this.options
                    .requirePositiveKelly

        };

    }

    /**
     * 複製 Ranking 引擎
     */
    clone() {

        return new Ranking({

            strategy:
                this.options.strategy,

            weights:
                this.customWeights
                    ? {
                        ...this.customWeights
                    }
                    : undefined,

            minimumEV:
                this.options.minimumEV,

            minimumConfidence:
                this.options
                    .minimumConfidence,

            requirePositiveKelly:
                this.options
                    .requirePositiveKelly

        });

    }

}
