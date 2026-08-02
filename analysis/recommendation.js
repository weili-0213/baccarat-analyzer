/**
 * Baccarat Analyzer V3.4
 * analysis/recommendation.js
 *
 * Recommendation Engine
 *
 * 原則：
 *
 * - 主推薦只允許 player / banker / tie
 * - 只有 EV > minimumEV 的候選可下注
 * - 候選依 EV 由高至低排列
 * - 最多輸出 Top 3
 * - Kelly 建議金額限制於 minBet ～ maxBet
 * - 沒有合格候選時，明確回傳「不下注」
 */

export const RECOMMENDATION_ENGINE_VERSION =
    "3.4.0";


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
            DEFAULT_ALLOWED_BETS,

        minBet:
            100,

        maxBet:
            10000,

        roundTo:
            100

    });


function isFiniteNumber(value) {

    return Number.isFinite(
        value
    );

}


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
            allowedBets,
            minBet,
            maxBet,
            roundTo
        } = this.options;


        if (
            !isFiniteNumber(
                minimumEV
            )
        ) {

            throw new TypeError(
                "minimumEV must be a finite number"
            );

        }


        if (
            !isFiniteNumber(
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
                !isFiniteNumber(
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
            !isFiniteNumber(
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


        if (
            !isFiniteNumber(
                minBet
            ) ||
            minBet < 0
        ) {

            throw new RangeError(
                "minBet must be a non-negative number"
            );

        }


        if (
            !isFiniteNumber(
                maxBet
            ) ||
            maxBet < minBet
        ) {

            throw new RangeError(
                "maxBet must be greater than or equal to minBet"
            );

        }


        if (
            !isFiniteNumber(
                roundTo
            ) ||
            roundTo <= 0
        ) {

            throw new RangeError(
                "roundTo must be greater than 0"
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
                    !isFiniteNumber(
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
            !isFiniteNumber(
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
            !isFiniteNumber(
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


    normalizeAmount(amount) {

        if (
            !isFiniteNumber(
                amount
            ) ||
            amount <= 0
        ) {

            return 0;

        }


        const rounded =
            Math.floor(
                amount /
                this.options.roundTo
            ) *
            this.options.roundTo;


        if (
            rounded <
            this.options.minBet
        ) {

            return this.options
                .requirePositiveAmount
                    ? 0
                    : this.options.minBet;

        }


        return Math.min(
            this.options.maxBet,
            Math.max(
                this.options.minBet,
                rounded
            )
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
                "可信度仍為暫時值"
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
            this.normalizeAmount(
                item.amount
            );


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
                "Kelly 金額低於最低下注限制"
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

            rawAmount:
                isFiniteNumber(
                    item.amount
                )
                    ? item.amount
                    : 0,

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


    sortCandidates(
        candidates
    ) {

        return [
            ...candidates
        ].sort(
            (
                left,
                right
            ) => {

                if (
                    right.ev !==
                    left.ev
                ) {

                    return (
                        right.ev -
                        left.ev
                    );

                }


                if (
                    right.confidence !==
                    left.confidence
                ) {

                    return (
                        right.confidence -
                        left.confidence
                    );

                }


                if (
                    right.kelly !==
                    left.kelly
                ) {

                    return (
                        right.kelly -
                        left.kelly
                    );

                }


                return (
                    left.risk -
                    right.risk
                );

            }
        );

    }


    getCandidates(ranking) {

        this.validateRanking(
            ranking
        );


        const candidates =
            this
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
                );


        return this
            .sortCandidates(
                candidates
            )
            .slice(
                0,
                this.options
                    .candidateCount
            )
            .map(
                (
                    item,
                    index
                ) => ({

                    ...item,

                    recommendationRank:
                        index +
                        1

                })
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

            version:
                RECOMMENDATION_ENGINE_VERSION,

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
                best.recommendationRank,

            headline:
                `建議下注：${best.label}`,

            message:
                `最高 EV 為 ${best.label}，建議下注 ${this.formatAmount(best.amount)}`,

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

            limits: {

                minBet:
                    this.options.minBet,

                maxBet:
                    this.options.maxBet,

                roundTo:
                    this.options.roundTo

            },

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

            version:
                RECOMMENDATION_ENGINE_VERSION,

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
                "所有主注皆未通過正 EV、可信度、Kelly 與風險條件",

            reasons,

            warnings:
                [],

            candidates:
                [],

            rejected,

            limits: {

                minBet:
                    this.options.minBet,

                maxBet:
                    this.options.maxBet,

                roundTo:
                    this.options.roundTo

            },

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


        if (!best) {

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

            version:
                RECOMMENDATION_ENGINE_VERSION,

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
                ],

            minBet:
                this.options.minBet,

            maxBet:
                this.options.maxBet,

            roundTo:
                this.options.roundTo

        };

    }

}
