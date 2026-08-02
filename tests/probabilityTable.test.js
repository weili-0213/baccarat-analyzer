/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * ProbabilityTable Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. mount()
 * 3. 空資料狀態
 * 4. setProbability()
 * 5. update()
 * 6. 主要下注機率
 * 7. 側注機率
 * 8. 分組顯示
 * 9. 百分比格式
 * 10. 進度條
 * 11. mainTotal
 * 12. highlight()
 * 13. 點擊高亮
 * 14. setRows()
 * 15. setOptions()
 * 16. clear()
 * 17. summary
 * 18. toJSON()
 * 19. fromJSON()
 * 20. destroy()
 */

import createProbabilityTable, {
    ProbabilityTable,
    DEFAULT_ROWS,
    GROUP_LABELS
} from "../components/ProbabilityTable.js";


/**
 * 斷言工具
 */
function assert(
    condition,
    message
) {

    if (!condition) {

        throw new Error(
            message
        );

    }

}


/**
 * 浮點近似比較
 */
function approximatelyEqual(
    left,
    right,
    tolerance = 1e-12
) {

    return (
        Math.abs(
            left - right
        ) <= tolerance
    );

}


/**
 * 預期同步錯誤
 */
function assertThrows(
    callback,
    message
) {

    let error =
        null;

    try {

        callback();

    }
    catch (caught) {

        error =
            caught;

    }

    assert(
        error instanceof Error,
        message
    );

    return error;

}


/**
 * 建立測試 Root
 */
function createRoot() {

    const root =
        document.createElement(
            "div"
        );

    root.className =
        "probabilityTableTestRoot";

    document.body.appendChild(
        root
    );

    return root;

}


/**
 * 移除測試 Root
 */
function removeRoot(root) {

    root?.remove();

}


/**
 * 完整測試機率
 */
function createProbability() {

    return {

        player:
            0.4462,

        banker:
            0.4586,

        tie:
            0.0952,

        playerPair:
            0.0741,

        bankerPair:
            0.0749,

        eitherPair:
            0.1435,

        super6:
            0.0538,

        playerNatural:
            0.162,

        bankerNatural:
            0.164,

        natural:
            0.298,

        big:
            0.754,

        small:
            0.246,

        playerDragonBonus:
            0.031,

        bankerDragonBonus:
            0.034

    };

}


/**
 * ProbabilityTable 完整測試
 */
export default function probabilityTableTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. 匯出常數。
         */
        assert(
            Array.isArray(
                DEFAULT_ROWS
            ),
            "DEFAULT_ROWS 應為陣列"
        );

        assert(
            DEFAULT_ROWS.length >= 14,
            "DEFAULT_ROWS 應包含完整下注選項"
        );

        assert(
            GROUP_LABELS.main ===
                "主要下注",
            "GROUP_LABELS.main 錯誤"
        );

        messages.push(
            "✓ DEFAULT_ROWS 與 GROUP_LABELS 正確"
        );


        /**
         * 2. constructor()。
         */
        const unmounted =
            new ProbabilityTable({

                autoMount:
                    false

            });

        assert(
            unmounted instanceof
                ProbabilityTable,
            "ProbabilityTable 建立失敗"
        );

        assert(
            unmounted.root === null,
            "未指定 root 時 root 應為 null"
        );

        assert(
            unmounted.summary.mounted ===
                false,
            "未掛載元件 mounted 應為 false"
        );

        assert(
            unmounted.hasData ===
                false,
            "空資料時 hasData 應為 false"
        );

        messages.push(
            "✓ constructor() 正確"
        );


        /**
         * 3. 非法參數。
         */
        assertThrows(
            () =>
                new ProbabilityTable({

                    probability:
                        null,

                    autoMount:
                        false

                }),
            "probability 非物件時應拋出錯誤"
        );

        assertThrows(
            () =>
                new ProbabilityTable({

                    rows:
                        null,

                    autoMount:
                        false

                }),
            "rows 非陣列時應拋出錯誤"
        );

        assertThrows(
            () =>
                new ProbabilityTable({

                    digits:
                        -1,

                    autoMount:
                        false

                }),
            "非法 digits 應拋出錯誤"
        );

        messages.push(
            "✓ 建構參數驗證正確"
        );


        /**
         * 4. 工廠函式與 mount()。
         */
        const root =
            createRoot();

        roots.push(root);

        const table =
            createProbabilityTable({

                root,

                autoMount:
                    true

            });

        assert(
            table instanceof
                ProbabilityTable,
            "工廠函式應回傳 ProbabilityTable"
        );

        assert(
            table.summary.mounted ===
                true,
            "mount() 後 mounted 應為 true"
        );

        assert(
            root.querySelector(
                "[data-probability-table]"
            ),
            "掛載後應建立 ProbabilityTable DOM"
        );

        messages.push(
            "✓ 工廠函式與 mount() 正確"
        );


        /**
         * 5. 空資料狀態。
         */
        assert(
            root.querySelector(
                ".probabilityEmpty"
            ),
            "空資料時應顯示 empty 狀態"
        );

        assert(
            root.textContent.includes(
                "尚無機率資料"
            ),
            "空資料提示文字錯誤"
        );

        assert(
            table.mainTotal === null,
            "空資料時 mainTotal 應為 null"
        );

        messages.push(
            "✓ 空資料狀態正確"
        );


        /**
         * 6. setProbability()。
         */
        const probability =
            createProbability();

        table.setProbability(
            probability
        );

        assert(
            table.hasData ===
                true,
            "setProbability() 後應有資料"
        );

        assert(
            table.getValue(
                "player"
            ) ===
                probability.player,
            "Player 機率保存錯誤"
        );

        assert(
            table.getValue(
                "banker"
            ) ===
                probability.banker,
            "Banker 機率保存錯誤"
        );

        assert(
            table.getValue(
                "tie"
            ) ===
                probability.tie,
            "Tie 機率保存錯誤"
        );

        messages.push(
            "✓ setProbability() 正確"
        );


        /**
         * 7. 主要下注總和。
         */
        assert(
            approximatelyEqual(
                table.mainTotal,
                1
            ),
            "Player + Banker + Tie 應等於 1"
        );

        assert(
            root.textContent.includes(
                "Player + Banker + Tie"
            ),
            "Footer 應顯示主結果總和"
        );

        assert(
            root.querySelector(
                ".probabilityTableFooter .valid"
            ),
            "主結果總和正確時應顯示 valid"
        );

        messages.push(
            "✓ mainTotal 與 Footer 驗證正確"
        );


        /**
         * 8. 所有預期列均顯示。
         */
        const expectedKeys = [

            "player",
            "banker",
            "tie",
            "playerPair",
            "bankerPair",
            "eitherPair",
            "super6",
            "playerNatural",
            "bankerNatural",
            "natural",
            "big",
            "small",
            "playerDragonBonus",
            "bankerDragonBonus"

        ];

        for (
            const key of
            expectedKeys
        ) {

            assert(
                root.querySelector(
                    `[data-probability-key="${key}"]`
                ),
                `缺少機率列：${key}`
            );

        }

        messages.push(
            "✓ 主要下注與所有側注列顯示正確"
        );


        /**
         * 9. 分組顯示。
         */
        const groups = [

            "main",
            "pair",
            "side",
            "natural",
            "size",
            "dragon"

        ];

        for (
            const group of
            groups
        ) {

            assert(
                root.querySelector(
                    `[data-probability-group="${group}"]`
                ),
                `缺少分組：${group}`
            );

        }

        assert(
            root.textContent.includes(
                "主要下注"
            ),
            "應顯示主要下注分組標題"
        );

        assert(
            root.textContent.includes(
                "龍寶"
            ),
            "應顯示龍寶分組標題"
        );

        messages.push(
            "✓ 分組顯示正確"
        );


        /**
         * 10. 百分比格式。
         */
        const playerRow =
            root.querySelector(
                '[data-probability-key="player"]'
            );

        assert(
            playerRow.textContent.includes(
                "44.62%"
            ),
            "Player 百分比格式錯誤"
        );

        const tieRow =
            root.querySelector(
                '[data-probability-key="tie"]'
            );

        assert(
            tieRow.textContent.includes(
                "9.52%"
            ),
            "Tie 百分比格式錯誤"
        );

        messages.push(
            "✓ 百分比格式正確"
        );


        /**
         * 11. 進度條寬度。
         */
        const playerBar =
            playerRow.querySelector(
                ".probabilityBarFill"
            );

        assert(
            playerBar.style.width ===
                "44.62%",
            "Player 進度條寬度錯誤"
        );

        messages.push(
            "✓ 機率進度條正確"
        );


        /**
         * 12. update()。
         */
        table.update({

            player:
                0.4,

            banker:
                0.5,

            tie:
                0.1

        });

        assert(
            table.getValue(
                "player"
            ) === 0.4,
            "update() 沒有更新 Player"
        );

        assert(
            root.textContent.includes(
                "40.00%"
            ),
            "update() 後 DOM 未更新"
        );

        assert(
            approximatelyEqual(
                table.mainTotal,
                1
            ),
            "update() 後 mainTotal 錯誤"
        );

        messages.push(
            "✓ update() 正確"
        );


        /**
         * 13. 超出範圍機率會被顯示層限制。
         */
        table.setProbability({

            player:
                1.2,

            banker:
                -0.1,

            tie:
                0.2

        });

        assert(
            table.getValue(
                "player"
            ) === 1,
            "大於 1 的機率應限制為 1"
        );

        assert(
            table.getValue(
                "banker"
            ) === 0,
            "小於 0 的機率應限制為 0"
        );

        messages.push(
            "✓ 顯示層機率範圍限制正確"
        );


        /**
         * 14. highlight()。
         */
        table.setProbability(
            probability
        );

        table.highlight(
            "banker"
        );

        assert(
            table.summary
                .highlightedKey ===
                "banker",
            "highlight() 沒有保存 key"
        );

        assert(
            root.querySelector(
                '[data-probability-key="banker"]'
            )
                .classList
                .contains(
                    "highlighted"
                ),
            "Banker 列應顯示 highlighted"
        );

        assert(
            root.querySelector(
                '[data-probability-key="banker"]'
            )
                .getAttribute(
                    "aria-pressed"
                ) ===
                "true",
            "高亮列 aria-pressed 應為 true"
        );

        table.highlight(
            null
        );

        assert(
            table.summary
                .highlightedKey ===
                null,
            "highlight(null) 應取消高亮"
        );

        messages.push(
            "✓ highlight() 正確"
        );


        /**
         * 15. 點擊切換高亮。
         */
        const bankerRow =
            root.querySelector(
                '[data-probability-key="banker"]'
            );

        bankerRow.click();

        assert(
            table.summary
                .highlightedKey ===
                "banker",
            "點擊列應高亮"
        );

        root.querySelector(
            '[data-probability-key="banker"]'
        ).click();

        assert(
            table.summary
                .highlightedKey ===
                null,
            "再次點擊應取消高亮"
        );

        messages.push(
            "✓ 點擊高亮切換正確"
        );


        /**
         * 16. setRows()。
         */
        table.setRows([

            {
                key:
                    "player",

                label:
                    "自訂閒",

                group:
                    "custom",

                description:
                    "Custom Player"
            },

            {
                key:
                    "banker",

                label:
                    "自訂莊",

                group:
                    "custom",

                description:
                    "Custom Banker"
            }

        ]);

        table.setProbability({

            player:
                0.48,

            banker:
                0.52

        });

        assert(
            root.textContent.includes(
                "自訂閒"
            ),
            "setRows() 自訂 Player 標籤未顯示"
        );

        assert(
            root.textContent.includes(
                "自訂莊"
            ),
            "setRows() 自訂 Banker 標籤未顯示"
        );

        assert(
            table.summary.rowCount ===
                2,
            "自訂 rows 後 rowCount 應為 2"
        );

        assertThrows(
            () =>
                table.setRows(
                    null
                ),
            "setRows(null) 應拋出錯誤"
        );

        messages.push(
            "✓ setRows() 正確"
        );


        /**
         * 17. setOptions()。
         */
        table.setOptions({

            title:
                "自訂機率表",

            subtitle:
                "測試副標題",

            digits:
                3,

            grouped:
                false,

            showBars:
                false,

            showDescriptions:
                false,

            compact:
                true,

            emptyText:
                "沒有資料"

        });

        assert(
            root.textContent.includes(
                "自訂機率表"
            ),
            "title 未更新"
        );

        assert(
            root.textContent.includes(
                "測試副標題"
            ),
            "subtitle 未更新"
        );

        assert(
            root.querySelector(
                "[data-probability-table]"
            )
                .classList
                .contains(
                    "compact"
                ),
            "compact 選項未生效"
        );

        assert(
            !root.querySelector(
                ".probabilityBar"
            ),
            "showBars=false 時不應顯示進度條"
        );

        assert(
            !root.querySelector(
                ".probabilityGroup"
            ),
            "grouped=false 時不應顯示群組容器"
        );

        assert(
            root.textContent.includes(
                "48.000%"
            ),
            "digits=3 未生效"
        );

        assertThrows(
            () =>
                table.setOptions({

                    digits:
                        10

                }),
            "非法 digits 應拋出錯誤"
        );

        messages.push(
            "✓ setOptions() 正確"
        );


        /**
         * 18. summary。
         */
        const summary =
            table.summary;

        assert(
            summary.hasData ===
                true,
            "summary.hasData 錯誤"
        );

        assert(
            summary.rowCount ===
                2,
            "summary.rowCount 錯誤"
        );

        assert(
            summary.probability.player ===
                0.48,
            "summary probability.player 錯誤"
        );

        assert(
            summary.mounted ===
                true,
            "summary.mounted 錯誤"
        );

        messages.push(
            "✓ summary 正確"
        );


        /**
         * 19. toJSON()。
         */
        const json =
            table.toJSON();

        assert(
            json &&
            typeof json ===
                "object",
            "toJSON() 應回傳物件"
        );

        assert(
            json.probability.player ===
                0.48,
            "JSON probability 錯誤"
        );

        assert(
            Array.isArray(
                json.rows
            ) &&
            json.rows.length === 2,
            "JSON rows 錯誤"
        );

        assert(
            json.options.title ===
                "自訂機率表",
            "JSON options 錯誤"
        );

        messages.push(
            "✓ toJSON() 正確"
        );


        /**
         * 20. fromJSON()。
         */
        const restoredRoot =
            createRoot();

        roots.push(
            restoredRoot
        );

        const restored =
            ProbabilityTable.fromJSON(
                json,
                {
                    root:
                        restoredRoot
                }
            );

        assert(
            restored instanceof
                ProbabilityTable,
            "fromJSON() 應回傳 ProbabilityTable"
        );

        assert(
            restored.getValue(
                "player"
            ) === 0.48,
            "還原後 Player 機率錯誤"
        );

        assert(
            restored.rows.length === 2,
            "還原後 rows 錯誤"
        );

        assert(
            restored.options.title ===
                "自訂機率表",
            "還原後 title 錯誤"
        );

        assert(
            restored.summary.mounted ===
                true,
            "還原後應已掛載"
        );

        assertThrows(
            () =>
                ProbabilityTable.fromJSON(
                    null
                ),
            "fromJSON(null) 應拋出錯誤"
        );

        messages.push(
            "✓ fromJSON() 正確"
        );


        /**
         * 21. clear()。
         */
        restored.clear();

        assert(
            restored.hasData ===
                false,
            "clear() 後 hasData 應為 false"
        );

        assert(
            restored.summary.rowCount ===
                0,
            "clear() 後 rowCount 應為 0"
        );

        assert(
            restoredRoot.textContent
                .includes(
                    "沒有資料"
                ),
            "clear() 後應顯示自訂 emptyText"
        );

        messages.push(
            "✓ clear() 正確"
        );


        /**
         * 22. destroy()。
         */
        restored.destroy();

        assert(
            restored.summary.mounted ===
                false,
            "destroy() 後 mounted 應為 false"
        );

        assert(
            restoredRoot.innerHTML ===
                "",
            "destroy() 應清空 root"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        return `
${messages.join("\n")}

ProbabilityTable 測試完成

完整機率範例：
Player：${probability.player}
Banker：${probability.banker}
Tie：${probability.tie}
主結果總和：${
    probability.player +
    probability.banker +
    probability.tie
}

側注：
Player Pair：${probability.playerPair}
Banker Pair：${probability.bankerPair}
Super 6：${probability.super6}
Player Dragon Bonus：${probability.playerDragonBonus}
Banker Dragon Bonus：${probability.bankerDragonBonus}

自訂表格：
列數：${summary.rowCount}
Player：${summary.probability.player}
Banker：${summary.probability.banker}
`;

    }
    finally {

        for (
            const root of
            roots
        ) {

            removeRoot(
                root
            );

        }

    }

}
