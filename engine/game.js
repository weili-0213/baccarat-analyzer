/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game v4
 *
 * 百家樂遊戲主控制器
 *
 * 正式操作流程：
 *
 * 1. 建立新牌靴
 * 2. 等待手動輸入燒牌指示牌
 * 3. 記錄未知燒牌張數
 * 4. 手動輸入荷官已發出的牌
 * 5. 完成本局
 * 6. 更新 History
 * 7. 更新 Roadmap
 * 8. 分析下一局概率、EV 與下注建議
 *
 * 注意：
 *
 * - 不自動判斷停牌卡
 * - 不自動更換牌靴
 * - 不自動替荷官發牌
 * - 未知燒牌只記錄張數，不虛構牌面
 */

import Shoe
    from "./shoe.js";

import Burn, {
    BurnState
} from "./burn.js";

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


/**
 * 遊戲整體狀態
 */
export const GameState =
    Object.freeze({

        /**
         * 尚未建立牌靴。
         */
        READY:
            "READY",

        /**
         * 新牌靴已建立，
         * 等待輸入燒牌指示牌。
         */
        WAITING_BURN_INDICATOR:
            "WAITING_BURN_INDICATOR",

        /**
         * 燒牌程序已確認，
         * 可以開始輸入牌局。
         */
        SHOE_ACTIVE:
            "SHOE_ACTIVE",

        /**
         * 正在輸入荷官已發出的牌。
         */
        ROUND_INPUT:
            "ROUND_INPUT",

        /**
         * 本局已完成，
         * 正在分析下一局。
         */
        ANALYZING:
            "ANALYZING",

        /**
         * 發生無法繼續使用的狀態。
         *
         * 一般情況不會自動進入，
         * 停牌卡仍由使用者手動開始新牌靴。
         */
        SHOE_FINISHED:
            "SHOE_FINISHED"

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
 * 下一局分析狀態
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

        deckCount: 8,

        /**
         * 新牌靴建立後是否洗牌。
         *
         * 正式使用建議為 true。
         */
        autoShuffle: true,

        /**
         * 是否在完成一局後自動分析下一局。
         */
        autoAnalyze: true,

        /**
         * 若分析失敗，
         * 是否仍保留已完成的牌局。
         */
        preserveRoundOnAnalysisError: true,

        beadRows: 6,

        bigRoadRows: 6,

        derivedRows: 6,

        /**
         * 實體安全限制。
         *
         * 不用來判斷停牌卡，
         * 只防止牌靴真的沒有牌時仍輸入。
         */
        minimumPhysicalCards: 1,

        /**
         * 傳給 Analyzer 的額外設定。
         */
        analyzerOptions: {}

    });


/**
 * 判斷一般物件
 */
function isObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


/**
 * 深度複製可序列化資料
 */
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

            // 繼續使用 JSON 備援。
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
                options.analyzer
            );


        /**
         * 遊戲狀態
         */
        this.state =
            GameState.READY;

        this.shoeNumber = 0;

        this.startedAt = null;

        this.lastRoundAt = null;

        this.lastResult = null;


        /**
         * 手動牌局
         */
        this.manualRound = null;

        this.manualState =
            ManualRoundState.IDLE;

        this.manualCards = [];

        this.manualResult = null;


        /**
         * 下一局分析
         */
        this.analysisState =
            AnalysisState.IDLE;

        this.nextAnalysis = null;

        this.analysisError = null;

        this.analysisPromise = null;

        this.lastAnalysisAt = null;


        /**
         * 建立第一個牌靴。
         */
        this.startNewShoe();

    }


    /* =====================================
       建立與驗證
       ===================================== */


    /**
     * 驗證 Game 設定
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
                this.options
                    .minimumPhysicalCards
            ) ||
            this.options
                .minimumPhysicalCards < 1
        ) {

            throw new RangeError(
                "minimumPhysicalCards must be a positive integer."
            );

        }


        const rowFields = [

            "beadRows",

            "bigRoadRows",

            "derivedRows"

        ];


        for (
            const field of
            rowFields
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

    }


    /**
     * 建立 Roadmap Analyzer
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
     * 建立 Analyzer
     *
     * 可由外部傳入 Analyzer 實例，
     * 方便測試或替換分析策略。
     */
    createAnalyzer(customAnalyzer) {

        if (customAnalyzer) {

            return customAnalyzer;

        }


        try {

            return new Analyzer(
                this.options
                    .analyzerOptions
            );

        }
        catch {

            /**
             * 若目前 Analyzer 採用純函式形式，
             * 或 constructor 不接受 options，
             * 嘗試不帶參數建立。
             */
            try {

                return new Analyzer();

            }
            catch {

                /**
                 * 若 import 本身就是可呼叫分析函式，
                 * 保留原值供 invokeAnalyzer() 處理。
                 */
                return Analyzer;

            }

        }

    }


    /* =====================================
       新牌靴與燒牌
       ===================================== */


    /**
     * 建立新牌靴
     *
     * 注意：
     *
     * - 不會自動抽燒牌指示牌
     * - 不會自動產生隱藏燒牌
     * - 建立後必須先呼叫 confirmBurnIndicator()
     */
    startNewShoe({

        clearHistory = true,

        shuffle =
            this.options.autoShuffle

    } = {}) {

        /**
         * 若有尚未完成的牌局，
         * 新牌靴會直接放棄該局。
         *
         * 不需要把牌放回舊牌靴，
         * 因為整個牌靴即將被替換。
         */
        this.resetManualRound();


        const shoe =
            new Shoe(
                this.options.deckCount
            );


        /**
         * 相容 constructor 未自動 create()
         * 的 Shoe 實作。
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


        this.clearAnalysis();

        this.lastResult = null;

        this.lastRoundAt = null;

        this.shoeNumber++;

        this.startedAt =
            Date.now();

        this.state =
            GameState
                .WAITING_BURN_INDICATOR;

        return this;

    }


    /**
     * newShoe() 別名
     */
    newShoe(options = {}) {

        return this.startNewShoe(
            options
        );

    }


    /**
     * 是否等待輸入燒牌指示牌
     */
    get isWaitingBurnIndicator() {

        return (

            this.state ===
                GameState
                    .WAITING_BURN_INDICATOR &&

            this.burn !== null &&

            !this.burn.isConfirmed

        );

    }


    /**
     * 確認燒牌指示牌
     */
    confirmBurnIndicator(input) {

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


        /**
         * 燒牌完成後即可先分析第一局。
         *
         * 不阻塞 confirmBurnIndicator()；
         * UI 可透過 waitForAnalysis() 等待完成。
         */
        if (
            this.options.autoAnalyze
        ) {

            this.runNextAnalysis();

        }


        return info;

    }


    /**
     * 燒牌資訊
     */
    get burnInfo() {

        if (!this.burn) {

            return null;

        }

        return this.burn.info;

    }


    /**
     * 是否已完成燒牌程序
     */
    get burnConfirmed() {

        return Boolean(
            this.burn?.isConfirmed
        );

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
     * 是否正在輸入牌局
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
     * 是否可開始新局
     */
    get canStartManualRound() {

        return (

            this.burnConfirmed &&

            this.shoe !== null &&

            this.shoe.physicalRemaining >=
                this.options
                    .minimumPhysicalCards &&

            !this.isManualRoundActive &&

            this.state !==
                GameState.SHOE_FINISHED

        );

    }


    /**
     * 開始輸入一局
     */
    startManualRound() {

        if (!this.burnConfirmed) {

            throw new Error(
                "Burn indicator must be confirmed before starting a round."
            );

        }


        if (!this.canStartManualRound) {

            if (this.isManualRoundActive) {

                throw new Error(
                    "A manual round is already active."
                );

            }

            throw new Error(
                "A new manual round cannot be started."
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


    /**
     * 驗證 Player / Banker
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
     * 取得下一張應輸入哪一方
     */
    get nextManualSide() {

        if (!this.manualRound) {

            return null;

        }


        const total =
            this.manualCards.length;


        /**
         * 初始四張固定順序：
         *
         * Player 1
         * Banker 1
         * Player 2
         * Banker 2
         */
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


    /**
     * 下一張輸入提示
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
     * 從 Shoe 解析實際存在的牌
     */
    resolveManualCard(input) {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }


        if (
            typeof this.shoe.resolveCard ===
                "function"
        ) {

            return this.shoe.resolveCard(
                input
            );

        }


        if (input instanceof Card) {

            return input;

        }


        throw new Error(
            "Shoe does not support manual card resolution."
        );

    }


    /**
     * 新增荷官已發出的牌
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


        const expectedSide =
            this.nextManualSide;


        if (!expectedSide) {

            throw new Error(
                "No more cards are required for this round."
            );

        }


        if (
            side !== expectedSide
        ) {

            throw new Error(
                `Expected ${expectedSide}, received ${side}.`
            );

        }


        const card =
            this.resolveManualCard(
                input
            );


        /**
         * 先讓 Round 接受牌。
         *
         * 若 Round.deal() 驗證失敗，
         * Shoe 不會被修改。
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

            /**
             * Shoe 移除失敗時，
             * 撤回剛才加入 Hand 的牌。
             */
            const hand =

                side === HandSide.PLAYER

                    ? this.manualRound.player

                    : this.manualRound.banker;


            if (
                typeof hand.remove ===
                    "function"
            ) {

                hand.remove(
                    card
                );

            }

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


    /**
     * 根據牌局規則更新輸入狀態
     *
     * 規則只用於：
     *
     * - 提示下一張應輸入哪一方
     * - 判斷是否可以完成本局
     *
     * 系統不會自動抽牌。
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
         * Natural 直接完成。
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
         * Player 是否需要第三張。
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
         * Banker 是否需要第三張。
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
     * 是否可以確認本局
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
     * 完成本局
     *
     * 預設會：
     *
     * 1. 建立 RoundResult
     * 2. 加入 History
     * 3. 更新 Roadmap
     * 4. 分析下一局
     *
     * 此方法為 async，
     * 因為 Exact / Monte Carlo 可能是非同步運算。
     */
    async finishManualRound({

        analyze =
            this.options.autoAnalyze

    } = {}) {

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


        /**
         * 本局已完成，
         * 牌靴重新進入可開始下一局狀態。
         */
        this.state =
            GameState.SHOE_ACTIVE;


        if (analyze) {

            try {

                await this.runNextAnalysis();

            }
            catch (error) {

                /**
                 * 已完成的本局預設仍保留。
                 */
                if (
                    !this.options
                        .preserveRoundOnAnalysisError
                ) {

                    throw error;

                }

            }

        }


        return result;

    }


    /**
     * 撤銷最後輸入的一張牌
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
            this.manualCards.pop() ??
            null;


        if (!removed) {

            return null;

        }


        if (
            typeof this.shoe.restore !==
                "function"
        ) {

            throw new Error(
                "Shoe does not support card restoration."
            );

        }


        this.shoe.restore(
            removed.card
        );


        this.rebuildManualRound();

        return removed;

    }


    /**
     * 依目前輸入紀錄重建 Round
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
     * 取消目前牌局
     *
     * 已輸入的公開牌會放回可知牌池。
     */
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
                    ?.getCards?.() ??
                [],

            bankerCards:
                this.manualRound
                    ?.banker
                    ?.getCards?.() ??
                [],

            playerScore:
                this.manualRound
                    ?.playerScore ??
                this.manualRound
                    ?.player
                    ?.value ??
                null,

            bankerScore:
                this.manualRound
                    ?.bankerScore ??
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


    /**
     * 記錄已完成牌局
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
     * 清除本鞋歷史與路單
     *
     * 不會重建 Shoe。
     */
    clearHistory() {

        this.history.clear();

        this.roadmapAnalyzer.clear();

        this.lastResult = null;

        this.lastRoundAt = null;

        this.clearAnalysis();

        return this;

    }


    /**
     * 依 History 重建路單
     */
    rebuildRoadmaps() {

        this.roadmapAnalyzer.build(
            this.history
        );

        return this.roadmapAnalyzer;

    }


    /* =====================================
       下一局分析
       ===================================== */


    /**
     * 清除分析狀態
     */
    clearAnalysis() {

        this.analysisState =
            AnalysisState.IDLE;

        this.nextAnalysis = null;

        this.analysisError = null;

        this.analysisPromise = null;

        this.lastAnalysisAt = null;

        return this;

    }


    /**
     * 建立 Analyzer 輸入資料
     *
     * 未知燒牌不會被當成已知牌面移除。
     */
    createAnalysisContext() {

        if (!this.shoe) {

            throw new Error(
                "Shoe not found."
            );

        }


        return {

            /**
             * Analyzer 可直接使用 Shoe。
             */
            shoe:
                this.shoe,

            /**
             * 可知牌面池副本。
             */
            cards:
                this.shoe.peek(),

            observableCards:
                this.shoe.peek(),

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

            history:
                this.history,

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

            analyzerOptions: {

                ...this.options
                    .analyzerOptions

            }

        };

    }


    /**
     * 呼叫 Analyzer
     *
     * 支援常見介面：
     *
     * analyzer.analyze(context)
     * analyzer.run(context)
     * analyzer(context)
     */
    invokeAnalyzer(context) {

        if (!this.analyzer) {

            throw new Error(
                "Analyzer not found."
            );

        }


        if (
            typeof this.analyzer
                .analyze ===
                "function"
        ) {

            return this.analyzer
                .analyze(
                    context
                );

        }


        if (
            typeof this.analyzer.run ===
                "function"
        ) {

            return this.analyzer.run(
                context
            );

        }


        if (
            typeof this.analyzer ===
                "function"
        ) {

            return this.analyzer(
                context
            );

        }


        throw new TypeError(
            "Analyzer must provide analyze(), run(), or be callable."
        );

    }


    /**
     * 執行下一局分析
     */
    runNextAnalysis() {

        if (!this.burnConfirmed) {

            return Promise.reject(
                new Error(
                    "Burn indicator must be confirmed before analysis."
                )
            );

        }


        if (this.isManualRoundActive) {

            return Promise.reject(
                new Error(
                    "Cannot analyze the next round while a round is being entered."
                )
            );

        }


        const context =
            this.createAnalysisContext();


        this.analysisState =
            AnalysisState.RUNNING;

        this.analysisError = null;

        this.state =
            GameState.ANALYZING;


        const analysisPromise =
            Promise.resolve()
                .then(
                    () =>
                        this.invokeAnalyzer(
                            context
                        )
                )
                .then(
                    result => {

                        this.nextAnalysis =
                            result;

                        this.analysisState =
                            AnalysisState
                                .COMPLETED;

                        this.lastAnalysisAt =
                            Date.now();

                        this.state =
                            GameState
                                .SHOE_ACTIVE;

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
                            GameState
                                .SHOE_ACTIVE;

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
            analysisPromise;

        return analysisPromise;

    }


    /**
     * analyzeNextRound() 語意別名
     */
    analyzeNextRound() {

        return this.runNextAnalysis();

    }


    /**
     * 等待目前分析完成
     */
    async waitForAnalysis() {

        if (this.analysisPromise) {

            return this.analysisPromise;

        }

        return this.nextAnalysis;

    }


    /**
     * 是否正在分析
     */
    get isAnalyzing() {

        return (
            this.analysisState ===
            AnalysisState.RUNNING
        );

    }


    /**
     * 是否已有下一局分析
     */
    get hasNextAnalysis() {

        return (
            this.analysisState ===
                AnalysisState.COMPLETED &&

            this.nextAnalysis !==
                null
        );

    }


    /**
     * 分析摘要
     */
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

            physicalRemaining:
                this.shoe
                    ?.physicalRemaining ??
                0,

            observableRemaining:
                this.shoe
                    ?.observableRemaining ??
                0,

            unknownBurnedCount:
                this.shoe
                    ?.unknownBurnedCount ??
                0,

            result:
                this.nextAnalysis

        };

    }


    /* =====================================
       模擬功能
       ===================================== */


    /**
     * 自動模擬一局。
     *
     * 不作為正式 Dashboard 主流程。
     */
    simulateRound() {

        if (!this.burnConfirmed) {

            throw new Error(
                "Burn indicator must be confirmed before simulation."
            );

        }


        if (this.isManualRoundActive) {

            throw new Error(
                "Cannot simulate while a manual round is active."
            );

        }


        const result =
            this.dealer.play();


        return this.recordResult(
            result
        );

    }


    /**
     * 自動模擬多局。
     */
    simulateMany(count = 1) {

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

            if (
                this.shoe.physicalRemaining <
                this.options
                    .minimumPhysicalCards
            ) {

                break;

            }

            results.push(
                this.simulateRound()
            );

        }


        return results;

    }


    /**
     * 舊版相容。
     *
     * 正式 UI 不應使用 play()。
     */
    play() {

        return this.simulateRound();

    }


    /**
     * 舊版相容。
     */
    playRound() {

        return this.simulateRound();

    }


    /**
     * 舊版相容。
     */
    playMany(count = 1) {

        return this.simulateMany(
            count
        );

    }


    /* =====================================
       Shoe 替換
       ===================================== */


    /**
     * 替換 Shoe
     *
     * 主要供測試與 JSON 還原使用。
     */
    setShoe(
        shoe,
        {
            clearHistory = true,

            burn = null

        } = {}
    ) {

        if (!shoe) {

            throw new Error(
                "Shoe is required."
            );

        }


        if (
            typeof shoe.remove !==
                "function"
        ) {

            throw new TypeError(
                "Invalid shoe."
            );

        }


        this.resetManualRound();

        this.shoe =
            shoe;

        this.burn =
            burn ??
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


        this.clearAnalysis();

        this.lastResult = null;

        this.startedAt =
            Date.now();


        this.state =
            this.burn.isConfirmed

                ? GameState.SHOE_ACTIVE

                : GameState
                    .WAITING_BURN_INDICATOR;


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

        return (
            this.manualRound ??
            this.dealer
                ?.currentRound ??
            null
        );

    }


    /**
     * 可知牌池剩餘數
     */
    get observableRemainingCards() {

        return (
            this.shoe
                ?.observableRemaining ??
            0
        );

    }


    /**
     * 實體牌靴剩餘數
     *
     * UI 的「剩餘牌數」應優先顯示這個值。
     */
    get remainingCards() {

        return (
            this.shoe
                ?.physicalRemaining ??
            0
        );

    }


    /**
     * 未知燒牌張數
     */
    get unknownBurnedCount() {

        return (
            this.shoe
                ?.unknownBurnedCount ??
            0
        );

    }


    /**
     * 已知已輸入／移除牌數
     */
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


    get finished() {

        return (
            this.state ===
            GameState.SHOE_FINISHED
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


    /**
     * 一致性檢查
     */
    validateConsistency() {

        const errors = [];


        const roadmapConsistency =
            this.roadmapAnalyzer
                .validateConsistency();


        errors.push(
            ...roadmapConsistency.errors
        );


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
                "Physical remaining cards exceed observable cards."
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

            shoeNumber:
                this.shoeNumber,

            waitingBurnIndicator:
                this.isWaitingBurnIndicator,

            burnConfirmed:
                this.burnConfirmed,

            canStartRound:
                this.canStartManualRound,

            statistics:
                this.statistics,

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

            roadmap:
                this.roadmapViewModel,

            consistency:
                this.validateConsistency()

        };

    }


    /* =====================================
       JSON
       ===================================== */


    /**
     * JSON 匯出
     */
    toJSON() {

        return {

            version: 4,

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


    /**
     * JSON 還原
     */
    static fromJSON(
        data,
        {
            analyzer = null
        } = {}
    ) {

        if (
            !isObject(data)
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


        game.lastResult =
            game.history.last;


        /**
         * 還原手動牌局。
         */
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


            if (
                game.isManualRoundActive
            ) {

                game.state =
                    GameState.ROUND_INPUT;

            }

        }


        /**
         * 還原分析結果。
         *
         * RUNNING 不會跨頁面持續，
         * 因此還原成 IDLE。
         */
        const savedAnalysisState =
            data.analysis?.state;


        game.analysisState =

            savedAnalysisState ===
                AnalysisState.COMPLETED

                ? AnalysisState.COMPLETED

                : savedAnalysisState ===
                    AnalysisState.FAILED

                    ? AnalysisState.FAILED

                    : AnalysisState.IDLE;


        game.nextAnalysis =
            data.analysis?.result ??
            null;


        game.analysisError =
            data.analysis?.error

                ? new Error(
                    data.analysis.error
                )

                : null;


        game.analysisPromise =
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
