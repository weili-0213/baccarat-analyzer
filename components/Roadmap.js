/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Roadmap Component v1
 *
 * 路單 UI 元件
 *
 * 顯示：
 *
 * 1. Bead Road
 * 2. Big Road
 * 3. Big Eye Road
 * 4. Small Road
 * 5. Cockroach Road
 */

const ROAD_CONFIG = Object.freeze({

    beadRoad: {

        key: "beadRoad",

        title: "珠盤路",

        subtitle: "Bead Road",

        type: "result"

    },

    bigRoad: {

        key: "bigRoad",

        title: "大路",

        subtitle: "Big Road",

        type: "result"

    },

    bigEyeRoad: {

        key: "bigEyeRoad",

        title: "大眼仔",

        subtitle: "Big Eye Road",

        type: "derived"

    },

    smallRoad: {

        key: "smallRoad",

        title: "小路",

        subtitle: "Small Road",

        type: "derived"

    },

    cockroachRoad: {

        key: "cockroachRoad",

        title: "曱甴路",

        subtitle: "Cockroach Road",

        type: "derived"

    }

});


const ROAD_ORDER = Object.freeze([

    "beadRoad",

    "bigRoad",

    "bigEyeRoad",

    "smallRoad",

    "cockroachRoad"

]);


/**
 * 建立 DOM Element
 */
function createElement(
    tagName,
    className = "",
    text = ""
) {

    const element =
        document.createElement(
            tagName
        );

    if (className) {

        element.className =
            className;

    }

    if (
        text !== undefined &&
        text !== null &&
        text !== ""
    ) {

        element.textContent =
            String(text);

    }

    return element;

}


/**
 * 判斷是否為物件
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
 * 安全轉成非負整數
 */
function toNonNegativeInteger(
    value,
    fallback = 0
) {

    return (

        Number.isInteger(value) &&
        value >= 0

    )
        ? value
        : fallback;

}


/**
 * 安全取得矩陣欄數
 */
function getMatrixColumnCount(matrix) {

    if (!Array.isArray(matrix)) {

        return 0;

    }

    return matrix.reduce(

        (
            maximum,
            row
        ) => {

            if (!Array.isArray(row)) {

                return maximum;

            }

            return Math.max(
                maximum,
                row.length
            );

        },

        0

    );

}


/**
 * 深度複製簡單 ViewModel
 */
function cloneViewModel(viewModel) {

    if (!isObject(viewModel)) {

        return {

            summary: {},

            matrices: {},

            trend: [],

            recentRounds: []

        };

    }

    return {

        summary:
            isObject(viewModel.summary)
                ? viewModel.summary
                : {},

        matrices:
            isObject(viewModel.matrices)
                ? viewModel.matrices
                : {},

        trend:
            Array.isArray(
                viewModel.trend
            )
                ? [...viewModel.trend]
                : [],

        recentRounds:
            Array.isArray(
                viewModel.recentRounds
            )
                ? [
                    ...viewModel
                        .recentRounds
                ]
                : []

    };

}


export default class Roadmap {

    constructor({

        root = null,

        source = null,

        cellSize = 34,

        minimumColumns = 12,

        showSummary = true,

        showLegend = true

    } = {}) {

        this.root =
            this.resolveRoot(root);

        this.source =
            source;

        this.options = {

            cellSize:
                this.validatePositiveInteger(
                    cellSize,
                    "cellSize"
                ),

            minimumColumns:
                this.validatePositiveInteger(
                    minimumColumns,
                    "minimumColumns"
                ),

            showSummary:
                Boolean(showSummary),

            showLegend:
                Boolean(showLegend)

        };

        this.viewModel =
            this.createEmptyViewModel();

        this.element = null;

        this.mounted = false;

    }


    /**
     * 驗證正整數
     */
    validatePositiveInteger(
        value,
        name
    ) {

        if (
            !Number.isInteger(value) ||
            value < 1
        ) {

            throw new RangeError(
                `${name} must be a positive integer.`
            );

        }

        return value;

    }


    /**
     * 解析 root
     *
     * 支援：
     * - HTMLElement
     * - CSS selector
     * - null
     */
    resolveRoot(root) {

        if (root === null) {

            return null;

        }

        if (
            typeof HTMLElement !==
                "undefined" &&
            root instanceof HTMLElement
        ) {

            return root;

        }

        if (
            typeof root ===
            "string"
        ) {

            const element =
                document.querySelector(
                    root
                );

            if (!element) {

                throw new Error(
                    `Roadmap root not found: ${root}`
                );

            }

            return element;

        }

        throw new TypeError(
            "Roadmap root must be an HTMLElement, selector, or null."
        );

    }


    /**
     * 空 ViewModel
     */
    createEmptyViewModel() {

        return {

            summary: {

                sourceRounds: 0,

                winners: {

                    player: 0,

                    banker: 0,

                    tie: 0

                }

            },

            matrices: {

                beadRoad: [],

                bigRoad: [],

                bigEyeRoad: [],

                smallRoad: [],

                cockroachRoad: []

            },

            trend: [],

            recentRounds: []

        };

    }


    /**
     * 將來源轉成 Roadmap ViewModel
     *
     * 支援：
     *
     * 1. Game
     * 2. RoadmapAnalyzer
     * 3. Roadmap ViewModel
     */
    resolveViewModel(source) {

        if (!source) {

            return this.createEmptyViewModel();

        }


        /**
         * Game：
         *
         * game.roadmapViewModel
         */
        if (
            isObject(
                source.roadmapViewModel
            )
        ) {

            return cloneViewModel(
                source.roadmapViewModel
            );

        }


        /**
         * Game：
         *
         * game.roadmapAnalyzer.toViewModel()
         */
        if (
            source.roadmapAnalyzer &&
            typeof source
                .roadmapAnalyzer
                .toViewModel ===
                "function"
        ) {

            return cloneViewModel(

                source
                    .roadmapAnalyzer
                    .toViewModel()

            );

        }


        /**
         * RoadmapAnalyzer
         */
        if (
            typeof source.toViewModel ===
                "function"
        ) {

            return cloneViewModel(
                source.toViewModel()
            );

        }


        /**
         * 已經是 ViewModel
         */
        if (
            isObject(source.matrices)
        ) {

            return cloneViewModel(
                source
            );

        }


        throw new TypeError(
            "Unsupported Roadmap source."
        );

    }


    /**
     * 設定資料來源
     */
    setSource(source) {

        this.source =
            source;

        return this;

    }


    /**
     * 掛載元件
     */
    mount(root = this.root) {

        if (root !== this.root) {

            this.root =
                this.resolveRoot(root);

        }

        if (!this.root) {

            throw new Error(
                "Roadmap root is required."
            );

        }

        this.render();

        this.mounted = true;

        return this;

    }


    /**
     * 更新畫面
     */
    update(source = this.source) {

        this.source =
            source;

        this.viewModel =
            this.resolveViewModel(
                source
            );

        if (
            this.root ||
            this.element
        ) {

            this.render();

        }

        return this;

    }


    /**
     * 清空元件資料
     */
    clear() {

        this.source = null;

        this.viewModel =
            this.createEmptyViewModel();

        if (
            this.root ||
            this.element
        ) {

            this.render();

        }

        return this;

    }


    /**
     * 主渲染
     */
    render(source = this.source) {

        this.viewModel =
            this.resolveViewModel(
                source
            );

        const component =
            createElement(
                "section",
                "roadmap-component"
            );

        component.dataset.component =
            "roadmap";

        component.append(
            this.renderHeader()
        );

        if (
            this.options.showSummary
        ) {

            component.append(
                this.renderSummary()
            );

        }

        if (
            this.options.showLegend
        ) {

            component.append(
                this.renderLegend()
            );

        }

        const roadsContainer =
            createElement(
                "div",
                "roadmap-list"
            );

        for (
            const roadName of
            ROAD_ORDER
        ) {

            roadsContainer.append(
                this.renderRoad(
                    roadName
                )
            );

        }

        component.append(
            roadsContainer
        );

        this.replaceElement(
            component
        );

        return component;

    }


    /**
     * 替換目前 Element
     */
    replaceElement(component) {

        if (
            this.element &&
            this.element.parentNode
        ) {

            this.element.replaceWith(
                component
            );

        }
        else if (this.root) {

            this.root.replaceChildren(
                component
            );

        }

        this.element =
            component;

    }


    /**
     * 標題區
     */
    renderHeader() {

        const header =
            createElement(
                "header",
                "roadmap-header"
            );

        const titleGroup =
            createElement(
                "div",
                "roadmap-header__title-group"
            );

        titleGroup.append(

            createElement(
                "h2",
                "roadmap-header__title",
                "路單"
            ),

            createElement(
                "p",
                "roadmap-header__subtitle",
                "Baccarat Roadmaps"
            )

        );

        const count =
            this.getSourceRoundCount();

        const counter =
            createElement(
                "div",
                "roadmap-header__counter"
            );

        counter.append(

            createElement(
                "span",
                "roadmap-header__counter-label",
                "總局數"
            ),

            createElement(
                "strong",
                "roadmap-header__counter-value",
                count
            )

        );

        header.append(
            titleGroup,
            counter
        );

        return header;

    }


    /**
     * 取得總局數
     */
    getSourceRoundCount() {

        const summary =
            this.viewModel.summary;

        if (
            Number.isInteger(
                summary?.sourceRounds
            )
        ) {

            return summary.sourceRounds;

        }

        if (
            Number.isInteger(
                summary?.winners?.rounds
            )
        ) {

            return summary.winners.rounds;

        }

        if (
            Array.isArray(
                this.viewModel.trend
            )
        ) {

            return this.viewModel
                .trend
                .length;

        }

        return 0;

    }


    /**
     * 統計摘要
     */
    renderSummary() {

        const summary =
            this.viewModel.summary ?? {};

        const winners =
            summary.winners ?? {};

        const player =
            toNonNegativeInteger(
                winners.player
            );

        const banker =
            toNonNegativeInteger(
                winners.banker
            );

        const tie =
            toNonNegativeInteger(
                winners.tie
            );

        const container =
            createElement(
                "div",
                "roadmap-summary"
            );

        container.append(

            this.renderSummaryItem(
                "Player",
                player,
                "player"
            ),

            this.renderSummaryItem(
                "Banker",
                banker,
                "banker"
            ),

            this.renderSummaryItem(
                "Tie",
                tie,
                "tie"
            )

        );

        return container;

    }


    /**
     * 單一摘要
     */
    renderSummaryItem(
        label,
        value,
        type
    ) {

        const item =
            createElement(
                "div",
                [
                    "roadmap-summary__item",
                    `roadmap-summary__item--${type}`
                ].join(" ")
            );

        item.append(

            createElement(
                "span",
                "roadmap-summary__label",
                label
            ),

            createElement(
                "strong",
                "roadmap-summary__value",
                value
            )

        );

        return item;

    }


    /**
     * 圖例
     */
    renderLegend() {

        const legend =
            createElement(
                "div",
                "roadmap-legend"
            );

        legend.setAttribute(
            "aria-label",
            "路單圖例"
        );

        legend.append(

            this.renderLegendItem(
                "P",
                "Player",
                "player"
            ),

            this.renderLegendItem(
                "B",
                "Banker",
                "banker"
            ),

            this.renderLegendItem(
                "T",
                "Tie",
                "tie"
            ),

            this.renderLegendItem(
                "●",
                "Red",
                "red"
            ),

            this.renderLegendItem(
                "●",
                "Blue",
                "blue"
            ),

            this.renderLegendItem(
                "P",
                "Player Pair",
                "player-pair"
            ),

            this.renderLegendItem(
                "B",
                "Banker Pair",
                "banker-pair"
            )

        );

        return legend;

    }


    /**
     * 單一圖例
     */
    renderLegendItem(
        symbol,
        label,
        type
    ) {

        const item =
            createElement(
                "span",
                "roadmap-legend__item"
            );

        const marker =
            createElement(
                "span",
                [
                    "roadmap-legend__marker",
                    `roadmap-legend__marker--${type}`
                ].join(" "),
                symbol
            );

        marker.setAttribute(
            "aria-hidden",
            "true"
        );

        item.append(

            marker,

            createElement(
                "span",
                "roadmap-legend__label",
                label
            )

        );

        return item;

    }


    /**
     * 渲染單一路單
     */
    renderRoad(roadName) {

        const config =
            ROAD_CONFIG[roadName];

        if (!config) {

            throw new Error(
                `Unknown road: ${roadName}`
            );

        }

        const matrix =
            this.getMatrix(
                roadName
            );

        const section =
            createElement(
                "article",
                [
                    "roadmap-card",
                    `roadmap-card--${roadName}`
                ].join(" ")
            );

        section.dataset.road =
            roadName;

        section.append(
            this.renderRoadHeader(
                config,
                matrix
            )
        );

        const viewport =
            createElement(
                "div",
                "roadmap-card__viewport"
            );

        viewport.tabIndex = 0;

        viewport.setAttribute(
            "role",
            "region"
        );

        viewport.setAttribute(
            "aria-label",
            config.title
        );

        if (
            this.isMatrixEmpty(
                matrix
            )
        ) {

            viewport.append(
                this.renderEmptyRoad(
                    config
                )
            );

        }
        else {

            viewport.append(
                this.renderMatrix(
                    matrix,
                    config
                )
            );

        }

        section.append(
            viewport
        );

        return section;

    }


    /**
     * 路單標題
     */
    renderRoadHeader(
        config,
        matrix
    ) {

        const header =
            createElement(
                "header",
                "roadmap-card__header"
            );

        const titleGroup =
            createElement(
                "div",
                "roadmap-card__title-group"
            );

        titleGroup.append(

            createElement(
                "h3",
                "roadmap-card__title",
                config.title
            ),

            createElement(
                "span",
                "roadmap-card__subtitle",
                config.subtitle
            )

        );

        const cellCount =
            this.countMatrixCells(
                matrix
            );

        const meta =
            createElement(
                "div",
                "roadmap-card__meta",
                `${cellCount} 格`
            );

        header.append(
            titleGroup,
            meta
        );

        return header;

    }


    /**
     * 取得矩陣
     */
    getMatrix(roadName) {

        const matrix =
            this.viewModel
                ?.matrices
                ?.[roadName];

        return Array.isArray(matrix)
            ? matrix
            : [];

    }


    /**
     * 矩陣是否沒有資料
     */
    isMatrixEmpty(matrix) {

        return (
            this.countMatrixCells(
                matrix
            ) === 0
        );

    }


    /**
     * 計算矩陣非空格數
     */
    countMatrixCells(matrix) {

        if (!Array.isArray(matrix)) {

            return 0;

        }

        return matrix.reduce(

            (
                total,
                row
            ) => {

                if (!Array.isArray(row)) {

                    return total;

                }

                return (

                    total +

                    row.filter(
                        cell =>
                            cell !== null &&
                            cell !== undefined
                    ).length

                );

            },

            0

        );

    }


    /**
     * 空路單提示
     */
    renderEmptyRoad(config) {

        const empty =
            createElement(
                "div",
                "roadmap-empty"
            );

        empty.append(

            createElement(
                "span",
                "roadmap-empty__icon",
                "—"
            ),

            createElement(
                "span",
                "roadmap-empty__text",
                `${config.title}尚無資料`
            )

        );

        return empty;

    }


    /**
     * 渲染矩陣
     */
    renderMatrix(
        matrix,
        config
    ) {

        const rows =
            Math.max(
                matrix.length,
                1
            );

        const columns =
            Math.max(

                getMatrixColumnCount(
                    matrix
                ),

                this.options
                    .minimumColumns

            );

        const grid =
            createElement(
                "div",
                [
                    "roadmap-grid",
                    `roadmap-grid--${config.type}`
                ].join(" ")
            );

        grid.style.setProperty(
            "--roadmap-cell-size",
            `${this.options.cellSize}px`
        );

        grid.style.gridTemplateRows =
            `repeat(${rows}, var(--roadmap-cell-size))`;

        grid.style.gridTemplateColumns =
            `repeat(${columns}, var(--roadmap-cell-size))`;

        grid.setAttribute(
            "role",
            "grid"
        );

        grid.setAttribute(
            "aria-rowcount",
            String(rows)
        );

        grid.setAttribute(
            "aria-colcount",
            String(columns)
        );


        for (
            let rowIndex = 0;
            rowIndex < rows;
            rowIndex++
        ) {

            for (
                let columnIndex = 0;
                columnIndex < columns;
                columnIndex++
            ) {

                const cell =

                    matrix[
                        rowIndex
                    ]?.[
                        columnIndex
                    ] ??
                    null;

                grid.append(
                    this.renderCell({

                        cell,

                        config,

                        row:
                            rowIndex,

                        column:
                            columnIndex

                    })
                );

            }

        }

        return grid;

    }


    /**
     * 渲染格子
     */
    renderCell({

        cell,

        config,

        row,

        column

    }) {

        const element =
            createElement(
                "div",
                "roadmap-cell"
            );

        element.dataset.row =
            String(row);

        element.dataset.column =
            String(column);

        element.setAttribute(
            "role",
            "gridcell"
        );


        if (!cell) {

            element.classList.add(
                "roadmap-cell--empty"
            );

            element.setAttribute(
                "aria-label",
                `第 ${row + 1} 列，第 ${column + 1} 欄，空白`
            );

            return element;

        }


        element.classList.add(
            "roadmap-cell--filled"
        );


        if (
            config.type ===
            "derived"
        ) {

            this.renderDerivedCell(
                element,
                cell
            );

        }
        else {

            this.renderResultCell(
                element,
                cell,
                config.key
            );

        }

        return element;

    }


    /**
     * 渲染珠盤路／大路格
     */
    renderResultCell(
        element,
        cell,
        roadName
    ) {

        const winner =
            cell.winner ?? "";

        const winnerType =
            this.normalizeWinner(
                winner
            );

        element.classList.add(
            `roadmap-cell--${winnerType}`
        );

        const marker =
            createElement(
                "span",
                "roadmap-cell__result-marker",
                this.getWinnerSymbol(
                    winner
                )
            );

        element.append(
            marker
        );


        /**
         * Player Pair
         */
        if (cell.playerPair) {

            element.append(
                this.renderPairMarker(
                    "P",
                    "player"
                )
            );

        }


        /**
         * Banker Pair
         */
        if (cell.bankerPair) {

            element.append(
                this.renderPairMarker(
                    "B",
                    "banker"
                )
            );

        }


        /**
         * 大路 Tie 疊加
         */
        const tieCount =
            toNonNegativeInteger(
                cell.tieCount
            );

        if (
            roadName === "bigRoad" &&
            tieCount > 0
        ) {

            element.append(
                this.renderTieBadge(
                    tieCount
                )
            );

        }


        /**
         * Super 6
         */
        if (cell.super6) {

            const super6 =
                createElement(
                    "span",
                    "roadmap-cell__super6",
                    "6"
                );

            super6.title =
                "Super 6";

            element.append(
                super6
            );

        }


        /**
         * Natural
         */
        if (
            cell.playerNatural ||
            cell.bankerNatural
        ) {

            const natural =
                createElement(
                    "span",
                    "roadmap-cell__natural",
                    "N"
                );

            natural.title =
                "Natural";

            element.append(
                natural
            );

        }


        element.title =
            this.createResultTitle(
                cell
            );

        element.setAttribute(
            "aria-label",
            element.title
        );

    }


    /**
     * 渲染衍生路格
     */
    renderDerivedCell(
        element,
        cell
    ) {

        const color =
            this.normalizeColor(
                cell.color
            );

        element.classList.add(
            `roadmap-cell--${color}`
        );

        const marker =
            createElement(
                "span",
                "roadmap-cell__derived-marker"
            );

        marker.setAttribute(
            "aria-hidden",
            "true"
        );

        element.append(
            marker
        );

        const sourceText =
            this.createDerivedSourceText(
                cell
            );

        element.title =
            `${cell.color ?? "Unknown"}${sourceText}`;

        element.setAttribute(
            "aria-label",
            element.title
        );

    }


    /**
     * Pair 標記
     */
    renderPairMarker(
        text,
        type
    ) {

        const marker =
            createElement(
                "span",
                [
                    "roadmap-cell__pair",
                    `roadmap-cell__pair--${type}`
                ].join(" "),
                text
            );

        marker.title =
            type === "player"
                ? "Player Pair"
                : "Banker Pair";

        return marker;

    }


    /**
     * Tie 次數標記
     */
    renderTieBadge(count) {

        const badge =
            createElement(
                "span",
                "roadmap-cell__tie-badge",
                count > 1
                    ? String(count)
                    : "T"
            );

        badge.title =
            `Tie × ${count}`;

        return badge;

    }


    /**
     * Winner CSS 名稱
     */
    normalizeWinner(winner) {

        switch (winner) {

            case "Player":

                return "player";

            case "Banker":

                return "banker";

            case "Tie":

                return "tie";

            default:

                return "unknown";

        }

    }


    /**
     * Winner 顯示文字
     */
    getWinnerSymbol(winner) {

        switch (winner) {

            case "Player":

                return "P";

            case "Banker":

                return "B";

            case "Tie":

                return "T";

            default:

                return "?";

        }

    }


    /**
     * 衍生路顏色 CSS 名稱
     */
    normalizeColor(color) {

        switch (color) {

            case "Red":

                return "red";

            case "Blue":

                return "blue";

            default:

                return "unknown";

        }

    }


    /**
     * 建立結果格說明
     */
    createResultTitle(cell) {

        const parts = [

            cell.winner ??
                "Unknown"

        ];

        if (cell.playerPair) {

            parts.push(
                "Player Pair"
            );

        }

        if (cell.bankerPair) {

            parts.push(
                "Banker Pair"
            );

        }

        if (
            toNonNegativeInteger(
                cell.tieCount
            ) > 0
        ) {

            parts.push(
                `Tie × ${cell.tieCount}`
            );

        }

        if (cell.super6) {

            parts.push(
                "Super 6"
            );

        }

        if (cell.playerNatural) {

            parts.push(
                "Player Natural"
            );

        }

        if (cell.bankerNatural) {

            parts.push(
                "Banker Natural"
            );

        }

        if (
            Number.isFinite(
                cell.margin
            )
        ) {

            parts.push(
                `Margin ${cell.margin}`
            );

        }

        return parts.join(" · ");

    }


    /**
     * 建立衍生格來源說明
     */
    createDerivedSourceText(cell) {

        const parts = [];

        if (
            Number.isInteger(
                cell.sourceStreakIndex
            )
        ) {

            parts.push(
                `來源第 ${cell.sourceStreakIndex + 1} 條`
            );

        }

        if (
            Number.isInteger(
                cell.sourceDepth
            )
        ) {

            parts.push(
                `深度 ${cell.sourceDepth}`
            );

        }

        if (cell.sourceWinner) {

            parts.push(
                cell.sourceWinner
            );

        }

        return parts.length > 0
            ? ` · ${parts.join(" · ")}`
            : "";

    }


    /**
     * 取得目前 DOM
     */
    getElement() {

        return this.element;

    }


    /**
     * 移除元件
     */
    destroy() {

        if (
            this.element &&
            this.element.parentNode
        ) {

            this.element.remove();

        }

        this.element = null;

        this.root = null;

        this.source = null;

        this.viewModel =
            this.createEmptyViewModel();

        this.mounted = false;

        return this;

    }

}


/**
 * 函式式建立方式
 */
export function createRoadmap(options = {}) {

    return new Roadmap(options);

}
