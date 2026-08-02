/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Exact Probability Engine v2
 *
 * 根據目前可觀察牌池的 Rank 數量，
 * 完整列舉下一局所有可能發牌結果。
 *
 * 使用「條件機率 × 分支機率」累加，
 * 不修改真實 Shoe。
 *
 * 職責：
 *
 * 1. 精確計算下一局所有主要與側注事件機率
 * 2. 支援同步與非同步分批計算
 * 3. 支援 AbortSignal 與進度回呼
 * 4. 區分可觀察牌池與實體牌靴剩餘數
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
 * Exact 以可觀察牌池計算條件機率；
 * 不會任意虛構未知燒牌的具體牌面。
 */

const RANKS = Object.freeze([

    "A",

    "2",

    "3",

    "4",

    "5",

    "6",

    "7",

    "8",

    "9",

    "10",

    "J",

    "Q",

    "K"

]);


const DEFAULT_OPTIONS =
    Object.freeze({

        /**
         * 非同步模式每批處理多少個
         * P1 / B1 起始分支。
         */
        batchSize:
            8,

        /**
         * 浮點誤差容許值。
         */
        probabilityTolerance:
            1e-9

    });


function isObject(value) {

    return (

        value !== null &&

        typeof value ===
            "object" &&

        !Array.isArray(value)

    );

}


export default class Exact {

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

        this.context = {};

        this.shoe = null;

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };

        this.setContext(
            context
        );

        this.validateOptions();

    }


    /**
     * 更新分析環境
     */
    setContext(context = {}) {

        if (!isObject(context)) {

            throw new TypeError(
                "Exact context must be an object."
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
     * 驗證設定
     */
    validateOptions() {

        if (
            !Number.isInteger(
                this.options.batchSize
            ) ||
            this.options.batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer."
            );

        }

        if (
            !Number.isFinite(
                this.options
                    .probabilityTolerance
            ) ||
            this.options
                .probabilityTolerance <= 0
        ) {

            throw new RangeError(
                "probabilityTolerance must be a positive number."
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
     * 取得未知燒牌張數
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
     * 驗證 Shoe
     */
    validateShoe(
        shoe = this.shoe
    ) {

        if (!shoe) {

            throw new Error(
                "Exact analysis requires a Shoe."
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
         * Exact 必須完整列舉所有可能分支。
         *
         * 一局最多使用六張，因此可觀察牌池與
         * 實體牌靴均至少需要六張。
         */
        if (
            observableRemaining < 6
        ) {

            throw new Error(
                "Exact analysis requires at least 6 observable cards."
            );

        }

        if (
            physicalRemaining < 6
        ) {

            throw new Error(
                "Exact analysis requires at least 6 physical cards."
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
     * Rank 轉百家樂點數
     */
    rankValue(rank) {

        if (rank === "A") {

            return 1;

        }

        if (
            rank === "10" ||
            rank === "J" ||
            rank === "Q" ||
            rank === "K"
        ) {

            return 0;

        }

        const value =
            Number(rank);

        if (
            !Number.isInteger(value) ||
            value < 2 ||
            value > 9
        ) {

            throw new Error(
                `Invalid baccarat rank: ${rank}`
            );

        }

        return value;

    }


    /**
     * 手牌點數
     */
    handScore(rankIndexes) {

        if (!Array.isArray(rankIndexes)) {

            throw new TypeError(
                "rankIndexes must be an array."
            );

        }

        let total = 0;

        for (
            const index of
            rankIndexes
        ) {

            if (
                !Number.isInteger(index) ||
                index < 0 ||
                index >= RANKS.length
            ) {

                throw new RangeError(
                    `Invalid rank index: ${index}`
                );

            }

            total +=
                this.rankValue(
                    RANKS[index]
                );

        }

        return total % 10;

    }


    /**
     * 是否 Natural
     */
    isNatural(rankIndexes) {

        if (
            !Array.isArray(rankIndexes) ||
            rankIndexes.length !== 2
        ) {

            return false;

        }

        const score =
            this.handScore(
                rankIndexes
            );

        return (
            score === 8 ||
            score === 9
        );

    }


    /**
     * Player 是否補牌
     */
    playerMustDraw(playerRanks) {

        if (
            this.isNatural(
                playerRanks
            )
        ) {

            return false;

        }

        return (
            this.handScore(
                playerRanks
            ) <= 5
        );

    }


    /**
     * Banker 是否補牌
     */
    bankerMustDraw(
        bankerRanks,
        playerThirdIndex = null
    ) {

        if (
            this.isNatural(
                bankerRanks
            )
        ) {

            return false;

        }

        const bankerScore =
            this.handScore(
                bankerRanks
            );

        /**
         * Player 沒有第三張牌。
         */
        if (
            playerThirdIndex === null
        ) {

            return bankerScore <= 5;

        }

        if (
            !Number.isInteger(
                playerThirdIndex
            ) ||
            playerThirdIndex < 0 ||
            playerThirdIndex >=
                RANKS.length
        ) {

            throw new RangeError(
                "Invalid player third-card rank index."
            );

        }

        const playerThirdRank =
            RANKS[playerThirdIndex];

        if (bankerScore <= 2) {

            return true;

        }

        if (bankerScore === 3) {

            return (
                playerThirdRank !== "8"
            );

        }

        if (bankerScore === 4) {

            return [

                "2",

                "3",

                "4",

                "5",

                "6",

                "7"

            ].includes(
                playerThirdRank
            );

        }

        if (bankerScore === 5) {

            return [

                "4",

                "5",

                "6",

                "7"

            ].includes(
                playerThirdRank
            );

        }

        if (bankerScore === 6) {

            return (

                playerThirdRank === "6" ||

                playerThirdRank === "7"

            );

        }

        return false;

    }


    /**
     * 統計目前剩餘牌的 Rank 數量
     */
    getRankCounts(
        shoe = this.shoe
    ) {

        this.validateShoe(
            shoe
        );

        const counts =
            new Array(
                RANKS.length
            ).fill(0);

        for (
            const card of
            shoe.cards
        ) {

            const index =
                RANKS.indexOf(
                    card.rank
                );

            if (index === -1) {

                throw new Error(
                    `Unknown card rank: ${card.rank}`
                );

            }

            counts[index]++;

        }

        return counts;

    }


    /**
     * 建立空機率累加器
     */
    createAccumulator() {

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

            totalProbability:
                0,

            terminalBranches:
                0

        };

    }


    /**
     * 遍歷一次可能抽牌
     *
     * counts 會在 callback 執行期間
     * 暫時扣除該張牌，結束後恢復。
     */
    forEachDraw(
        counts,
        remaining,
        callback
    ) {

        if (!Array.isArray(counts)) {

            throw new TypeError(
                "counts must be an array."
            );

        }

        if (
            !Number.isInteger(remaining) ||
            remaining <= 0
        ) {

            throw new Error(
                "No cards remaining in exact branch."
            );

        }

        if (
            typeof callback !==
            "function"
        ) {

            throw new TypeError(
                "callback must be a function."
            );

        }

        for (
            let index = 0;
            index < counts.length;
            index++
        ) {

            const count =
                counts[index];

            if (count <= 0) {

                continue;

            }

            const probability =
                count /
                remaining;

            counts[index]--;

            try {

                callback(
                    index,
                    probability
                );

            }
            finally {

                counts[index]++;

            }

        }

    }


    /**
     * 閒龍寶是否為中獎事件
     *
     * 暫定：
     *
     * - 閒家獲勝
     * - 閒家 Natural，或勝差至少 4
     */
    isPlayerDragonBonus({

        winner,

        playerNatural,

        margin

    }) {

        return (

            winner === "Player" &&

            (
                playerNatural ||

                margin >= 4
            )

        );

    }


    /**
     * 莊龍寶是否為中獎事件
     */
    isBankerDragonBonus({

        winner,

        bankerNatural,

        margin

    }) {

        return (

            winner === "Banker" &&

            (
                bankerNatural ||

                margin >= 4
            )

        );

    }


    /**
     * 記錄一個完成分支
     */
    recordTerminal(
        accumulator,
        playerRanks,
        bankerRanks,
        probability
    ) {

        if (
            !Number.isFinite(probability) ||
            probability < 0
        ) {

            throw new RangeError(
                "Terminal branch probability must be non-negative."
            );

        }

        const playerScore =
            this.handScore(
                playerRanks
            );

        const bankerScore =
            this.handScore(
                bankerRanks
            );

        let winner;

        if (
            playerScore >
            bankerScore
        ) {

            winner =
                "Player";

            accumulator.player +=
                probability;

        }
        else if (
            bankerScore >
            playerScore
        ) {

            winner =
                "Banker";

            accumulator.banker +=
                probability;

        }
        else {

            winner =
                "Tie";

            accumulator.tie +=
                probability;

        }

        const playerPair =

            playerRanks[0] ===
            playerRanks[1];

        const bankerPair =

            bankerRanks[0] ===
            bankerRanks[1];

        const playerNatural =
            this.isNatural(
                playerRanks.slice(
                    0,
                    2
                )
            );

        const bankerNatural =
            this.isNatural(
                bankerRanks.slice(
                    0,
                    2
                )
            );

        const natural =

            playerNatural ||

            bankerNatural;

        const margin =
            Math.abs(
                playerScore -
                bankerScore
            );

        const cardCount =

            playerRanks.length +

            bankerRanks.length;

        if (playerPair) {

            accumulator.playerPair +=
                probability;

        }

        if (bankerPair) {

            accumulator.bankerPair +=
                probability;

        }

        if (
            playerPair ||
            bankerPair
        ) {

            accumulator.eitherPair +=
                probability;

        }

        if (playerNatural) {

            accumulator.playerNatural +=
                probability;

        }

        if (bankerNatural) {

            accumulator.bankerNatural +=
                probability;

        }

        if (natural) {

            accumulator.natural +=
                probability;

        }

        if (
            winner === "Banker" &&
            bankerScore === 6
        ) {

            accumulator.super6 +=
                probability;

        }

        /**
         * Small = 4 張完成。
         * Big = 5 或 6 張完成。
         */
        if (cardCount === 4) {

            accumulator.small +=
                probability;

        }
        else {

            accumulator.big +=
                probability;

        }

        if (
            this.isPlayerDragonBonus({

                winner,

                playerNatural,

                margin

            })
        ) {

            accumulator
                .playerDragonBonus +=
                probability;

        }

        if (
            this.isBankerDragonBonus({

                winner,

                bankerNatural,

                margin

            })
        ) {

            accumulator
                .bankerDragonBonus +=
                probability;

        }

        accumulator.totalProbability +=
            probability;

        accumulator.terminalBranches++;

    }


    /**
     * 初始四張完成後，
     * 列舉所有第三張牌分支。
     */
    enumerateThirdCards({

        counts,

        remaining,

        playerRanks,

        bankerRanks,

        branchProbability,

        accumulator

    }) {

        /**
         * 任一方 Natural，
         * 本局立即完成。
         */
        if (
            this.isNatural(
                playerRanks
            ) ||
            this.isNatural(
                bankerRanks
            )
        ) {

            this.recordTerminal(

                accumulator,

                playerRanks,

                bankerRanks,

                branchProbability

            );

            return;

        }

        /**
         * Player 補牌。
         */
        if (
            this.playerMustDraw(
                playerRanks
            )
        ) {

            this.forEachDraw(

                counts,

                remaining,

                (
                    playerThirdIndex,
                    playerThirdProbability
                ) => {

                    const nextPlayerRanks = [

                        ...playerRanks,

                        playerThirdIndex

                    ];

                    const nextProbability =

                        branchProbability *

                        playerThirdProbability;

                    const nextRemaining =
                        remaining - 1;

                    /**
                     * Banker 依 Player 第三張
                     * 決定是否補牌。
                     */
                    if (
                        this.bankerMustDraw(

                            bankerRanks,

                            playerThirdIndex

                        )
                    ) {

                        this.forEachDraw(

                            counts,

                            nextRemaining,

                            (
                                bankerThirdIndex,
                                bankerThirdProbability
                            ) => {

                                this.recordTerminal(

                                    accumulator,

                                    nextPlayerRanks,

                                    [

                                        ...bankerRanks,

                                        bankerThirdIndex

                                    ],

                                    nextProbability *

                                    bankerThirdProbability

                                );

                            }

                        );

                    }
                    else {

                        this.recordTerminal(

                            accumulator,

                            nextPlayerRanks,

                            bankerRanks,

                            nextProbability

                        );

                    }

                }

            );

            return;

        }

        /**
         * Player 停牌後，
         * Banker 依自身點數補牌。
         */
        if (
            this.bankerMustDraw(

                bankerRanks,

                null

            )
        ) {

            this.forEachDraw(

                counts,

                remaining,

                (
                    bankerThirdIndex,
                    bankerThirdProbability
                ) => {

                    this.recordTerminal(

                        accumulator,

                        playerRanks,

                        [

                            ...bankerRanks,

                            bankerThirdIndex

                        ],

                        branchProbability *

                        bankerThirdProbability

                    );

                }

            );

            return;

        }

        /**
         * 雙方都不補牌。
         */
        this.recordTerminal(

            accumulator,

            playerRanks,

            bankerRanks,

            branchProbability

        );

    }


    /**
     * 處理已固定 P1、B1 的分支。
     */
    enumeratePrefix({

        baseCounts,

        totalCards,

        playerFirstIndex,

        bankerFirstIndex,

        prefixProbability,

        accumulator

    }) {

        const counts = [

            ...baseCounts

        ];

        counts[playerFirstIndex]--;

        counts[bankerFirstIndex]--;

        if (
            counts[playerFirstIndex] < 0 ||
            counts[bankerFirstIndex] < 0
        ) {

            throw new Error(
                "Invalid exact prefix card counts."
            );

        }

        const remainingAfterPrefix =
            totalCards - 2;

        /**
         * Player 第二張。
         */
        this.forEachDraw(

            counts,

            remainingAfterPrefix,

            (
                playerSecondIndex,
                playerSecondProbability
            ) => {

                const remainingAfterPlayer =
                    remainingAfterPrefix - 1;

                /**
                 * Banker 第二張。
                 */
                this.forEachDraw(

                    counts,

                    remainingAfterPlayer,

                    (
                        bankerSecondIndex,
                        bankerSecondProbability
                    ) => {

                        const probability =

                            prefixProbability *

                            playerSecondProbability *

                            bankerSecondProbability;

                        this.enumerateThirdCards({

                            counts,

                            remaining:
                                remainingAfterPlayer -
                                1,

                            playerRanks: [

                                playerFirstIndex,

                                playerSecondIndex

                            ],

                            bankerRanks: [

                                bankerFirstIndex,

                                bankerSecondIndex

                            ],

                            branchProbability:
                                probability,

                            accumulator

                        });

                    }

                );

            }

        );

    }


    /**
     * 建立所有 P1 / B1 起始分支
     */
    createPrefixes(
        counts,
        totalCards
    ) {

        if (!Array.isArray(counts)) {

            throw new TypeError(
                "counts must be an array."
            );

        }

        if (
            !Number.isInteger(totalCards) ||
            totalCards < 2
        ) {

            throw new RangeError(
                "totalCards must be at least 2."
            );

        }

        const prefixes = [];

        for (
            let playerIndex = 0;
            playerIndex < counts.length;
            playerIndex++
        ) {

            if (
                counts[playerIndex] <= 0
            ) {

                continue;

            }

            const playerProbability =

                counts[playerIndex] /

                totalCards;

            counts[playerIndex]--;

            try {

                for (
                    let bankerIndex = 0;
                    bankerIndex < counts.length;
                    bankerIndex++
                ) {

                    if (
                        counts[bankerIndex] <= 0
                    ) {

                        continue;

                    }

                    const bankerProbability =

                        counts[bankerIndex] /

                        (
                            totalCards - 1
                        );

                    prefixes.push({

                        playerFirstIndex:
                            playerIndex,

                        bankerFirstIndex:
                            bankerIndex,

                        probability:

                            playerProbability *

                            bankerProbability

                    });

                }

            }
            finally {

                counts[playerIndex]++;

            }

        }

        return prefixes;

    }


    /**
     * 正規化事件機率
     */
    normalizeProbability(
        probability,
        totalProbability
    ) {

        if (
            !Number.isFinite(
                totalProbability
            ) ||
            totalProbability <= 0
        ) {

            throw new Error(
                "Exact analysis produced no terminal probability."
            );

        }

        const normalized = {};

        for (
            const [
                name,
                value
            ] of Object.entries(
                probability
            )
        ) {

            normalized[name] =
                value /
                totalProbability;

        }

        return normalized;

    }


    /**
     * 建立最終輸出
     */
    finalize({

        accumulator,

        startedAt,

        completedAt

    }) {

        const {

            totalProbability,

            terminalBranches,

            ...rawProbability

        } = accumulator;

        const probability =
            this.normalizeProbability(

                rawProbability,

                totalProbability

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

        const probabilityError =
            Math.abs(
                1 -
                totalProbability
            );

        return {

            method:
                "exact",

            probability,

            /**
             * 原始、尚未正規化的機率總和。
             */
            totalProbability,

            probabilityError,

            withinTolerance:

                probabilityError <=

                this.options
                    .probabilityTolerance,

            terminalBranches,

            durationMs:

                completedAt -
                startedAt,

            /**
             * 舊版相容：
             * 顯示實體牌靴剩餘數。
             */
            remainingCards:
                physicalRemaining,

            /**
             * 機率引擎使用的可觀察牌池張數。
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
     * 同步精確計算
     *
     * 建議：
     *
     * - 測試
     * - Web Worker
     * - 桌面瀏覽器
     *
     * 手機主執行緒可能暫時停止回應。
     */
    calculateSync() {

        this.validateShoe();

        const counts =
            this.getRankCounts();

        const totalCards =
            this.getObservableRemaining(
                this.shoe
            );

        const prefixes =
            this.createPrefixes(

                [
                    ...counts
                ],

                totalCards

            );

        const accumulator =
            this.createAccumulator();

        const startedAt =
            Date.now();

        for (
            const prefix of
            prefixes
        ) {

            this.enumeratePrefix({

                baseCounts:
                    counts,

                totalCards,

                playerFirstIndex:
                    prefix
                        .playerFirstIndex,

                bankerFirstIndex:
                    prefix
                        .bankerFirstIndex,

                prefixProbability:
                    prefix.probability,

                accumulator

            });

        }

        const completedAt =
            Date.now();

        return this.finalize({

            accumulator,

            startedAt,

            completedAt

        });

    }


    /**
     * 非同步分批精確計算
     *
     * 適合手機主執行緒。
     */
    async calculate({

        batchSize =
            this.options.batchSize,

        signal =
            null,

        onProgress =
            null

    } = {}) {

        this.validateShoe();

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

        const counts =
            this.getRankCounts();

        const totalCards =
            this.getObservableRemaining(
                this.shoe
            );

        const prefixes =
            this.createPrefixes(

                [
                    ...counts
                ],

                totalCards

            );

        const accumulator =
            this.createAccumulator();

        const startedAt =
            Date.now();

        let completed = 0;

        while (
            completed <
            prefixes.length
        ) {

            if (
                signal?.aborted
            ) {

                const error =
                    new Error(
                        "Exact analysis aborted."
                    );

                error.name =
                    "AbortError";

                throw error;

            }

            const end =
                Math.min(

                    completed +
                    batchSize,

                    prefixes.length

                );

            for (
                let index =
                    completed;

                index < end;

                index++
            ) {

                const prefix =
                    prefixes[index];

                this.enumeratePrefix({

                    baseCounts:
                        counts,

                    totalCards,

                    playerFirstIndex:
                        prefix
                            .playerFirstIndex,

                    bankerFirstIndex:
                        prefix
                            .bankerFirstIndex,

                    prefixProbability:
                        prefix.probability,

                    accumulator

                });

            }

            completed =
                end;

            if (onProgress) {

                onProgress({

                    completed,

                    total:
                        prefixes.length,

                    ratio:

                        completed /

                        prefixes.length,

                    percent:

                        (
                            completed /

                            prefixes.length
                        ) * 100,

                    accumulatedProbability:

                        accumulator
                            .totalProbability,

                    terminalBranches:

                        accumulator
                            .terminalBranches

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

            accumulator,

            startedAt,

            completedAt

        });

    }


    /**
     * 更新設定
     */
    setOptions(options = {}) {

        if (!isObject(options)) {

            throw new TypeError(
                "Exact options must be an object."
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
     * 複製 Exact Engine
     */
    clone() {

        return new Exact(

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

            batchSize:
                this.options
                    .batchSize,

            probabilityTolerance:
                this.options
                    .probabilityTolerance,

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

            batchSize:
                this.options
                    .batchSize,

            probabilityTolerance:
                this.options
                    .probabilityTolerance

        };

    }

}
