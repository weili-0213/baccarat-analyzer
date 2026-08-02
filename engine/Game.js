/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game v2
 *
 * 百家樂遊戲主控制器
 *
 * 負責整合：
 *
 * 1. Shoe
 * 2. Burn
 * 3. Dealer
 * 4. History
 * 5. RoadmapAnalyzer
 *
 * 每完成一局：
 *
 * Dealer.play()
 *      ↓
 * RoundResult
 *      ↓
 * History.add()
 *      ↓
 * RoadmapAnalyzer.add()
 */

import Shoe
    from "./shoe.js";

import Burn
    from "./burn.js";

import Dealer
    from "./dealer.js";

import History
    from "./history.js";

import RoundResult
    from "./roundResult.js";

import RoadmapAnalyzer
    from "../roadmap/roadmapAnalyzer.js";


export const GameState =
    Object.freeze({

        READY: "READY",

        PLAYING: "PLAYING",

        SHOE_FINISHED: "SHOE_FINISHED"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        deckCount: 8,

        autoShuffle: true,

        autoBurn: true,

        /**
         * 最少保留牌數。
         *
         * 一局最多使用 6 張牌，
         * 少於 6 張時不再開始新局。
         */
        minimumCards: 6,

        /**
         * Roadmap 列數設定。
         */
        beadRows: 6,

        bigRoadRows: 6,

        derivedRows: 6

    });


export default class Game {

    constructor(options = {}) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };

        this.validateOptions();

        this.shoe = null;

        this.burn = null;

        this.dealer = null;

        this.history =
            new History();

        this.roadmapAnalyzer =
            new RoadmapAnalyzer({

                beadRows:
                    this.options.beadRows,

                bigRoadRows:
                    this.options.bigRoadRows,

                derivedRows:
                    this.options.derivedRows

            });

        this.state =
            GameState.READY;

        this.lastResult = null;

        this.shoeNumber = 0;

        this.startedAt = null;

        this.lastRoundAt = null;

        this.startNewShoe();

    }


    /**
     * 驗證設定
     */
    validateOptions() {

        if (
            !Number.isInteger(
                this.options.deckCount
            ) ||
            this.options.deckCount < 1
        ) {

            throw new RangeError(
                "deckCount must be a positive integer."
            );

        }

        if (
            !Number.isInteger(
                this.options.minimumCards
            ) ||
            this.options.minimumCards < 1
        ) {

            throw new RangeError(
                "minimumCards must be a positive integer."
            );

        }

        const rowOptions = [

            "beadRows",

            "bigRoadRows",

            "derivedRows"

        ];

        for (
            const option of
            rowOptions
        ) {

            if (
                !Number.isInteger(
                    this.options[option]
                ) ||
                this.options[option] < 1
            ) {

                throw new RangeError(
                    `${option} must be a positive integer.`
                );

            }

        }

    }


    /**
     * 建立新牌靴
     *
     * 預設會：
     *
     * 1. 建立牌靴
     * 2. 洗牌
     * 3. 燒牌
     * 4. 建立 Dealer
     * 5. 清空 History
     * 6. 清空 Roadmap
     */
    startNewShoe({

        clearHistory = true,

        shuffle =
            this.options.autoShuffle,

        burn =
            this.options.autoBurn

    } = {}) {

        const shoe =
            new Shoe(
                this.options.deckCount
            );


        /**
         * 相容兩種 Shoe 實作：
         *
         * 1. constructor 已自動 create()
         * 2. constructor 尚未 create()
         */
        if (
            shoe.remaining === 0 &&
            typeof shoe.create ===
                "function"
        ) {

            shoe.create();

        }


        if (
            shuffle &&
            typeof shoe.shuffle ===
                "function"
        ) {

            shoe.shuffle();

        }


        this.shoe = shoe;

        this.burn =
            new Burn(
                this.shoe
            );


        if (burn) {

            this.burn.execute();

        }


        this.dealer =
            new Dealer(
                this.shoe
            );


        if (clearHistory) {

            this.clearHistory();

        }


        this.lastResult = null;

        this.shoeNumber++;

        this.startedAt =
            Date.now();

        this.lastRoundAt =
            null;

        this.state =
            GameState.PLAYING;

        return this;

    }


    /**
     * 新牌靴別名
     */
    newShoe(options = {}) {

        return this.startNewShoe(
            options
        );

    }


    /**
     * 是否有足夠牌數開始新局
     */
    get canPlay() {

        return (

            this.state ===
                GameState.PLAYING &&

            this.shoe !== null &&

            this.dealer !== null &&

            this.shoe.remaining >=
                this.options.minimumCards

        );

    }


    /**
     * 檢查是否可進行下一局
     */
    ensurePlayable() {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }

        if (!this.dealer) {

            throw new Error(
                "Dealer not found."
            );

        }

        if (
            this.state ===
            GameState.SHOE_FINISHED
        ) {

            throw new Error(
                "The shoe has finished."
            );

        }

        if (
            this.shoe.remaining <
            this.options.minimumCards
        ) {

            this.state =
                GameState.SHOE_FINISHED;

            throw new Error(
                "Not enough cards remaining to play a round."
            );

        }

        return true;

    }


    /**
     * 儲存完成的一局
     *
     * 統一更新：
     *
     * - History
     * - RoadmapAnalyzer
     * - lastResult
     */
    recordResult(result) {

        if (!result) {

            throw new Error(
                "Round result is required."
            );

        }

        this.history.add(
            result
        );

        this.roadmapAnalyzer.add(
            result
        );

        this.lastResult =
            result;

        this.lastRoundAt =
            Date.now();

        return result;

    }


    /**
     * 完成一局
     *
     * 回傳 RoundResult
     */
    playRound() {

        this.ensurePlayable();

        const result =
            this.dealer.play();

        if (!result) {

            throw new Error(
                "Dealer did not return a round result."
            );

        }

        this.recordResult(
            result
        );


        /**
         * 打完這局後檢查剩餘牌數。
         */
        if (
            this.shoe.remaining <
            this.options.minimumCards
        ) {

            this.state =
                GameState.SHOE_FINISHED;

        }

        return result;

    }


    /**
     * play() 作為 playRound() 別名
     */
    play() {

        return this.playRound();

    }


    /**
     * 一次模擬多局
     *
     * 若牌數不足會提前停止。
     */
    playMany(count = 1) {

        if (
            !Number.isInteger(count) ||
            count < 0
        ) {

            throw new RangeError(
                "count must be a non-negative integer."
            );

        }

        const results = [];

        for (
            let index = 0;
            index < count;
            index++
        ) {

            if (!this.canPlay) {

                break;

            }

            results.push(
                this.playRound()
            );

        }

        return results;

    }


    /**
     * 匯入外部結果
     *
     * 適合：
     *
     * - 手動輸入牌局
     * - 還原歷史
     * - 外部 API 結果
     */
    addResult(result) {

        return this.recordResult(
            result
        );

    }


    /**
     * 一次匯入多筆結果
     */
    addResults(results = []) {

        if (!Array.isArray(results)) {

            throw new TypeError(
                "results must be an array."
            );

        }

        for (
            const result of
            results
        ) {

            this.recordResult(
                result
            );

        }

        return this;

    }


    /**
     * 清空歷史與所有路單
     *
     * 不更換目前牌靴。
     */
    clearHistory() {

        this.history.clear();

        this.roadmapAnalyzer.clear();

        this.lastResult = null;

        this.lastRoundAt = null;

        return this;

    }


    /**
     * 根據 History 重新建立全部路單
     */
    rebuildRoadmaps() {

        this.roadmapAnalyzer.build(
            this.history
        );

        return this.roadmapAnalyzer;

    }


    /**
     * 替換牌靴
     *
     * 可用於測試固定牌序。
     */
    setShoe(
        shoe,
        {
            clearHistory = true
        } = {}
    ) {

        if (!shoe) {

            throw new Error(
                "Shoe is required."
            );

        }

        if (
            typeof shoe.draw !==
            "function"
        ) {

            throw new TypeError(
                "Invalid shoe."
            );

        }

        this.shoe =
            shoe;

        this.burn =
            new Burn(
                this.shoe
            );

        this.dealer =
            new Dealer(
                this.shoe
            );

        if (clearHistory) {

            this.clearHistory();

        }

        this.state =
            GameState.PLAYING;

        this.lastResult = null;

        this.startedAt =
            Date.now();

        return this;

    }


    /**
     * 目前局數
     */
    get roundCount() {

        return this.history.count;

    }


    /**
     * 是否尚未有牌局
     */
    get isEmpty() {

        return this.history.isEmpty;

    }


    /**
     * 最後一局
     */
    get lastRound() {

        return (
            this.history.last ??
            null
        );

    }


    /**
     * 最後勝方
     */
    get winner() {

        return (
            this.lastResult?.winner ??
            null
        );

    }


    /**
     * 目前牌局
     */
    get currentRound() {

        return (
            this.dealer
                ?.currentRound ??
            null
        );

    }


    /**
     * 剩餘牌數
     */
    get remainingCards() {

        return (
            this.shoe?.remaining ??
            0
        );

    }


    /**
     * 已使用牌數
     */
    get usedCards() {

        return (
            this.shoe?.used ??
            0
        );

    }


    /**
     * 剩餘牌比例
     */
    get remainingRatio() {

        return (
            this.shoe
                ?.remainingRatio ??
            0
        );

    }


    /**
     * 是否已完成牌靴
     */
    get finished() {

        return (
            this.state ===
            GameState.SHOE_FINISHED
        );

    }


    /**
     * 燒牌資訊
     */
    get burnInfo() {

        if (!this.burn) {

            return null;

        }

        return {

            executed:
                this.burn.isExecuted,

            indicator:
                this.burn.indicator,

            amount:
                this.burn.amount,

            count:
                this.burn.count

        };

    }


    /**
     * 五種 Road 實例
     */
    get roads() {

        return this.roadmapAnalyzer
            .roads;

    }


    /**
     * 五種 Road 矩陣
     */
    get roadMatrices() {

        return this.roadmapAnalyzer
            .matrices;

    }


    /**
     * Roadmap 完整摘要
     */
    get roadmapSummary() {

        return this.roadmapAnalyzer
            .summary;

    }


    /**
     * Roadmap UI ViewModel
     */
    get roadmapViewModel() {

        return this.roadmapAnalyzer
            .toViewModel();

    }


    /**
     * 遊戲統計
     */
    get statistics() {

        return {

            shoeNumber:
                this.shoeNumber,

            state:
                this.state,

            rounds:
                this.roundCount,

            remainingCards:
                this.remainingCards,

            usedCards:
                this.usedCards,

            remainingRatio:
                this.remainingRatio,

            winners: {

                player:
                    this.history
                        .playerWins,

                banker:
                    this.history
                        .bankerWins,

                tie:
                    this.history
                        .ties

            },

            winRate: {

                ...this.history
                    .winRate

            },

            pairs: {

                player:
                    this.history
                        .playerPairs,

                banker:
                    this.history
                        .bankerPairs

            },

            naturals: {

                player:
                    this.history
                        .playerNaturals,

                banker:
                    this.history
                        .bankerNaturals

            },

            super6:
                this.history
                    .super6Count,

            dragonBonus:
                this.history
                    .dragonBonusCount,

            streak:
                this.history
                    .streak,

            lastWinner:
                this.winner,

            startedAt:
                this.startedAt,

            lastRoundAt:
                this.lastRoundAt

        };

    }


    /**
     * 路單與 History 一致性檢查
     */
    validateConsistency() {

        const roadmap =
            this.roadmapAnalyzer
                .validateConsistency();

        const errors = [

            ...roadmap.errors

        ];


        if (
            this.history.count !==
            this.roadmapAnalyzer
                .sourceCount
        ) {

            errors.push(
                "History count does not match Roadmap source count."
            );

        }


        if (
            this.history.count !==
            this.roadmapAnalyzer
                .beadRoad
                .count
        ) {

            errors.push(
                "History count does not match Bead Road count."
            );

        }


        return {

            valid:
                errors.length === 0,

            errors

        };

    }


    /**
     * UI 使用資料
     */
    toViewModel() {

        return {

            state:
                this.state,

            canPlay:
                this.canPlay,

            finished:
                this.finished,

            statistics:
                this.statistics,

            burn:
                this.burnInfo,

            lastResult:
                this.lastResult
                    ? this.lastResult
                        .toJSON()
                    : null,

            roadmap:
                this.roadmapViewModel,

            consistency:
                this.validateConsistency()

        };

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            version: 2,

            options: {

                ...this.options

            },

            state:
                this.state,

            shoeNumber:
                this.shoeNumber,

            startedAt:
                this.startedAt,

            lastRoundAt:
                this.lastRoundAt,

            shoe:
                this.shoe
                    ? this.shoe.toJSON()
                    : null,

            burn:
                this.burn
                    ? this.burn.toJSON()
                    : null,

            dealer:
                this.dealer
                    ? this.dealer.toJSON()
                    : null,

            history:
                this.history.toJSON(),

            roadmap:
                this.roadmapAnalyzer
                    .toJSON(),

            lastResult:
                this.lastResult
                    ? this.lastResult
                        .toJSON()
                    : null

        };

    }


    /**
     * JSON 還原
     */
    static fromJSON(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Game data is required."
            );

        }

        if (!data.shoe) {

            throw new Error(
                "Game shoe data is required."
            );

        }

        if (
            data.history !== undefined &&
            !Array.isArray(
                data.history
            )
        ) {

            throw new Error(
                "Game history must be an array."
            );

        }


        const game =
            Object.create(
                Game.prototype
            );


        game.options = {

            ...DEFAULT_OPTIONS,

            ...data.options

        };

        game.validateOptions();


        game.shoe =
            Shoe.fromJSON(
                data.shoe
            );


        game.burn =
            new Burn(
                game.shoe
            );


        /**
         * Burn.fromJSON 尚未定義時，
         * 直接恢復公開資料。
         */
        if (data.burn) {

            game.burn.executed =
                Boolean(
                    data.burn.executed ??
                    data.burn.indicator
                );

            game.burn.amount =
                Number.isInteger(
                    data.burn.amount
                )
                    ? data.burn.amount
                    : 0;

        }


        game.dealer =
            data.dealer
                ? Dealer.fromJSON(
                    data.dealer,
                    game.shoe
                )
                : new Dealer(
                    game.shoe
                );


        game.history =
            new History();


        for (
            const item of
            data.history ?? []
        ) {

            const result =

                typeof RoundResult
                    .fromJSON ===
                    "function"

                    ? RoundResult.fromJSON(
                        item
                    )

                    : item;

            game.history.add(
                result
            );

        }


        game.roadmapAnalyzer =
            new RoadmapAnalyzer({

                beadRows:
                    game.options
                        .beadRows,

                bigRoadRows:
                    game.options
                        .bigRoadRows,

                derivedRows:
                    game.options
                        .derivedRows

            });


        /**
         * 使用 History 重建路單，
         * 確保五種路單一致。
         */
        game.roadmapAnalyzer.build(
            game.history
        );


        game.state =
            Object.values(
                GameState
            ).includes(data.state)

                ? data.state

                : GameState.READY;


        game.shoeNumber =
            Number.isInteger(
                data.shoeNumber
            )
                ? data.shoeNumber
                : 1;


        game.startedAt =
            Number.isFinite(
                data.startedAt
            )
                ? data.startedAt
                : null;


        game.lastRoundAt =
            Number.isFinite(
                data.lastRoundAt
            )
                ? data.lastRoundAt
                : null;


        game.lastResult =
            game.history.last;


        return game;

    }

}
