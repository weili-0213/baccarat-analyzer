/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Monte Carlo Engine v2
 *
 * 根據目前剩餘牌靴，
 * 重複模擬下一局百家樂。
 *
 * 職責：
 *
 * 1. 複製目前牌靴
 * 2. 隨機洗牌
 * 3. 使用 Dealer 完成一局
 * 4. 統計各下注事件
 * 5. 回傳下一局機率
 *
 * 不負責：
 *
 * - EV
 * - Kelly
 * - Risk
 * - Confidence
 * - Ranking
 * - Recommendation
 *
 * 未知燒牌說明：
 *
 * shoe.cards 代表可觀察牌池。
 *
 * unknownBurnedCount 只表示實際已離開物理牌靴、
 * 但牌面身分未知的牌數。
 *
 * 因為未知燒牌是隨機移除，
 * 下一局的條件牌面分布仍可由 observable cards
 * 進行抽樣，不應任意虛構未知燒牌的具體牌面。
 */

import Dealer
    from "../engine/dealer.js";


const DEFAULT_OPTIONS =
    Object.freeze({

        /**
         * 預設模擬次數
         */
        simulations:
            100000,

        /**
         * 非同步模式每批執行次數
         *
         * 數字越小，UI 越流暢，
         * 但整體執行時間可能稍微增加。
         */
        batchSize:
            1000

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

        this.context = {};

        this.shoe = null;

        this.setContext(
            context
        );

        this.validateOptions();

    }


    /**
     * 更新分析環境
     */
    setContext(context = {}) {

        if (
            context === null ||
            typeof context !==
                "object" ||
            Array.isArray(context)
        ) {

            throw new TypeError(
                "Monte Carlo context must be an object."
            );

        }

        this.context = {

            ...context

        };

        this.shoe =
            context.shoe ??
            null;

        return this;

    }


    /**
     * 驗證預設設定
     */
    validateOptions() {

        const {

            simulations,

            batchSize

        } = this.options;


        if (
            !Number.isInteger(
                simulations
            ) ||
            simulations <= 0
        ) {

            throw new RangeError(
                "simulations must be a positive integer."
            );

        }


        if (
            !Number.isInteger(
                batchSize
            ) ||
            batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer."
            );

        }

        return true;

    }


    /**
     * 取得可觀察牌池張數
     */
    getObservableRemaining(
        shoe = this.shoe
    ) {

        if (!shoe) {

            return 0;

        }

        const value =

            shoe.observableRemaining ??

            shoe.knownRemaining ??

            shoe.remaining ??

            (
                Array.isArray(
                    shoe.cards
                )
                    ? shoe.cards.length
                    : null
            );


        if (
            !Number.isInteger(value) ||
            value < 0
        ) {

            throw new TypeError(
                "Invalid Shoe observable remaining count."
            );

        }

        return value;

    }


    /**
     * 取得物理牌靴剩餘張數
     */
    getPhysicalRemaining(
        shoe = this.shoe
    ) {

        if (!shoe) {

            return 0;

        }

        const observableRemaining =
            this.getObservableRemaining(
                shoe
            );

        const value =

            shoe.physicalRemaining ??

            observableRemaining;


        if (
            !Number.isInteger(value) ||
            value < 0
        ) {

            throw new TypeError(
                "Invalid Shoe physical remaining count."
            );

        }

        if (
            value >
            observableRemaining
        ) {

            throw new RangeError(
                "Physical remaining cards cannot exceed observable remaining cards."
            );

        }

        return value;

    }


    /**
     * 取得未知燒牌數
     */
    getUnknownBurnedCount(
        shoe = this.shoe
    ) {

        if (!shoe) {

            return 0;

        }

        const value =
            shoe.unknownBurnedCount ??
            0;


        if (
            !Number.isInteger(value) ||
            value < 0
        ) {

            throw new TypeError(
                "Invalid Shoe unknown burned count."
            );

        }

        return value;

    }


    /**
     * 驗證牌靴
     */
    validateShoe(
        shoe = this.shoe
    ) {

        if (!shoe) {

            throw new Error(
                "Monte Carlo requires a Shoe."
            );

        }


        if (
            typeof shoe.clone !==
                "function"
        ) {

            throw new TypeError(
                "Shoe must provide clone()."
            );

        }


        if (
            !Array.isArray(
                shoe.cards
            )
        ) {

            throw new TypeError(
                "Shoe cards must be an array."
            );

        }


        const observableRemaining =
            this.getObservableRemaining(
                shoe
            );

        const physicalRemaining =
            this.getPhysicalRemaining(
                shoe
            );

        const unknownBurnedCount =
            this.getUnknownBurnedCount(
                shoe
            );


        /**
         * 一局最低需要初始四張牌。
         *
         * 可觀察牌池不足四張時，
         * 已無法建立合法百家樂初始牌局。
         */
        if (
            observableRemaining < 4
        ) {

            throw new Error(
                "Not enough observable cards remaining for simulation."
            );

        }


        /**
         * 物理牌靴也至少需要四張。
         *
         * observable cards 可能仍包含身分未知、
         * 但實際已被燒掉的牌，因此必須分開檢查。
         */
        if (
            physicalRemaining < 4
        ) {

            throw new Error(
                "Not enough physical cards remaining for simulation."
            );

        }


        if (
            unknownBurnedCount >
            observableRemaining
        ) {

            throw new RangeError(
                "Unknown burned count exceeds observable remaining cards."
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
            !Number.isInteger(
                simulations
            ) ||
            simulations <= 0
        ) {

            throw new RangeError(
                "simulations must be a positive integer."
            );

        }


        if (
            !Number.isInteger(
                batchSize
            ) ||
            batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer."
            );

        }

        return true;

    }


    /**
     * 驗證亂數函式
     */
    validateRandom(random) {

        if (
            typeof random !==
            "function"
        ) {

            throw new TypeError(
                "random must be a function."
            );

        }

        return random;

    }


    /**
     * 建立空統計資料
     */
    createCounters() {

        return {

            player:
                0,

            banker:
                0,

            tie:
                0,

            playerPair:
                0,

            bankerPair:
                0,

            eitherPair:
                0,

            super6:
                0,

            super6TwoCard: 0,
            super6ThreeCard: 0,

            playerNatural:
                0,

            bankerNatural:
                0,

            natural:
                0,

            big:
                0,

            small:
                0,

            playerDragonBonus:
                0,

            bankerDragonBonus:
                0,

            dragonBonusNaturalTie: 0,
            playerDragonBonusNaturalWin: 0,
            playerDragonBonusMargin4: 0,
            playerDragonBonusMargin5: 0,
            playerDragonBonusMargin6: 0,
            playerDragonBonusMargin7: 0,
            playerDragonBonusMargin8: 0,
            playerDragonBonusMargin9: 0,
            bankerDragonBonusNaturalWin: 0,
            bankerDragonBonusMargin4: 0,
            bankerDragonBonusMargin5: 0,
            bankerDragonBonusMargin6: 0,
            bankerDragonBonusMargin7: 0,
            bankerDragonBonusMargin8: 0,
            bankerDragonBonusMargin9: 0

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
        random =
            Math.random
    ) {

        this.validateRandom(
            random
        );

        const cards =
            shoe.cards;


        if (
            !Array.isArray(cards)
        ) {

            throw new TypeError(
                "Shoe cards must be an array."
            );

        }


        for (
            let index =
                cards.length - 1;

            index > 0;

            index--
        ) {

            const randomValue =
                random();


            if (
                !Number.isFinite(
                    randomValue
                ) ||
                randomValue < 0 ||
                randomValue >= 1
            ) {

                throw new RangeError(
                    "random() must return a number between 0 inclusive and 1 exclusive."
                );

            }


            const randomIndex =
                Math.floor(

                    randomValue *

                    (
                        index + 1
                    )

                );


            [
                cards[index],

                cards[randomIndex]

            ] = [

                cards[randomIndex],

                cards[index]

            ];

        }

        return shoe;

    }


    /**
     * 取得 Dealer 回傳的結果
     *
     * 支援：
     *
     * - Dealer.play() 回傳 Round
     * - Dealer.play() 直接回傳 RoundResult
     */
    extractResult(output) {

        if (!output) {

            throw new Error(
                "Dealer returned no result."
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
            "Unable to extract RoundResult from Dealer output."
        );

    }


    /**
     * 判斷閒龍寶中獎事件
     *
     * 暫定規則：
     *
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
     *
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

        if (!result) {

            throw new Error(
                "Round result is required."
            );

        }


        switch (
            result.winner
        ) {

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


        if (
            result.playerPair
        ) {

            counters.playerPair++;

        }


        if (
            result.bankerPair
        ) {

            counters.bankerPair++;

        }


        /**
         * 若 RoundResult 沒有 eitherPair，
         * 仍可由兩方 Pair 推導。
         */
        if (
            result.eitherPair ??
            (
                result.playerPair ||
                result.bankerPair
            )
        ) {

            counters.eitherPair++;

        }


        if (
            result.super6
        ) {

            counters.super6++;

            const bankerCardCount =
                result.banker?.count ??
                result.bankerCards?.length ??
                (result.bankerDrewThirdCard ? 3 : 2);

            counters[
                bankerCardCount === 2
                    ? "super6TwoCard"
                    : "super6ThreeCard"
            ]++;

        }


        if (
            result.playerNatural
        ) {

            counters.playerNatural++;

        }


        if (
            result.bankerNatural
        ) {

            counters.bankerNatural++;

        }


        /**
         * 若沒有 natural getter，
         * 可由 Player / Banker Natural 推導。
         */
        if (
            result.natural ??
            (
                result.playerNatural ||
                result.bankerNatural
            )
        ) {

            counters.natural++;

        }


        if (
            result.isBig
        ) {

            counters.big++;

        }


        if (
            result.isSmall
        ) {

            counters.small++;

        }


        if (
            this.isPlayerDragonBonus(
                result
            )
        ) {

            counters
                .playerDragonBonus++;

            if (result.playerNatural) {
                counters.playerDragonBonusNaturalWin++;
            }
            else {
                const margin = Math.abs(result.margin ?? 0);
                if (margin >= 4 && margin <= 9) {
                    counters[`playerDragonBonusMargin${margin}`]++;
                }
            }

        }


        if (
            this.isBankerDragonBonus(
                result
            )
        ) {

            counters
                .bankerDragonBonus++;

            if (result.bankerNatural) {
                counters.bankerDragonBonusNaturalWin++;
            }
            else {
                const margin = Math.abs(result.margin ?? 0);
                if (margin >= 4 && margin <= 9) {
                    counters[`bankerDragonBonusMargin${margin}`]++;
                }
            }

        }

        if (
            String(result.winner).toLowerCase() === "tie" &&
            result.playerNatural &&
            result.bankerNatural
        ) {

            counters.dragonBonusNaturalTie++;

        }

        return counters;

    }


    /**
     * 模擬一局
     */
    simulateOnce({

        shoe =
            this.shoe,

        random =
            Math.random

    } = {}) {

        this.validateShoe(
            shoe
        );

        this.validateRandom(
            random
        );


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

        if (
            !Number.isInteger(
                simulations
            ) ||
            simulations <= 0
        ) {

            throw new RangeError(
                "simulations must be a positive integer."
            );

        }


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


        const observableRemaining =
            this.getObservableRemaining(
                this.shoe
            );


        const physicalRemaining =
            this.getPhysicalRemaining(
                this.shoe
            );


        const unknownBurnedCount =
            this.getUnknownBurnedCount(
                this.shoe
            );


        return {

            method:
                "monteCarlo",

            simulations,

            /**
             * Confidence 模組目前支援：
             *
             * sampleSize
             * samples
             * simulations
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

            /**
             * 舊版相容：
             * 顯示實體牌靴剩餘數量。
             */
            remainingCards:
                physicalRemaining,

            /**
             * 機率分析使用的可觀察牌池數量。
             */
            observableRemaining,

            /**
             * 賭桌牌靴實際剩餘張數。
             */
            physicalRemaining,

            /**
             * 身分未知的隱藏燒牌張數。
             */
            unknownBurnedCount,

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
     *
     * - 測試
     * - Web Worker
     * - 較少模擬次數
     *
     * 在手機主執行緒使用大量次數時，
     * 畫面可能暫時停止回應。
     */
    calculateSync({

        simulations =
            this.options
                .simulations,

        random =
            Math.random

    } = {}) {

        this.validateShoe();

        this.validateRandom(
            random
        );


        this.validateRunOptions({

            simulations,

            batchSize:
                1

        });


        const counters =
            this.createCounters();


        const startedAt =
            Date.now();


        for (
            let index = 0;

            index < simulations;

            index++
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
     *
     *     simulations: 100000,
     *
     *     batchSize: 1000,
     *
     *     onProgress(progress) {}
     *
     * });
     */
    async calculate({

        simulations =
            this.options
                .simulations,

        batchSize =
            this.options
                .batchSize,

        random =
            Math.random,

        signal =
            null,

        onProgress =
            null

    } = {}) {

        this.validateShoe();

        this.validateRandom(
            random
        );


        this.validateRunOptions({

            simulations,

            batchSize

        });


        if (
            signal !== null &&
            typeof signal !==
                "object"
        ) {

            throw new TypeError(
                "signal must be an AbortSignal-compatible object or null."
            );

        }


        if (
            onProgress !== null &&
            typeof onProgress !==
                "function"
        ) {

            throw new TypeError(
                "onProgress must be a function or null."
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

            if (
                signal?.aborted
            ) {

                const error =
                    new Error(
                        "Monte Carlo simulation aborted."
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
                let index = 0;

                index < currentBatch;

                index++
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

        if (
            options === null ||
            typeof options !==
                "object" ||
            Array.isArray(options)
        ) {

            throw new TypeError(
                "Monte Carlo options must be an object."
            );

        }


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
     * 引擎摘要
     */
    get summary() {

        return {

            simulations:
                this.options
                    .simulations,

            batchSize:
                this.options
                    .batchSize,

            hasShoe:
                Boolean(
                    this.shoe
                ),

            observableRemaining:
                this.shoe
                    ? this
                        .getObservableRemaining(
                            this.shoe
                        )
                    : 0,

            physicalRemaining:
                this.shoe
                    ? this
                        .getPhysicalRemaining(
                            this.shoe
                        )
                    : 0,

            unknownBurnedCount:
                this.shoe
                    ? this
                        .getUnknownBurnedCount(
                            this.shoe
                        )
                    : 0

        };

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
