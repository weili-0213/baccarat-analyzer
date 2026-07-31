/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Analyzer
 *
 * 分析總控制器
 *
 * 負責：
 * 1. 機率分析
 * 2. Monte Carlo 模擬
 * 3. Exact Analysis
 * 4. EV
 * 5. Kelly
 * 6. 推薦下注
 */

import Probability from "./probability.js";
import MonteCarlo from "./monteCarlo.js";
import Exact from "./exact.js";
import EV from "./ev.js";
import Kelly from "./kelly.js";
import Recommendation from "./recommendation.js";

export default class Analyzer {

    /**
     * @param {Object} context
     *
     * {
     *     shoe,
     *     history,
     *     game,
     *     settings
     * }
     */
    constructor(context = {}) {

        this.setContext(context);

    }

    /**
     * 更新分析環境
     */
    setContext(context = {}) {

        this.context = context;

        this.probability =
            new Probability(context);

        this.monteCarlo =
            new MonteCarlo(context);

        this.exact =
            new Exact(context);

        this.ev =
            new EV(context);

        this.kelly =
            new Kelly(context);

        this.recommendation =
            new Recommendation(context);

        return this;

    }

    /**
     * 完整分析
     */
    analyze() {

        const probability =
            this.getProbability();

        const ev =
            this.getEV(probability);

        const kelly =
            this.getKelly(probability);

        const recommendation =
            this.getRecommendation(
                probability,
                ev,
                kelly
            );

        return {

            probability,

            ev,

            kelly,

            recommendation

        };

    }

    /**
     * 下一局機率
     */
    getProbability() {

        return this.probability.calculate();

    }

    /**
     * Monte Carlo
     */
    getMonteCarlo(simulations = 100000) {

        return this.monteCarlo.calculate(
            simulations
        );

    }

    /**
     * Exact Analysis
     */
    getExact() {

        return this.exact.calculate();

    }

    /**
     * EV
     */
    getEV(probability = null) {

        if (!probability) {

            probability =
                this.getProbability();

        }

        return this.ev.calculate(
            probability
        );

    }

    /**
     * Kelly
     */
    getKelly(probability = null) {

        if (!probability) {

            probability =
                this.getProbability();

        }

        return this.kelly.calculate(
            probability
        );

    }

    /**
     * 推薦下注
     */
    getRecommendation(
        probability = null,
        ev = null,
        kelly = null
    ) {

        if (!probability) {

            probability =
                this.getProbability();

        }

        if (!ev) {

            ev =
                this.getEV(probability);

        }

        if (!kelly) {

            kelly =
                this.getKelly(probability);

        }

        return this.recommendation.calculate({

            probability,

            ev,

            kelly

        });

    }

    /**
     * Side Bet
     *
     * 之後加入：
     * Pair
     * Super6
     * Dragon Bonus
     */
    getSideBets() {

        return {};

    }

    /**
     * 所有分析
     */
    getAll() {

        return {

            probability:
                this.getProbability(),

            monteCarlo:
                this.getMonteCarlo(),

            exact:
                this.getExact(),

            ev:
                this.getEV(),

            kelly:
                this.getKelly(),

            recommendation:
                this.getRecommendation(),

            sideBets:
                this.getSideBets()

        };

    }

}
