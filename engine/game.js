/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game v3
 *
 * 百家樂遊戲主控制器
 *
 * 支援：
 *
 * 1. 自動模擬牌局
 * 2. 荷官手動輸入牌局
 * 3. Shoe
 * 4. Burn
 * 5. Dealer
 * 6. History
 * 7. RoadmapAnalyzer
 */

import Shoe
    from "./shoe.js";

import Burn
    from "./burn.js";

import Dealer
    from "./dealer.js";

import History
    from "./history.js";

import Round
    from "./round.js";

import RoundResult
    from "./roundResult.js";

import Card
    from "./card.js";

import {
    playerMustDraw
} from "./rules/playerRule.js";

import {
    bankerMustDraw
} from "./rules/bankerRule.js";

import RoadmapAnalyzer
    from "../roadmap/roadmapAnalyzer.js";


export const GameState =
    Object.freeze({

        READY: "READY",

        PLAYING: "PLAYING",

        SHOE_FINISHED: "SHOE_FINISHED"

    });


/**
 * 手動牌局狀態
 */
export const ManualRoundState =
    Object.freeze({

        IDLE: "IDLE",

        INITIAL: "INITIAL",

        PLAYER_THIRD: "PLAYER_THIRD",

        BANKER_THIRD: "BANKER_THIRD",

        READY_TO_FINISH:
            "READY_TO_FINISH",

        FINISHED: "FINISHED"

    });


/**
 * 手動輸入方位
 */
export const HandSide =
    Object.freeze({

        PLAYER: "player",

        BANKER: "banker"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        deckCount: 8,

        autoShuffle: true,

        autoBurn: true,

        /**
         * 一局最多可能使用六張牌。
         */
        minimumCards: 6,

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
            this.createRoadmapAnalyzer();

        this.state =
            GameState.READY;

        this.lastResult = null;

        this.shoeNumber = 0;

        this.startedAt = null;

        this.lastRoundAt = null;


        /**
         * 手動牌局資料
         */
        this.manualRound = null;

        this.manualState =
            ManualRoundState.IDLE;

        this.manualCards = [];

        this.manualResult = null;


        this.startNewShoe();

    }


    /**
     * 建立 RoadmapAnalyzer
     */
    createRoadmapAnalyzer() {

        return new RoadmapAnalyzer({

            beadRows:
                this.options.beadRows,

            bigRoadRows:
                this.options
                    .bigRoadRows,

            derivedRows:
                this.options
                    .derivedRows

        });

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


        this.resetManualRound();

        this.lastResult = null;

        this.shoeNumber++;

        this.startedAt =
            Date.now();

        this.lastRoundAt = null;

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

            this.shoe.remaining >=
                this.options.minimumCards

        );

    }


    /**
     * 檢查牌靴是否可開始新局
     */
    ensurePlayable() {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
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
     * 儲存完成牌局
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


        if (
            this.shoe &&
            this.shoe.remaining <
                this.options.minimumCards
        ) {

            this.state =
                GameState.SHOE_FINISHED;

        }

        return result;

    }


    /* =====================================
       自動模擬牌局
       ===================================== */


    /**
     * 自動完成一局
     *
     * 用於：
     * - 測試
     * - 模擬
     * - Monte Carlo
     */
    playRound() {

        this.ensurePlayable();

        if (this.isManualRoundActive) {

            throw new Error(
                "Cannot auto-play while a manual round is active."
            );

        }

        const result =
            this.dealer.play();

        if (!result) {

            throw new Error(
                "Dealer did not return a round result."
            );

        }

        return this.recordResult(
            result
        );

    }


    /**
     * play() 為自動牌局別名
     */
    play() {

        return this.playRound();

    }


    /**
     * 自動模擬多局
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

        if (this.isManualRoundActive) {

            throw new Error(
                "Cannot auto-play while a manual round is active."
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


    /* =====================================
       手動輸入牌局
       ===================================== */


    /**
     * 重置手動牌局資料
     */
    resetManualRound() {

        this.manualRound = null;

        this.manualCards = [];

        this.manualResult = null;

        this.manualState =
            ManualRoundState.IDLE;

        return this;

    }


    /**
     * 是否正在輸入手動牌局
     */
    get isManualRoundActive() {

        return [

            ManualRoundState.INITIAL,

            ManualRoundState.PLAYER_THIRD,

            ManualRoundState.BANKER_THIRD,

            ManualRoundState
                .READY_TO_FINISH

        ].includes(
            this.manualState
        );

    }


    /**
     * 開始荷官手動牌局
     */
    startManualRound() {

        this.ensurePlayable();

        if (this.isManualRoundActive) {

            throw new Error(
                "A manual round is already active."
            );

        }

        this.manualRound =
            new Round();

        this.manualCards = [];

        this.manualResult = null;

        this.manualState =
            ManualRoundState.INITIAL;

        return this.manualRound;

    }


    /**
     * 驗證 side
     */
    validateSide(side) {

        if (
            !Object.values(
                HandSide
            ).includes(side)
        ) {

            throw new Error(
                `Invalid hand side: ${side}`
            );

        }

        return side;

    }


    /**
     * 手動輸入的下一方
     */
    get nextManualSide() {

        if (!this.manualRound) {

            return null;

        }

        const count =
            this.manualCards.length;


        /**
         * 初始四張固定順序：
         *
         * Player
         * Banker
         * Player
         * Banker
         */
        if (count === 0) {

            return HandSide.PLAYER;

        }

        if (count === 1) {

            return HandSide.BANKER;

        }

        if (count === 2) {

            return HandSide.PLAYER;

        }

        if (count === 3) {

            return HandSide.BANKER;

        }


        if (
            this.manualState ===
            ManualRoundState.PLAYER_THIRD
        ) {

            return HandSide.PLAYER;

        }


        if (
            this.manualState ===
            ManualRoundState.BANKER_THIRD
        ) {

            return HandSide.BANKER;

        }

        return null;

    }


    /**
     * 下一張牌的顯示名稱
     */
    get nextManualInput() {

        const side =
            this.nextManualSide;

        if (!side) {

            return null;

        }

        const hand =

            side === HandSide.PLAYER

                ? this.manualRound?.player

                : this.manualRound?.banker;

        const cardNumber =
            (hand?.count ?? 0) + 1;

        return {

            side,

            cardNumber,

            label:
                side === HandSide.PLAYER
                    ? `Player 第 ${cardNumber} 張`
                    : `Banker 第 ${cardNumber} 張`

        };

    }


    /**
     * 解析手動輸入牌
     *
     * 支援：
     *
     * Card
     *
     * {
     *     rank: "A",
     *     suit: "S",
     *     deck: 1
     * }
     *
     * {
     *     rank: "A",
     *     suit: "S"
     * }
     *
     * 沒有提供 deck 時，
     * 會從牌靴找到第一張相同 rank / suit。
     */
    resolveManualCard(input) {

        if (!input) {

            throw new Error(
                "Card is required."
            );

        }


        let rank;

        let suit;

        let deckNumber;


        if (input instanceof Card) {

            rank = input.rank;

            suit = input.suit;

            deckNumber =
                input.deck ??
                input.deckNumber;

        }
        else if (
            typeof input === "object" &&
            !Array.isArray(input)
        ) {

            rank = input.rank;

            suit = input.suit;

            deckNumber =
                input.deck ??
                input.deckNumber;

        }
        else {

            throw new TypeError(
                "Manual card must be a Card or card data object."
            );

        }


        if (!rank || !suit) {

            throw new Error(
                "Card rank and suit are required."
            );

        }


        const remainingCards =

            typeof this.shoe.peek ===
                "function"

                ? this.shoe.peek()

                : [...this.shoe.cards];


        const matched =
            remainingCards.find(
                card => {

                    const sameRank =
                        card.rank === rank;

                    const sameSuit =
                        card.suit === suit;

                    const sameDeck =

                        deckNumber ===
                            undefined ||

                        deckNumber ===
                            null ||

                        card.deck ===
                            deckNumber ||

                        card.deckNumber ===
                            deckNumber;

                    return (
                        sameRank &&
                        sameSuit &&
                        sameDeck
                    );

                }
            );


        if (!matched) {

            throw new Error(
                `Card is not available in shoe: ${rank}${suit}`
            );

        }

        return matched;

    }


    /**
     * 從牌靴移除手動輸入牌
     */
    consumeManualCard(card) {

        const before =
            this.shoe.remaining;

        this.shoe.remove(
            card
        );

        if (
            this.shoe.remaining !==
            before - 1
        ) {

            throw new Error(
                "Failed to remove manual card from shoe."
            );

        }

        return card;

    }


    /**
     * 將牌放回牌靴
     *
     * 用於撤銷上一張。
     */
    restoreManualCard(card) {

        if (!card) {

            return this;

        }

        if (
            !Array.isArray(
                this.shoe.cards
            ) ||
            !Array.isArray(
                this.shoe.discarded
            )
        ) {

            throw new Error(
                "Shoe does not support card restoration."
            );

        }


        const discardedIndex =
            this.shoe.discarded
                .findLastIndex(
                    item =>
                        typeof item.equals ===
                            "function"
                            ? item.equals(card)
                            : item.id === card.id
                );


        if (discardedIndex >= 0) {

            this.shoe.discarded.splice(
                discardedIndex,
                1
            );

        }


        const alreadyExists =
            this.shoe.cards.some(
                item =>
                    typeof item.equals ===
                        "function"
                        ? item.equals(card)
                        : item.id === card.id
            );


        if (!alreadyExists) {

            this.shoe.cards.push(
                card
            );

        }

        return this;

    }


    /**
     * 新增荷官發出的牌
     */
    addManualCard(
        side,
        input
    ) {

        if (!this.isManualRoundActive) {

            throw new Error(
                "Manual round is not active."
            );

        }

        this.validateSide(
            side
        );

        const expected =
            this.nextManualSide;

        if (!expected) {

            throw new Error(
                "No more cards are required for this round."
            );

        }

        if (side !== expected) {

            throw new Error(
                `Expected ${expected}, received ${side}.`
            );

        }


        const card =
            this.resolveManualCard(
                input
            );


        /**
         * 先確認 Round 可接受這張牌，
         * 再從 Shoe 移除。
         */
        this.manualRound.deal(
            side,
            card
        );


        try {

            this.consumeManualCard(
                card
            );

        }
        catch (error) {

            const hand =

                side === HandSide.PLAYER

                    ? this.manualRound.player

                    : this.manualRound.banker;

            hand.remove(
                card
            );

            throw error;

        }


        this.manualCards.push({

            side,

            card

        });


        this.updateManualState();

        return card;

    }


    /**
     * 依規則更新手動牌局狀態
     */
    updateManualState() {

        if (!this.manualRound) {

            this.manualState =
                ManualRoundState.IDLE;

            return this.manualState;

        }


        const total =
            this.manualCards.length;


        /**
         * 初始四張尚未完成。
         */
        if (total < 4) {

            this.manualState =
                ManualRoundState.INITIAL;

            return this.manualState;

        }


        /**
         * Natural 不補牌。
         */
        if (this.manualRound.isNatural) {

            this.manualState =
                ManualRoundState
                    .READY_TO_FINISH;

            return this.manualState;

        }


        const player =
            this.manualRound.player;

        const banker =
            this.manualRound.banker;


        /**
         * Player 需要第三張。
         */
        if (
            player.count === 2 &&
            playerMustDraw(player)
        ) {

            this.manualState =
                ManualRoundState
                    .PLAYER_THIRD;

            return this.manualState;

        }


        const playerThirdCard =

            player.count === 3

                ? player.lastCard

                : null;


        /**
         * Banker 需要第三張。
         */
        if (
            banker.count === 2 &&
            bankerMustDraw(
                banker,
                playerThirdCard
            )
        ) {

            this.manualState =
                ManualRoundState
                    .BANKER_THIRD;

            return this.manualState;

        }


        this.manualState =
            ManualRoundState
                .READY_TO_FINISH;

        return this.manualState;

    }


    /**
     * 是否可完成手動牌局
     */
    get canFinishManualRound() {

        return (

            this.manualRound !== null &&

            this.manualState ===
                ManualRoundState
                    .READY_TO_FINISH

        );

    }


    /**
     * 完成手動牌局
     */
    finishManualRound() {

        if (!this.manualRound) {

            throw new Error(
                "Manual round not found."
            );

        }

        if (!this.canFinishManualRound) {

            throw new Error(
                "Manual round is not ready to finish."
            );

        }


        const result =
            this.manualRound.finish();


        this.manualResult =
            result;

        this.manualState =
            ManualRoundState.FINISHED;


        this.recordResult(
            result
        );

        return result;

    }


    /**
     * 撤銷手動輸入的上一張牌
     */
    undoManualCard() {

        if (!this.manualRound) {

            return null;

        }

        if (
            this.manualState ===
            ManualRoundState.FINISHED
        ) {

            throw new Error(
                "Finished round cannot be edited."
            );

        }


        const removed =
            this.manualCards.pop();

        if (!removed) {

            return null;

        }


        this.restoreManualCard(
            removed.card
        );


        this.rebuildManualRound();

        return removed;

    }


    /**
     * 依輸入紀錄重建 Round
     */
    rebuildManualRound() {

        const round =
            new Round();


        for (
            const item of
            this.manualCards
        ) {

            round.deal(
                item.side,
                item.card
            );

        }


        this.manualRound =
            round;

        this.manualResult =
            null;

        this.updateManualState();

        return this.manualRound;

    }


    /**
     * 取消目前手動牌局
     *
     * 已輸入的牌會放回牌靴。
     */
    cancelManualRound() {

        if (
            this.manualState ===
            ManualRoundState.FINISHED
        ) {

            throw new Error(
                "Finished round cannot be cancelled."
            );

        }


        for (
            let index =
                this.manualCards.length - 1;

            index >= 0;

            index--
        ) {

            this.restoreManualCard(
                this.manualCards[index]
                    .card
            );

        }


        this.resetManualRound();

        return this;

    }


    /**
     * 手動牌局進度
     */
    get manualProgress() {

        return {

            state:
                this.manualState,

            active:
                this.isManualRoundActive,

            canFinish:
                this.canFinishManualRound,

            nextInput:
                this.nextManualInput,

            totalCards:
                this.manualCards.length,

            playerCards:
                this.manualRound
                    ?.player
                    ?.getCards() ??
                [],

            bankerCards:
                this.manualRound
                    ?.banker
                    ?.getCards() ??
                [],

            playerScore:
                this.manualRound
                    ?.playerScore ??
                null,

            bankerScore:
                this.manualRound
                    ?.bankerScore ??
                null,

            isNatural:
                this.manualRound
                    ?.isNatural ??
                false,

            result:
                this.manualResult

        };

    }


    /* =====================================
       外部結果與歷史
       ===================================== */


    /**
     * 匯入外部結果
     */
    addResult(result) {

        return this.recordResult(
            result
        );

    }


    /**
     * 匯入多筆結果
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
     * 清空歷史與路單
     */
    clearHistory() {

        this.history.clear();

        this.roadmapAnalyzer.clear();

        this.lastResult = null;

        this.lastRoundAt = null;

        return this;

    }


    /**
     * 重新建立所有路單
     */
    rebuildRoadmaps() {

        this.roadmapAnalyzer.build(
            this.history
        );

        return this.roadmapAnalyzer;

    }


    /**
     * 替換牌靴
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


        if (this.isManualRoundActive) {

            this.cancelManualRound();

        }


        this.shoe = shoe;

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


        this.resetManualRound();

        this.state =
            GameState.PLAYING;

        this.lastResult = null;

        this.startedAt =
            Date.now();

        return this;

    }


    /* =====================================
       Getter
       ===================================== */


    get roundCount() {

        return this.history.count;

    }


    get isEmpty() {

        return this.history.isEmpty;

    }


    get lastRound() {

        return (
            this.history.last ??
            null
        );

    }


    get winner() {

        return (
            this.lastResult?.winner ??
            null
        );

    }


    get currentRound() {

        if (this.manualRound) {

            return this.manualRound;

        }

        return (
            this.dealer
                ?.currentRound ??
            null
        );

    }


    get remainingCards() {

        return (
            this.shoe?.remaining ??
            0
        );

    }


    get usedCards() {

        return (
            this.shoe?.used ??
            0
        );

    }


    get remainingRatio() {

        return (
            this.shoe
                ?.remainingRatio ??
            0
        );

    }


    get finished() {

        return (
            this.state ===
            GameState.SHOE_FINISHED
        );

    }


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


    get roads() {

        return this.roadmapAnalyzer
            .roads;

    }


    get roadMatrices() {

        return this.roadmapAnalyzer
            .matrices;

    }


    get roadmapSummary() {

        return this.roadmapAnalyzer
            .summary;

    }


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

                ...this.history.winRate

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
                this.history.streak,

            lastWinner:
                this.winner,

            startedAt:
                this.startedAt,

            lastRoundAt:
                this.lastRoundAt,

            manual:
                this.manualProgress

        };

    }


    /**
     * 一致性檢查
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
     * UI ViewModel
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
                    ?.toJSON?.() ??
                this.lastResult ??
                null,

            manual:
                this.manualProgress,

            roadmap:
                this.roadmapViewModel,

            consistency:
                this.validateConsistency()

        };

    }


    /* =====================================
       JSON
       ===================================== */


    toJSON() {

        return {

            version: 3,

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
                    ?.toJSON?.() ??
                this.lastResult ??
                null,

            manual: {

                state:
                    this.manualState,

                cards:
                    this.manualCards.map(
                        item => ({

                            side:
                                item.side,

                            card:
                                item.card.toJSON()

                        })
                    )

            }

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
            game.createRoadmapAnalyzer();

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


        game.manualRound = null;

        game.manualCards = [];

        game.manualResult = null;

        game.manualState =
            ManualRoundState.IDLE;


        if (
            Array.isArray(
                data.manual?.cards
            ) &&
            data.manual.cards.length > 0
        ) {

            game.manualRound =
                new Round();


            for (
                const item of
                data.manual.cards
            ) {

                const card =
                    Card.fromJSON(
                        item.card
                    );

                game.manualRound.deal(
                    item.side,
                    card
                );

                game.manualCards.push({

                    side:
                        item.side,

                    card

                });

            }


            game.updateManualState();

        }

        return game;

    }

}
