/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Bead Road
 *
 * 珠盤路
 *
 * 排列方式：
 * - 由上往下
 * - 每欄 6 格
 * - 滿 6 格後移到下一欄
 *
 * 例：
 *
 * 1  7  13
 * 2  8  14
 * 3  9  15
 * 4 10  16
 * 5 11  17
 * 6 12  18
 */

export const BeadRoadWinner =
    Object.freeze({

        PLAYER: "Player",

        BANKER: "Banker",

        TIE: "Tie"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        rows: 6

    });


export default class BeadRoad {

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
     * 清空珠盤路
     */
    clear() {

        this.entries = [];

        return this;

    }


    /**
     * 目前資料筆數
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
     * 欄數
     */
    get columns() {

        if (this.count === 0) {

            return 0;

        }

        return Math.ceil(
            this.count /
            this.options.rows
        );

    }


    /**
     * 最後一筆
     */
    get last() {

        return (
            this.entries.at(-1) ??
            null
        );

    }


    /**
     * 驗證 winner
     */
    validateWinner(winner) {

        if (
            !Object.values(
                BeadRoadWinner
            ).includes(winner)
        ) {

            throw new Error(
                `Invalid bead road winner: ${winner}`
            );

        }

    }


    /**
     * 正規化單局資料
     *
     * 支援 History.roadmapData 的格式：
     *
     * {
     *     winner,
     *     playerPair,
     *     bankerPair,
     *     super6,
     *     margin,
     *     playerNatural,
     *     bankerNatural
     * }
     */
    normalizeEntry(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new TypeError(
                "Bead road entry must be an object."
            );

        }

        const winner =
            data.winner;

        this.validateWinner(
            winner
        );

        return {

            winner,

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
     * 計算位置
     *
     * index 從 0 開始。
     */
    getPosition(index) {

        if (
            !Number.isInteger(index) ||
            index < 0
        ) {

            throw new RangeError(
                "index must be a non-negative integer."
            );

        }

        return {

            row:
                index %
                this.options.rows,

            column:
                Math.floor(
                    index /
                    this.options.rows
                )

        };

    }


    /**
     * 新增一局
     */
    add(data) {

        const normalized =
            this.normalizeEntry(
                data
            );

        const index =
            this.entries.length;

        const position =
            this.getPosition(
                index
            );

        const entry = {

            index,

            row:
                position.row,

            column:
                position.column,

            ...normalized

        };

        this.entries.push(
            entry
        );

        return entry;

    }


    /**
     * 一次新增多局
     */
    addAll(items = []) {

        if (!Array.isArray(items)) {

            throw new TypeError(
                "Bead road items must be an array."
            );

        }

        return items.map(
            item =>
                this.add(item)
        );

    }


    /**
     * 由 History 建立
     *
     * 支援：
     * - history.roadmapData
     * - history.getAll()
     * - 直接傳陣列
     */
    build(source) {

        this.clear();

        if (Array.isArray(source)) {

            this.addAll(source);

            return this;

        }

        if (!source) {

            throw new Error(
                "Bead road source is required."
            );

        }

        if (
            Array.isArray(
                source.roadmapData
            )
        ) {

            this.addAll(
                source.roadmapData
            );

            return this;

        }

        if (
            typeof source.getAll ===
            "function"
        ) {

            this.addAll(
                source.getAll()
            );

            return this;

        }

        throw new Error(
            "Unsupported bead road source."
        );

    }


    /**
     * 依 index 取得資料
     */
    get(index) {

        return (
            this.entries[index] ??
            null
        );

    }


    /**
     * 依 row / column 取得資料
     */
    getCell(
        row,
        column
    ) {

        if (
            !Number.isInteger(row) ||
            row < 0 ||
            row >= this.options.rows
        ) {

            return null;

        }

        if (
            !Number.isInteger(column) ||
            column < 0
        ) {

            return null;

        }

        const index =

            column *
            this.options.rows +
            row;

        return this.get(index);

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
     * 回傳格式：
     *
     * [
     *   [cell, cell],
     *   [cell, cell],
     *   ...
     * ]
     *
     * 第一層是 row，
     * 第二層是 column。
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
     * Player 次數
     */
    get playerCount() {

        return this.entries.filter(
            entry =>
                entry.winner ===
                BeadRoadWinner.PLAYER
        ).length;

    }


    /**
     * Banker 次數
     */
    get bankerCount() {

        return this.entries.filter(
            entry =>
                entry.winner ===
                BeadRoadWinner.BANKER
        ).length;

    }


    /**
     * Tie 次數
     */
    get tieCount() {

        return this.entries.filter(
            entry =>
                entry.winner ===
                BeadRoadWinner.TIE
        ).length;

    }


    /**
     * Pair 次數
     */
    get playerPairCount() {

        return this.entries.filter(
            entry =>
                entry.playerPair
        ).length;

    }


    get bankerPairCount() {

        return this.entries.filter(
            entry =>
                entry.bankerPair
        ).length;

    }


    /**
     * Super 6 次數
     */
    get super6Count() {

        return this.entries.filter(
            entry =>
                entry.super6
        ).length;

    }


    /**
     * 統計摘要
     */
    get summary() {

        return {

            rounds:
                this.count,

            rows:
                this.options.rows,

            columns:
                this.columns,

            player:
                this.playerCount,

            banker:
                this.bankerCount,

            tie:
                this.tieCount,

            playerPair:
                this.playerPairCount,

            bankerPair:
                this.bankerPairCount,

            super6:
                this.super6Count

        };

    }


    /**
     * JSON
     */
    toJSON() {

        return {

            rows:
                this.options.rows,

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
            typeof data !== "object"
        ) {

            throw new Error(
                "Bead road data is required."
            );

        }

        if (
            !Array.isArray(
                data.entries
            )
        ) {

            throw new Error(
                "Bead road entries are required."
            );

        }

        const beadRoad =
            new BeadRoad({

                rows:
                    data.rows ??
                    DEFAULT_OPTIONS.rows

            });

        for (
            const item of
            data.entries
        ) {

            beadRoad.add(item);

        }

        return beadRoad;

    }

}
