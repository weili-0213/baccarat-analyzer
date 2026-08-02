/**
 * Baccarat Analyzer V3.4.2
 * controllers/InputController.js
 *
 * 牌靴與手動牌局輸入控制。
 */

export const INPUT_CONTROLLER_VERSION = "3.4.2";

function getManualCards(game) {
    return Array.isArray(game?.manualCards)
        ? game.manualCards
        : [];
}

export default class InputController {
    constructor({
        game,
        actionController,
        uiController,
        inputSection = "input"
    } = {}) {
        if (!game || !actionController || !uiController) {
            throw new Error(
                "InputController requires game, actionController and uiController."
            );
        }

        this.game = game;
        this.actions = actionController;
        this.ui = uiController;
        this.inputSection = inputSection;
    }

    startNewShoe() {
        return this.actions.run(
            async () =>
                this.game.startNewShoe({
                    clearHistory: true,
                    shuffle: true
                }),
            {
                successMessage:
                    "已建立新牌靴，請輸入燒牌指示牌。"
            }
        );
    }

    startRound() {
        this.ui.state.mobileSection =
            this.inputSection;

        return this.actions.run(
            async () =>
                this.game.startManualRound(),
            {
                successMessage:
                    "已開始輸入本局牌面。"
            }
        );
    }

    addCard({ rank, suit }) {
        return this.actions.run(
            async () => {
                const side =
                    this.game.nextManualSide;

                if (!side) {
                    throw new Error(
                        "目前不需要再輸入牌。"
                    );
                }

                this.game.addManualCard(
                    side,
                    {
                        rank,
                        suit
                    }
                );
            },
            {
                renderBefore: false
            }
        );
    }

    undoCard() {
        return this.actions.run(
            async () => {
                const removed =
                    this.game.undoManualCard();

                if (!removed) {
                    throw new Error(
                        "目前沒有可復原的牌。"
                    );
                }
            },
            {
                successMessage:
                    "已復原最後一張牌。"
            }
        );
    }

    cancelRound() {
        return this.actions.run(
            async () =>
                this.game.cancelManualRound(),
            {
                successMessage:
                    "已取消本局輸入。"
            }
        );
    }

    finishRound() {
        return this.actions.run(
            async () =>
                this.game.finishManualRound({
                    analyze: true
                }),
            {
                successMessage:
                    "本局已確認，下一局分析已更新。"
            }
        );
    }

    canUndo() {
        return getManualCards(this.game).length > 0;
    }

    get summary() {
        return {
            version: INPUT_CONTROLLER_VERSION,
            active: Boolean(this.game.isManualRoundActive),
            canUndo: this.canUndo(),
            canFinish: Boolean(this.game.canFinishManualRound)
        };
    }
}
