/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Recommendation Engine
 *
 * 職責：
 * 1. 接收 Ranking 結果
 * 2. 判斷下注或跳過
 * 3. 選出最佳下注
 * 4. 整理建議原因
 * 5. 整理拒絕原因
 * 6. 提供 UI 可直接使用的輸出
 *
 * 不負責：
 * - 機率計算
 * - EV 計算
 * - Kelly 計算
 * - Risk 計算
 * - Confidence 計算
 * - Ranking 計算
 */

const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 最低 EV
     *
     * 0 代表必須為正 EV。
     */
    minimumEV: 0,

    /**
     * 最低可信度
     */
    minimumConfidence: 0.6,

    /**
     * 最高相對風險
     *
     * null 代表不限制。
     */
    maximumRisk: null,

    /**
     * 最低綜合排名分數
     */
    minimumScore: 0,

    /**
     * 必須有正 Kelly
     */
    requirePositiveKelly: true,

    /**
     * 必須有實際下注金額
     */
    requirePositiveAmount: true,

    /**
     * 暫時可信度是否允許下注
     *
     * Monte Carlo / Exact 尚未完成時，
     * Confidence 可能標記 provisional。
     */
    allowProvisionalConfidence: false,

    /**
     * 最多輸出幾個候選項目
     */
    candidateCount: 3

});


const ACTION = Object.freeze({

    BET: "bet",

    SKIP: "skip"

});


const DECISION = Object.freeze({

    RECOMMENDED: "recommended",

    REJECTED: "rejected"

});


export {
    ACTION,
    DECISION
};


export default class Recommendation {

    constructor(options = {}) {

        this.setOptions(options);

    }

    /**
     * 更新設定
     */
    setOptions(options = {}) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };

        this.validateOptions();

        return this;

    }

    /**
     * 驗證設定
     */
    validateOptions() {

        const {
            minimumEV,
            minimumConfidence,
            maximumRisk,
            minimumScore,
            requirePositiveKelly,
            requirePositiveAmount,
            allowProvisionalConfidence,
            candidateCount
        } = this.options;

        if (!Number.isFinite(minimumEV)) {

            throw new TypeError(
                "minimumEV must be a finite number"
            );

        }

        if (
            !Number.isFinite(
                minimumConfidence
            ) ||
            minimumConfidence < 0 ||
            minimumConfidence > 1
        ) {

            throw new RangeError(
                "minimumConfidence must be between 0 and 1"
            );

        }

        if (
            maximumRisk !== null &&
            (
                !Number.isFinite(maximumRisk) ||
                maximumRisk < 0
            )
        ) {

            throw new RangeError(
                "maximumRisk must be null or a non-negative number"
            );

        }

        if (
            !Number.isFinite(minimumScore) ||
            minimumScore < 0 ||
            minimumScore > 1
        ) {

            throw new RangeError(
                "minimumScore must be between 0 and 1"
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

        if (
            typeof requirePositiveAmount !==
            "boolean"
        ) {

            throw new TypeError(
                "requirePositiveAmount must be boolean"
            );

        }

        if (
            typeof allowProvisionalConfidence !==
            "boolean"
        ) {

            throw new TypeError(
                "allowProvisionalConfidence must be boolean"
            );

        }

        if (
            !Number.isInteger(candidateCount) ||
            candidateCount < 1
        ) {

            throw new RangeError(
                "candidateCount must be a positive integer"
            );

        }

    }

    /**
     * 驗證 Ranking 結果
     */
    validateRanking(ranking) {

        if (!Array.isArray(ranking)) {

            throw new TypeError(
                "Ranking result must be an array"
            );

        }

        for (const item of ranking) {

            if (
                !item ||
                typeof item !== "object" ||
                Array.isArray(item)
            ) {

                throw new TypeError(
                    "Invalid ranking item"
                );

            }

            if (
                typeof item.name !==
                "string" ||
                item.name.length === 0
            ) {

                throw new TypeError(
                    "Ranking item name is required"
                );

            }

            const requiredNumbers = {

                ev:
                    item.ev,

                kelly:
                    item.kelly,

                risk:
                    item.risk,

                confidence:
                    item.confidence,

                score:
                    item.score

            };

            for (
                const [key, value]
                of Object.entries(
                    requiredNumbers
                )
            ) {

                if (!Number.isFinite(value)) {

                    throw new TypeError(
                        `${item.name}.${key} must be a finite number`
                    );

                }

            }

        }

    }

    /**
     * 數值格式化
     */
    formatPercent(
        value,
        digits = 2
    ) {

        if (!Number.isFinite(value)) {

            return "0.00%";

        }

        return (
            value * 100
        ).toFixed(digits) + "%";

    }

    /**
     * 金額格式化
     */
    formatAmount(amount) {

        if (!Number.isFinite(amount)) {

            return "0";

        }

        return Math.max(
            0,
            Math.floor(amount)
        ).toLocaleString();

    }

    /**
     * 取得中文名稱
     */
    getLabel(item) {

        return (
            item.label ??
            item.name
        );

    }

    /**
     * 檢查單一項目是否符合推薦條件
     */
    evaluate(item) {

        const reasons = [];

        const rejectedReasons = [];

        /**
         * EV
         */
        if (
            item.ev >
            this.options.minimumEV
        ) {

            reasons.push(
                `EV 為正（${this.formatPercent(item.ev)}）`
            );

        }
        else {

            rejectedReasons.push(
                `EV 未超過門檻（${this.formatPercent(item.ev)}）`
            );

        }

        /**
         * Confidence
         */
        if (
            item.confidence >=
            this.options.minimumConfidence
        ) {

            reasons.push(
                `可信度達標（${this.formatPercent(item.confidence)}）`
            );

        }
        else {

            rejectedReasons.push(
                `可信度不足（${this.formatPercent(item.confidence)}）`
            );

        }

        /**
         * 暫時可信度
         */
        if (
            item.confidenceProvisional &&
            !this.options
                .allowProvisionalConfidence
        ) {

            rejectedReasons.push(
                "可信度仍為暫時值，尚未完成 Monte Carlo 或 Exact 驗證"
            );

        }

        /**
         * Kelly
         */
        if (
            !this.options
                .requirePositiveKelly ||
            item.kelly > 0
        ) {

            if (item.kelly > 0) {

                reasons.push(
                    `Kelly 比例為 ${this.formatPercent(item.kelly)}`
                );

            }

        }
        else {

            rejectedReasons.push(
                "Kelly 比例不是正值"
            );

        }

        /**
         * 下注金額
         */
        const amount =
            Number.isFinite(item.amount)
                ? Math.max(
                    0,
                    Math.floor(item.amount)
                )
                : 0;

        if (
            !this.options
                .requirePositiveAmount ||
            amount > 0
        ) {

            if (amount > 0) {

                reasons.push(
                    `建議下注金額為 ${this.formatAmount(amount)}`
                );

            }

        }
        else {

            rejectedReasons.push(
                "下注金額低於最低下注限制或為 0"
            );

        }

        /**
         * Risk
         */
        if (
            this.options.maximumRisk ===
            null
        ) {

            if (item.riskLabel) {

                reasons.push(
                    `風險等級：${item.riskLabel}`
                );

            }

        }
        else if (
            item.risk <=
            this.options.maximumRisk
        ) {

            reasons.push(
                "風險低於設定上限"
            );

        }
        else {

            rejectedReasons.push(
                "風險超過設定上限"
            );

        }

        /**
         * Ranking Score
         */
        if (
            item.score >=
            this.options.minimumScore
        ) {

            reasons.push(
                `綜合分數為 ${this.formatPercent(item.score)}`
            );

        }
        else {

            rejectedReasons.push(
                `綜合分數未達門檻（${this.formatPercent(item.score)}）`
            );

        }

        /**
         * Ranking 自己已經判定不合格時，
         * Recommendation 必須尊重該結果。
         */
        if (item.eligible === false) {

            rejectedReasons.push(
                "未通過 Ranking 的基本下注條件"
            );

        }

        const eligible =
            rejectedReasons.length === 0;

        return {

            eligible,

            reasons,

            rejectedReasons,

            amount

        };

    }

    /**
     * 建立候選項目資料
     */
    createCandidate(item) {

        const evaluation =
            this.evaluate(item);

        return {

            name:
                item.name,

            label:
                this.getLabel(item),

            rank:
                item.rank ?? null,

            probability:
                item.probability ?? null,

            ev:
                item.ev,

            evPercent:
                item.ev * 100,

            kelly:
                item.kelly,

            kellyPercent:
                item.kelly * 100,

            fullKelly:
                item.fullKelly ?? null,

            amount:
                evaluation.amount,

            risk:
                item.risk,

            riskLevel:
                item.riskLevel ?? null,

            riskLabel:
                item.riskLabel ?? null,

            confidence:
                item.confidence,

            confidencePercent:
                item.confidence * 100,

            confidenceLevel:
                item.confidenceLevel ??
                null,

            confidenceLabel:
                item.confidenceLabel ??
                null,

            confidenceProvisional:
                item.confidenceProvisional ??
                false,

            score:
                item.score,

            scorePercent:
                item.score * 100,

            positiveEV:
                item.ev > 0,

            eligible:
                evaluation.eligible,

            reasons:
                evaluation.reasons,

            rejectedReasons:
                evaluation.rejectedReasons

        };

    }

    /**
     * 取得符合條件的候選項目
     */
    getCandidates(ranking) {

        this.validateRanking(ranking);

        return ranking

            .map(
                item =>
                    this.createCandidate(
                        item
                    )
            )

            .filter(
                item =>
                    item.eligible
            )

            .slice(
                0,
                this.options
                    .candidateCount
            );

    }

    /**
     * 取得被拒絕項目
     */
    getRejected(ranking) {

        this.validateRanking(ranking);

        return ranking

            .map(
                item =>
                    this.createCandidate(
                        item
                    )
            )

            .filter(
                item =>
                    !item.eligible
            );

    }

    /**
     * 建立下注建議
     */
    createBetRecommendation(
        best,
        candidates,
        rejected
    ) {

        return {

            action:
                ACTION.BET,

            decision:
                DECISION.RECOMMENDED,

            shouldBet:
                true,

            bet:
                best.name,

            label:
                best.label,

            amount:
                best.amount,

            probability:
                best.probability,

            ev:
                best.ev,

            evPercent:
                best.evPercent,

            kelly:
                best.kelly,

            kellyPercent:
                best.kellyPercent,

            fullKelly:
                best.fullKelly,

            risk:
                best.risk,

            riskLevel:
                best.riskLevel,

            riskLabel:
                best.riskLabel,

            confidence:
                best.confidence,

            confidencePercent:
                best.confidencePercent,

            confidenceLevel:
                best.confidenceLevel,

            confidenceLabel:
                best.confidenceLabel,

            score:
                best.score,

            scorePercent:
                best.scorePercent,

            rank:
                best.rank,

            headline:
                `建議下注：${best.label}`,

            message:
                `建議下注 ${best.label}，金額 ${this.formatAmount(best.amount)}`,

            reasons: [
                ...best.reasons
            ],

            warnings:
                best.confidenceProvisional
                    ? [
                        "目前可信度仍為暫時值"
                    ]
                    : [],

            candidates,

            rejected,

            generatedAt:
                new Date()
                    .toISOString()

        };

    }

    /**
     * 建立跳過建議
     */
    createSkipRecommendation(
        ranking,
        rejected
    ) {

        const reasons = [];

        if (ranking.length === 0) {

            reasons.push(
                "目前沒有可供分析的下注項目"
            );

        }
        else {

            reasons.push(
                "目前沒有符合條件的正 EV 下注"
            );

        }

        const negativeEVCount =
            ranking.filter(
                item =>
                    item.ev <=
                    this.options.minimumEV
            ).length;

        if (
            negativeEVCount ===
            ranking.length &&
            ranking.length > 0
        ) {

            reasons.push(
                "所有下注項目的 EV 都未超過設定門檻"
            );

        }

        const lowConfidenceCount =
            ranking.filter(
                item =>
                    item.confidence <
                    this.options
                        .minimumConfidence
            ).length;

        if (
            lowConfidenceCount > 0
        ) {

            reasons.push(
                `${lowConfidenceCount} 個下注項目的可信度不足`
            );

        }

        const provisionalCount =
            ranking.filter(
                item =>
                    item.confidenceProvisional
            ).length;

        if (
            provisionalCount > 0 &&
            !this.options
                .allowProvisionalConfidence
        ) {

            reasons.push(
                "分析尚未完成 Monte Carlo 或 Exact 驗證"
            );

        }

        return {

            action:
                ACTION.SKIP,

            decision:
                DECISION.REJECTED,

            shouldBet:
                false,

            bet:
                null,

            label:
                "不下注",

            amount:
                0,

            probability:
                null,

            ev:
                null,

            evPercent:
                null,

            kelly:
                0,

            kellyPercent:
                0,

            risk:
                null,

            riskLevel:
                null,

            riskLabel:
                null,

            confidence:
                null,

            confidencePercent:
                null,

            score:
                null,

            scorePercent:
                null,

            rank:
                null,

            headline:
                "建議：本局不下注",

            message:
                "目前沒有符合設定條件的下注項目",

            reasons,

            warnings: [],

            candidates: [],

            rejected,

            generatedAt:
                new Date()
                    .toISOString()

        };

    }

    /**
     * 產生最終建議
     */
    calculate(ranking) {

        this.validateRanking(ranking);

        const candidates =
            this.getCandidates(
                ranking
            );

        const rejected =
            this.getRejected(
                ranking
            );

        const best =
            candidates[0] ?? null;

        if (!best) {

            return this
                .createSkipRecommendation(
                    ranking,
                    rejected
                );

        }

        return this
            .createBetRecommendation(
                best,
                candidates,
                rejected
            );

    }

    /**
     * calculate() 的別名
     */
    recommend(ranking) {

        return this.calculate(
            ranking
        );

    }

    /**
     * 更新單一設定
     */
    updateOptions(options = {}) {

        return this.setOptions({

            ...this.options,

            ...options

        });

    }

    /**
     * 複製 Recommendation 引擎
     */
    clone() {

        return new Recommendation({

            ...this.options

        });

    }

    /**
     * 輸出設定
     */
    toJSON() {

        return {

            minimumEV:
                this.options.minimumEV,

            minimumConfidence:
                this.options
                    .minimumConfidence,

            maximumRisk:
                this.options.maximumRisk,

            minimumScore:
                this.options.minimumScore,

            requirePositiveKelly:
                this.options
                    .requirePositiveKelly,

            requirePositiveAmount:
                this.options
                    .requirePositiveAmount,

            allowProvisionalConfidence:
                this.options
                    .allowProvisionalConfidence,

            candidateCount:
                this.options
                    .candidateCount

        };

    }

}
