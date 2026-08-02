/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Big Road
 *
 * 大路
 *
 * 核心規則：
 *
 * 1. Player / Banker 才會建立新格。
 * 2. Tie 不獨立佔格，附加在最近一格。
 * 3. 開局 Tie 暫存，第一個非 Tie 出現後附加。
 * 4. 同一勝方優先向下排列。
 * 5. 到底或下方已有格子時，向右排列。
 * 6. 勝方改變時，從下一個主欄第一列開始。
 */

export const BigRoadWinner =
    Object.freeze({

        PLAYER: "Player",

        BANKER: "Banker",

        TIE: "Tie"

    });


const DEFAULT_OPTIONS =
    Object.freeze({

        rows: 6

    });


export default class BigRoad {

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
     * 清空大路
     */
    clear() {

        /**
         * 大路格子，僅包含 Player / Banker。
         */
        this.entries = [];

        /**
         * 快速查找位置。
         *
         * key:
         * "row:column"
         */
        this.cellMap =
            new Map();

        /**
         * 開局尚未有 Player / Banker 時，
         * Tie 暫存在這裡。
         */
        this.pendingTies = [];

        /**
         * 目前最後一格。
         */
        this.currentEntry =
            null;

        /**
         * 目前這一條龍的起始主欄。
         */
        this.currentBaseColumn =
            -1;

        /**
         * 下一條新龍應開始的主欄。
         */
        this.nextBaseColumn =
            0;

        /**
         * 原始輸入局數。
         *
         * 包含 Tie。
         */
        this.roundCount =
            0;

        return this;

    }


    /**
     * 大路格數
     *
     * 不包含 Tie。
     */
    get count() {

        return this.entries.length;

    }


    /**
     * 原始局數
     *
     * 包含 Tie。
     */
    get totalRounds() {

        return this.roundCount;

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

        const maximumColumn =
            Math.max(
                ...this.entries.map(
                    entry =>
                        entry.column
                )
            );

        return maximumColumn + 1;

    }


    /**
     * 最後一個 Player / Banker 格
     */
    get last() {

        return (
            this.entries.at(-1) ??
            null
        );

    }


    /**
     * 最後勝方
     */
    get lastWinner() {

        return (
            this.last?.winner ??
            null
        );

    }


    /**
     * 尚未附加的開局 Tie 數
     */
    get pendingTieCount() {

        return this.pendingTies.length;

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
     * 驗證 Winner
     */
    validateWinner(winner) {

        if (
            !Object.values(
                BigRoadWinner
            ).includes(winner)
        ) {

            throw new Error(
                `Invalid big road winner: ${winner}`
            );

        }

    }


    /**
     * 正規化輸入資料
     */
    normalizeRound(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new TypeError(
                "Big road round must be an object."
            );

        }

        const winner =
            data.winner;

        this.validateWinner(
            winner
        );

        const margin =
            Number.isFinite(
                data.margin
            )
                ? Math.max(
                    0,
                    data.margin
                )
                : 0;

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

            margin,

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
     * 驗證 row / column
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
     * 建立 Tie 資料
     */
    createTieData(
        round,
        roundIndex
    ) {

        return {

            roundIndex,

            playerPair:
                round.playerPair,

            bankerPair:
                round.bankerPair,

            super6:
                round.super6,

            margin:
                round.margin,

            playerNatural:
                round.playerNatural,

            bankerNatural:
                round.bankerNatural

        };

    }


    /**
     * 把 Tie 附加到指定格
     */
    attachTie(
        entry,
        tie
    ) {

        if (!entry) {

            throw new Error(
                "Cannot attach tie without a big road entry."
            );

        }

        entry.ties.push({

            ...tie

        });

        entry.tieCount =
            entry.ties.length;

        /**
         * Tie 局中的 Pair 標記也保存，
         * 方便 UI 顯示 Tie 與 Pair 疊加符號。
         */
        if (tie.playerPair) {

            entry.tiePlayerPairCount++;

        }

        if (tie.bankerPair) {

            entry.tieBankerPairCount++;

        }

        return entry;

    }


    /**
     * 將開局暫存 Tie 附加到第一格
     */
    attachPendingTies(entry) {

        for (
            const tie of
            this.pendingTies
        ) {

            this.attachTie(
                entry,
                tie
            );

        }

        this.pendingTies = [];

        return entry;

    }


    /**
     * 計算新格位置
     */
    calculateNextPosition(winner) {

        /**
         * 第一個 Player / Banker。
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
         * 勝方改變：
         *
         * 從下一個主欄第一列開始。
         */
        if (
            winner !==
            this.currentEntry.winner
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
         * 同一勝方：
         *
         * 優先向下。
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
         * 到底或下方已有格子：
         *
         * 改向右排列。
         */
        let rightColumn =
            this.currentEntry.column + 1;

        const sameRow =
            this.currentEntry.row;

        /**
         * 理論上右方通常為空，
         * 但若已有格子，繼續向右尋找。
         */
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
     * 建立 Player / Banker 格
     */
    createEntry(
        round,
        position,
        roundIndex
    ) {

        const entry = {

            index:
                this.entries.length,

            roundIndex,

            row:
                position.row,

            column:
                position.column,

            baseColumn:
                this.currentBaseColumn,

            newStreak:
                position.newStreak,

            winner:
                round.winner,

            playerPair:
                round.playerPair,

            bankerPair:
                round.bankerPair,

            super6:
                round.super6,

            margin:
                round.margin,

            playerNatural:
                round.playerNatural,

            bankerNatural:
                round.bankerNatural,

            tieCount: 0,

            tiePlayerPairCount: 0,

            tieBankerPairCount: 0,

            ties: []

        };

        return entry;

    }


    /**
     * 新增一局
     *
     * Tie：
     * - 不建立新格
     * - 回傳被附加的格子
     * - 若尚無非 Tie，回傳 null
     */
    add(data) {

        const round =
            this.normalizeRound(
                data
            );

        const roundIndex =
            this.roundCount;

        this.roundCount++;


        /**
         * Tie 不佔新格。
         */
        if (
            round.winner ===
            BigRoadWinner.TIE
        ) {

            const tie =
                this.createTieData(
                    round,
                    roundIndex
                );

            if (!this.currentEntry) {

                this.pendingTies.push(
                    tie
                );

                return null;

            }

            return this.attachTie(
                this.currentEntry,
                tie
            );

        }


        const position =
            this.calculateNextPosition(
                round.winner
            );

        const entry =
            this.createEntry(
                round,
                position,
                roundIndex
            );

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


        /**
         * 第一個非 Tie 出現時，
         * 附加所有開局 Tie。
         */
        if (
            this.pendingTies.length > 0
        ) {

            this.attachPendingTies(
                entry
            );

        }

        return entry;

    }


    /**
     * 新增多局
     */
    addAll(items = []) {

        if (!Array.isArray(items)) {

            throw new TypeError(
                "Big road items must be an array."
            );

        }

        return items.map(
            item =>
                this.add(item)
        );

    }


    /**
     * 解析 build 來源
     *
     * 支援：
     * - 陣列
     * - History.roadmapData
     * - History.getAll()
     */
    resolveSource(source) {

        if (Array.isArray(source)) {

            return source;

        }

        if (!source) {

            throw new Error(
                "Big road source is required."
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
                    "History.getAll() must return an array."
                );

            }

            return items;

        }

        throw new Error(
            "Unsupported big road source."
        );

    }


    /**
     * 從來源重新建立大路
     *
     * 先驗證來源，再 clear()，
     * 避免非法來源清除現有資料。
     */
    build(source) {

        const items =
            this.resolveSource(
                source
            );

        /**
         * 先正規化所有資料，
         * 確認全部合法後才清除舊資料。
         */
        const normalized =
            items.map(
                item =>
                    this.normalizeRound(
                        item
                    )
            );

        this.clear();

        this.addAll(
            normalized
        );

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
     * 轉為矩陣
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

                ...entry,

                ties:
                    entry.ties.map(
                        tie => ({
                            ...tie
                        })
                    )

            };

        }

        return matrix;

    }


    /**
     * Player 格數
     */
    get playerCount() {

        return this.entries.filter(
            entry =>
                entry.winner ===
                BigRoadWinner.PLAYER
        ).length;

    }


    /**
     * Banker 格數
     */
    get bankerCount() {

        return this.entries.filter(
            entry =>
                entry.winner ===
                BigRoadWinner.BANKER
        ).length;

    }


    /**
     * Tie 總局數
     *
     * 包含尚未附加的開局 Tie。
     */
    get tieCount() {

        const attached =
            this.entries.reduce(
                (
                    total,
                    entry
                ) =>
                    total +
                    entry.tieCount,
                0
            );

        return (
            attached +
            this.pendingTies.length
        );

    }


    /**
     * Player Pair 局數
     *
     * 包含 Tie 局中的 Player Pair。
     */
    get playerPairCount() {

        const main =
            this.entries.filter(
                entry =>
                    entry.playerPair
            ).length;

        const tiePairs =
            this.entries.reduce(
                (
                    total,
                    entry
                ) =>
                    total +
                    entry.tiePlayerPairCount,
                0
            );

        const pending =
            this.pendingTies.filter(
                tie =>
                    tie.playerPair
            ).length;

        return (
            main +
            tiePairs +
            pending
        );

    }


    /**
     * Banker Pair 局數
     */
    get bankerPairCount() {

        const main =
            this.entries.filter(
                entry =>
                    entry.bankerPair
            ).length;

        const tiePairs =
            this.entries.reduce(
                (
                    total,
                    entry
                ) =>
                    total +
                    entry.tieBankerPairCount,
                0
            );

        const pending =
            this.pendingTies.filter(
                tie =>
                    tie.bankerPair
            ).length;

        return (
            main +
            tiePairs +
            pending
        );

    }


    /**
     * Super 6 次數
     */
    get super6Count() {

        const main =
            this.entries.filter(
                entry =>
                    entry.super6
            ).length;

        const ties =
            this.entries.reduce(
                (
                    total,
                    entry
                ) =>
                    total +
                    entry.ties.filter(
                        tie =>
                            tie.super6
                    ).length,
                0
            );

        const pending =
            this.pendingTies.filter(
                tie =>
                    tie.super6
            ).length;

        return (
            main +
            ties +
            pending
        );

    }


    /**
     * 目前連續勝方長度
     *
     * Tie 不會中斷。
     */
    get currentStreak() {

        if (!this.currentEntry) {

            return null;

        }

        const winner =
            this.currentEntry.winner;

        let count = 0;

        for (
            let index =
                this.entries.length - 1;

            index >= 0;

            index--
        ) {

            if (
                this.entries[index]
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
     * 大路摘要
     */
    get summary() {

        return {

            rounds:
                this.totalRounds,

            cells:
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
                this.super6Count,

            pendingTies:
                this.pendingTieCount,

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

            roundCount:
                this.roundCount,

            entries:
                this.entries.map(
                    entry => ({

                        ...entry,

                        ties:
                            entry.ties.map(
                                tie => ({
                                    ...tie
                                })
                            )

                    })
                ),

            pendingTies:
                this.pendingTies.map(
                    tie => ({
                        ...tie
                    })
                )

        };

    }


    /**
     * JSON 還原
     *
     * 透過原始局序重建最安全，
     * 因此將 entry 與 tie 依 roundIndex
     * 重新排序後逐局加入。
     */
    static fromJSON(data) {

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            throw new Error(
                "Big road data is required."
            );

        }

        if (
            !Array.isArray(
                data.entries
            )
        ) {

            throw new Error(
                "Big road entries are required."
            );

        }

        if (
            data.pendingTies !== undefined &&
            !Array.isArray(
                data.pendingTies
            )
        ) {

            throw new Error(
                "Big road pending ties must be an array."
            );

        }

        const road =
            new BigRoad({

                rows:
                    data.rows ??
                    DEFAULT_OPTIONS.rows

            });

        const rounds = [];


        /**
         * 還原每個非 Tie 格與附加 Tie。
         */
        for (
            const entry of
            data.entries
        ) {

            rounds.push({

                roundIndex:
                    entry.roundIndex,

                data: {

                    winner:
                        entry.winner,

                    playerPair:
                        entry.playerPair,

                    bankerPair:
                        entry.bankerPair,

                    super6:
                        entry.super6,

                    margin:
                        entry.margin,

                    playerNatural:
                        entry.playerNatural,

                    bankerNatural:
                        entry.bankerNatural

                }

            });


            for (
                const tie of
                entry.ties ?? []
            ) {

                rounds.push({

                    roundIndex:
                        tie.roundIndex,

                    data: {

                        winner:
                            BigRoadWinner.TIE,

                        playerPair:
                            tie.playerPair,

                        bankerPair:
                            tie.bankerPair,

                        super6:
                            tie.super6,

                        margin:
                            tie.margin,

                        playerNatural:
                            tie.playerNatural,

                        bankerNatural:
                            tie.bankerNatural

                    }

                });

            }

        }


        /**
         * 還原尚未附加的 Tie。
         */
        for (
            const tie of
            data.pendingTies ?? []
        ) {

            rounds.push({

                roundIndex:
                    tie.roundIndex,

                data: {

                    winner:
                        BigRoadWinner.TIE,

                    playerPair:
                        tie.playerPair,

                    bankerPair:
                        tie.bankerPair,

                    super6:
                        tie.super6,

                    margin:
                        tie.margin,

                    playerNatural:
                        tie.playerNatural,

                    bankerNatural:
                        tie.bankerNatural

                }

            });

        }


        rounds.sort(
            (
                first,
                second
            ) =>
                first.roundIndex -
                second.roundIndex
        );


        road.addAll(
            rounds.map(
                item =>
                    item.data
            )
        );

        return road;

    }

}
