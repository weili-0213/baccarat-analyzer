/**
 * Baccarat Analyzer
 * -----------------------------------------
 * Exact Probability Engine
 *
 * 根據目前剩餘牌靴的 Rank 數量，
 * 完整列舉下一局所有可能發牌結果。
 *
 * 使用「條件機率 × 分支機率」累加，
 * 不修改真實 Shoe。
 *
 * 職責：
 * - 精確計算下一局事件機率
 *
 * 不負責：
 * - EV
 * - Kelly
 * - Risk
 * - Confidence
 * - Ranking
 * - Recommendation
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

const DEFAULT_OPTIONS = Object.freeze({

    /**
     * 非同步模式每批處理多少個
     * P1/B1 起始分支。
     */
    batchSize: 8

});


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

        if (
            !Number.isInteger(
                this.options.batchSize
            ) ||
            this.options.batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer"
            );

        }

    }

    /**
     * 驗證 Shoe
     */
    validateShoe(shoe = this.shoe) {

        if (!shoe) {

            throw new Error(
                "Exact analysis requires a Shoe"
            );

        }

        if (!Array.isArray(shoe.cards)) {

            throw new TypeError(
                "Shoe cards must be an array"
            );

        }

        /**
         * 一局最多使用六張牌。
         *
         * 為了保證每個可能分支都能完成，
         * Exact 至少要求六張剩餘牌。
         */
        if (shoe.cards.length < 6) {

            throw new Error(
                "Exact analysis requires at least 6 remaining cards"
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

        return Number(rank);

    }

    /**
     * 手牌點數
     */
    handScore(rankIndexes) {

        let total = 0;

        for (
            const index of
            rankIndexes
        ) {

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

        if (rankIndexes.length !== 2) {

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

        this.validateShoe(shoe);

        const counts =
            new Array(
                RANKS.length
            ).fill(0);

        for (const card of shoe.cards) {

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

            bankerDragonBonus: 0,

            totalProbability: 0,

            terminalBranches: 0

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

        if (remaining <= 0) {

            throw new Error(
                "No cards remaining in exact branch"
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
                count / remaining;

            counts[index]--;

            callback(
                index,
                probability
            );

            counts[index]++;

        }

    }

    /**
     * 閒龍寶是否為中獎事件
     *
     * 暫定：
     * - 閒家獲勝
     * - 閒家 Natural，或勝差至少 4
     *
     * 分級賠率之後交給 sidebets.js。
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

            winner = "Player";

            accumulator.player +=
                probability;

        }
        else if (
            bankerScore >
            playerScore
        ) {

            winner = "Banker";

            accumulator.banker +=
                probability;

        }
        else {

            winner = "Tie";

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
                playerRanks.slice(0, 2)
            );

        const bankerNatural =
            this.isNatural(
                bankerRanks.slice(0, 2)
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
                     * Banker 依 Player
                     * 第三張牌決定是否補牌。
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
     * 建立所有 P1/B1 起始分支
     */
    createPrefixes(
        counts,
        totalCards
    ) {

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

                    (totalCards - 1);

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

            counts[playerIndex]++;

        }

        return prefixes;

    }

    /**
     * 建立最終輸出
     */
    finalize({

        accumulator,

        startedAt,

        completedAt,

        remainingCards

    }) {

        const {
            totalProbability,
            terminalBranches,
            ...probability
        } = accumulator;

        return {

            method: "exact",

            probability,

            totalProbability,

            probabilityError:

                Math.abs(
                    1 -
                    totalProbability
                ),

            terminalBranches,

            durationMs:

                completedAt -
                startedAt,

            remainingCards,

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
            this.shoe.cards.length;

        const prefixes =
            this.createPrefixes(

                [...counts],

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

            completedAt,

            remainingCards:
                totalCards

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

        signal = null,

        onProgress = null

    } = {}) {

        this.validateShoe();

        if (
            !Number.isInteger(
                batchSize
            ) ||
            batchSize <= 0
        ) {

            throw new RangeError(
                "batchSize must be a positive integer"
            );

        }

        if (
            onProgress !== null &&
            typeof onProgress !==
            "function"
        ) {

            throw new TypeError(
                "onProgress must be a function or null"
            );

        }

        const counts =
            this.getRankCounts();

        const totalCards =
            this.shoe.cards.length;

        const prefixes =
            this.createPrefixes(

                [...counts],

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

            if (signal?.aborted) {

                const error =
                    new Error(
                        "Exact analysis aborted"
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
                let index = completed;
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

            completed = end;

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
                            .totalProbability

                });

            }

            /**
             * 讓瀏覽器更新畫面。
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

            completedAt,

            remainingCards:
                totalCards

        });

    }

    /**
     * 更新設定
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
     * 輸出設定
     */
    toJSON() {

        return {

            batchSize:
                this.options.batchSize

        };

    }

}
