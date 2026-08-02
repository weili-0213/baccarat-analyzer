/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * CardInput Test
 *
 * 測試範圍：
 *
 * 1. constructor()
 * 2. mount()
 * 3. 預設 Rank / Suit
 * 4. getValue()
 * 5. setValue()
 * 6. setRank()
 * 7. setSuit()
 * 8. setSide()
 * 9. setLabel()
 * 10. setDisabled()
 * 11. setLoading()
 * 12. setOptions()
 * 13. clear()
 * 14. onChange
 * 15. onSubmit
 * 16. 送出失敗與錯誤狀態
 * 17. Click 選牌
 * 18. Select change
 * 19. Enter 鍵送出
 * 20. summary
 * 21. toJSON()
 * 22. fromJSON()
 * 23. destroy()
 */

import createCardInput, {
    CardInput,
    RANKS,
    SUITS
} from "../components/CardInput.js";


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
        "cardInputTestRoot";

    document.body.appendChild(
        root
    );

    return root;

}


/**
 * 清除測試 Root
 */
function removeRoot(root) {

    root?.remove();

}


/**
 * 等待一次事件循環
 */
function nextTick() {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                0
            )
    );

}


/**
 * CardInput 完整測試
 */
export default async function cardInputTest() {

    const messages = [];

    const roots = [];


    try {

        /**
         * 1. 匯出內容。
         */
        assert(
            Array.isArray(RANKS),
            "RANKS 應為陣列"
        );

        assert(
            RANKS.length === 13,
            "RANKS 應有 13 個 Rank"
        );

        assert(
            Array.isArray(SUITS),
            "SUITS 應為陣列"
        );

        assert(
            SUITS.length === 4,
            "SUITS 應有 4 個 Suit"
        );

        messages.push(
            "✓ RANKS 與 SUITS 匯出正確"
        );


        /**
         * 2. constructor()。
         */
        const unmounted =
            new CardInput({

                autoMount:
                    false

            });

        assert(
            unmounted instanceof
                CardInput,
            "CardInput 建立失敗"
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

        messages.push(
            "✓ constructor() 正確"
        );


        /**
         * 3. 非法建構參數。
         */
        assertThrows(
            () =>
                new CardInput({
                    rank:
                        "1",
                    autoMount:
                        false
                }),
            "非法 Rank 應拋出錯誤"
        );

        assertThrows(
            () =>
                new CardInput({
                    suit:
                        "X",
                    autoMount:
                        false
                }),
            "非法 Suit 應拋出錯誤"
        );

        assertThrows(
            () =>
                new CardInput({
                    cardNumber:
                        0,
                    autoMount:
                        false
                }),
            "非法 cardNumber 應拋出錯誤"
        );

        assertThrows(
            () =>
                new CardInput({
                    onSubmit:
                        "invalid",
                    autoMount:
                        false
                }),
            "非法 onSubmit 應拋出錯誤"
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

        const input =
            createCardInput({

                root,

                autoMount:
                    true

            });

        assert(
            input instanceof CardInput,
            "工廠函式應回傳 CardInput"
        );

        assert(
            input.root === root,
            "mount() 應保存 root"
        );

        assert(
            input.summary.mounted ===
                true,
            "掛載後 mounted 應為 true"
        );

        assert(
            root.querySelector(
                "[data-card-input]"
            ),
            "掛載後應產生 CardInput DOM"
        );

        messages.push(
            "✓ 工廠函式與 mount() 正確"
        );


        /**
         * 5. 預設值與 getValue()。
         */
        const defaultValue =
            input.getValue();

        assert(
            defaultValue.rank === "A",
            "預設 Rank 應為 A"
        );

        assert(
            defaultValue.suit === "S",
            "預設 Suit 應為 S"
        );

        assert(
            input.displayLabel ===
                "第 1 張牌",
            "預設顯示標籤錯誤"
        );

        messages.push(
            "✓ 預設值與 getValue() 正確"
        );


        /**
         * 6. setValue() 與 onChange。
         */
        let changeCount = 0;

        let lastChangedValue =
            null;

        const changeRoot =
            createRoot();

        roots.push(changeRoot);

        const changeInput =
            new CardInput({

                root:
                    changeRoot,

                onChange(
                    value
                ) {

                    changeCount++;

                    lastChangedValue = {

                        ...value

                    };

                }

            });

        changeInput.setValue({

            rank:
                "10",

            suit:
                "D"

        });

        assert(
            changeInput.getValue().rank ===
                "10",
            "setValue() Rank 更新失敗"
        );

        assert(
            changeInput.getValue().suit ===
                "D",
            "setValue() Suit 更新失敗"
        );

        assert(
            changeCount === 1,
            "setValue() 應呼叫一次 onChange"
        );

        assert(
            lastChangedValue.rank ===
                "10" &&
            lastChangedValue.suit ===
                "D",
            "onChange 回傳值錯誤"
        );

        messages.push(
            "✓ setValue() 與 onChange 正確"
        );


        /**
         * 7. setRank() / setSuit()。
         */
        changeInput.setRank(
            "K"
        );

        changeInput.setSuit(
            "H"
        );

        assert(
            changeInput.getValue().rank ===
                "K",
            "setRank() 失敗"
        );

        assert(
            changeInput.getValue().suit ===
                "H",
            "setSuit() 失敗"
        );

        assert(
            changeCount === 3,
            "setRank() 與 setSuit() 應各觸發 onChange"
        );

        messages.push(
            "✓ setRank() 與 setSuit() 正確"
        );


        /**
         * 8. setSide()。
         */
        changeInput.setSide(
            "player",
            2
        );

        assert(
            changeInput.summary.side ===
                "player",
            "setSide() side 錯誤"
        );

        assert(
            changeInput.summary.cardNumber ===
                2,
            "setSide() cardNumber 錯誤"
        );

        assert(
            changeInput.displayLabel ===
                "Player／閒家 第 2 張",
            "Player 顯示標籤錯誤"
        );

        changeInput.setSide(
            "莊家",
            3
        );

        assert(
            changeInput.summary.side ===
                "banker",
            "中文莊家應正規化為 banker"
        );

        assert(
            changeInput.displayLabel ===
                "Banker／莊家 第 3 張",
            "Banker 顯示標籤錯誤"
        );

        assertThrows(
            () =>
                changeInput.setSide(
                    "invalid",
                    1
                ),
            "非法 side 應拋出錯誤"
        );

        messages.push(
            "✓ setSide() 正確"
        );


        /**
         * 9. setLabel()。
         */
        changeInput.setLabel(
            "燒牌指示牌"
        );

        assert(
            changeInput.displayLabel ===
                "燒牌指示牌",
            "setLabel() 失敗"
        );

        assert(
            changeRoot
                .querySelector(
                    ".cardInputTitle"
                )
                .textContent
                .trim() ===
                "燒牌指示牌",
            "自訂 label 沒有顯示"
        );

        messages.push(
            "✓ setLabel() 正確"
        );


        /**
         * 10. setDisabled()。
         */
        changeInput.setDisabled(
            true
        );

        assert(
            changeInput.isDisabled ===
                true,
            "setDisabled(true) 失敗"
        );

        assert(
            changeRoot
                .querySelector(
                    "[data-card-input-rank]"
                )
                .disabled ===
                true,
            "disabled 時 Rank select 應停用"
        );

        assert(
            changeRoot
                .querySelector(
                    "[data-card-input-action='submit']"
                )
                .disabled ===
                true,
            "disabled 時送出按鈕應停用"
        );

        changeInput.setDisabled(
            false
        );

        assert(
            changeInput.isDisabled ===
                false,
            "setDisabled(false) 失敗"
        );

        messages.push(
            "✓ setDisabled() 正確"
        );


        /**
         * 11. setLoading()。
         */
        changeInput.setLoading(
            true
        );

        assert(
            changeInput.isDisabled ===
                true,
            "loading 時元件應視為 disabled"
        );

        assert(
            changeRoot.textContent
                .includes(
                    "處理中"
                ),
            "loading 時應顯示處理中"
        );

        changeInput.setLoading(
            false
        );

        assert(
            changeInput.isDisabled ===
                false,
            "取消 loading 後應恢復可用"
        );

        messages.push(
            "✓ setLoading() 正確"
        );


        /**
         * 12. setOptions()。
         */
        changeInput.setOptions({

            compact:
                true,

            showQuickRanks:
                false,

            showPreview:
                false,

            submitText:
                "確認輸入",

            cardNumber:
                1,

            side:
                "player"

        });

        assert(
            changeRoot
                .querySelector(
                    "[data-card-input]"
                )
                .classList
                .contains(
                    "compact"
                ),
            "compact 選項未生效"
        );

        assert(
            !changeRoot.querySelector(
                ".cardInputQuickRanks"
            ),
            "showQuickRanks=false 時不應顯示快捷 Rank"
        );

        assert(
            !changeRoot.querySelector(
                ".cardInputPreview"
            ),
            "showPreview=false 時不應顯示預覽"
        );

        assert(
            changeRoot.textContent
                .includes(
                    "確認輸入"
                ),
            "submitText 未更新"
        );

        messages.push(
            "✓ setOptions() 正確"
        );


        /**
         * 13. clear()。
         */
        changeInput.clear({

            rank:
                "3",

            suit:
                "C",

            keepSide:
                false

        });

        assert(
            changeInput.getValue().rank ===
                "3" &&
            changeInput.getValue().suit ===
                "C",
            "clear() 沒有重設指定牌面"
        );

        assert(
            changeInput.summary.side ===
                null,
            "keepSide=false 應清除 side"
        );

        assert(
            changeInput.summary.cardNumber ===
                1,
            "keepSide=false 應重設 cardNumber"
        );

        assert(
            changeInput.displayLabel ===
                "第 1 張牌",
            "clear() 後預設 label 錯誤"
        );

        messages.push(
            "✓ clear() 正確"
        );


        /**
         * 14. Click 快捷 Rank / Suit。
         */
        const clickRoot =
            createRoot();

        roots.push(clickRoot);

        const clickInput =
            new CardInput({

                root:
                    clickRoot,

                rank:
                    "A",

                suit:
                    "S"

            });

        const rankButton =
            clickRoot.querySelector(
                "[data-card-input-action='select-rank'][data-rank='8']"
            );

        rankButton.click();

        assert(
            clickInput.getValue().rank ===
                "8",
            "點擊快捷 Rank 應更新 Rank"
        );

        const suitButton =
            clickRoot.querySelector(
                "[data-card-input-action='select-suit'][data-suit='D']"
            );

        suitButton.click();

        assert(
            clickInput.getValue().suit ===
                "D",
            "點擊 Suit 按鈕應更新 Suit"
        );

        messages.push(
            "✓ Click 快捷選牌正確"
        );


        /**
         * 15. Select change。
         */
        const rankSelect =
            clickRoot.querySelector(
                "[data-card-input-rank]"
            );

        rankSelect.value =
            "Q";

        rankSelect.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles:
                        true
                }
            )
        );

        assert(
            clickInput.getValue().rank ===
                "Q",
            "Rank select change 失敗"
        );

        const suitSelect =
            clickRoot.querySelector(
                "[data-card-input-suit]"
            );

        suitSelect.value =
            "H";

        suitSelect.dispatchEvent(
            new Event(
                "change",
                {
                    bubbles:
                        true
                }
            )
        );

        assert(
            clickInput.getValue().suit ===
                "H",
            "Suit select change 失敗"
        );

        messages.push(
            "✓ Select change 正確"
        );


        /**
         * 16. onSubmit。
         */
        const submitRoot =
            createRoot();

        roots.push(submitRoot);

        let submitCount = 0;

        let submittedCard =
            null;

        let submittedMeta =
            null;

        const submitInput =
            new CardInput({

                root:
                    submitRoot,

                rank:
                    "7",

                suit:
                    "C",

                side:
                    "banker",

                cardNumber:
                    2,

                async onSubmit(
                    card,
                    meta
                ) {

                    submitCount++;

                    submittedCard = {

                        ...card

                    };

                    submittedMeta = {

                        ...meta

                    };

                    return {
                        accepted:
                            true
                    };

                }

            });

        const submitResult =
            await submitInput.submit();

        assert(
            submitCount === 1,
            "submit() 應呼叫一次 onSubmit"
        );

        assert(
            submittedCard.rank ===
                "7" &&
            submittedCard.suit ===
                "C",
            "onSubmit card 資料錯誤"
        );

        assert(
            submittedMeta.side ===
                "banker",
            "onSubmit meta.side 錯誤"
        );

        assert(
            submittedMeta.cardNumber ===
                2,
            "onSubmit meta.cardNumber 錯誤"
        );

        assert(
            submitResult.accepted ===
                true,
            "submit() 應回傳 onSubmit 結果"
        );

        assert(
            submitInput.summary.submitting ===
                false,
            "submit() 完成後 submitting 應為 false"
        );

        messages.push(
            "✓ onSubmit 與 submit() 正確"
        );


        /**
         * 17. 按鈕送出。
         */
        submitRoot
            .querySelector(
                "[data-card-input-action='submit']"
            )
            .click();

        await nextTick();

        assert(
            submitCount === 2,
            "點擊送出按鈕應呼叫 onSubmit"
        );

        messages.push(
            "✓ 送出按鈕事件正確"
        );


        /**
         * 18. Enter 鍵送出。
         */
        const enterTarget =
            submitRoot.querySelector(
                "[data-card-input-rank]"
            );

        enterTarget.dispatchEvent(
            new KeyboardEvent(
                "keydown",
                {
                    key:
                        "Enter",

                    bubbles:
                        true,

                    cancelable:
                        true
                }
            )
        );

        await nextTick();

        assert(
            submitCount === 3,
            "Enter 鍵應送出牌面"
        );

        messages.push(
            "✓ Enter 鍵送出正確"
        );


        /**
         * 19. disabled 時不可送出。
         */
        submitInput.setDisabled(
            true
        );

        const disabledResult =
            await submitInput.submit();

        assert(
            disabledResult === null,
            "disabled 時 submit() 應回傳 null"
        );

        assert(
            submitCount === 3,
            "disabled 時不應呼叫 onSubmit"
        );

        submitInput.setDisabled(
            false
        );

        messages.push(
            "✓ disabled 時禁止送出"
        );


        /**
         * 20. 沒有 onSubmit 時回傳牌值。
         */
        const plainInput =
            new CardInput({

                rank:
                    "J",

                suit:
                    "D",

                autoMount:
                    false

            });

        const plainResult =
            await plainInput.submit();

        assert(
            plainResult.rank ===
                "J" &&
            plainResult.suit ===
                "D",
            "沒有 onSubmit 時 submit() 應回傳目前牌值"
        );

        messages.push(
            "✓ 無 onSubmit 時 submit() 回傳牌值"
        );


        /**
         * 21. 送出錯誤與 onError。
         */
        const errorRoot =
            createRoot();

        roots.push(errorRoot);

        let receivedError =
            null;

        const errorInput =
            new CardInput({

                root:
                    errorRoot,

                onError(
                    message
                ) {

                    receivedError =
                        message;

                },

                async onSubmit() {

                    throw new Error(
                        "測試送出失敗"
                    );

                }

            });

        let submitError =
            null;

        try {

            await errorInput.submit();

        }
        catch (error) {

            submitError =
                error;

        }

        assert(
            submitError instanceof Error,
            "onSubmit 失敗時 submit() 應拋出錯誤"
        );

        assert(
            errorInput.summary.error ===
                "測試送出失敗",
            "錯誤訊息應保存到 state"
        );

        assert(
            receivedError ===
                "測試送出失敗",
            "onError 應收到錯誤訊息"
        );

        assert(
            errorRoot.textContent
                .includes(
                    "測試送出失敗"
                ),
            "DOM 應顯示送出錯誤"
        );

        errorRoot
            .querySelector(
                "[data-card-input-action='clear-error']"
            )
            .click();

        assert(
            errorInput.summary.error ===
                "",
            "清除錯誤按鈕應清空錯誤"
        );

        messages.push(
            "✓ 送出失敗與錯誤狀態正確"
        );


        /**
         * 22. summary。
         */
        const summary =
            submitInput.summary;

        assert(
            summary.value.rank ===
                "7" &&
            summary.value.suit ===
                "C",
            "summary.value 錯誤"
        );

        assert(
            summary.side ===
                "banker",
            "summary.side 錯誤"
        );

        assert(
            summary.cardNumber ===
                2,
            "summary.cardNumber 錯誤"
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
         * 23. toJSON()。
         */
        const json =
            submitInput.toJSON();

        assert(
            json.rank === "7",
            "JSON rank 錯誤"
        );

        assert(
            json.suit === "C",
            "JSON suit 錯誤"
        );

        assert(
            json.side ===
                "banker",
            "JSON side 錯誤"
        );

        assert(
            json.cardNumber === 2,
            "JSON cardNumber 錯誤"
        );

        messages.push(
            "✓ toJSON() 正確"
        );


        /**
         * 24. fromJSON()。
         */
        const restoredRoot =
            createRoot();

        roots.push(restoredRoot);

        const restored =
            CardInput.fromJSON(
                json,
                {
                    root:
                        restoredRoot
                }
            );

        assert(
            restored instanceof
                CardInput,
            "fromJSON() 應回傳 CardInput"
        );

        assert(
            restored.getValue().rank ===
                submitInput.getValue().rank,
            "還原後 Rank 不一致"
        );

        assert(
            restored.getValue().suit ===
                submitInput.getValue().suit,
            "還原後 Suit 不一致"
        );

        assert(
            restored.summary.side ===
                submitInput.summary.side,
            "還原後 side 不一致"
        );

        assert(
            restored.summary.cardNumber ===
                submitInput.summary
                    .cardNumber,
            "還原後 cardNumber 不一致"
        );

        assertThrows(
            () =>
                CardInput.fromJSON(
                    null
                ),
            "fromJSON(null) 應拋出錯誤"
        );

        messages.push(
            "✓ fromJSON() 正確"
        );


        /**
         * 25. focus()。
         */
        restored.focus();

        assert(
            document.activeElement ===
                restoredRoot.querySelector(
                    "[data-card-input-rank]"
                ),
            "focus() 應聚焦 Rank select"
        );

        messages.push(
            "✓ focus() 正確"
        );


        /**
         * 26. destroy()。
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

CardInput 測試完成

預設牌面：${defaultValue.rank}${defaultValue.suit}
送出牌面：${submittedCard.rank}${submittedCard.suit}
送出方位：${submittedMeta.side}
第幾張：${submittedMeta.cardNumber}

onChange 次數：${changeCount}
onSubmit 次數：${submitCount}

JSON 還原：
Rank：${restored.getValue().rank}
Suit：${restored.getValue().suit}
Side：${restored.summary.side}
Card Number：${restored.summary.cardNumber}
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
