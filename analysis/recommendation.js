/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * analysis/recommendation.js
 *
 * Recommendation Engine
 *
 * 預設只允許主注成為最終建議：
 *
 * - player
 * - banker
 * - tie
 *
 * 邊注與 Dragon Bonus 可保留在分析畫面中，
 * 但不會成為主推薦。
 */

export const ACTION =
    Object.freeze({

        BET:
            "bet",

        SKIP:
            "skip"

    });


export const DECISION =
    Object.freeze({

        RECOMMENDED:
            "recommended",

        REJECTED:
            "rejected"

    });


export const DEFAULT_ALLOWED_BETS =
    Object.freeze([

        "player",

        "banker",

        "tie"

    ]);


const DEFAULT_OPTIONS =
    Object.freeze({

        minimumEV:
            0,

        minimumConfidence:
            0.6,

        maximumRisk:
            null,

        minimumScore:
            0,

        requirePositiveKelly:
            true,

        requirePositiveAmount:
            true,

        allowProvisionalConfidence:
            false,

        candidateCount:
            3,

        allowedBets:
            DEFAULT_ALLOWED_BETS

    });


export default class Recommendation {

    constructor(
        options = {}
    ) {

        this.setOptions(
            options
        );

    }


    setOptions(
        options = {}
    ) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options,

            allowedBets:
                Array.isArray(
                    options.allowedBets
                )
                    ? [
                        ...options.allowedBets
                    ]
                    : [
                        ...DEFAULT_ALLOWED_BETS
                    ]

        };


        this.validateOptions();

        return this;

    }


    validateOptions() {

        const {
            minimumEV,
            minimumConfidence,
            maximumRisk,
            minimumScore,
            requirePositiveKelly,
            requirePositiveAmount,
            allowProvisionalConfidence,
            candidateCount,
            allowedBets
        } = this.options;


        if (
            !Number.isFinite(
                minimumEV
            )
        ) {

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
                !Number.isFinite(
                    maximumRisk
                ) ||
                maximumRisk < 0
            )
        ) {

            throw new RangeError(
                "maximumRisk must be null or a non-negative number"
            );

        }


        if (
            !Number.isFinite(
                minimumScore
            ) ||
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
            !Number.isInteger(
                candidateCount
            ) ||
            candidateCount < 1
        ) {

            throw new RangeError(
                "candidateCount must be a positive integer"
            );

        }


        if (
            !Array.isArray(
                allowedBets
            ) ||
            allowedBets.length === 0
        ) {

            throw new TypeError(
                "allowedBets must be a non-empty array"
            );

        }

    }


    isAllowedBet(name) {

        return this.options
            .allowedBets
            .includes(
                name
            );

    }


    filterAllowedRanking(
        ranking
    ) {

        return ranking.filter(
            item =>
                this.isAllowedBet(
                    item.name
                ) &&
                item.recommendationEligible !==
                    false
        );

    }


    validateRanking(
        ranking
    ) {

        if (
            !Array.isArray(
                ranking
            )
        ) {

            throw new TypeError(
                "Ranking result must be an array"
            );

        }


        for (
            const item of
            ranking
        ) {

            if (
                !item ||
                typeof item !==
                    "object" ||
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


            for (
                const [
                    key,
                    value
                ] of Object.entries({

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

                })
            ) {

                if (
                    !Number.isFinite(
                        value
                    )
                ) {

                    throw new TypeError(
                        `${item.name}.${key} must be a finite number`
                    );

                }

            }

        }

    }


    formatPercent(
        value,
        digits = 2
    ) {

        if (
            !Number.isFinite(
                value
            )
        ) {

            return "0.00%";

        }


        return (
            value *
            100
        ).toFixed(
            digits
        ) + "%";

    }


    formatAmount(amount) {

        if (
            !Number.isFinite(
                amount
            )
        ) {

            return "0";

        }


        return Math.max(
            0,
            Math.floor(
                amount
            )
        ).toLocaleString();

    }


    getLabel(item) {

        return (
            item.label ??
            item.name
        );

    }


    evaluate(item) {

        const reasons =
            [];

        const rejectedReasons =
            [];


        if (
            !this.isAllowedBet(
                item.name
            ) ||
            item.recommendationEligible ===
                false
        ) {

            rejectedReasons.push(
                "此下注項目不在主推薦候選範圍"
            );

        }


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


        if (
            item.confidenceProvisional &&
            !this.options
                .allowProvisionalConfidence
        ) {

            rejectedReasons.push(
                "可信度仍為暫時值，尚未完成 Monte Carlo 或 Exact 驗證"
            );

        }


        if (
            !this.options
                .requirePositiveKelly ||
            item.kelly > 0
        ) {

            if (
                item.kelly > 0
            ) {

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


        const amount =
            Number.isFinite(
                item.amount
            )
                ? Math.max(
                    0,
                    Math.floor(
                        item.amount
                    )
                )
                : 0;


        if (
            !this.options
                .requirePositiveAmount ||
            amount > 0
        ) {

            if (
                amount > 0
            ) {

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


        if (
            this.options.maximumRisk ===
            null
        ) {

            if (
                item.riskLabel
            ) {

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


        if (
            item.eligible ===
                false
        ) {

            rejectedReasons.push(
                "未通過 Ranking 的基本下注條件"
            );

        }


        return {

            eligible:
                rejectedReasons.length ===
                0,

            reasons,

            rejectedReasons,

            amount

        };

    }


    createCandidate(item) {

        const evaluation =
            this.evaluate(
                item
            );


        return {

            name:
                item.name,

            label:
                this.getLabel(
                    item
                ),

            rank:
                item.rank ??
                null,

            probability:
                item.probability ??
                null,

            ev:
                item.ev,

            evPercent:
                item.ev *
                100,

            kelly:
                item.kelly,

            kellyPercent:
                item.kelly *
                100,

            fullKelly:
                item.fullKelly ??
                null,

            amount:
                evaluation.amount,

            risk:
                item.risk,

            riskLevel:
                item.riskLevel ??
                null,

            riskLabel:
                item.riskLabel ??
                null,

            confidence:
                item.confidence,

            confidencePercent:
                item.confidence *
                100,

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
                item.score *
                100,

            positiveEV:
                item.ev >
                0,

            eligible:
                evaluation.eligible,

            reasons:
                evaluation.reasons,

            rejectedReasons:
                evaluation.rejectedReasons

        };

    }


    getCandidates(ranking) {

        this.validateRanking(
            ranking
        );


        return this
            .filterAllowedRanking(
                ranking
            )
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


    getRejected(ranking) {

        this.validateRanking(
            ranking
        );


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

            reasons:
                [
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


    createSkipRecommendation(
        ranking,
        rejected
    ) {

        const reasons =
            [];


        if (
            ranking.length ===
            0
        ) {

            reasons.push(
                "目前沒有可供分析的主注項目"
            );

        }
        else {

            reasons.push(
                "目前沒有符合條件的正 EV 主注"
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
                "目前沒有符合設定條件的主注項目",

            reasons,

            warnings:
                [],

            candidates:
                [],

            rejected,

            generatedAt:
                new Date()
                    .toISOString()

        };

    }


    calculate(ranking) {

        this.validateRanking(
            ranking
        );


        const allowedRanking =
            this.filterAllowedRanking(
                ranking
            );


        const candidates =
            this.getCandidates(
                ranking
            );

        const rejected =
            this.getRejected(
                ranking
            );

        const best =
            candidates[0] ??
            null;


        if (
            !best
        ) {

            return this
                .createSkipRecommendation(
                    allowedRanking,
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


    recommend(ranking) {

        return this.calculate(
            ranking
        );

    }


    updateOptions(
        options = {}
    ) {

        return this.setOptions({

            ...this.options,

            ...options

        });

    }


    clone() {

        return new Recommendation({

            ...this.options,

            allowedBets:
                [
                    ...this.options
                        .allowedBets
                ]

        });

    }


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
                    .candidateCount,

            allowedBets:
                [
                    ...this.options
                        .allowedBets
                ]

        };

    }

}
