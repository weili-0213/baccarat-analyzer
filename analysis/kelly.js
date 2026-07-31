/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Kelly Criterion
 *
 * 只負責：
 * 1. Full Kelly
 * 2. Fractional Kelly
 * 3. 建議下注金額
 * 4. 最低及最高下注限制
 */

const DEFAULT_CONFIG = Object.freeze({

    bankroll: 10000,

    fraction: 0.5,

    minBet: 0,

    maxBet: Infinity,

    maxBankrollRatio: 0.05

});

export default class Kelly {

    constructor(config = {}) {

        this.setConfig(config);

    }

    /**
     * 更新設定
     */
    setConfig(config = {}) {

        this.config = {

            ...DEFAULT_CONFIG,
            ...config

        };

        this.validateConfig();

        return this;

    }

    /**
     * 驗證設定
     */
    validateConfig() {

        const {
            bankroll,
            fraction,
            minBet,
            maxBet,
            maxBankrollRatio
        } = this.config;

        if (
            !Number.isFinite(bankroll) ||
            bankroll < 0
        ) {
            throw new Error(
                "Bankroll must be a non-negative number"
            );
        }

        if (
            !Number.isFinite(fraction) ||
            fraction < 0 ||
            fraction > 1
        ) {
            throw new Error(
                "Kelly fraction must be between 0 and 1"
            );
        }

        if (
            !Number.isFinite(minBet) ||
            minBet < 0
        ) {
            throw new Error(
                "Minimum bet must be non-negative"
            );
        }

        if (
            maxBet !== Infinity &&
            (
                !Number.isFinite(maxBet) ||
                maxBet < minBet
            )
        ) {
            throw new Error(
                "Maximum bet must be greater than minimum bet"
            );
        }

        if (
            !Number.isFinite(maxBankrollRatio) ||
            maxBankrollRatio < 0 ||
            maxBankrollRatio > 1
        ) {
            throw new Error(
                "Maximum bankroll ratio must be between 0 and 1"
            );
        }

    }

    /**
     * 驗證勝率及淨賠率
     */
    validateInput(
        winProbability,
        netOdds,
        pushProbability = 0
    ) {

        if (
            !Number.isFinite(winProbability) ||
            winProbability < 0 ||
            winProbability > 1
        ) {
            throw new Error(
                "Win probability must be between 0 and 1"
            );
        }

        if (
            !Number.isFinite(pushProbability) ||
            pushProbability < 0 ||
            pushProbability > 1
        ) {
            throw new Error(
                "Push probability must be between 0 and 1"
            );
        }

        if (
            winProbability + pushProbability > 1
        ) {
            throw new Error(
                "Win and push probabilities cannot exceed 1"
            );
        }

        if (
            !Number.isFinite(netOdds) ||
            netOdds <= 0
        ) {
            throw new Error(
                "Net odds must be greater than 0"
            );
        }

    }

    /**
     * Full Kelly
     *
     * f = (bp - q) / b
     *
     * b = 淨賠率
     * p = 勝率
     * q = 敗率
     *
     * Push 不輸不贏，因此：
     * q = 1 - p - push
     */
    ratio(
        winProbability,
        netOdds,
        pushProbability = 0
    ) {

        this.validateInput(
            winProbability,
            netOdds,
            pushProbability
        );

        const loseProbability =
            1 -
            winProbability -
            pushProbability;

        const value = (

            netOdds * winProbability -
            loseProbability

        ) / netOdds;

        return Math.max(0, value);

    }

    /**
     * Fractional Kelly
     */
    fractionalRatio(
        winProbability,
        netOdds,
        pushProbability = 0,
        fraction = this.config.fraction
    ) {

        if (
            !Number.isFinite(fraction) ||
            fraction < 0 ||
            fraction > 1
        ) {
            throw new Error(
                "Kelly fraction must be between 0 and 1"
            );
        }

        return this.ratio(
            winProbability,
            netOdds,
            pushProbability
        ) * fraction;

    }

    /**
     * 建議下注金額
     */
    calculate({

        winProbability,

        netOdds,

        pushProbability = 0,

        bankroll = this.config.bankroll,

        fraction = this.config.fraction,

        minBet = this.config.minBet,

        maxBet = this.config.maxBet,

        maxBankrollRatio =
            this.config.maxBankrollRatio

    }) {

        if (
            !Number.isFinite(bankroll) ||
            bankroll < 0
        ) {
            throw new Error(
                "Bankroll must be a non-negative number"
            );
        }

        const fullKelly = this.ratio(
            winProbability,
            netOdds,
            pushProbability
        );

        const appliedKelly =
            fullKelly * fraction;

        const rawAmount =
            bankroll * appliedKelly;

        const bankrollCap =
            bankroll * maxBankrollRatio;

        const effectiveMax =
            Math.min(
                maxBet,
                bankrollCap
            );

        let amount =
            Math.min(
                rawAmount,
                effectiveMax
            );

        if (amount < minBet) {
            amount = 0;
        }

        return {

            winProbability,

            loseProbability:
                1 -
                winProbability -
                pushProbability,

            pushProbability,

            netOdds,

            fullKelly,

            appliedKelly,

            fraction,

            bankroll,

            rawAmount,

            amount:
                Math.floor(amount),

            capped:
                rawAmount > effectiveMax,

            shouldBet:
                amount > 0

        };

    }

    /**
     * 一次計算所有下注項目
     *
     * bets 範例：
     * {
     *   player: {
     *     winProbability: 0.446,
     *     pushProbability: 0.096,
     *     netOdds: 1
     *   }
     * }
     */
    calculateAll(
        bets,
        options = {}
    ) {

        if (
            !bets ||
            typeof bets !== "object" ||
            Array.isArray(bets)
        ) {
            throw new Error(
                "Bets must be an object"
            );
        }

        const result = {};

        for (
            const [name, bet] of
            Object.entries(bets)
        ) {

            result[name] = this.calculate({

                ...bet,
                ...options

            });

        }

        return result;

    }

}
