/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * analysis/ranking.js
 *
 * Ranking Engine
 *
 * 預設只允許主注進入推薦排名：
 *
 * - player
 * - banker
 * - tie
 *
 * 邊注仍可顯示 EV，但不參與主推薦。
 */

export const MAIN_RECOMMENDATION_BETS =
    Object.freeze([

        "player",

        "banker",

        "tie"

    ]);


export const SIDE_BETS =
    Object.freeze([

        "playerPair",

        "bankerPair",

        "super6",

        "playerDragonBonus",

        "bankerDragonBonus"

    ]);


export const STRATEGIES =
    Object.freeze({

        conservative:
            Object.freeze({

                ev:
                    0.25,

                kelly:
                    0.15,

                confidence:
                    0.30,

                risk:
                    0.30

            }),

        balanced:
            Object.freeze({

                ev:
                    0.40,

                kelly:
                    0.20,

                confidence:
                    0.20,

                risk:
                    0.20

            }),

        aggressive:
            Object.freeze({

                ev:
                    0.50,

                kelly:
                    0.30,

                confidence:
                    0.10,

                risk:
                    0.10

            })

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        strategy:
            "balanced",

        minimumEV:
            0,

        minimumConfidence:
            0,

        requirePositiveKelly:
            true,

        allowedNames:
            MAIN_RECOMMENDATION_BETS

    });


export default class Ranking {

    constructor(
        options = {}
    ) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options,

            allowedNames:
                Array.isArray(
                    options.allowedNames
                )
                    ? [
                        ...options.allowedNames
                    ]
                    : [
                        ...MAIN_RECOMMENDATION_BETS
                    ]

        };


        this.customWeights =
            options.weights
                ? {
                    ...options.weights
                }
                : null;


        this.validateOptions();

    }


    clamp(
        value,
        min = 0,
        max = 1
    ) {

        return Math.min(
            max,
            Math.max(
                min,
                value
            )
        );

    }


    validateOptions() {

        const {
            strategy,
            minimumEV,
            minimumConfidence,
            requirePositiveKelly,
            allowedNames
        } = this.options;


        if (
            !Object.prototype
                .hasOwnProperty
                .call(
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
            typeof requirePositiveKelly !==
                "boolean"
        ) {

            throw new TypeError(
                "requirePositiveKelly must be boolean"
            );

        }


        if (
            !Array.isArray(
                allowedNames
            ) ||
            allowedNames.length === 0
        ) {

            throw new TypeError(
                "allowedNames must be a non-empty array"
            );

        }


        for (
            const name of
            allowedNames
        ) {

            if (
                typeof name !==
                    "string" ||
                name.length === 0
            ) {

                throw new TypeError(
                    "allowedNames must contain non-empty strings"
                );

            }

        }


        this.validateWeights(
            this.weights
        );

    }


    validateWeights(weights) {

        const keys = [

            "ev",

            "kelly",

            "confidence",

            "risk"

        ];


        for (
            const key of
            keys
        ) {

            if (
                !Number.isFinite(
                    weights[key]
                ) ||
                weights[key] < 0
            ) {

                throw new RangeError(
                    `Invalid ranking weight: ${key}`
                );

            }

        }


        const total =
            keys.reduce(
                (
                    sum,
                    key
                ) =>
                    sum +
                    weights[key],
                0
            );


        if (total <= 0) {

            throw new RangeError(
                "At least one ranking weight must be greater than 0"
            );

        }

    }


    get weights() {

        if (
            this.customWeights
        ) {

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


    get normalizedWeights() {

        const weights =
            this.weights;

        const total =
            Object.values(
                weights
            )
                .reduce(
                    (
                        sum,
                        value
                    ) =>
                        sum +
                        value,
                    0
                );


        return {

            ev:
                weights.ev /
                total,

            kelly:
                weights.kelly /
                total,

            confidence:
                weights.confidence /
                total,

            risk:
                weights.risk /
                total

        };

    }


    setStrategy(strategy) {

        if (
            !Object.prototype
                .hasOwnProperty
                .call(
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


    setAllowedNames(names) {

        if (
            !Array.isArray(names) ||
            names.length === 0
        ) {

            throw new TypeError(
                "Allowed ranking names must be a non-empty array"
            );

        }


        this.options.allowedNames =
            [
                ...names
            ];

        this.validateOptions();

        return this;

    }


    isAllowedName(name) {

        return this.options
            .allowedNames
            .includes(
                name
            );

    }


    validateItem(
        name,
        item
    ) {

        if (
            !item ||
            typeof item !==
                "object" ||
            Array.isArray(item)
        ) {

            throw new TypeError(
                `Invalid ranking item: ${name}`
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
                    item.confidence

            })
        ) {

            if (
                !Number.isFinite(
                    value
                )
            ) {

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


    validateData(data) {

        if (
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(data)
        ) {

            throw new TypeError(
                "Ranking data must be an object"
            );

        }


        for (
            const [
                name,
                item
            ] of Object.entries(data)
        ) {

            this.validateItem(
                name,
                item
            );

        }

    }


    filterAllowedData(data) {

        return Object.fromEntries(

            Object.entries(
                data
            )
                .filter(
                    ([
                        name
                    ]) =>
                        this.isAllowedName(
                            name
                        )
                )

        );

    }


    normalizeValues(
        values,
        higherIsBetter = true
    ) {

        if (
            values.length === 0
        ) {

            return [];

        }


        const minimum =
            Math.min(
                ...values
            );

        const maximum =
            Math.max(
                ...values
            );


        if (
            maximum ===
            minimum
        ) {

            return values.map(
                () => 0.5
            );

        }


        return values.map(
            value => {

                const normalized =
                    (
                        value -
                        minimum
                    ) /
                    (
                        maximum -
                        minimum
                    );

                return higherIsBetter
                    ? normalized
                    : 1 -
                        normalized;

            }
        );

    }


    isEligible(item) {

        if (
            item.recommendationEligible ===
                false
        ) {

            return false;

        }


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


    normalize(data) {

        this.validateData(
            data
        );


        const filtered =
            this.filterAllowedData(
                data
            );

        const entries =
            Object.entries(
                filtered
            );


        if (
            entries.length === 0
        ) {

            return {};

        }


        const normalizedEV =
            this.normalizeValues(
                entries.map(
                    ([
                        ,
                        item
                    ]) =>
                        item.ev
                ),
                true
            );

        const normalizedKelly =
            this.normalizeValues(
                entries.map(
                    ([
                        ,
                        item
                    ]) =>
                        item.kelly
                ),
                true
            );

        const normalizedConfidence =
            this.normalizeValues(
                entries.map(
                    ([
                        ,
                        item
                    ]) =>
                        item.confidence
                ),
                true
            );

        const normalizedRisk =
            this.normalizeValues(
                entries.map(
                    ([
                        ,
                        item
                    ]) =>
                        item.risk
                ),
                false
            );


        const normalized =
            {};


        entries.forEach(
            (
                [
                    name
                ],
                index
            ) => {

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


    calculate(data) {

        this.validateData(
            data
        );


        const filtered =
            this.filterAllowedData(
                data
            );

        const entries =
            Object.entries(
                filtered
            );


        if (
            entries.length === 0
        ) {

            return [];

        }


        const normalized =
            this.normalize(
                filtered
            );


        const result =
            entries.map(
                ([
                    name,
                    item
                ]) => {

                    const normalizedItem =
                        normalized[name];

                    const score =
                        this.score(
                            normalizedItem
                        );


                    return {

                        name,

                        ...item,

                        recommendationEligible:
                            item.recommendationEligible !==
                                false,

                        normalized:
                            {
                                ...normalizedItem
                            },

                        score,

                        scorePercent:
                            score *
                            100,

                        eligible:
                            this.isEligible(
                                item
                            ),

                        positiveEV:
                            item.ev >
                            0

                    };

                }
            );


        result.sort(
            (
                a,
                b
            ) => {

                if (
                    a.eligible !==
                    b.eligible
                ) {

                    return (
                        Number(
                            b.eligible
                        ) -
                        Number(
                            a.eligible
                        )
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

                    return (
                        b.ev -
                        a.ev
                    );

                }


                return (
                    a.risk -
                    b.risk
                );

            }
        );


        result.forEach(
            (
                item,
                index
            ) => {

                item.rank =
                    index +
                    1;

            }
        );


        return result;

    }


    best(data) {

        return (
            this.calculate(
                data
            )
                .find(
                    item =>
                        item.eligible
                ) ??
            null
        );

    }


    top(
        data,
        count = 3,
        options = {}
    ) {

        if (
            !Number.isInteger(
                count
            ) ||
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
            this.calculate(
                data
            );


        if (
            eligibleOnly
        ) {

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


    rejected(data) {

        return this.calculate(
            data
        )
            .filter(
                item =>
                    !item.eligible
            );

    }


    positiveEV(data) {

        return this.calculate(
            data
        )
            .filter(
                item =>
                    item.ev >
                    0
            );

    }


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
                    .requirePositiveKelly,

            allowedNames:
                [
                    ...this.options
                        .allowedNames
                ]

        };

    }


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
                    .requirePositiveKelly,

            allowedNames:
                [
                    ...this.options
                        .allowedNames
                ]

        });

    }

}
