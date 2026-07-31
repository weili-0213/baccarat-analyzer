/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Probability Engine v2
 *
 * 機率資料模型
 */

export default class Probability {

    constructor() {

        this.reset();

    }

    /**
     * 重置
     */
    reset() {

        // 機率
        this.player = 0;
        this.banker = 0;
        this.tie = 0;

        // 模擬次數
        this.samples = 0;

        return this;

    }

    /**
     * 直接設定機率
     */
    set(player, banker, tie) {

        this.player = player;
        this.banker = banker;
        this.tie = tie;

        return this;

    }

    /**
     * 加入一次模擬結果
     *
     * winner:
     * "player"
     * "banker"
     * "tie"
     */
    addResult(winner) {

        this.samples++;

        switch (winner) {

            case "player":
                this.player++;
                break;

            case "banker":
                this.banker++;
                break;

            case "tie":
                this.tie++;
                break;

            default:
                throw new Error(
                    "Unknown winner : " + winner
                );

        }

        return this;

    }

    /**
     * 將統計次數轉成機率
     */
    normalize() {

        if (this.samples === 0) {

            return this;

        }

        this.player /= this.samples;
        this.banker /= this.samples;
        this.tie /= this.samples;

        return this;

    }

    /**
     * 是否已有資料
     */
    get hasData() {

        return this.samples > 0 ||
               this.player > 0 ||
               this.banker > 0 ||
               this.tie > 0;

    }

    /**
     * 玩家機率(%)
     */
    get playerPercent() {

        return this.player * 100;

    }

    /**
     * 莊家機率(%)
     */
    get bankerPercent() {

        return this.banker * 100;

    }

    /**
     * 和局機率(%)
     */
    get tiePercent() {

        return this.tie * 100;

    }

    /**
     * 最大機率
     */
    get best() {

        if (
            this.player >= this.banker &&
            this.player >= this.tie
        ) {

            return "player";

        }

        if (
            this.banker >= this.player &&
            this.banker >= this.tie
        ) {

            return "banker";

        }

        return "tie";

    }

    /**
     * 最大機率值
     */
    get bestProbability() {

        return Math.max(
            this.player,
            this.banker,
            this.tie
        );

    }

    /**
     * 是否平手機率
     */
    get hasTieForBest() {

        const max = this.bestProbability;

        let count = 0;

        if (this.player === max) count++;
        if (this.banker === max) count++;
        if (this.tie === max) count++;

        return count > 1;

    }

    /**
     * 複製
     */
    clone() {

        const probability = new Probability();

        probability.player = this.player;
        probability.banker = this.banker;
        probability.tie = this.tie;
        probability.samples = this.samples;

        return probability;

    }

    /**
     * JSON
     */
    toJSON() {

        return {

            player: this.player,
            banker: this.banker,
            tie: this.tie,
            samples: this.samples

        };

    }

    /**
     * JSON還原
     */
    static fromJSON(data) {

        const probability = new Probability();

        probability.player = data.player ?? 0;
        probability.banker = data.banker ?? 0;
        probability.tie = data.tie ?? 0;
        probability.samples = data.samples ?? 0;

        return probability;

    }

}
