/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Roadmap Analyzer
 *
 * 路單統一分析中心
 *
 * 負責串接：
 *
 * 1. Bead Road
 * 2. Big Road
 * 3. Big Eye Road
 * 4. Small Road
 * 5. Cockroach Road
 */

import BeadRoad
    from "./beadRoad.js";

import BigRoad
    from "./bigRoad.js";

import BigEyeRoad
    from "./bigEyeRoad.js";

import SmallRoad
    from "./smallRoad.js";

import CockroachRoad
    from "./cockroachRoad.js";


export const RoadmapType =
    Object.freeze({

        BEAD: "beadRoad",

        BIG: "bigRoad",

        BIG_EYE: "bigEyeRoad",

        SMALL: "smallRoad",

        COCKROACH: "cockroachRoad"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        beadRows: 6,

        bigRoadRows: 6,

        derivedRows: 6

    });


export default class RoadmapAnalyzer {

    constructor(options = {}) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };

        this.validateOptions();

        this.createRoads();

        this.resetMetadata();

    }


    /**
     * 驗證設定
     */
    validateOptions() {

        const fields = [

            "beadRows",

            "bigRoadRows",

            "derivedRows"

        ];

        for (const field of fields) {

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

    }


    /**
     * 建立所有 Road 實例
     */
    createRoads() {

        this.beadRoad =
            new BeadRoad({

                rows:
                    this.options.beadRows

            });

        this.bigRoad =
            new BigRoad({

                rows:
                    this.options.bigRoadRows

            });

        this.bigEyeRoad =
            new BigEyeRoad({

                rows:
                    this.options.derivedRows

            });

        this.smallRoad =
            new SmallRoad({

                rows:
                    this.options.derivedRows

            });

        this.cockroachRoad =
            new CockroachRoad({

                rows:
                    this.options.derivedRows

            });

        return this;

    }


    /**
     * 重置分析中繼資料
     */
    resetMetadata() {

        this.sourceRounds = [];

        this.lastUpdatedAt = null;

        this.revision = 0;

        return this;

    }


    /**
     * 清空全部路單
     */
    clear() {

        this.beadRoad.clear();

        this.bigRoad.clear();

        this.bigEyeRoad.clear();

        this.smallRoad.clear();

        this.cockroachRoad.clear();

        this.resetMetadata();

        return this;

    }


    /**
     * 是否為空
     */
    get isEmpty() {

        return (
            this.sourceCount === 0
        );

    }


    /**
     * 來源總局數
     */
    get sourceCount() {

        return this.sourceRounds.length;

    }


    /**
     * 最後一局來源資料
     */
    get lastSourceRound() {

        return (
            this.sourceRounds.at(-1) ??
            null
        );

    }


    /**
     * 最後勝方
     */
    get lastWinner() {

        return (
            this.lastSourceRound
                ?.winner ??
            null
        );

    }


    /**
     * 解析來源
     *
     * 支援：
     * - Array
     * - History.roadmapData
     * - History.getAll()
     */
    resolveSource(source) {

        if (Array.isArray(source)) {

            return source;

        }

        if (!source) {

            throw new Error(
                "Roadmap source is required."
            );

        }

        if (
            Array.isArray(
                source.roadmapData
            )
        ) {

            return source.roadmapData;

        }

        if (
            typeof source.getAll ===
            "function"
        ) {

            const items =
                source.getAll();

            if (!Array.isArray(items)) {

                throw new TypeError(
                    "Source getAll() must return an array."
                );

            }

            return items;

        }

        throw new Error(
            "Unsupported roadmap source."
        );

    }


    /**
     * 正規化單局資料
     *
     * 使用 BeadRoad 的正規化規則，
     * 讓所有路單共用一致資料格式。
     */
    normalizeRound(data) {

        return this.beadRoad
            .normalizeEntry(data);

    }


    /**
     * 深度複製來源資料
     */
    cloneRound(data) {

        return {

            winner:
                data.winner,

            playerPair:
                Boolean(
                    data.playerPair
                ),

            bankerPair:
                Boolean(
                    data.bankerPair
                ),

            super6:
                Boolean(
                    data.super6
                ),

            margin:
                Number.isFinite(
                    data.margin
                )
                    ? data.margin
                    : 0,

            playerNatural:
                Boolean(
                    data.playerNatural
                ),

            bankerNatural:
                Boolean(
                    data.bankerNatural
                )

        };

    }


    /**
     * 建立全部路單
     *
     * 先完整驗證與建立暫存路單，
     * 全部成功後才替換現有資料。
     */
    build(source) {

        const items =
            this.resolveSource(
                source
            );

        const normalized =
            items.map(
                item =>
                    this.normalizeRound(
                        item
                    )
            );


        /**
         * 使用暫存實例建立，
         * 避免過程失敗時破壞現有資料。
         */
        const beadRoad =
            new BeadRoad({

                rows:
                    this.options.beadRows

            });

        const bigRoad =
            new BigRoad({

                rows:
                    this.options.bigRoadRows

            });

        const bigEyeRoad =
            new BigEyeRoad({

                rows:
                    this.options.derivedRows

            });

        const smallRoad =
            new SmallRoad({

                rows:
                    this.options.derivedRows

            });

        const cockroachRoad =
            new CockroachRoad({

                rows:
                    this.options.derivedRows

            });


        beadRoad.build(
            normalized
        );

        bigRoad.build(
            normalized
        );

        bigEyeRoad.build(
            bigRoad
        );

        smallRoad.build(
            bigRoad
        );

        cockroachRoad.build(
            bigRoad
        );


        /**
         * 全部成功後才正式替換。
         */
        this.beadRoad =
            beadRoad;

        this.bigRoad =
            bigRoad;

        this.bigEyeRoad =
            bigEyeRoad;

        this.smallRoad =
            smallRoad;

        this.cockroachRoad =
            cockroachRoad;

        this.sourceRounds =
            normalized.map(
                item =>
                    this.cloneRound(item)
            );

        this.lastUpdatedAt =
            Date.now();

        this.revision++;

        return this;

    }


    /**
     * analyze() 為 build() 的語意別名
     */
    analyze(source) {

        return this.build(source);

    }


    /**
     * 重新建立衍生路
     *
     * Big Road 更新後，
     * Big Eye / Small / Cockroach
     * 都必須重新計算。
     */
    rebuildDerivedRoads() {

        this.bigEyeRoad.build(
            this.bigRoad
        );

        this.smallRoad.build(
            this.bigRoad
        );

        this.cockroachRoad.build(
            this.bigRoad
        );

        return this;

    }


    /**
     * 新增單局
     *
     * Bead Road 與 Big Road 可直接增量加入；
     * 三條衍生路由更新後的 Big Road 重建。
     */
    add(data) {

        const normalized =
            this.normalizeRound(
                data
            );

        /**
         * 先使用暫存來源驗證整體結果，
         * 避免部分路單成功、部分失敗。
         */
        const nextSource = [

            ...this.sourceRounds.map(
                item =>
                    this.cloneRound(item)
            ),

            this.cloneRound(
                normalized
            )

        ];

        return this.build(
            nextSource
        );

    }


    /**
     * 一次新增多局
     */
    addAll(items = []) {

        if (!Array.isArray(items)) {

            throw new TypeError(
                "Roadmap items must be an array."
            );

        }

        const normalized =
            items.map(
                item =>
                    this.normalizeRound(
                        item
                    )
            );

        return this.build([

            ...this.sourceRounds.map(
                item =>
                    this.cloneRound(item)
            ),

            ...normalized.map(
                item =>
                    this.cloneRound(item)
            )

        ]);

    }


    /**
     * 取得指定 Road
     */
    getRoad(type) {

        if (
            !Object.values(
                RoadmapType
            ).includes(type)
        ) {

            return null;

        }

        return this[type];

    }


    /**
     * 取得全部 Road
     */
    get roads() {

        return {

            beadRoad:
                this.beadRoad,

            bigRoad:
                this.bigRoad,

            bigEyeRoad:
                this.bigEyeRoad,

            smallRoad:
                this.smallRoad,

            cockroachRoad:
                this.cockroachRoad

        };

    }


    /**
     * 取得所有矩陣
     */
    get matrices() {

        return {

            beadRoad:
                this.beadRoad
                    .toMatrix(),

            bigRoad:
                this.bigRoad
                    .toMatrix(),

            bigEyeRoad:
                this.bigEyeRoad
                    .toMatrix(),

            smallRoad:
                this.smallRoad
                    .toMatrix(),

            cockroachRoad:
                this.cockroachRoad
                    .toMatrix()

        };

    }


    /**
     * 勝負統計
     */
    get winnerSummary() {

        return {

            rounds:
                this.sourceCount,

            player:
                this.beadRoad
                    .playerCount,

            banker:
                this.beadRoad
                    .bankerCount,

            tie:
                this.beadRoad
                    .tieCount

        };

    }


    /**
     * Pair 與特殊結果統計
     */
    get specialSummary() {

        return {

            playerPair:
                this.beadRoad
                    .playerPairCount,

            bankerPair:
                this.beadRoad
                    .bankerPairCount,

            super6:
                this.beadRoad
                    .super6Count,

            playerNatural:
                this.sourceRounds.filter(
                    round =>
                        round.playerNatural
                ).length,

            bankerNatural:
                this.sourceRounds.filter(
                    round =>
                        round.bankerNatural
                ).length,

            dragonBonus:
                this.sourceRounds.filter(
                    round =>
                        round.margin >= 4
                ).length

        };

    }


    /**
     * 衍生路紅藍統計
     */
    get derivedSummary() {

        return {

            bigEyeRoad: {

                red:
                    this.bigEyeRoad
                        .redCount,

                blue:
                    this.bigEyeRoad
                        .blueCount,

                cells:
                    this.bigEyeRoad
                        .count

            },

            smallRoad: {

                red:
                    this.smallRoad
                        .redCount,

                blue:
                    this.smallRoad
                        .blueCount,

                cells:
                    this.smallRoad
                        .count

            },

            cockroachRoad: {

                red:
                    this.cockroachRoad
                        .redCount,

                blue:
                    this.cockroachRoad
                        .blueCount,

                cells:
                    this.cockroachRoad
                        .count

            }

        };

    }


    /**
     * 來源勝方趨勢
     */
    get trend() {

        return this.sourceRounds.map(
            round =>
                round.winner
        );

    }


    /**
     * 目前 Player／Banker／Tie streak
     *
     * 與 History v5 相同，
     * Tie 也會形成自己的 streak。
     */
    get currentWinnerStreak() {

        if (this.sourceCount === 0) {

            return null;

        }

        const winner =
            this.lastWinner;

        let count = 0;

        for (
            let index =
                this.sourceRounds.length - 1;

            index >= 0;

            index--
        ) {

            if (
                this.sourceRounds[index]
                    .winner === winner
            ) {

                count++;

            }
            else {

                break;

            }

        }

        return {

            winner,

            count

        };

    }


    /**
     * 最近 N 局
     */
    lastRounds(count = 20) {

        if (
            !Number.isInteger(count) ||
            count < 0
        ) {

            throw new RangeError(
                "count must be a non-negative integer."
            );

        }

        return this.sourceRounds
            .slice(-count)
            .map(
                round =>
                    this.cloneRound(round)
            );

    }


    /**
     * 路單一致性檢查
     */
    validateConsistency() {

        const errors = [];

        /**
         * 珠盤路一格對應一局。
         */
        if (
            this.beadRoad.count !==
            this.sourceCount
        ) {

            errors.push(
                "Bead Road count does not match source count."
            );

        }


        /**
         * 大路總局數包含 Tie，
         * 應與來源總局數一致。
         */
        if (
            this.bigRoad.totalRounds !==
            this.sourceCount
        ) {

            errors.push(
                "Big Road total rounds do not match source count."
            );

        }


        /**
         * 大路非 Tie 格數。
         */
        const nonTieCount =
            this.sourceRounds.filter(
                round =>
                    round.winner !== "Tie"
            ).length;

        if (
            this.bigRoad.count !==
            nonTieCount
        ) {

            errors.push(
                "Big Road cell count does not match non-tie rounds."
            );

        }


        /**
         * Tie 統計。
         */
        const tieCount =
            this.sourceRounds.filter(
                round =>
                    round.winner === "Tie"
            ).length;

        if (
            this.bigRoad.tieCount !==
            tieCount
        ) {

            errors.push(
                "Big Road tie count does not match source ties."
            );

        }


        /**
         * 衍生路來源格數必須與 Big Road 一致。
         */
        const derivedRoads = [

            {
                name: "Big Eye Road",
                road: this.bigEyeRoad
            },

            {
                name: "Small Road",
                road: this.smallRoad
            },

            {
                name: "Cockroach Road",
                road: this.cockroachRoad
            }

        ];

        for (
            const item of
            derivedRoads
        ) {

            if (
                item.road
                    .sourceCellCount !==
                this.bigRoad.count
            ) {

                errors.push(
                    `${item.name} source cell count does not match Big Road.`
                );

            }

            if (
                item.road
                    .sourceRoundCount !==
                this.bigRoad.totalRounds
            ) {

                errors.push(
                    `${item.name} source round count does not match Big Road.`
                );

            }

        }


        return {

            valid:
                errors.length === 0,

            errors

        };

    }


    /**
     * 完整摘要
     */
    get summary() {

        const consistency =
            this.validateConsistency();

        return {

            sourceRounds:
                this.sourceCount,

            revision:
                this.revision,

            lastUpdatedAt:
                this.lastUpdatedAt,

            lastWinner:
                this.lastWinner,

            currentWinnerStreak:
                this.currentWinnerStreak,

            winners:
                this.winnerSummary,

            specials:
                this.specialSummary,

            roads: {

                beadRoad:
                    this.beadRoad
                        .summary,

                bigRoad:
                    this.bigRoad
                        .summary,

                bigEyeRoad:
                    this.bigEyeRoad
                        .summary,

                smallRoad:
                    this.smallRoad
                        .summary,

                cockroachRoad:
                    this.cockroachRoad
                        .summary

            },

            derived:
                this.derivedSummary,

            consistency

        };

    }


    /**
     * 匯出適合 UI 使用的資料
     */
    toViewModel() {

        return {

            summary:
                this.summary,

            matrices:
                this.matrices,

            trend:
                [...this.trend],

            recentRounds:
                this.lastRounds(20)

        };

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            version: 1,

            options: {

                ...this.options

            },

            revision:
                this.revision,

            lastUpdatedAt:
                this.lastUpdatedAt,

            sourceRounds:
                this.sourceRounds.map(
                    round =>
                        this.cloneRound(round)
                ),

            roads: {

                beadRoad:
                    this.beadRoad
                        .toJSON(),

                bigRoad:
                    this.bigRoad
                        .toJSON(),

                bigEyeRoad:
                    this.bigEyeRoad
                        .toJSON(),

                smallRoad:
                    this.smallRoad
                        .toJSON(),

                cockroachRoad:
                    this.cockroachRoad
                        .toJSON()

            }

        };

    }


    /**
     * JSON 還原
     *
     * 以 sourceRounds 重新建立最安全，
     * 可以再次確認各路單一致性。
     */
    static fromJSON(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Roadmap Analyzer data is required."
            );

        }

        if (
            !Array.isArray(
                data.sourceRounds
            )
        ) {

            throw new Error(
                "Roadmap Analyzer sourceRounds are required."
            );

        }

        const analyzer =
            new RoadmapAnalyzer({

                beadRows:
                    data.options
                        ?.beadRows ??
                    DEFAULT_OPTIONS
                        .beadRows,

                bigRoadRows:
                    data.options
                        ?.bigRoadRows ??
                    DEFAULT_OPTIONS
                        .bigRoadRows,

                derivedRows:
                    data.options
                        ?.derivedRows ??
                    DEFAULT_OPTIONS
                        .derivedRows

            });

        analyzer.build(
            data.sourceRounds
        );

        /**
         * build() 會增加一次 revision。
         * JSON 有合法 revision 時恢復原值。
         */
        if (
            Number.isInteger(
                data.revision
            ) &&
            data.revision >= 0
        ) {

            analyzer.revision =
                data.revision;

        }

        if (
            Number.isFinite(
                data.lastUpdatedAt
            )
        ) {

            analyzer.lastUpdatedAt =
                data.lastUpdatedAt;

        }

        return analyzer;

    }

}
