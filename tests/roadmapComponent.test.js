/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Roadmap Component Test
 *
 * 路單 UI 元件測試
 */

import Roadmap, {
    createRoadmap
} from "../components/Roadmap.js";

import RoadmapAnalyzer
    from "../roadmap/roadmapAnalyzer.js";

import Game
    from "../engine/game.js";


function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(message);

    }

}


/**
 * 驗證指定函式必須丟出錯誤
 */
function assertThrows(
    callback,
    message
) {

    let thrown = false;

    try {

        callback();

    }
    catch {

        thrown = true;

    }

    assert(
        thrown,
        message
    );

}


/**
 * 建立測試容器
 */
function createTestRoot() {

    const root =
        document.createElement(
            "div"
        );

    root.className =
        "roadmap-component-test-root";

    document.body.append(
        root
    );

    return root;

}


/**
 * 建立空矩陣
 */
function createMatrix(
    rows = 6,
    columns = 3
) {

    return Array.from(
        {
            length: rows
        },
        () =>
            Array(
                columns
            ).fill(null)
    );

}


/**
 * 建立固定 ViewModel
 */
function createViewModel() {

    const beadRoad =
        createMatrix(6, 3);

    beadRoad[0][0] = {

        winner: "Player",

        playerPair: true,

        bankerPair: false,

        super6: false,

        margin: 4,

        playerNatural: true,

        bankerNatural: false

    };

    beadRoad[1][0] = {

        winner: "Banker",

        playerPair: false,

        bankerPair: true,

        super6: true,

        margin: 2,

        playerNatural: false,

        bankerNatural: false

    };

    beadRoad[2][0] = {

        winner: "Tie",

        playerPair: false,

        bankerPair: false,

        super6: false,

        margin: 0,

        playerNatural: false,

        bankerNatural: false

    };


    const bigRoad =
        createMatrix(6, 3);

    bigRoad[0][0] = {

        winner: "Player",

        playerPair: true,

        bankerPair: false,

        tieCount: 2,

        super6: false,

        margin: 4,

        playerNatural: true,

        bankerNatural: false

    };

    bigRoad[1][0] = {

        winner: "Player",

        playerPair: false,

        bankerPair: false,

        tieCount: 0,

        super6: false,

        margin: 1,

        playerNatural: false,

        bankerNatural: false

    };

    bigRoad[0][1] = {

        winner: "Banker",

        playerPair: false,

        bankerPair: true,

        tieCount: 0,

        super6: true,

        margin: 2,

        playerNatural: false,

        bankerNatural: false

    };


    const bigEyeRoad =
        createMatrix(6, 3);

    bigEyeRoad[0][0] = {

        color: "Red",

        sourceStreakIndex: 1,

        sourceDepth: 2,

        sourceWinner: "Banker"

    };

    bigEyeRoad[1][0] = {

        color: "Blue",

        sourceStreakIndex: 2,

        sourceDepth: 1,

        sourceWinner: "Player"

    };


    const smallRoad =
        createMatrix(6, 3);

    smallRoad[0][0] = {

        color: "Blue",

        sourceStreakIndex: 2,

        sourceDepth: 2,

        sourceWinner: "Player"

    };


    const cockroachRoad =
        createMatrix(6, 3);

    cockroachRoad[0][0] = {

        color: "Red",

        sourceStreakIndex: 3,

        sourceDepth: 2,

        sourceWinner: "Banker"

    };


    return {

        summary: {

            sourceRounds: 5,

            winners: {

                rounds: 5,

                player: 2,

                banker: 2,

                tie: 1

            }

        },

        matrices: {

            beadRoad,

            bigRoad,

            bigEyeRoad,

            smallRoad,

            cockroachRoad

        },

        trend: [

            "Player",

            "Banker",

            "Tie",

            "Player",

            "Banker"

        ],

        recentRounds: [

            {
                winner: "Player"
            },

            {
                winner: "Banker"
            }

        ]

    };

}


/**
 * 建立路單來源資料
 */
function resultEntry(
    winner,
    options = {}
) {

    return {

        winner,

        playerPair:
            options.playerPair ??
            false,

        bankerPair:
            options.bankerPair ??
            false,

        super6:
            options.super6 ??
            false,

        margin:
            options.margin ??
            0,

        playerNatural:
            options.playerNatural ??
            false,

        bankerNatural:
            options.bankerNatural ??
            false

    };

}


/**
 * 取得文字並壓縮空白
 */
function normalizedText(element) {

    return element
        ?.textContent
        ?.replace(
            /\s+/g,
            " "
        )
        .trim() ??
        "";

}


export default async function roadmapComponentTest() {

    const details = [];

    const cleanupRoots = [];


    try {

        /*
         * 測試 1：
         * Constructor 初始狀態
         */
        const component =
            new Roadmap();

        assert(
            component.root === null,
            "未指定 root 時應為 null"
        );

        assert(
            component.source === null,
            "未指定 source 時應為 null"
        );

        assert(
            component.element === null,
            "尚未 render 時 element 應為 null"
        );

        assert(
            component.mounted === false,
            "尚未 mount 時 mounted 應為 false"
        );

        assert(
            component.options.cellSize === 34,
            "預設 cellSize 應為 34"
        );

        assert(
            component.options.minimumColumns === 12,
            "預設 minimumColumns 應為 12"
        );

        assert(
            component.options.showSummary === true,
            "預設應顯示摘要"
        );

        assert(
            component.options.showLegend === true,
            "預設應顯示圖例"
        );

        details.push(
            "建立 Roadmap：PASS"
        );


        /*
         * 測試 2：
         * 沒有 root 時 mount() 應失敗
         */
        assertThrows(
            () => {

                component.mount();

            },
            "沒有 root 時 mount() 應丟出錯誤"
        );

        details.push(
            "mount() root 驗證：PASS"
        );


        /*
         * 測試 3：
         * 以 HTMLElement 掛載空路單
         */
        const emptyRoot =
            createTestRoot();

        cleanupRoots.push(
            emptyRoot
        );

        const emptyComponent =
            new Roadmap({

                root:
                    emptyRoot

            });

        const mountResult =
            emptyComponent.mount();

        assert(
            mountResult ===
                emptyComponent,
            "mount() 應回傳元件本身"
        );

        assert(
            emptyComponent.mounted ===
                true,
            "mount() 後 mounted 應為 true"
        );

        assert(
            emptyComponent.element !==
                null,
            "mount() 後應建立 element"
        );

        assert(
            emptyRoot.children.length ===
                1,
            "root 應包含一個元件"
        );

        assert(
            emptyRoot.querySelector(
                ".roadmap-component"
            ) ===
                emptyComponent.element,
            "root 應包含 Roadmap element"
        );

        assert(
            emptyRoot.querySelectorAll(
                ".roadmap-card"
            ).length === 5,
            "應建立五個路單區塊"
        );

        assert(
            emptyRoot.querySelectorAll(
                ".roadmap-empty"
            ).length === 5,
            "空資料時五個路單都應顯示空狀態"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-header__counter"
                )
            ).includes("0"),
            "空路單總局數應為 0"
        );

        details.push(
            "空資料掛載：PASS"
        );


        /*
         * 測試 4：
         * 五個路單標題
         */
        const cardTitles = [

            ...emptyRoot.querySelectorAll(
                ".roadmap-card__title"
            )

        ].map(
            element =>
                element.textContent
        );

        assert(
            JSON.stringify(
                cardTitles
            ) ===
            JSON.stringify([
                "珠盤路",
                "大路",
                "大眼仔",
                "小路",
                "曱甴路"
            ]),
            "五個路單標題順序不正確"
        );

        details.push(
            "五種路單標題：PASS"
        );


        /*
         * 測試 5：
         * 直接使用 ViewModel 更新
         */
        const viewModel =
            createViewModel();

        const updateResult =
            emptyComponent.update(
                viewModel
            );

        assert(
            updateResult ===
                emptyComponent,
            "update() 應回傳元件本身"
        );

        assert(
            emptyComponent.source ===
                viewModel,
            "update() 應保存來源"
        );

        assert(
            emptyRoot.querySelectorAll(
                ".roadmap-empty"
            ).length === 0,
            "有資料後不應顯示空狀態"
        );

        assert(
            emptyRoot.querySelectorAll(
                ".roadmap-grid"
            ).length === 5,
            "有資料後應建立五個矩陣"
        );

        details.push(
            "ViewModel update()：PASS"
        );


        /*
         * 測試 6：
         * Header 與勝負摘要
         */
        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-header__counter"
                )
            ).includes("5"),
            "Header 總局數應為 5"
        );

        const summaryItems =
            emptyRoot.querySelectorAll(
                ".roadmap-summary__item"
            );

        assert(
            summaryItems.length === 3,
            "應顯示三個勝負摘要"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-summary__item--player"
                )
            ).includes("2"),
            "Player 統計應為 2"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-summary__item--banker"
                )
            ).includes("2"),
            "Banker 統計應為 2"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-summary__item--tie"
                )
            ).includes("1"),
            "Tie 統計應為 1"
        );

        details.push(
            "勝負摘要：PASS"
        );


        /*
         * 測試 7：
         * Legend
         */
        const legend =
            emptyRoot.querySelector(
                ".roadmap-legend"
            );

        assert(
            legend !== null,
            "預設應顯示圖例"
        );

        assert(
            legend.querySelectorAll(
                ".roadmap-legend__item"
            ).length === 7,
            "圖例應有七個項目"
        );

        assert(
            normalizedText(
                legend
            ).includes("Player"),
            "圖例應包含 Player"
        );

        assert(
            normalizedText(
                legend
            ).includes("Banker"),
            "圖例應包含 Banker"
        );

        assert(
            normalizedText(
                legend
            ).includes("Tie"),
            "圖例應包含 Tie"
        );

        details.push(
            "路單圖例：PASS"
        );


        /*
         * 測試 8：
         * 珠盤路結果格
         */
        const beadCard =
            emptyRoot.querySelector(
                '[data-road="beadRoad"]'
            );

        assert(
            beadCard !== null,
            "應找到珠盤路卡片"
        );

        assert(
            beadCard.querySelectorAll(
                ".roadmap-cell--filled"
            ).length === 3,
            "珠盤路應有三個結果格"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell--player"
            ) !== null,
            "珠盤路應有 Player 格"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell--banker"
            ) !== null,
            "珠盤路應有 Banker 格"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell--tie"
            ) !== null,
            "珠盤路應有 Tie 格"
        );

        const beadSymbols = [

            ...beadCard.querySelectorAll(
                ".roadmap-cell__result-marker"
            )

        ].map(
            element =>
                element.textContent
        );

        assert(
            beadSymbols.includes("P"),
            "珠盤路應顯示 P"
        );

        assert(
            beadSymbols.includes("B"),
            "珠盤路應顯示 B"
        );

        assert(
            beadSymbols.includes("T"),
            "珠盤路應顯示 T"
        );

        details.push(
            "珠盤路結果格：PASS"
        );


        /*
         * 測試 9：
         * Pair、Super 6、Natural
         */
        assert(
            beadCard.querySelector(
                ".roadmap-cell__pair--player"
            ) !== null,
            "應顯示 Player Pair"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell__pair--banker"
            ) !== null,
            "應顯示 Banker Pair"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell__super6"
            ) !== null,
            "應顯示 Super 6"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell__natural"
            ) !== null,
            "應顯示 Natural"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell__super6"
            ).textContent === "6",
            "Super 6 標記應為 6"
        );

        assert(
            beadCard.querySelector(
                ".roadmap-cell__natural"
            ).textContent === "N",
            "Natural 標記應為 N"
        );

        details.push(
            "Pair／Super6／Natural：PASS"
        );


        /*
         * 測試 10：
         * 大路 Tie 疊加
         */
        const bigRoadCard =
            emptyRoot.querySelector(
                '[data-road="bigRoad"]'
            );

        assert(
            bigRoadCard !== null,
            "應找到大路卡片"
        );

        assert(
            bigRoadCard.querySelectorAll(
                ".roadmap-cell--filled"
            ).length === 3,
            "大路應有三格"
        );

        const tieBadge =
            bigRoadCard.querySelector(
                ".roadmap-cell__tie-badge"
            );

        assert(
            tieBadge !== null,
            "大路應顯示 Tie badge"
        );

        assert(
            tieBadge.textContent === "2",
            "兩個 Tie 應顯示數字 2"
        );

        assert(
            tieBadge.title ===
                "Tie × 2",
            "Tie badge title 不正確"
        );

        details.push(
            "大路 Tie 疊加：PASS"
        );


        /*
         * 測試 11：
         * 衍生路紅藍格
         */
        const bigEyeCard =
            emptyRoot.querySelector(
                '[data-road="bigEyeRoad"]'
            );

        const smallCard =
            emptyRoot.querySelector(
                '[data-road="smallRoad"]'
            );

        const cockroachCard =
            emptyRoot.querySelector(
                '[data-road="cockroachRoad"]'
            );

        assert(
            bigEyeCard.querySelectorAll(
                ".roadmap-cell__derived-marker"
            ).length === 2,
            "大眼仔應有兩個衍生格"
        );

        assert(
            bigEyeCard.querySelector(
                ".roadmap-cell--red"
            ) !== null,
            "大眼仔應有 Red"
        );

        assert(
            bigEyeCard.querySelector(
                ".roadmap-cell--blue"
            ) !== null,
            "大眼仔應有 Blue"
        );

        assert(
            smallCard.querySelector(
                ".roadmap-cell--blue"
            ) !== null,
            "小路應有 Blue"
        );

        assert(
            cockroachCard.querySelector(
                ".roadmap-cell--red"
            ) !== null,
            "曱甴路應有 Red"
        );

        const derivedCell =
            bigEyeCard.querySelector(
                ".roadmap-cell--red"
            );

        assert(
            derivedCell.title.includes(
                "來源第 2 條"
            ),
            "衍生格 title 應包含來源 streak"
        );

        assert(
            derivedCell.title.includes(
                "深度 2"
            ),
            "衍生格 title 應包含來源深度"
        );

        details.push(
            "衍生路紅藍格：PASS"
        );


        /*
         * 測試 12：
         * 每張卡片顯示格數
         */
        assert(
            normalizedText(
                beadCard.querySelector(
                    ".roadmap-card__meta"
                )
            ) === "3 格",
            "珠盤路格數應為 3"
        );

        assert(
            normalizedText(
                bigRoadCard.querySelector(
                    ".roadmap-card__meta"
                )
            ) === "3 格",
            "大路格數應為 3"
        );

        assert(
            normalizedText(
                bigEyeCard.querySelector(
                    ".roadmap-card__meta"
                )
            ) === "2 格",
            "大眼仔格數應為 2"
        );

        assert(
            normalizedText(
                smallCard.querySelector(
                    ".roadmap-card__meta"
                )
            ) === "1 格",
            "小路格數應為 1"
        );

        assert(
            normalizedText(
                cockroachCard.querySelector(
                    ".roadmap-card__meta"
                )
            ) === "1 格",
            "曱甴路格數應為 1"
        );

        details.push(
            "路單格數顯示：PASS"
        );


        /*
         * 測試 13：
         * Grid rows、columns 與 cellSize
         */
        const customRoot =
            createTestRoot();

        cleanupRoots.push(
            customRoot
        );

        const customComponent =
            new Roadmap({

                root:
                    customRoot,

                source:
                    viewModel,

                cellSize: 40,

                minimumColumns: 8

            });

        customComponent.mount();

        const customGrid =
            customRoot.querySelector(
                '[data-road="beadRoad"] .roadmap-grid'
            );

        assert(
            customGrid.style.getPropertyValue(
                "--roadmap-cell-size"
            ) === "40px",
            "自訂 cellSize 應為 40px"
        );

        assert(
            customGrid.getAttribute(
                "aria-rowcount"
            ) === "6",
            "Grid 應有六列"
        );

        assert(
            customGrid.getAttribute(
                "aria-colcount"
            ) === "8",
            "minimumColumns 應使 Grid 至少八欄"
        );

        assert(
            customGrid.querySelectorAll(
                ".roadmap-cell"
            ).length === 48,
            "六列八欄應產生 48 個格子"
        );

        details.push(
            "Grid 尺寸與欄數：PASS"
        );


        /*
         * 測試 14：
         * 關閉摘要與圖例
         */
        const minimalRoot =
            createTestRoot();

        cleanupRoots.push(
            minimalRoot
        );

        const minimalComponent =
            new Roadmap({

                root:
                    minimalRoot,

                source:
                    viewModel,

                showSummary:
                    false,

                showLegend:
                    false

            });

        minimalComponent.mount();

        assert(
            minimalRoot.querySelector(
                ".roadmap-summary"
            ) === null,
            "showSummary=false 不應建立摘要"
        );

        assert(
            minimalRoot.querySelector(
                ".roadmap-legend"
            ) === null,
            "showLegend=false 不應建立圖例"
        );

        assert(
            minimalRoot.querySelectorAll(
                ".roadmap-card"
            ).length === 5,
            "關閉摘要與圖例仍應顯示五種路單"
        );

        details.push(
            "摘要與圖例選項：PASS"
        );


        /*
         * 測試 15：
         * 使用 CSS selector 掛載
         */
        const selectorRoot =
            createTestRoot();

        cleanupRoots.push(
            selectorRoot
        );

        selectorRoot.id =
            `roadmap-test-${Date.now()}`;

        const selectorComponent =
            new Roadmap({

                root:
                    `#${selectorRoot.id}`,

                source:
                    viewModel

            });

        selectorComponent.mount();

        assert(
            selectorComponent.root ===
                selectorRoot,
            "CSS selector 應解析為正確 HTMLElement"
        );

        assert(
            selectorRoot.querySelector(
                ".roadmap-component"
            ) !== null,
            "CSS selector 掛載應成功"
        );

        details.push(
            "CSS selector 掛載：PASS"
        );


        /*
         * 測試 16：
         * RoadmapAnalyzer 作為來源
         */
        const analyzerSource = [

            resultEntry("Player"),

            resultEntry("Player"),

            resultEntry("Banker"),

            resultEntry("Player"),

            resultEntry("Player"),

            resultEntry("Banker"),

            resultEntry("Banker"),

            resultEntry("Player")

        ];

        const analyzer =
            new RoadmapAnalyzer();

        analyzer.build(
            analyzerSource
        );

        const analyzerRoot =
            createTestRoot();

        cleanupRoots.push(
            analyzerRoot
        );

        const analyzerComponent =
            new Roadmap({

                root:
                    analyzerRoot,

                source:
                    analyzer

            });

        analyzerComponent.mount();

        assert(
            normalizedText(
                analyzerRoot.querySelector(
                    ".roadmap-header__counter"
                )
            ).includes("8"),
            "RoadmapAnalyzer 來源總局數應為 8"
        );

        assert(
            analyzerRoot.querySelectorAll(
                '[data-road="beadRoad"] .roadmap-cell--filled'
            ).length === 8,
            "RoadmapAnalyzer 應建立八個珠盤路格"
        );

        assert(
            analyzerRoot.querySelectorAll(
                '[data-road="bigRoad"] .roadmap-cell--filled'
            ).length === 8,
            "無 Tie 時大路應有八格"
        );

        details.push(
            "RoadmapAnalyzer 來源：PASS"
        );


        /*
         * 測試 17：
         * Game 作為來源
         */
        const game =
            new Game({

                deckCount: 1,

                autoShuffle: false,

                autoBurn: false

            });

        game.addResults([

            resultEntry("Player"),

            resultEntry("Tie"),

            resultEntry("Banker")

        ]);

        const gameRoot =
            createTestRoot();

        cleanupRoots.push(
            gameRoot
        );

        const gameComponent =
            new Roadmap({

                root:
                    gameRoot,

                source:
                    game

            });

        gameComponent.mount();

        assert(
            normalizedText(
                gameRoot.querySelector(
                    ".roadmap-header__counter"
                )
            ).includes("3"),
            "Game 來源總局數應為 3"
        );

        assert(
            gameRoot.querySelectorAll(
                '[data-road="beadRoad"] .roadmap-cell--filled'
            ).length === 3,
            "Game 來源珠盤路應有三格"
        );

        assert(
            gameRoot.querySelectorAll(
                '[data-road="bigRoad"] .roadmap-cell--filled'
            ).length === 2,
            "Game 來源有一局 Tie，大路應有兩格"
        );

        details.push(
            "Game 來源：PASS"
        );


        /*
         * 測試 18：
         * setSource()
         */
        const newViewModel =
            createViewModel();

        newViewModel.summary.sourceRounds =
            9;

        const setSourceResult =
            component.setSource(
                newViewModel
            );

        assert(
            setSourceResult ===
                component,
            "setSource() 應回傳元件本身"
        );

        assert(
            component.source ===
                newViewModel,
            "setSource() 應保存來源"
        );

        details.push(
            "setSource()：PASS"
        );


        /*
         * 測試 19：
         * render() 可在沒有 root 時建立 DOM
         */
        const detached =
            new Roadmap({

                source:
                    viewModel

            });

        const detachedElement =
            detached.render();

        assert(
            detachedElement instanceof
                HTMLElement,
            "render() 應回傳 HTMLElement"
        );

        assert(
            detached.getElement() ===
                detachedElement,
            "getElement() 應回傳目前元件"
        );

        assert(
            detachedElement.parentNode ===
                null,
            "沒有 root 時 render() 應建立未掛載 DOM"
        );

        assert(
            detachedElement.querySelectorAll(
                ".roadmap-card"
            ).length === 5,
            "未掛載 render() 仍應建立五張路單"
        );

        details.push(
            "獨立 render()：PASS"
        );


        /*
         * 測試 20：
         * update() 應替換舊 DOM
         */
        const beforeElement =
            emptyComponent.element;

        const updatedViewModel =
            createViewModel();

        updatedViewModel.summary.sourceRounds =
            7;

        updatedViewModel.summary
            .winners.player = 4;

        emptyComponent.update(
            updatedViewModel
        );

        assert(
            emptyComponent.element !==
                beforeElement,
            "update() 應建立新的元件 DOM"
        );

        assert(
            beforeElement.isConnected ===
                false,
            "舊 DOM 應被移除"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-header__counter"
                )
            ).includes("7"),
            "update() 後總局數應更新為 7"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-summary__item--player"
                )
            ).includes("4"),
            "update() 後 Player 統計應更新"
        );

        details.push(
            "update() 重繪：PASS"
        );


        /*
         * 測試 21：
         * clear()
         */
        const clearResult =
            emptyComponent.clear();

        assert(
            clearResult ===
                emptyComponent,
            "clear() 應回傳元件本身"
        );

        assert(
            emptyComponent.source === null,
            "clear() 後 source 應為 null"
        );

        assert(
            emptyRoot.querySelectorAll(
                ".roadmap-empty"
            ).length === 5,
            "clear() 後五種路單應顯示空狀態"
        );

        assert(
            normalizedText(
                emptyRoot.querySelector(
                    ".roadmap-header__counter"
                )
            ).includes("0"),
            "clear() 後總局數應為 0"
        );

        details.push(
            "clear()：PASS"
        );


        /*
         * 測試 22：
         * createRoadmap()
         */
        const factoryComponent =
            createRoadmap({

                source:
                    viewModel

            });

        assert(
            factoryComponent instanceof
                Roadmap,
            "createRoadmap() 應回傳 Roadmap"
        );

        assert(
            factoryComponent.source ===
                viewModel,
            "工廠函式應保存 options"
        );

        details.push(
            "createRoadmap()：PASS"
        );


        /*
         * 測試 23：
         * destroy()
         */
        const destroyRoot =
            createTestRoot();

        cleanupRoots.push(
            destroyRoot
        );

        const destroyComponent =
            new Roadmap({

                root:
                    destroyRoot,

                source:
                    viewModel

            });

        destroyComponent.mount();

        const destroyedElement =
            destroyComponent.element;

        const destroyResult =
            destroyComponent.destroy();

        assert(
            destroyResult ===
                destroyComponent,
            "destroy() 應回傳元件本身"
        );

        assert(
            destroyedElement.isConnected ===
                false,
            "destroy() 應移除元件 DOM"
        );

        assert(
            destroyComponent.element ===
                null,
            "destroy() 後 element 應為 null"
        );

        assert(
            destroyComponent.root === null,
            "destroy() 後 root 應為 null"
        );

        assert(
            destroyComponent.source ===
                null,
            "destroy() 後 source 應為 null"
        );

        assert(
            destroyComponent.mounted ===
                false,
            "destroy() 後 mounted 應為 false"
        );

        details.push(
            "destroy()：PASS"
        );


        /*
         * 測試 24：
         * 非法 root
         */
        assertThrows(
            () => {

                new Roadmap({

                    root:
                        {}

                });

            },
            "非法 root 類型應丟出錯誤"
        );

        assertThrows(
            () => {

                new Roadmap({

                    root:
                        "#roadmap-root-not-found"

                });

            },
            "不存在的 selector 應丟出錯誤"
        );

        details.push(
            "非法 root 驗證：PASS"
        );


        /*
         * 測試 25：
         * 非法 options
         */
        assertThrows(
            () => {

                new Roadmap({

                    cellSize: 0

                });

            },
            "cellSize = 0 應丟出錯誤"
        );

        assertThrows(
            () => {

                new Roadmap({

                    cellSize: 1.5

                });

            },
            "cellSize 非整數應丟出錯誤"
        );

        assertThrows(
            () => {

                new Roadmap({

                    minimumColumns: 0

                });

            },
            "minimumColumns = 0 應丟出錯誤"
        );

        details.push(
            "非法 options 驗證：PASS"
        );


        /*
         * 測試 26：
         * 非法 source
         */
        const invalidSourceComponent =
            new Roadmap();

        assertThrows(
            () => {

                invalidSourceComponent
                    .resolveViewModel({});

            },
            "不支援的 source 應丟出錯誤"
        );

        assertThrows(
            () => {

                invalidSourceComponent
                    .update({
                        unknown: true
                    });

            },
            "update() 非法來源應丟出錯誤"
        );

        details.push(
            "非法 source 驗證：PASS"
        );


        /*
         * 最終摘要
         */
        const finalSummary = {

            roadCards:
                customRoot
                    .querySelectorAll(
                        ".roadmap-card"
                    )
                    .length,

            grids:
                customRoot
                    .querySelectorAll(
                        ".roadmap-grid"
                    )
                    .length,

            beadCells:
                beadCard
                    .querySelectorAll(
                        ".roadmap-cell--filled"
                    )
                    .length,

            bigRoadCells:
                bigRoadCard
                    .querySelectorAll(
                        ".roadmap-cell--filled"
                    )
                    .length,

            bigEyeCells:
                bigEyeCard
                    .querySelectorAll(
                        ".roadmap-cell--filled"
                    )
                    .length

        };


        return [

            "Roadmap Component 測試全部完成",

            "",

            ...details,

            "",

            "元件支援來源：",

            "Game",

            "RoadmapAnalyzer",

            "Roadmap ViewModel",

            "",

            `路單區塊：${finalSummary.roadCards}`,

            `矩陣數量：${finalSummary.grids}`,

            `珠盤路資料格：${finalSummary.beadCells}`,

            `大路資料格：${finalSummary.bigRoadCells}`,

            `大眼仔資料格：${finalSummary.bigEyeCells}`,

            "",

            "UI 標記：",

            "Player / Banker / Tie",

            "Player Pair / Banker Pair",

            "Tie Badge / Super 6 / Natural",

            "Red / Blue Derived Road"

        ].join("\n");

    }
    finally {

        /*
         * 清除測試建立的 DOM，
         * 避免影響 Test Runner 畫面。
         */
        for (
            const root of
            cleanupRoots
        ) {

            if (root.isConnected) {

                root.remove();

            }

        }

    }

}
