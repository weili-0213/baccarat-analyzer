/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Big Eye Road
 *
 * 大眼仔路
 *
 * 大眼仔路不表示 Player / Banker。
 *
 * Red：
 * - 大路結構規律、相同或整齊
 *
 * Blue：
 * - 大路結構出現差異
 *
 * 起始條件：
 * - 第二條大路 streak 的第二格
 * - 或第三條大路 streak 的第一格
 *
 * 哪一個先出現，就從哪裡開始。
 */

import BigRoad
    from "./bigRoad.js";


export const DerivedRoadColor =
    Object.freeze({

        RED: "Red",

        BLUE: "Blue"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        rows: 6

    });


export default class BigEyeRoad {

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
     * 清空大眼仔路
     */
    clear() {

        /**
         * 大眼仔路格子。
         */
        this.entries = [];

        /**
         * row:column → entry
         */
        this.cellMap =
            new Map();

        /**
         * 最後一格。
         */
        this.currentEntry =
            null;

        /**
         * 下一個不同顏色開始的主欄。
         */
        this.nextBaseColumn =
            0;

        /**
         * 目前顏色 streak 的主欄。
         */
        this.currentBaseColumn =
            -1;

        /**
         * 來源大路格數。
         */
        this.sourceCellCount =
            0;

        /**
         * 來源大路總局數，包含 Tie。
         */
        this.sourceRoundCount =
            0;

        return this;

    }


    /**
     * 大眼仔路格數
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
     * 指定位置是否已有資料
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
                DerivedRoadColor
            ).includes(color)
        ) {

            throw new Error(
                `Invalid derived road color: ${color}`
            );

        }

    }


    /**
     * 將 BigRoad entries 分成 streak。
     *
     * 每一個 streak 就是一段連莊或連閒。
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
     * 新 streak 第一格的判斷。
     *
     * 大眼仔路：
     * 比較前兩條大路 streak 的長度。
     *
     * 相同 → Red
     * 不同 → Blue
     */
    calculateNewStreakColor(
        streakIndex,
        streaks
    ) {

        /**
         * 至少需要第三條 streak。
         */
        if (streakIndex < 2) {

            return null;

        }

        const previousLength =
            streaks[
                streakIndex - 1
            ].entries.length;

        const comparisonLength =
            streaks[
                streakIndex - 2
            ].entries.length;

        return (
            previousLength ===
            comparisonLength
        )
            ? DerivedRoadColor.RED
            : DerivedRoadColor.BLUE;

    }


    /**
     * 同一 streak 往下延伸時的判斷。
     *
     * currentDepth：
     * 目前 streak 第幾格，從 1 開始。
     *
     * 規則：
     *
     * currentDepth <= previousLength
     * → Red
     *
     * currentDepth === previousLength + 1
     * → Blue
     *
     * currentDepth > previousLength + 1
     * → Red
     *
     * 最後一種情況代表長龍已超過前欄，
     * 後續持續延伸。
     */
    calculateContinuationColor(
        streakIndex,
        currentDepth,
        streaks
    ) {

        /**
         * 第一條 streak 沒有前欄可比較。
         */
        if (streakIndex < 1) {

            return null;

        }

        const previousLength =
            streaks[
                streakIndex - 1
            ].entries.length;

        if (
            currentDepth <=
            previousLength
        ) {

            return DerivedRoadColor.RED;

        }

        if (
            currentDepth ===
            previousLength + 1
        ) {

            return DerivedRoadColor.BLUE;

        }

        return DerivedRoadColor.RED;

    }


    /**
     * 計算大路某一格對應的大眼仔顏色。
     */
    calculateColor({

        streakIndex,

        depth,

        streaks

    }) {

        /**
         * streak 第一格。
         */
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
     * 計算大眼仔路下一格位置。
     *
     * 排列方式與大路相同：
     * - 同顏色優先向下
     * - 到底或碰撞後向右
     * - 顏色改變時從下一主欄第一列開始
     */
    calculateNextPosition(color) {

        /**
         * 第一格。
         */
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
         * 顏色改變。
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
         * 同顏色優先向下。
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
         * 到底或碰撞後向右。
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
     * 新增一個紅／藍結果。
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

            /**
             * 對應大路資料。
             */
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
     * 驗證是否為 BigRoad。
     */
    isBigRoad(source) {

        return (

            source instanceof
            BigRoad

        );

    }


    /**
     * 將來源轉成 BigRoad。
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
                "Big Eye Road source is required."
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
            "Unsupported Big Eye Road source."
        );

    }


    /**
     * 從 BigRoad 建立大眼仔路。
     */
    build(source) {

        /**
         * 先解析並完成計算，
         * 成功後才 clear()。
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
                streaks[streakIndex];

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

                /**
                 * depth 從 1 開始。
                 */
                const depth =
                    entryIndex + 1;

                const color =
                    this.calculateColor({

                        streakIndex,

                        depth,

                        streaks

                    });

                /**
                 * 尚未達到大眼仔路起始條件。
                 */
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
     * 取得指定欄。
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
     * 轉成矩陣。
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
     * 紅色格數
     */
    get redCount() {

        return this.entries.filter(
            entry =>
                entry.color ===
                DerivedRoadColor.RED
        ).length;

    }


    /**
     * 藍色格數
     */
    get blueCount() {

        return this.entries.filter(
            entry =>
                entry.color ===
                DerivedRoadColor.BLUE
        ).length;

    }


    /**
     * 目前顏色 streak。
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
     * 大眼仔路摘要。
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
     *
     * 直接依 color 順序重建排列。
     */
    static fromJSON(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Big Eye Road data is required."
            );

        }

        if (
            !Array.isArray(
                data.entries
            )
        ) {

            throw new Error(
                "Big Eye Road entries are required."
            );

        }

        const road =
            new BigEyeRoad({

                rows:
                    data.rows ??
                    DEFAULT_OPTIONS.rows

            });

        /**
         * 先驗證所有 entries，
         * 避免部分還原。
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
