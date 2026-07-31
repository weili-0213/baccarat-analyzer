/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Risk Analysis Engine
 *
 * 職責：
 * 1. 計算單位下注的期望值
 * 2. 計算變異數
 * 3. 計算標準差
 * 4. 計算輸錢機率
 * 5. 計算報酬風險比
 * 6. 提供風險等級
 *
 * 不負責：
 * - Kelly
 * - 信心值
 * - 排名
 * - 最終下注推薦
 */

const DEFAULT_THRESHOLDS = Object.freeze({
    low: 0.75,
    medium: 1.5,
    high: 3
});

export default class Risk {

    constructor(options = {}) {

        this.thresholds = {
            ...DEFAULT_THRESHOLDS,
            ...(options.thresholds ?? {})
        };

        this.validateThresholds();

    }

    /**
     * 驗證風險門檻
     */
    validateThresholds() {

        const {
            low,
            medium,
            high
        } = this.thresholds;

        if (
            !Number.isFinite(low) ||
            !Number.isFinite(medium) ||
            !Number.isFinite(high)
        ) {
            throw new TypeError(
                "Risk thresholds must be finite numbers"
            );
        }

        if (
            low < 0 ||
            medium <= low ||
            high <= medium
        ) {
            throw new RangeError(
                "Risk thresholds must satisfy: 0 <= low < medium < high"
            );
        }

    }

    /**
     * 驗證下注參數
     */
    validateInput({
        winProbability,
        pushProbability = 0,
        netOdds
    }) {

        if (
            !Number.isFinite(winProbability) ||
            winProbability < 0 ||
            winProbability > 1
        ) {
            throw new RangeError(
                "winProbability must be between 0 and 1"
            );
        }

        if (
            !Number.isFinite(pushProbability) ||
            pushProbability < 0 ||
            pushProbability > 1
        ) {
            throw new RangeError(
                "pushProbability must be between 0 and 1"
            );
        }

        if (
            winProbability + pushProbability > 1
        ) {
            throw new RangeError(
                "winProbability + pushProbability cannot exceed 1"
            );
        }

        if (
            !Number.isFinite(netOdds) ||
            netOdds <= 0
        ) {
            throw new RangeError(
                "netOdds must be greater than 0"
            );
        }

    }

    /**
     * 敗率
     */
    loseProbability(
        winProbability,
        pushProbability = 0
    ) {

        return Math.max(
            0,
            1 -
            winProbability -
            pushProbability
        );

    }

    /**
     * 單位下注期望值
     *
     * 勝：獲利 netOdds
     * 敗：損失 1
     * Push：獲利 0
     */
    expectedValue({
        winProbability,
        pushProbability = 0,
        netOdds
    }) {

        this.validateInput({
            winProbability,
            pushProbability,
            netOdds
        });

        const loseProbability =
            this.loseProbability(
                winProbability,
                pushProbability
            );

        return (
            winProbability * netOdds -
            loseProbability
        );

    }

    /**
     * 單位下注變異數
     *
     * Var(X) = E[(X - μ)²]
     */
    variance({
        winProbability,
        pushProbability = 0,
        netOdds
    }) {

        this.validateInput({
            winProbability,
            pushProbability,
            netOdds
        });

        const loseProbability =
            this.loseProbability(
                winProbability,
                pushProbability
            );

        const ev = this.expectedValue({
            winProbability,
            pushProbability,
            netOdds
        });

        const winDeviation =
            netOdds - ev;

        const loseDeviation =
            -1 - ev;

        const pushDeviation =
            -ev;

        return (
            winProbability *
            winDeviation ** 2
        ) + (
            loseProbability *
            loseDeviation ** 2
        ) + (
            pushProbability *
            pushDeviation ** 2
        );

    }

    /**
     * 標準差
     */
    standardDeviation(input) {

        return Math.sqrt(
            this.variance(input)
        );

    }

    /**
     * 報酬風險比
     *
     * 正 EV：
     * EV / 標準差
     *
     * 負 EV 或零 EV：
     * 回傳 0
     */
    rewardToRisk(input) {

        const ev =
            this.expectedValue(input);

        const standardDeviation =
            this.standardDeviation(input);

        if (
            ev <= 0 ||
            standardDeviation === 0
        ) {
            return 0;
        }

        return ev / standardDeviation;

    }

    /**
     * 相對風險
     *
     * 標準差 / 最大可能獲利
     *
     * 數值越高代表報酬波動越大。
     */
    relativeRisk(input) {

        const standardDeviation =
            this.standardDeviation(input);

        return (
            standardDeviation /
            input.netOdds
        );

    }

    /**
     * 風險等級
     *
     * 根據相對風險分類。
     */
    level(relativeRisk) {

        if (
            !Number.isFinite(relativeRisk) ||
            relativeRisk < 0
        ) {
            throw new RangeError(
                "relativeRisk must be a non-negative finite number"
            );
        }

        if (
            relativeRisk <=
            this.thresholds.low
        ) {
            return "low";
        }

        if (
            relativeRisk <=
            this.thresholds.medium
        ) {
            return "medium";
        }

        if (
            relativeRisk <=
            this.thresholds.high
        ) {
            return "high";
        }

        return "extreme";

    }

    /**
     * 中文風險標籤
     */
    levelLabel(level) {

        const labels = {
            low: "低風險",
            medium: "中等風險",
            high: "高風險",
            extreme: "極高風險"
        };

        return labels[level] ?? "未知風險";

    }

    /**
     * 完整風險分析
     */
    calculate({
        name = null,
        winProbability,
        pushProbability = 0,
        netOdds
    }) {

        const input = {
            winProbability,
            pushProbability,
            netOdds
        };

        this.validateInput(input);

        const loseProbability =
            this.loseProbability(
                winProbability,
                pushProbability
            );

        const expectedValue =
            this.expectedValue(input);

        const variance =
            this.variance(input);

        const standardDeviation =
            Math.sqrt(variance);

        const rewardToRisk =
            expectedValue > 0 &&
            standardDeviation > 0
                ? expectedValue /
                  standardDeviation
                : 0;

        const relativeRisk =
            standardDeviation /
            netOdds;

        const riskLevel =
            this.level(relativeRisk);

        return {
            name,

            winProbability,
            loseProbability,
            pushProbability,

            netOdds,

            expectedValue,
            variance,
            standardDeviation,

            downsideProbability:
                loseProbability,

            rewardToRisk,
            relativeRisk,

            riskLevel,

            riskLabel:
                this.levelLabel(
                    riskLevel
                ),

            positiveEV:
                expectedValue > 0
        };

    }

    /**
     * 一次分析多個下注項目
     *
     * 支援物件格式：
     *
     * {
     *   player: {
     *     winProbability: 0.446,
     *     pushProbability: 0.096,
     *     netOdds: 1
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
            const [name, bet]
            of Object.entries(bets)
        ) {

            if (
                !bet ||
                typeof bet !== "object"
            ) {
                throw new TypeError(
                    `Invalid bet configuration: ${name}`
                );
            }

            results[name] =
                this.calculate({
                    name,
                    ...bet
                });

        }

        return results;

    }

    /**
     * 複製 Risk 引擎
     */
    clone() {

        return new Risk({
            thresholds: {
                ...this.thresholds
            }
        });

    }

    /**
     * 輸出設定
     */
    toJSON() {

        return {
            thresholds: {
                ...this.thresholds
            }
        };

    }

}
