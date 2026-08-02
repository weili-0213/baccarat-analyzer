/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Cockroach Road
 *
 * 曱甴路
 *
 * 曱甴路不表示 Player / Banker。
 *
 * Red：
 * - 大路結構規律、相同或整齊
 *
 * Blue：
 * - 大路結構出現差異
 *
 * 比較距離：
 * - 與前三條大路 streak 比較
 *
 * 起始條件：
 * - 第四條大路 streak 的第二格
 * - 或第五條大路 streak 的第一格
 *
 * 哪一個先出現，就從哪裡開始。
 */

import BigRoad
    from "./bigRoad.js";


export const CockroachRoadColor =
    Object.freeze({

        RED: "Red",

        BLUE: "Blue"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        rows: 6

    });


/**
 * 衍生路比較間隔
 *
 * Big Eye Road = 1
 * Small Road   = 2
 * Cockroach    = 3
 */
const COMPARISON_GAP = 3;


export default class CockroachRoad {

    constructor(options = {}) {

        this.options = {

            ...DEFAULT_OPTIONS,

            ...options

        };

        this.validateOptions();

        this.clear();

    }


    /**
     * 驗證設定
     */
    validateOptions() {

        if (
            !Number.isInteger(
                this.options.rows
            ) ||
            this.options.rows < 1
        ) {

            throw new RangeError(
                "rows must be a positive integer."
            );

        }

    }


    /**
     * 清空曱甴路
     */
    clear() {

        this.entries = [];

        this.cellMap =
            new Map();

        this.currentEntry =
            null;

        this.currentBaseColumn =
            -1;

        this.nextBaseColumn =
            0;

        this.sourceCellCount =
            0;

        this.sourceRoundCount =
            0;

        return this;

    }


    /**
     * 格數
     */
    get count() {

        return this.entries.length;

    }


    /**
     * 是否為空
     */
    get isEmpty() {

        return this.count === 0;

    }


    /**
     * 使用欄數
     */
    get columns() {

        if (this.entries.length === 0) {

            return 0;

        }

        return (
            Math.max(
                ...this.entries.map(
                    entry =>
                        entry.column
                )
            ) + 1
        );

    }


    /**
     * 最後一格
     */
    get last() {

        return (
            this.entries.at(-1) ??
            null
        );

    }


    /**
     * 最後顏色
     */
    get lastColor() {

        return (
            this.last?.color ??
            null
        );

    }


    /**
     * 位置鍵值
     */
    positionKey(
        row,
        column
    ) {

        return `${row}:${column}`;

    }


    /**
     * 位置是否合法
     */
    isValidPosition(
        row,
        column
    ) {

        return (

            Number.isInteger(row) &&
            row >= 0 &&
            row < this.options.rows &&

            Number.isInteger(column) &&
            column >= 0

        );

    }


    /**
     * 指定位置是否已有格子
     */
    hasCell(
        row,
        column
    ) {

        if (
            !this.isValidPosition(
                row,
                column
            )
        ) {

            return false;

        }

        return this.cellMap.has(
            this.positionKey(
                row,
                column
            )
        );

    }


    /**
     * 依位置取得格子
     */
    getCell(
        row,
        column
    ) {

        if (
            !this.isValidPosition(
                row,
                column
            )
        ) {

            return null;

        }

        return (
            this.cellMap.get(
                this.positionKey(
                    row,
                    column
                )
            ) ??
            null
        );

    }


    /**
     * 依索引取得格子
     */
    get(index) {

        if (
            !Number.isInteger(index) ||
            index < 0
        ) {

            return null;

        }

        return (
            this.entries[index] ??
            null
        );

    }


    /**
     * 驗證顏色
     */
    validateColor(color) {

        if (
            !Object.values(
                CockroachRoadColor
            ).includes(color)
        ) {

            throw new Error(
                `Invalid cockroach road color: ${color}`
            );

        }

    }


    /**
     * 將 BigRoad 分成 streak
     */
    createStreaks(bigRoad) {

        const streaks = [];

        for (
            const entry of
            bigRoad.entries
        ) {

            if (
                entry.newStreak ||
                streaks.length === 0
            ) {

                streaks.push({

                    index:
                        streaks.length,

                    winner:
                        entry.winner,

                    baseColumn:
                        entry.baseColumn,

                    entries: []

                });

            }

            streaks.at(-1)
                .entries
                .push(entry);

        }

        return streaks;

    }


    /**
     * 新 streak 第一格的顏色
     *
     * 曱甴路比較：
     *
     * 前一條 streak
     * 與前四條 streak
     *
     * 例如目前是第 5 條：
     *
     * 比較第 4 條與第 1 條
     *
     * 長度相同 → Red
     * 長度不同 → Blue
     */
    calculateNewStreakColor(
        streakIndex,
        streaks
    ) {

        /**
         * 曱甴路至少需要第 5 條 streak
         *
         * streakIndex 從 0 開始，
         * 所以最小為 4。
         */
        if (
            streakIndex <
            COMPARISON_GAP + 1
        ) {

            return null;

        }

        const previousIndex =
            streakIndex - 1;

        const comparisonIndex =
            streakIndex -
            COMPARISON_GAP -
            1;

        const previousLength =
            streaks[
                previousIndex
            ].entries.length;

        const comparisonLength =
            streaks[
                comparisonIndex
            ].entries.length;

        return (
            previousLength ===
            comparisonLength
        )
            ? CockroachRoadColor.RED
            : CockroachRoadColor.BLUE;

    }


    /**
     * 同一 streak 延伸的顏色
     *
     * 目前深度會與前三條 streak 比較。
     *
     * currentDepth <= comparisonLength
     * → Red
     *
     * currentDepth === comparisonLength + 1
     * → Blue
     *
     * currentDepth > comparisonLength + 1
     * → Red
     */
    calculateContinuationColor(
        streakIndex,
        currentDepth,
        streaks
    ) {

        const comparisonIndex =
            streakIndex -
            COMPARISON_GAP;

        if (comparisonIndex < 0) {

            return null;

        }

        const comparisonLength =
            streaks[
                comparisonIndex
            ].entries.length;

        if (
            currentDepth <=
            comparisonLength
        ) {

            return CockroachRoadColor.RED;

        }

        if (
            currentDepth ===
            comparisonLength + 1
        ) {

            return CockroachRoadColor.BLUE;

        }

        return CockroachRoadColor.RED;

    }


    /**
     * 計算某一 BigRoad 格對應的曱甴路顏色
     */
    calculateColor({

        streakIndex,

        depth,

        streaks

    }) {

        if (depth === 1) {

            return this
                .calculateNewStreakColor(
                    streakIndex,
                    streaks
                );

        }

        return this
            .calculateContinuationColor(
                streakIndex,
                depth,
                streaks
            );

    }


    /**
     * 計算下一格位置
     *
     * 排列方式與大路相同：
     *
     * - 同顏色優先向下
     * - 到底或碰撞後向右
     * - 顏色改變時換新主欄
     */
    calculateNextPosition(color) {

        if (!this.currentEntry) {

            this.currentBaseColumn =
                0;

            this.nextBaseColumn =
                1;

            return {

                row: 0,

                column: 0,

                newStreak: true

            };

        }


        /**
         * 顏色改變
         */
        if (
            color !==
            this.currentEntry.color
        ) {

            const column =
                this.nextBaseColumn;

            this.currentBaseColumn =
                column;

            this.nextBaseColumn =
                column + 1;

            return {

                row: 0,

                column,

                newStreak: true

            };

        }


        /**
         * 同顏色優先向下
         */
        const downRow =
            this.currentEntry.row + 1;

        const sameColumn =
            this.currentEntry.column;

        const canMoveDown =

            downRow <
                this.options.rows &&

            !this.hasCell(
                downRow,
                sameColumn
            );


        if (canMoveDown) {

            return {

                row:
                    downRow,

                column:
                    sameColumn,

                newStreak:
                    false

            };

        }


        /**
         * 到底或碰撞後向右
         */
        const sameRow =
            this.currentEntry.row;

        let rightColumn =
            this.currentEntry.column + 1;

        while (
            this.hasCell(
                sameRow,
                rightColumn
            )
        ) {

            rightColumn++;

        }

        return {

            row:
                sameRow,

            column:
                rightColumn,

            newStreak:
                false

        };

    }


    /**
     * 新增紅／藍格
     */
    addColor(
        color,
        source = {}
    ) {

        this.validateColor(
            color
        );

        const position =
            this.calculateNextPosition(
                color
            );

        const entry = {

            index:
                this.entries.length,

            row:
                position.row,

            column:
                position.column,

            baseColumn:
                this.currentBaseColumn,

            newStreak:
                position.newStreak,

            color,

            sourceIndex:
                source.sourceIndex ??
                null,

            sourceRoundIndex:
                source.sourceRoundIndex ??
                null,

            sourceRow:
                source.sourceRow ??
                null,

            sourceColumn:
                source.sourceColumn ??
                null,

            sourceBaseColumn:
                source.sourceBaseColumn ??
                null,

            sourceWinner:
                source.sourceWinner ??
                null,

            sourceDepth:
                source.sourceDepth ??
                null,

            sourceStreakIndex:
                source.sourceStreakIndex ??
                null

        };

        this.entries.push(
            entry
        );

        this.cellMap.set(
            this.positionKey(
                entry.row,
                entry.column
            ),
            entry
        );

        this.currentEntry =
            entry;

        return entry;

    }


    /**
     * 是否為 BigRoad
     */
    isBigRoad(source) {

        return (
            source instanceof BigRoad
        );

    }


    /**
     * 解析來源為 BigRoad
     *
     * 支援：
     * - BigRoad
     * - History
     * - History.roadmapData
     * - 一般陣列
     */
    resolveBigRoad(source) {

        if (
            this.isBigRoad(source)
        ) {

            return source;

        }

        if (Array.isArray(source)) {

            return new BigRoad()
                .build(source);

        }

        if (!source) {

            throw new Error(
                "Cockroach Road source is required."
            );

        }

        if (
            Array.isArray(
                source.roadmapData
            ) ||
            typeof source.getAll ===
                "function"
        ) {

            return new BigRoad()
                .build(source);

        }

        throw new Error(
            "Unsupported Cockroach Road source."
        );

    }


    /**
     * 從來源建立曱甴路
     */
    build(source) {

        /**
         * 先解析來源與計算，
         * 成功後才清除原本資料。
         */
        const bigRoad =
            this.resolveBigRoad(
                source
            );

        const streaks =
            this.createStreaks(
                bigRoad
            );

        const derived = [];


        for (
            let streakIndex = 0;
            streakIndex <
                streaks.length;
            streakIndex++
        ) {

            const streak =
                streaks[
                    streakIndex
                ];

            for (
                let entryIndex = 0;
                entryIndex <
                    streak.entries.length;
                entryIndex++
            ) {

                const bigRoadEntry =
                    streak.entries[
                        entryIndex
                    ];

                const depth =
                    entryIndex + 1;

                const color =
                    this.calculateColor({

                        streakIndex,

                        depth,

                        streaks

                    });

                if (!color) {

                    continue;

                }

                derived.push({

                    color,

                    source: {

                        sourceIndex:
                            bigRoadEntry.index,

                        sourceRoundIndex:
                            bigRoadEntry.roundIndex,

                        sourceRow:
                            bigRoadEntry.row,

                        sourceColumn:
                            bigRoadEntry.column,

                        sourceBaseColumn:
                            bigRoadEntry.baseColumn,

                        sourceWinner:
                            bigRoadEntry.winner,

                        sourceDepth:
                            depth,

                        sourceStreakIndex:
                            streakIndex

                    }

                });

            }

        }


        this.clear();

        this.sourceCellCount =
            bigRoad.count;

        this.sourceRoundCount =
            bigRoad.totalRounds;


        for (
            const item of
            derived
        ) {

            this.addColor(
                item.color,
                item.source
            );

        }

        return this;

    }


    /**
     * 取得指定欄
     */
    getColumn(column) {

        if (
            !Number.isInteger(column) ||
            column < 0
        ) {

            return [];

        }

        const result = [];

        for (
            let row = 0;
            row < this.options.rows;
            row++
        ) {

            result.push(
                this.getCell(
                    row,
                    column
                )
            );

        }

        return result;

    }


    /**
     * 轉成矩陣
     *
     * 第一層：row
     * 第二層：column
     */
    toMatrix() {

        const matrix =
            Array.from(
                {
                    length:
                        this.options.rows
                },
                () =>
                    Array(
                        this.columns
                    ).fill(null)
            );

        for (
            const entry of
            this.entries
        ) {

            matrix[
                entry.row
            ][
                entry.column
            ] = {

                ...entry

            };

        }

        return matrix;

    }


    /**
     * Red 數量
     */
    get redCount() {

        return this.entries.filter(
            entry =>
                entry.color ===
                CockroachRoadColor.RED
        ).length;

    }


    /**
     * Blue 數量
     */
    get blueCount() {

        return this.entries.filter(
            entry =>
                entry.color ===
                CockroachRoadColor.BLUE
        ).length;

    }


    /**
     * 目前顏色 streak
     */
    get currentStreak() {

        if (!this.currentEntry) {

            return null;

        }

        const color =
            this.currentEntry.color;

        let count = 0;

        for (
            let index =
                this.entries.length - 1;

            index >= 0;

            index--
        ) {

            if (
                this.entries[index]
                    .color === color
            ) {

                count++;

            }
            else {

                break;

            }

        }

        return {

            color,

            count

        };

    }


    /**
     * 摘要
     */
    get summary() {

        return {

            cells:
                this.count,

            rows:
                this.options.rows,

            columns:
                this.columns,

            red:
                this.redCount,

            blue:
                this.blueCount,

            sourceCells:
                this.sourceCellCount,

            sourceRounds:
                this.sourceRoundCount,

            comparisonGap:
                COMPARISON_GAP,

            currentStreak:
                this.currentStreak

        };

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            rows:
                this.options.rows,

            comparisonGap:
                COMPARISON_GAP,

            sourceCellCount:
                this.sourceCellCount,

            sourceRoundCount:
                this.sourceRoundCount,

            entries:
                this.entries.map(
                    entry => ({
                        ...entry
                    })
                )

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
                "Cockroach Road data is required."
            );

        }

        if (
            !Array.isArray(
                data.entries
            )
        ) {

            throw new Error(
                "Cockroach Road entries are required."
            );

        }

        const road =
            new CockroachRoad({

                rows:
                    data.rows ??
                    DEFAULT_OPTIONS.rows

            });


        /**
         * 先完整驗證
         */
        for (
            const entry of
            data.entries
        ) {

            road.validateColor(
                entry.color
            );

        }


        road.sourceCellCount =
            Number.isInteger(
                data.sourceCellCount
            )
                ? data.sourceCellCount
                : 0;

        road.sourceRoundCount =
            Number.isInteger(
                data.sourceRoundCount
            )
                ? data.sourceRoundCount
                : 0;


        for (
            const entry of
            data.entries
        ) {

            road.addColor(

                entry.color,

                {

                    sourceIndex:
                        entry.sourceIndex,

                    sourceRoundIndex:
                        entry.sourceRoundIndex,

                    sourceRow:
                        entry.sourceRow,

                    sourceColumn:
                        entry.sourceColumn,

                    sourceBaseColumn:
                        entry.sourceBaseColumn,

                    sourceWinner:
                        entry.sourceWinner,

                    sourceDepth:
                        entry.sourceDepth,

                    sourceStreakIndex:
                        entry.sourceStreakIndex

                }

            );

        }

        return road;

    }

}
