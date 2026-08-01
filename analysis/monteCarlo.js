/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Monte Carlo Engine
 *
 * 根據目前剩餘牌靴，
 * 重複模擬下一局百家樂。
 *
 * 職責：
 * 1. 複製目前牌靴
 * 2. 隨機洗牌
 * 3. 使用 Dealer 完成一局
 * 4. 統計各下注事件
 * 5. 回傳下一局機率
 *
 * 不負責：
 * - EV
 * - Kelly
 * - Risk
 * - Confidence
 * - Ranking
 * - Recommendation
 */

import Dealer from "../engine/dealer.js";


const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 預設模擬次數
     */
    simulations: 100000,

    /**
     * 非同步模式每批執行次數
     *
     * 數字越小，UI 越流暢，
     * 但整體執行時間可能稍微增加。
     */
    batchSize: 1000

});


export default class MonteCarlo {

    /**
     * context:
     *
     * {
     *     shoe
     * }
     */
    constructor(
        context = {},
        options = {}
    ) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };

        this.setContext(context);

        this.validateOptions();

    }

    /**
     * 更新分析環境
     */
    setContext(context = {}) {

        this.context = {

            ...context

        };

        this.shoe =
            context.shoe ?? null;

        return this;

    }

    /**
     * 驗證設定
     */
    validateOptions() {

        const {
            simulations,
            batchSize
        } = this.options;

        if (
            !Number.isInteger(simulations) ||
            simulations <= 0
        ) {

            throw new RangeError(
                "simulations must be a positive integer"
            );

        }

        if (
            !Number.isInteger(batchSize) ||
            batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer"
            );

        }

    }

    /**
     * 驗證牌靴
     */
    validateShoe(shoe = this.shoe) {

        if (!shoe) {

            throw new Error(
                "Monte Carlo requires a Shoe"
            );

        }

        if (
            typeof shoe.clone !==
            "function"
        ) {

            throw new TypeError(
                "Shoe must provide clone()"
            );

        }

        if (
            !Number.isInteger(
                shoe.remaining
            )
        ) {

            throw new TypeError(
                "Invalid Shoe remaining count"
            );

        }

        /**
         * 一局最多可能使用六張，
         * 但最低四張即可開始發牌。
         */
        if (shoe.remaining < 4) {

            throw new Error(
                "Not enough cards remaining for simulation"
            );

        }

        return true;

    }

    /**
     * 驗證執行參數
     */
    validateRunOptions({

        simulations,

        batchSize

    }) {

        if (
            !Number.isInteger(simulations) ||
            simulations <= 0
        ) {

            throw new RangeError(
                "simulations must be a positive integer"
            );

        }

        if (
            !Number.isInteger(batchSize) ||
            batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer"
            );

        }

    }

    /**
     * 建立空統計資料
     */
    createCounters() {

        return {

            player: 0,

            banker: 0,

            tie: 0,

            playerPair: 0,

            bankerPair: 0,

            eitherPair: 0,

            super6: 0,

            playerNatural: 0,

            bankerNatural: 0,

            natural: 0,

            big: 0,

            small: 0,

            playerDragonBonus: 0,

            bankerDragonBonus: 0

        };

    }

    /**
     * Fisher-Yates 洗牌
     *
     * 不直接使用原牌靴的 shuffle()，
     * 方便未來注入自訂 RNG。
     */
    shuffleShoe(
        shoe,
        random = Math.random
    ) {

        const cards =
            shoe.cards;

        if (!Array.isArray(cards)) {

            throw new TypeError(
                "Shoe cards must be an array"
            );

        }

        for (
            let i =
                cards.length - 1;

            i > 0;

            i--
        ) {

            const j =
                Math.floor(
                    random() *
                    (i + 1)
                );

            [
                cards[i],
                cards[j]
            ] = [
                cards[j],
                cards[i]
            ];

        }

        return shoe;

    }

    /**
     * 取得 Dealer 回傳的結果
     *
     * 支援：
     * - Dealer.play() 回傳 Round
     * - Dealer.play() 直接回傳 RoundResult
     */
    extractResult(output) {

        if (!output) {

            throw new Error(
                "Dealer returned no result"
            );

        }

        /**
         * Dealer 回傳 Round。
         */
        if (output.result) {

            return output.result;

        }

        /**
         * Dealer 直接回傳 RoundResult。
         */
        if (
            typeof output.winner ===
            "string"
        ) {

            return output;

        }

        throw new Error(
            "Unable to extract RoundResult from Dealer output"
        );

    }

    /**
     * 判斷閒龍寶中獎事件
     *
     * 暫定規則：
     * - 閒家獲勝
     * - 閒家 Natural，或勝差至少 4 點
     *
     * 實際賠率是分級賠付，
     * 之後由 sidebets.js 處理。
     */
    isPlayerDragonBonus(result) {

        return (

            result.playerWin &&

            (
                result.playerNatural ||
                result.margin >= 4
            )

        );

    }

    /**
     * 判斷莊龍寶中獎事件
     *
     * 暫定規則：
     * - 莊家獲勝
     * - 莊家 Natural，或勝差至少 4 點
     */
    isBankerDragonBonus(result) {

        return (

            result.bankerWin &&

            (
                result.bankerNatural ||
                result.margin >= 4
            )

        );

    }

    /**
     * 將一局結果加入統計
     */
    recordResult(
        counters,
        result
    ) {

        switch (result.winner) {

            case "Player":

                counters.player++;

                break;

            case "Banker":

                counters.banker++;

                break;

            case "Tie":

                counters.tie++;

                break;

            default:

                throw new Error(
                    `Unknown round winner: ${result.winner}`
                );

        }

        if (result.playerPair) {

            counters.playerPair++;

        }

        if (result.bankerPair) {

            counters.bankerPair++;

        }

        if (result.eitherPair) {

            counters.eitherPair++;

        }

        if (result.super6) {

            counters.super6++;

        }

        if (result.playerNatural) {

            counters.playerNatural++;

        }

        if (result.bankerNatural) {

            counters.bankerNatural++;

        }

        if (result.natural) {

            counters.natural++;

        }

        if (result.isBig) {

            counters.big++;

        }

        if (result.isSmall) {

            counters.small++;

        }

        if (
            this.isPlayerDragonBonus(
                result
            )
        ) {

            counters
                .playerDragonBonus++;

        }

        if (
            this.isBankerDragonBonus(
                result
            )
        ) {

            counters
                .bankerDragonBonus++;

        }

        return counters;

    }

    /**
     * 模擬一局
     */
    simulateOnce({

        shoe = this.shoe,

        random = Math.random

    } = {}) {

        this.validateShoe(shoe);

        /**
         * 完整複製牌靴，
         * 不修改真實遊戲牌靴。
         */
        const simulationShoe =
            shoe.clone();

        this.shuffleShoe(
            simulationShoe,
            random
        );

        const dealer =
            new Dealer(
                simulationShoe
            );

        const output =
            dealer.play();

        return this.extractResult(
            output
        );

    }

    /**
     * 將次數轉換為機率
     */
    normalizeCounters(
        counters,
        simulations
    ) {

        const probability = {};

        for (
            const [
                name,
                count
            ] of Object.entries(
                counters
            )
        ) {

            probability[name] =

                count /
                simulations;

        }

        return probability;

    }

    /**
     * 完成輸出
     */
    finalize({

        counters,

        simulations,

        startedAt,

        completedAt

    }) {

        const probability =
            this.normalizeCounters(
                counters,
                simulations
            );

        return {

            method:
                "monteCarlo",

            simulations,

            /**
             * Confidence 模組目前支援
             * sampleSize / samples / simulations。
             */
            sampleSize:
                simulations,

            samples:
                simulations,

            probability,

            counts: {

                ...counters

            },

            mainTotal:

                probability.player +

                probability.banker +

                probability.tie,

            durationMs:

                completedAt -
                startedAt,

            remainingCards:
                this.shoe.remaining,

            generatedAt:
                new Date(
                    completedAt
                ).toISOString()

        };

    }

    /**
     * 同步計算
     *
     * 適合：
     * - 測試
     * - Web Worker
     * - 較少模擬次數
     *
     * 在手機主執行緒使用大量次數時，
     * 畫面可能暫時停止回應。
     */
    calculateSync({

        simulations =
            this.options.simulations,

        random =
            Math.random

    } = {}) {

        this.validateShoe();

        this.validateRunOptions({

            simulations,

            batchSize: 1

        });

        const counters =
            this.createCounters();

        const startedAt =
            Date.now();

        for (
            let i = 0;

            i < simulations;

            i++
        ) {

            const result =
                this.simulateOnce({

                    random

                });

            this.recordResult(

                counters,

                result

            );

        }

        const completedAt =
            Date.now();

        return this.finalize({

            counters,

            simulations,

            startedAt,

            completedAt

        });

    }

    /**
     * 非同步分批計算
     *
     * 適合手機主執行緒。
     *
     * 使用方式：
     *
     * await monteCarlo.calculate({
     *     simulations: 100000,
     *     batchSize: 1000,
     *     onProgress(progress) {}
     * });
     */
    async calculate({

        simulations =
            this.options.simulations,

        batchSize =
            this.options.batchSize,

        random =
            Math.random,

        signal = null,

        onProgress = null

    } = {}) {

        this.validateShoe();

        this.validateRunOptions({

            simulations,

            batchSize

        });

        if (
            onProgress !== null &&
            typeof onProgress !==
            "function"
        ) {

            throw new TypeError(
                "onProgress must be a function or null"
            );

        }

        const counters =
            this.createCounters();

        const startedAt =
            Date.now();

        let completed = 0;

        while (
            completed <
            simulations
        ) {

            if (signal?.aborted) {

                const error =
                    new Error(
                        "Monte Carlo simulation aborted"
                    );

                error.name =
                    "AbortError";

                throw error;

            }

            const currentBatch =
                Math.min(

                    batchSize,

                    simulations -
                    completed

                );

            for (
                let i = 0;

                i < currentBatch;

                i++
            ) {

                const result =
                    this.simulateOnce({

                        random

                    });

                this.recordResult(

                    counters,

                    result

                );

            }

            completed +=
                currentBatch;

            if (onProgress) {

                onProgress({

                    completed,

                    total:
                        simulations,

                    ratio:
                        completed /
                        simulations,

                    percent:

                        (
                            completed /
                            simulations
                        ) * 100,

                    counts: {

                        ...counters

                    }

                });

            }

            /**
             * 將控制權交還瀏覽器，
             * 讓 UI 有機會更新。
             */
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        0
                    )
            );

        }

        const completedAt =
            Date.now();

        return this.finalize({

            counters,

            simulations,

            startedAt,

            completedAt

        });

    }

    /**
     * 更新預設設定
     */
    setOptions(options = {}) {

        this.options = {

            ...this.options,

            ...options

        };

        this.validateOptions();

        return this;

    }

    /**
     * 複製 Monte Carlo 引擎
     */
    clone() {

        return new MonteCarlo(

            {

                ...this.context

            },

            {

                ...this.options

            }

        );

    }

    /**
     * 輸出設定
     */
    toJSON() {

        return {

            simulations:
                this.options
                    .simulations,

            batchSize:
                this.options
                    .batchSize

        };

    }

}
