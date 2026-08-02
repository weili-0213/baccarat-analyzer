/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * EVTable Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. mount()
 * 3. 空資料狀態
 * 4. setEV()
 * 5. update()
 * 6. 正 EV / 負 EV / 中性
 * 7. 小數與百分比格式
 * 8. 分組顯示
 * 9. best
 * 10. positiveCount / negativeCount / neutralCount
 * 11. highlight()
 * 12. 點擊高亮
 * 13. setRows()
 * 14. setOptions()
 * 15. clear()
 * 16. summary
 * 17. toJSON()
 * 18. fromJSON()
 * 19. destroy()
 */

import createEVTable, {
    EVTable,
    DEFAULT_ROWS,
    GROUP_LABELS
} from "../components/EVTable.js";


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
        "evTableTestRoot";

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
 * 完整測試 EV
 */
function createEV() {

    return {

        player:
            -0.0124,

        banker:
            0.0048,

        tie:
            -0.1432,

        playerPair:
            -0.0412,

        bankerPair:
            0,

        eitherPair:
            -0.0321,

        super6:
            0.0187,

        playerNatural:
            -0.0215,

        bankerNatural:
            -0.0194,

        natural:
            -0.0276,

        big:
            -0.0098,

        small:
            0.0065,

        playerDragonBonus:
            -0.055,

        bankerDragonBonus:
            0.0112

    };

}


/**
 * EVTable 完整測試
 */
export default function evTableTest() {

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
            new EVTable({

                autoMount:
                    false

            });

        assert(
            unmounted instanceof EVTable,
            "EVTable 建立失敗"
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
            unmounted.hasData === false,
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
                new EVTable({

                    ev:
                        null,

                    autoMount:
                        false

                }),
            "ev 非物件時應拋出錯誤"
        );

        assertThrows(
            () =>
                new EVTable({

                    rows:
                        null,

                    autoMount:
                        false

                }),
            "rows 非陣列時應拋出錯誤"
        );

        assertThrows(
            () =>
                new EVTable({

                    digits:
                        -1,

                    autoMount:
                        false

                }),
            "非法 digits 應拋出錯誤"
        );

        assertThrows(
            () =>
                new EVTable({

                    percentDigits:
                        10,

                    autoMount:
                        false

                }),
            "非法 percentDigits 應拋出錯誤"
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
            createEVTable({

                root,

                autoMount:
                    true

            });

        assert(
            table instanceof EVTable,
            "工廠函式應回傳 EVTable"
        );

        assert(
            table.summary.mounted === true,
            "mount() 後 mounted 應為 true"
        );

        assert(
            root.querySelector(
                "[data-ev-table]"
            ),
            "掛載後應建立 EVTable DOM"
        );

        messages.push(
            "✓ 工廠函式與 mount() 正確"
        );


        /**
         * 5. 空資料狀態。
         */
        assert(
            root.querySelector(
                ".evEmpty"
            ),
            "空資料時應顯示 empty 狀態"
        );

        assert(
            root.textContent.includes(
                "尚無 EV 資料"
            ),
            "空資料提示文字錯誤"
        );

        assert(
            table.best === null,
            "空資料時 best 應為 null"
        );

        assert(
            table.positiveCount === 0 &&
            table.negativeCount === 0 &&
            table.neutralCount === 0,
            "空資料時正負中性計數應為 0"
        );

        messages.push(
            "✓ 空資料狀態正確"
        );


        /**
         * 6. setEV()。
         */
        const ev =
            createEV();

        table.setEV(
            ev
        );

        assert(
            table.hasData === true,
            "setEV() 後應有資料"
        );

        assert(
            table.getValue(
                "player"
            ) === ev.player,
            "Player EV 保存錯誤"
        );

        assert(
            table.getValue(
                "banker"
            ) === ev.banker,
            "Banker EV 保存錯誤"
        );

        assert(
            table.getValue(
                "tie"
            ) === ev.tie,
            "Tie EV 保存錯誤"
        );

        messages.push(
            "✓ setEV() 正確"
        );


        /**
         * 7. 所有預期列均顯示。
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
                    `[data-ev-key="${key}"]`
                ),
                `缺少 EV 列：${key}`
            );

        }

        messages.push(
            "✓ 主要下注與所有側注列顯示正確"
        );


        /**
         * 8. 正 EV / 負 EV / 中性。
         */
        const bankerRow =
            root.querySelector(
                '[data-ev-key="banker"]'
            );

        const playerRow =
            root.querySelector(
                '[data-ev-key="player"]'
            );

        const bankerPairRow =
            root.querySelector(
                '[data-ev-key="bankerPair"]'
            );

        assert(
            bankerRow.classList
                .contains(
                    "positive"
                ),
            "正 EV 列應具有 positive class"
        );

        assert(
            bankerRow.textContent
                .includes(
                    "正 EV"
                ),
            "正 EV 列應顯示正 EV"
        );

        assert(
            playerRow.classList
                .contains(
                    "negative"
                ),
            "負 EV 列應具有 negative class"
        );

        assert(
            playerRow.textContent
                .includes(
                    "負 EV"
                ),
            "負 EV 列應顯示負 EV"
        );

        assert(
            bankerPairRow.classList
                .contains(
                    "neutral"
                ),
            "EV 0 列應具有 neutral class"
        );

        assert(
            bankerPairRow.textContent
                .includes(
                    "中性"
                ),
            "EV 0 列應顯示中性"
        );

        messages.push(
            "✓ 正 EV、負 EV、中性狀態正確"
        );


        /**
         * 9. 小數與百分比格式。
         */
        assert(
            bankerRow.textContent
                .includes(
                    "+0.0048"
                ),
            "Banker EV 小數格式錯誤"
        );

        assert(
            bankerRow.textContent
                .includes(
                    "+0.48%"
                ),
            "Banker EV 百分比格式錯誤"
        );

        assert(
            playerRow.textContent
                .includes(
                    "-0.0124"
                ),
            "Player EV 小數格式錯誤"
        );

        assert(
            playerRow.textContent
                .includes(
                    "-1.24%"
                ),
            "Player EV 百分比格式錯誤"
        );

        messages.push(
            "✓ EV 小數與百分比格式正確"
        );


        /**
         * 10. 分組顯示。
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
                    `[data-ev-group="${group}"]`
                ),
                `缺少 EV 分組：${group}`
            );

        }

        assert(
            root.textContent.includes(
                "主要下注"
            ),
            "應顯示主要下注分組"
        );

        assert(
            root.textContent.includes(
                "龍寶"
            ),
            "應顯示龍寶分組"
        );

        messages.push(
            "✓ 分組顯示正確"
        );


        /**
         * 11. 計數。
         */
        const expectedPositive =
            Object.values(ev)
                .filter(
                    value =>
                        value > 0
                )
                .length;

        const expectedNegative =
            Object.values(ev)
                .filter(
                    value =>
                        value < 0
                )
                .length;

        const expectedNeutral =
            Object.values(ev)
                .filter(
                    value =>
                        value === 0
                )
                .length;

        assert(
            table.positiveCount ===
                expectedPositive,
            "positiveCount 錯誤"
        );

        assert(
            table.negativeCount ===
                expectedNegative,
            "negativeCount 錯誤"
        );

        assert(
            table.neutralCount ===
                expectedNeutral,
            "neutralCount 錯誤"
        );

        messages.push(
            "✓ 正負中性 EV 計數正確"
        );


        /**
         * 12. best。
         */
        assert(
            table.best !== null,
            "best 不應為 null"
        );

        assert(
            table.best.key ===
                "super6",
            "最佳 EV 應為 Super 6"
        );

        assert(
            approximatelyEqual(
                table.best.value,
                ev.super6
            ),
            "best.value 錯誤"
        );

        assert(
            root.querySelector(
                ".evTableFooter"
            )
                .textContent
                .includes(
                    "幸運 6"
                ),
            "Footer 應顯示最佳 EV 選項"
        );

        messages.push(
            "✓ best 與 Footer 正確"
        );


        /**
         * 13. update()。
         */
        table.update({

            player:
                -0.02,

            banker:
                0.01,

            tie:
                0

        });

        assert(
            table.getValue(
                "banker"
            ) === 0.01,
            "update() 沒有更新 Banker"
        );

        assert(
            root.textContent.includes(
                "+0.0100"
            ),
            "update() 後 DOM 未更新"
        );

        assert(
            table.best.key ===
                "banker",
            "update() 後 best 應為 Banker"
        );

        messages.push(
            "✓ update() 正確"
        );


        /**
         * 14. 非數字 EV 不顯示。
         */
        table.setEV({

            player:
                "invalid",

            banker:
                0.02

        });

        assert(
            table.getValue(
                "player"
            ) === null,
            "非數字 EV 應正規化為 null"
        );

        assert(
            !root.querySelector(
                '[data-ev-key="player"]'
            ),
            "非數字 EV 不應顯示"
        );

        assert(
            root.querySelector(
                '[data-ev-key="banker"]'
            ),
            "有效 EV 應顯示"
        );

        messages.push(
            "✓ 非數字 EV 處理正確"
        );


        /**
         * 15. highlight()。
         */
        table.setEV(
            ev
        );

        table.highlight(
            "super6"
        );

        assert(
            table.summary
                .highlightedKey ===
                "super6",
            "highlight() 沒有保存 key"
        );

        assert(
            root.querySelector(
                '[data-ev-key="super6"]'
            )
                .classList
                .contains(
                    "highlighted"
                ),
            "Super 6 列應顯示 highlighted"
        );

        assert(
            root.querySelector(
                '[data-ev-key="super6"]'
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
         * 16. 點擊切換高亮。
         */
        root.querySelector(
            '[data-ev-key="banker"]'
        ).click();

        assert(
            table.summary
                .highlightedKey ===
                "banker",
            "點擊列應高亮"
        );

        root.querySelector(
            '[data-ev-key="banker"]'
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
         * 17. setRows()。
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

        table.setEV({

            player:
                -0.01,

            banker:
                0.02

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
            table.summary.rowCount === 2,
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
         * 18. setOptions()。
         */
        table.setOptions({

            title:
                "自訂 EV 表",

            subtitle:
                "測試副標題",

            digits:
                3,

            percentDigits:
                1,

            grouped:
                false,

            showDescriptions:
                false,

            showPercent:
                false,

            showSignal:
                false,

            compact:
                true,

            emptyText:
                "沒有 EV"

        });

        assert(
            root.textContent.includes(
                "自訂 EV 表"
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
                "[data-ev-table]"
            )
                .classList
                .contains(
                    "compact"
                ),
            "compact 選項未生效"
        );

        assert(
            !root.querySelector(
                ".evGroup"
            ),
            "grouped=false 時不應顯示群組容器"
        );

        assert(
            !root.querySelector(
                ".evSignal"
            ),
            "showSignal=false 時不應顯示訊號"
        );

        assert(
            !root
                .querySelector(
                    '[data-ev-key="banker"]'
                )
                .textContent
                .includes(
                    "2.0%"
                ),
            "showPercent=false 時不應顯示百分比"
        );

        assert(
            root.textContent.includes(
                "+0.020"
            ),
            "digits=3 未生效"
        );

        assertThrows(
            () =>
                table.setOptions({

                    digits:
                        20

                }),
            "非法 digits 應拋出錯誤"
        );

        assertThrows(
            () =>
                table.setOptions({

                    percentDigits:
                        -1

                }),
            "非法 percentDigits 應拋出錯誤"
        );

        messages.push(
            "✓ setOptions() 正確"
        );


        /**
         * 19. summary。
         */
        const summary =
            table.summary;

        assert(
            summary.hasData === true,
            "summary.hasData 錯誤"
        );

        assert(
            summary.rowCount === 2,
            "summary.rowCount 錯誤"
        );

        assert(
            summary.positiveCount === 1,
            "summary.positiveCount 錯誤"
        );

        assert(
            summary.negativeCount === 1,
            "summary.negativeCount 錯誤"
        );

        assert(
            summary.neutralCount === 0,
            "summary.neutralCount 錯誤"
        );

        assert(
            summary.best.key ===
                "banker",
            "summary.best 錯誤"
        );

        assert(
            summary.mounted === true,
            "summary.mounted 錯誤"
        );

        messages.push(
            "✓ summary 正確"
        );


        /**
         * 20. toJSON()。
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
            json.ev.banker === 0.02,
            "JSON ev 錯誤"
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
                "自訂 EV 表",
            "JSON options 錯誤"
        );

        messages.push(
            "✓ toJSON() 正確"
        );


        /**
         * 21. fromJSON()。
         */
        const restoredRoot =
            createRoot();

        roots.push(
            restoredRoot
        );

        const restored =
            EVTable.fromJSON(
                json,
                {
                    root:
                        restoredRoot
                }
            );

        assert(
            restored instanceof EVTable,
            "fromJSON() 應回傳 EVTable"
        );

        assert(
            restored.getValue(
                "banker"
            ) === 0.02,
            "還原後 Banker EV 錯誤"
        );

        assert(
            restored.rows.length === 2,
            "還原後 rows 錯誤"
        );

        assert(
            restored.options.title ===
                "自訂 EV 表",
            "還原後 title 錯誤"
        );

        assert(
            restored.summary.mounted === true,
            "還原後應已掛載"
        );

        assertThrows(
            () =>
                EVTable.fromJSON(
                    null
                ),
            "fromJSON(null) 應拋出錯誤"
        );

        messages.push(
            "✓ fromJSON() 正確"
        );


        /**
         * 22. clear()。
         */
        restored.clear();

        assert(
            restored.hasData === false,
            "clear() 後 hasData 應為 false"
        );

        assert(
            restored.summary.rowCount === 0,
            "clear() 後 rowCount 應為 0"
        );

        assert(
            restoredRoot.textContent
                .includes(
                    "沒有 EV"
                ),
            "clear() 後應顯示自訂 emptyText"
        );

        messages.push(
            "✓ clear() 正確"
        );


        /**
         * 23. destroy()。
         */
        restored.destroy();

        assert(
            restored.summary.mounted === false,
            "destroy() 後 mounted 應為 false"
        );

        assert(
            restoredRoot.innerHTML === "",
            "destroy() 應清空 root"
        );

        messages.push(
            "✓ destroy() 正確"
        );


        return `
${messages.join("\n")}

EVTable 測試完成

完整 EV 範例：
Player：${ev.player}
Banker：${ev.banker}
Tie：${ev.tie}

計數：
正 EV：${expectedPositive}
負 EV：${expectedNegative}
中性：${expectedNeutral}

最佳 EV：
選項：Super 6
EV：${ev.super6}

自訂表格：
列數：${summary.rowCount}
最佳：${summary.best.label}
最佳 EV：${summary.best.value}
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
