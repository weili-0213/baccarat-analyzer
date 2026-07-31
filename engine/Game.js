/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Game Engine v2
 *
 * Game Controller
 */

import Shoe from "./shoe.js";
import Burn from "./burn.js";
import Dealer from "./dealer.js";
import CurrentRound from "./currentRound.js";
import History from "./history.js";

// Analysis
import Analyzer from "../analysis/analyzer.js";

export default class Game {

    constructor(deckCount = 8) {

        this.deckCount = deckCount;

        this.newShoe();

    }

    /**
     * 建立新牌靴
     */
    newShoe() {

        this.shoe = new Shoe(this.deckCount);

        this.burn = new Burn(this.shoe);

        this.dealer = new Dealer(this.shoe);

        this.currentRound = new CurrentRound();

        this.history = new History();

        this.started = false;

        this.analyzer = new Analyzer(
            this.shoe,
            this.history
        );

        return this;

    }

    /**
     * 開始牌靴
     */
    start() {

        if (this.started) {

            throw new Error("Game already started");

        }

        this.burn.execute();

        this.started = true;

        return this;

    }

    /**
     * 發一局
     */
    play() {

        if (!this.started) {

            throw new Error("Game not started");

        }

        const result = this.dealer.play();

        this.currentRound.set(result);

        this.history.add(result);

        return result;

    }

    /**
     * 分析下一局
     */
    analyze() {

        return this.analyzer.analyze();

    }

    /**
     * 下一局EV
     */
    getEV() {

        return this.analyzer.getEV();

    }

    /**
     * Kelly
     */
    getKelly() {

        return this.analyzer.getKelly();

    }

    /**
     * 建議下注
     */
    getRecommendation() {

        return this.analyzer.getRecommendation();

    }

    /**
     * 勝率
     */
    getProbability() {

        return this.analyzer.getProbability();

    }

    /**
     * 剩餘牌
     */
    get remainingCards() {

        return this.shoe.remaining;

    }

    /**
     * 已玩局數
     */
    get rounds() {

        return this.history.count;

    }

    /**
     * 最近一局
     */
    get lastResult() {

        return this.history.last;

    }

    /**
     * JSON
     */
    toJSON() {

        return {

            started: this.started,

            remainingCards: this.remainingCards,

            rounds: this.rounds,

            burn: this.burn.info,

            history: this.history.toJSON()

        };

    }

}
