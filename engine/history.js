/**
 * Baccarat Analyzer
 * -----------------------------------------
 * History v5
 *
 * 全牌靴歷史資料中心
 *
 * 提供：
 * 1. 歷史紀錄
 * 2. 勝率統計
 * 3. Pair統計
 * 4. Natural統計
 * 5. Super6統計
 * 6. Streak
 * 7. Trend
 * 8. Roadmap資料來源
 */

export default class History {

    constructor() {

        this.rounds = [];

    }

    /**
     * 新增一局
     */
    add(result) {

        this.rounds.push(result);

        return this;

    }

    /**
     * 清空
     */
    clear() {

        this.rounds = [];

        return this;

    }

    /**
     * 全部資料
     */
    getAll() {

        return [...this.rounds];

    }

    /**
     * 局數
     */
    get count() {

        return this.rounds.length;

    }

    /**
     * 是否空歷史
     */
    get isEmpty() {

        return this.count === 0;

    }

    /**
     * 最後一局
     */
    get last() {

        return this.rounds.at(-1) ?? null;

    }

    /**
     * 指定局
     */
    get(index) {

        return this.rounds[index] ?? null;

    }

    /**
     * 最近N局
     */
    lastRounds(n = 20) {

        return this.rounds.slice(-n);

    }

    /**
     * Player勝
     */
    get playerWins() {

        return this.rounds.filter(
            r => r.winner === "Player"
        ).length;

    }

    /**
     * Banker勝
     */
    get bankerWins() {

        return this.rounds.filter(
            r => r.winner === "Banker"
        ).length;

    }

    /**
     * Tie
     */
    get ties() {

        return this.rounds.filter(
            r => r.winner === "Tie"
        ).length;

    }

    /**
     * Player Pair
     */
    get playerPairs() {

        return this.rounds.filter(
            r => r.playerPair
        ).length;

    }

    /**
     * Banker Pair
     */
    get bankerPairs() {

        return this.rounds.filter(
            r => r.bankerPair
        ).length;

    }

    /**
     * Super6
     */
    get super6Count() {

        return this.rounds.filter(
            r => r.super6
        ).length;

    }

    /**
     * Player Natural
     */
    get playerNaturals() {

        return this.rounds.filter(
            r => r.playerNatural
        ).length;

    }

    /**
     * Banker Natural
     */
    get bankerNaturals() {

        return this.rounds.filter(
            r => r.bankerNatural
        ).length;

    }

    /**
     * Dragon Bonus
     *
     * 勝差>=4
     */
    get dragonBonusCount() {

        return this.rounds.filter(
            r => r.margin >= 4
        ).length;

    }

    /**
     * 勝率
     */
    get winRate() {

        if (this.count === 0) {

            return {

                player:0,
                banker:0,
                tie:0

            };

        }

        return {

            player:this.playerWins / this.count,

            banker:this.bankerWins / this.count,

            tie:this.ties / this.count

        };

    }

    /**
     * 最近趨勢
     */
    get trend() {

        return this.rounds.map(
            r => r.winner
        );

    }

    /**
     * 目前連莊
     */
    get streak() {

        if(this.count===0){

            return null;

        }

        const winner=this.last.winner;

        let count=0;

        for(let i=this.rounds.length-1;i>=0;i--){

            if(this.rounds[i].winner===winner){

                count++;

            }else{

                break;

            }

        }

        return{

            winner,

            count

        };

    }

    /**
     * Roadmap資料
     *
     * 珠盤路、大路直接使用
     */
    get roadmapData(){

        return this.rounds.map(r=>({

            winner:r.winner,

            playerPair:r.playerPair,

            bankerPair:r.bankerPair,

            super6:r.super6,

            margin:r.margin,

            playerNatural:r.playerNatural,

            bankerNatural:r.bankerNatural

        }));

    }

    /**
     * JSON
     */
    toJSON(){

        return this.rounds.map(

            r=>r.toJSON()

        );

    }

}
