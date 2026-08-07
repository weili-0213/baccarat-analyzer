/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game Controller v2
 *
 * 真人百家樂主控制器
 *
 * 正式流程：
 *
 * 1. 建立新牌靴
 * 2. 等待手動輸入燒牌指示牌
 * 3. 扣除公開指示牌並記錄未知燒牌張數
 * 4. 開始輸入荷官已發出的牌
 * 5. 依規則提示 Player / Banker 第三張
 * 6. 確認本局
 * 7. 更新 History
 * 8. 更新五種路單
 * 9. 分析下一局所有下注選項
 * 10. 顯示概率、EV 與下注建議
 *
 * 注意：
 *
 * - 不自動發牌
 * - 不自動偵測停牌卡
 * - 看到停牌卡後，由使用者按「開始新牌靴」
 * - 隱藏燒牌只記錄數量，不虛構牌面
 */

/**
 * Baccarat Analyzer V10.4.4
 * Path: engine/game.js
 * Purpose: Live Round Critical Path Fix.
 *
 * Adds a per-call burn-analysis override so live Dashboard flows can confirm
 * the burn indicator without starting the legacy automatic analysis first.
 */
export const GAME_LIVE_CRITICAL_PATH_VERSION = "10.4.4";
export const GAME_NO_COMMISSION_VERSION = "10.4.5";

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

import Analyzer
    from "../analysis/analyzer.js";

import {
    NO_COMMISSION_BACCARAT_RULES,
    NO_COMMISSION_PAYOUT
} from "../config/noCommissionBaccarat.js";


/**
 * Game 整體狀態
 */
export const GameState =
    Object.freeze({

        READY:
            "READY",

        WAITING_BURN_INDICATOR:
            "WAITING_BURN_INDICATOR",

        SHOE_ACTIVE:
            "SHOE_ACTIVE",

        ROUND_INPUT:
            "ROUND_INPUT",

        ANALYZING:
            "ANALYZING",

        ERROR:
            "ERROR"

    });


/**
 * 手動牌局狀態
 */
export const ManualRoundState =
    Object.freeze({

        IDLE:
            "IDLE",

        INITIAL:
            "INITIAL",

        PLAYER_THIRD:
            "PLAYER_THIRD",

        BANKER_THIRD:
            "BANKER_THIRD",

        READY_TO_FINISH:
            "READY_TO_FINISH",

        FINISHED:
            "FINISHED"

    });


/**
 * 手牌方位
 */
export const HandSide =
    Object.freeze({

        PLAYER:
            "player",

        BANKER:
            "banker"

    });


/**
 * 分析狀態
 */
export const AnalysisState =
    Object.freeze({

        IDLE:
            "IDLE",

        RUNNING:
            "RUNNING",

        COMPLETED:
            "COMPLETED",

        FAILED:
            "FAILED"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        deckCount:
            8,

        autoShuffle:
            true,

        /**
         * 燒牌完成後是否先分析第一局。
         */
        analyzeAfterBurn:
            true,

        /**
         * 每局完成後是否自動分析下一局。
         */
        analyzeAfterRound:
            true,

        beadRows:
            6,

        bigRoadRows:
            6,

        derivedRows:
            6,

        analyzerOptions:
            Object.freeze({})

    });


function isObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


function clonePlainData(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return value;

    }

    if (
        typeof structuredClone ===
            "function"
    ) {

        try {

            return structuredClone(
                value
            );

        }
        catch {

            // 使用 JSON 備援。
        }

    }

    try {

        return JSON.parse(
            JSON.stringify(value)
        );

    }
    catch {

        return value;

    }

}


export default class Game {

    constructor(options = {}) {

        if (!isObject(options)) {

            throw new TypeError(
                "Game options must be an object."
            );

        }

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options,

            analyzerOptions: {

                ...DEFAULT_OPTIONS
                    .analyzerOptions,

                ...(
                    options
                        .analyzerOptions ??
                    {}
                )

            }

        };

        this.validateOptions();


        /**
         * 核心模組
         */
        this.shoe = null;

        this.burn = null;

        this.dealer = null;

        this.history =
            new History();

        this.roadmapAnalyzer =
            this.createRoadmapAnalyzer();

        this.analyzer =
            this.createAnalyzer(
                options.analyzer ??
                null
            );


        /**
         * Game 狀態
         */
        this.state =
            GameState.READY;

        this.shoeNumber = 0;

        this.startedAt = null;

        this.lastRoundAt = null;

        this.lastError = null;


        /**
         * 本局狀態
         */
        this.manualRound = null;

        this.manualState =
            ManualRoundState.IDLE;

        this.manualCards = [];

        this.manualResult = null;

        this.lastResult = null;


        /**
         * 分析狀態
         */
        this.analysisState =
            AnalysisState.IDLE;

        this.analysisPromise = null;

        this.analysisError = null;

        this.nextAnalysis = null;

        this.lastAnalysisAt = null;


        /**
         * 自動建立第一個牌靴。
         */
        this.startNewShoe();

    }


    /* =====================================
       建立與驗證
       ===================================== */


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

        for (
            const field of
            [
                "beadRows",
                "bigRoadRows",
                "derivedRows"
            ]
        ) {

            if (
                !Number.isInteger(
                    this.options[field]
                ) ||
                this.options[field] < 1
            ) {

                throw new RangeError(
                    `${field} must be a positive integer.`
                );

            }

        }

        for (
            const field of
            [
                "autoShuffle",
                "analyzeAfterBurn",
                "analyzeAfterRound"
            ]
        ) {

            if (
                typeof this.options[field] !==
                "boolean"
            ) {

                throw new TypeError(
                    `${field} must be boolean.`
                );

            }

        }

        if (
            !isObject(
                this.options
                    .analyzerOptions
            )
        ) {

            throw new TypeError(
                "analyzerOptions must be an object."
            );

        }

        return true;

    }


    createRoadmapAnalyzer() {

        return new RoadmapAnalyzer({

            beadRows:
                this.options.beadRows,

            bigRoadRows:
                this.options.bigRoadRows,

            derivedRows:
                this.options.derivedRows

        });

    }


    createAnalyzer(customAnalyzer = null) {

        if (customAnalyzer) {

            const valid =

                typeof customAnalyzer
                    .analyzeContext ===
                    "function" ||

                typeof customAnalyzer
                    .run ===
                    "function" ||

                (
                    typeof customAnalyzer
                        .setContext ===
                        "function" &&

                    typeof customAnalyzer
                        .analyze ===
                        "function"
                );

            if (!valid) {

                throw new TypeError(
                    "Custom analyzer must provide analyzeContext(), run(), or setContext() + analyze()."
                );

            }

            return customAnalyzer;

        }

        return new Analyzer();

    }


    /* =====================================
       新牌靴
       ===================================== */


    startNewShoe({

        clearHistory = true,

        shuffle =
            this.options.autoShuffle

    } = {}) {

        this.resetManualRound();

        this.clearAnalysis();


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

            this.history.clear();

            this.roadmapAnalyzer.clear();

        }


        this.lastResult = null;

        this.lastRoundAt = null;

        this.lastError = null;

        this.shoeNumber++;

        this.startedAt =
            Date.now();

        this.state =
            GameState
                .WAITING_BURN_INDICATOR;

        return this;

    }


    newShoe(options = {}) {

        return this.startNewShoe(
            options
        );

    }


    get isWaitingBurnIndicator() {

        return (

            this.state ===
                GameState
                    .WAITING_BURN_INDICATOR &&

            this.burn !== null &&

            !this.burn.isConfirmed

        );

    }


    get burnConfirmed() {

        return Boolean(
            this.burn?.isConfirmed
        );

    }


    confirmBurnIndicator(
        input,
        {
            analyze =
                this.options
                    .analyzeAfterBurn
        } = {}
    ) {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }

        if (!this.burn) {

            throw new Error(
                "Burn manager not found."
            );

        }

        if (
            !this.isWaitingBurnIndicator
        ) {

            throw new Error(
                "Game is not waiting for a burn indicator."
            );

        }


        const info =
            this.burn
                .confirmIndicator(
                    input
                );


        if (
            !this.burn.isConfirmed
        ) {

            throw new Error(
                "Burn indicator confirmation failed."
            );

        }


        this.state =
            GameState.SHOE_ACTIVE;


        if (analyze) {

            this.runNextAnalysis()
                .catch(
                    error => {

                        this.lastError =
                            error;

                    }
                );

        }


        return info;

    }


    get burnInfo() {

        return (
            this.burn?.info ??
            null
        );

    }


    /* =====================================
       手動牌局
       ===================================== */


    resetManualRound() {

        this.manualRound = null;

        this.manualState =
            ManualRoundState.IDLE;

        this.manualCards = [];

        this.manualResult = null;

        return this;

    }


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


    get canStartManualRound() {

        return (

            this.burnConfirmed &&

            this.shoe !== null &&

            this.shoe
                .physicalRemaining >= 4 &&

            !this.isManualRoundActive &&

            !this.isAnalyzing &&

            this.state ===
                GameState.SHOE_ACTIVE

        );

    }


    startManualRound() {

        if (!this.burnConfirmed) {

            throw new Error(
                "Burn indicator must be confirmed before starting a round."
            );

        }

        if (
            this.isAnalyzing
        ) {

            throw new Error(
                "Cannot start a round while analysis is running."
            );

        }

        if (
            this.isManualRoundActive
        ) {

            throw new Error(
                "A manual round is already active."
            );

        }

        if (
            this.shoe
                .physicalRemaining < 4
        ) {

            throw new Error(
                "Not enough physical cards remain to start a round."
            );

        }


        this.manualRound =
            new Round();

        this.manualCards = [];

        this.manualResult = null;

        this.manualState =
            ManualRoundState.INITIAL;

        this.state =
            GameState.ROUND_INPUT;

        return this.manualRound;

    }


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


    get nextManualSide() {

        if (!this.manualRound) {

            return null;

        }

        const total =
            this.manualCards.length;


        if (total === 0) {

            return HandSide.PLAYER;

        }

        if (total === 1) {

            return HandSide.BANKER;

        }

        if (total === 2) {

            return HandSide.PLAYER;

        }

        if (total === 3) {

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


    get nextManualInput() {

        const side =
            this.nextManualSide;

        if (!side) {

            return null;

        }


        const hand =

            side === HandSide.PLAYER

                ? this.manualRound.player

                : this.manualRound.banker;


        const cardNumber =
            hand.count + 1;


        return {

            side,

            cardNumber,

            label:

                side === HandSide.PLAYER

                    ? `Player 第 ${cardNumber} 張`

                    : `Banker 第 ${cardNumber} 張`

        };

    }


    resolveManualCard(input) {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }

        if (
            typeof this.shoe.resolveCard !==
                "function"
        ) {

            throw new Error(
                "Shoe does not support resolveCard()."
            );

        }

        return this.shoe.resolveCard(
            input
        );

    }


    addManualCard(
        side,
        input
    ) {

        if (!this.isManualRoundActive) {

            throw new Error(
                "Manual round is not active."
            );

        }

        if (
            this.manualState ===
            ManualRoundState
                .READY_TO_FINISH
        ) {

            throw new Error(
                "No more cards are required for this round."
            );

        }


        this.validateSide(
            side
        );


        const expected =
            this.nextManualSide;


        if (!expected) {

            throw new Error(
                "No more cards are required."
            );

        }


        if (
            side !== expected
        ) {

            throw new Error(
                `Expected ${expected}, received ${side}.`
            );

        }


        if (
            this.shoe
                .physicalRemaining <= 0
        ) {

            throw new Error(
                "No physical cards remain in the shoe."
            );

        }


        const card =
            this.resolveManualCard(
                input
            );


        /**
         * 先放入 Round，再從 Shoe 移除。
         * 若 Shoe 操作失敗，回復 Hand。
         */
        this.manualRound.deal(
            side,
            card
        );


        let removedCard;

        try {

            removedCard =
                this.shoe.remove(
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

            card:
                removedCard ??
                card

        });


        this.updateManualState();

        return (
            removedCard ??
            card
        );

    }


    updateManualState() {

        if (!this.manualRound) {

            this.manualState =
                ManualRoundState.IDLE;

            return this.manualState;

        }


        if (
            this.manualCards.length < 4
        ) {

            this.manualState =
                ManualRoundState.INITIAL;

            return this.manualState;

        }


        if (
            this.manualRound.isNatural
        ) {

            this.manualState =
                ManualRoundState
                    .READY_TO_FINISH;

            return this.manualState;

        }


        const player =
            this.manualRound.player;

        const banker =
            this.manualRound.banker;


        if (
            player.count === 2 &&
            playerMustDraw(player)
        ) {

            this.manualState =
                ManualRoundState.PLAYER_THIRD;

            return this.manualState;

        }


        const playerThirdCard =

            player.count === 3

                ? player.lastCard

                : null;


        if (
            banker.count === 2 &&
            bankerMustDraw(
                banker,
                playerThirdCard
            )
        ) {

            this.manualState =
                ManualRoundState.BANKER_THIRD;

            return this.manualState;

        }


        this.manualState =
            ManualRoundState
                .READY_TO_FINISH;

        return this.manualState;

    }


    get canFinishManualRound() {

        return (

            this.manualRound !== null &&

            this.manualState ===
                ManualRoundState
                    .READY_TO_FINISH

        );

    }


    async finishManualRound({

        analyze =
            this.options
                .analyzeAfterRound

    } = {}) {

        if (!this.manualRound) {

            throw new Error(
                "Manual round not found."
            );

        }

        if (
            !this.canFinishManualRound
        ) {

            throw new Error(
                "Manual round is not ready to finish."
            );

        }


        const result =
            this.manualRound.finish();


        if (!result) {

            throw new Error(
                "Round did not return a result."
            );

        }


        this.manualResult =
            result;

        this.manualState =
            ManualRoundState.FINISHED;


        this.recordResult(
            result
        );


        this.state =
            GameState.SHOE_ACTIVE;


        if (analyze) {

            await this.runNextAnalysis();

        }


        return result;

    }


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
            this.manualCards.pop() ??
            null;


        if (!removed) {

            return null;

        }


        this.shoe.restore(
            removed.card
        );


        this.rebuildManualRound();

        return removed;

    }


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


    cancelManualRound() {

        if (!this.manualRound) {

            return this;

        }

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

            this.shoe.restore(
                this.manualCards[index]
                    .card
            );

        }


        this.resetManualRound();

        this.state =
            GameState.SHOE_ACTIVE;

        return this;

    }


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
                    ?.getCards?.() ??
                [],

            bankerCards:
                this.manualRound
                    ?.banker
                    ?.getCards?.() ??
                [],

            playerScore:
                this.manualRound
                    ?.player
                    ?.value ??
                null,

            bankerScore:
                this.manualRound
                    ?.banker
                    ?.value ??
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
       History 與 Roadmap
       ===================================== */


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


    addResult(result) {

        return this.recordResult(
            result
        );

    }


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


    clearHistory() {

        this.history.clear();

        this.roadmapAnalyzer.clear();

        this.lastResult = null;

        this.lastRoundAt = null;

        this.clearAnalysis();

        return this;

    }


    rebuildRoadmaps() {

        this.roadmapAnalyzer.build(
            this.history
        );

        return this.roadmapAnalyzer;

    }


    /* =====================================
       Analyzer
       ===================================== */


    clearAnalysis() {

        this.analysisState =
            AnalysisState.IDLE;

        this.analysisPromise = null;

        this.analysisError = null;

        this.nextAnalysis = null;

        this.lastAnalysisAt = null;

        return this;

    }


    createAnalysisContext() {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }

        if (!this.burnConfirmed) {

            throw new Error(
                "Burn indicator must be confirmed before analysis."
            );

        }


        const analyzerOptions = {

            ...this.options
                .analyzerOptions

        };


        const observableCards =
            this.shoe.peek();


        return {

            shoe:
                this.shoe,

            history:
                this.history,

            cards:
                observableCards,

            observableCards,

            observableRemaining:
                this.shoe
                    .observableRemaining,

            physicalRemaining:
                this.shoe
                    .physicalRemaining,

            unknownBurnedCount:
                this.shoe
                    .unknownBurnedCount,

            shoeSummary: {

                ...this.shoe.summary

            },

            burn:
                this.burnInfo,

            historyItems:
                this.history.getAll(),

            roadmapAnalyzer:
                this.roadmapAnalyzer,

            roadmap:
                this.roadmapAnalyzer
                    .toViewModel(),

            roundCount:
                this.roundCount,

            lastResult:
                this.lastResult,

            ruleset: {
                ...NO_COMMISSION_BACCARAT_RULES
            },

            payouts: {
                ...NO_COMMISSION_PAYOUT,
                ...(
                    analyzerOptions
                        .payouts ??
                    {}
                )
            },

            monteCarloOptions: {

                ...(
                    analyzerOptions
                        .monteCarlo ??
                    {}
                )

            },

            exactOptions: {

                ...(
                    analyzerOptions
                        .exact ??
                    {}
                )

            },

            kellyOptions: {

                ...(
                    analyzerOptions
                        .kelly ??
                    {}
                )

            },

            riskOptions: {

                ...(
                    analyzerOptions
                        .risk ??
                    {}
                )

            },

            confidenceOptions: {

                ...(
                    analyzerOptions
                        .confidence ??
                    {}
                )

            },

            rankingOptions: {

                ...(
                    analyzerOptions
                        .ranking ??
                    {}
                )

            },

            recommendationOptions: {

                ...(
                    analyzerOptions
                        .recommendation ??
                    {}
                )

            },

            bankroll:
                analyzerOptions.bankroll,

            fraction:
                analyzerOptions.fraction,

            minBet:
                analyzerOptions.minBet,

            maxBet:
                analyzerOptions.maxBet,

            maxBankrollRatio:
                analyzerOptions
                    .maxBankrollRatio,

            analyzerOptions

        };

    }


    invokeAnalyzer(
        context,
        runOptions = {}
    ) {

        if (
            typeof this.analyzer
                .analyzeContext ===
                "function"
        ) {

            return this.analyzer
                .analyzeContext(
                    context,
                    runOptions
                );

        }


        if (
            typeof this.analyzer.run ===
                "function"
        ) {

            return this.analyzer.run(
                context,
                runOptions
            );

        }


        if (
            typeof this.analyzer
                .setContext ===
                "function" &&

            typeof this.analyzer
                .analyze ===
                "function"
        ) {

            this.analyzer.setContext(
                context
            );

            return this.analyzer.analyze(
                runOptions
            );

        }


        throw new TypeError(
            "Analyzer does not provide a supported interface."
        );

    }


    runNextAnalysis(
        runOptions = {}
    ) {

        if (!this.burnConfirmed) {

            return Promise.reject(
                new Error(
                    "Burn indicator must be confirmed before analysis."
                )
            );

        }

        if (
            this.isManualRoundActive
        ) {

            return Promise.reject(
                new Error(
                    "Cannot analyze while a round is being entered."
                )
            );

        }

        if (
            this.analysisPromise
        ) {

            return this.analysisPromise;

        }


        const context =
            this.createAnalysisContext();


        this.analysisState =
            AnalysisState.RUNNING;

        this.analysisError = null;

        this.state =
            GameState.ANALYZING;


        const promise =
            Promise.resolve()
                .then(
                    () =>
                        this.invokeAnalyzer(
                            context,
                            runOptions
                        )
                )
                .then(
                    result => {

                        if (!result) {

                            throw new Error(
                                "Analyzer returned no result."
                            );

                        }

                        this.nextAnalysis =
                            result;

                        this.analysisState =
                            AnalysisState
                                .COMPLETED;

                        this.lastAnalysisAt =
                            Date.now();

                        this.state =
                            GameState.SHOE_ACTIVE;

                        return result;

                    }
                )
                .catch(
                    error => {

                        this.nextAnalysis =
                            null;

                        this.analysisError =
                            error;

                        this.analysisState =
                            AnalysisState.FAILED;

                        this.state =
                            GameState.SHOE_ACTIVE;

                        this.lastError =
                            error;

                        throw error;

                    }
                )
                .finally(
                    () => {

                        this.analysisPromise =
                            null;

                    }
                );


        this.analysisPromise =
            promise;

        return promise;

    }


    analyzeNextRound(
        options = {}
    ) {

        return this.runNextAnalysis(
            options
        );

    }


    async waitForAnalysis() {

        if (
            this.analysisPromise
        ) {

            return this.analysisPromise;

        }

        return this.nextAnalysis;

    }


    get isAnalyzing() {

        return (
            this.analysisState ===
            AnalysisState.RUNNING
        );

    }


    get hasNextAnalysis() {

        return (

            this.analysisState ===
                AnalysisState.COMPLETED &&

            this.nextAnalysis !==
                null

        );

    }


    get analysisSummary() {

        return {

            state:
                this.analysisState,

            running:
                this.isAnalyzing,

            completed:
                this.hasNextAnalysis,

            error:
                this.analysisError
                    ?.message ??
                null,

            generatedAt:
                this.lastAnalysisAt,

            generatedAfterRound:
                this.roundCount,

            remainingCards:
                this.remainingCards,

            observableRemaining:
                this.observableRemainingCards,

            physicalRemaining:
                this.remainingCards,

            unknownBurnedCount:
                this.unknownBurnedCount,

            result:
                this.nextAnalysis

        };

    }


    /* =====================================
       Getter 與 ViewModel
       ===================================== */


    get roundCount() {

        return this.history.count;

    }


    get currentRound() {

        return (
            this.manualRound ??
            this.dealer
                ?.currentRound ??
            null
        );

    }


    get winner() {

        return (
            this.lastResult
                ?.winner ??
            null
        );

    }


    get remainingCards() {

        return (
            this.shoe
                ?.physicalRemaining ??
            0
        );

    }


    get observableRemainingCards() {

        return (
            this.shoe
                ?.observableRemaining ??
            0
        );

    }


    get unknownBurnedCount() {

        return (
            this.shoe
                ?.unknownBurnedCount ??
            0
        );

    }


    get usedCards() {

        return (
            this.shoe
                ?.knownRemovedCount ??
            this.shoe
                ?.used ??
            0
        );

    }


    get remainingRatio() {

        return (
            this.shoe
                ?.physicalRemainingRatio ??
            0
        );

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

            observableRemaining:
                this.observableRemainingCards,

            physicalRemaining:
                this.remainingCards,

            unknownBurnedCount:
                this.unknownBurnedCount,

            knownRemoved:
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

            burn:
                this.burnInfo,

            manual:
                this.manualProgress,

            analysis:
                this.analysisSummary

        };

    }


    validateConsistency() {

        const errors = [];


        if (
            typeof this.roadmapAnalyzer
                .validateConsistency ===
                "function"
        ) {

            const roadmap =
                this.roadmapAnalyzer
                    .validateConsistency();

            errors.push(
                ...(
                    roadmap.errors ??
                    []
                )
            );

        }


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


        if (
            this.burnConfirmed &&
            this.shoe
                .unknownBurnedCount !==
            this.burn.hiddenCount
        ) {

            errors.push(
                "Shoe unknown burn count does not match Burn hidden count."
            );

        }


        if (
            this.shoe &&
            this.shoe
                .physicalRemaining >
            this.shoe
                .observableRemaining
        ) {

            errors.push(
                "Physical remaining exceeds observable remaining."
            );

        }


        return {

            valid:
                errors.length === 0,

            errors

        };

    }


    toViewModel() {

        return {

            state:
                this.state,

            shoeNumber:
                this.shoeNumber,

            waitingBurnIndicator:
                this.isWaitingBurnIndicator,

            burnConfirmed:
                this.burnConfirmed,

            canStartRound:
                this.canStartManualRound,

            burn:
                this.burnInfo,

            manual:
                this.manualProgress,

            lastResult:
                this.lastResult
                    ?.toJSON?.() ??
                this.lastResult ??
                null,

            analysis:
                this.analysisSummary,

            statistics:
                this.statistics,

            roadmap:
                this.roadmapViewModel,

            consistency:
                this.validateConsistency(),

            error:
                this.lastError
                    ?.message ??
                null

        };

    }


    /* =====================================
       JSON
       ===================================== */


    toJSON() {

        return {

            version:
                2,

            options: {

                ...this.options,

                analyzerOptions: {

                    ...this.options
                        .analyzerOptions

                }

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
                    ?.toJSON?.() ??
                null,

            burn:
                this.burn
                    ?.toJSON?.() ??
                null,

            dealer:
                this.dealer
                    ?.toJSON?.() ??
                null,

            history:
                this.history
                    .toJSON(),

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
                                item.card
                                    .toJSON()

                        })
                    )

            },

            analysis: {

                state:
                    this.analysisState,

                result:
                    clonePlainData(
                        this.nextAnalysis
                    ),

                error:
                    this.analysisError
                        ?.message ??
                    null,

                lastAnalysisAt:
                    this.lastAnalysisAt

            }

        };

    }


    static fromJSON(
        data,
        {
            analyzer = null
        } = {}
    ) {

        if (!isObject(data)) {

            throw new Error(
                "Game data is required."
            );

        }

        if (!data.shoe) {

            throw new Error(
                "Game shoe data is required."
            );

        }


        const game =
            Object.create(
                Game.prototype
            );


        game.options = {

            ...DEFAULT_OPTIONS,

            ...(
                data.options ??
                {}
            ),

            analyzerOptions: {

                ...DEFAULT_OPTIONS
                    .analyzerOptions,

                ...(
                    data.options
                        ?.analyzerOptions ??
                    {}
                )

            }

        };


        game.validateOptions();


        game.shoe =
            Shoe.fromJSON(
                data.shoe
            );


        game.burn =
            data.burn

                ? Burn.fromJSON(
                    data.burn,
                    game.shoe
                )

                : new Burn(
                    game.shoe
                );


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
            data.history ??
            []
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


        game.analyzer =
            game.createAnalyzer(
                analyzer
            );


        game.state =
            Object.values(
                GameState
            ).includes(data.state)

                ? data.state

                : (
                    game.burn.isConfirmed

                        ? GameState
                            .SHOE_ACTIVE

                        : GameState
                            .WAITING_BURN_INDICATOR
                );


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


        game.lastError = null;

        game.lastResult =
            game.history.last;


        game.manualRound = null;

        game.manualState =
            ManualRoundState.IDLE;

        game.manualCards = [];

        game.manualResult = null;


        if (
            Array.isArray(
                data.manual
                    ?.cards
            ) &&
            data.manual.cards
                .length > 0
        ) {

            game.manualRound =
                new Round();


            for (
                const item of
                data.manual.cards
            ) {

                game.validateSide(
                    item.side
                );


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

            game.state =
                GameState.ROUND_INPUT;

        }


        const savedAnalysisState =
            data.analysis
                ?.state;


        game.analysisState =

            savedAnalysisState ===
                AnalysisState.COMPLETED

                ? AnalysisState.COMPLETED

                : savedAnalysisState ===
                    AnalysisState.FAILED

                    ? AnalysisState.FAILED

                    : AnalysisState.IDLE;


        game.analysisPromise =
            null;


        game.analysisError =
            data.analysis
                ?.error

                ? new Error(
                    data.analysis.error
                )

                : null;


        game.nextAnalysis =
            data.analysis
                ?.result ??
            null;


        game.lastAnalysisAt =
            Number.isFinite(
                data.analysis
                    ?.lastAnalysisAt
            )
                ? data.analysis
                    .lastAnalysisAt
                : null;


        return game;

    }

}
