/**
 * Baccarat Analyzer V3.4.2
 * controllers/GameController.js
 *
 * Dashboard 共用動作執行器：
 * - busy 狀態
 * - 錯誤處理
 * - 成功訊息
 * - 動作前後重新渲染
 */

export const GAME_CONTROLLER_VERSION = "3.4.2";

export default class GameController {
    constructor({
        game,
        uiController,
        render
    } = {}) {
        if (!game) {
            throw new Error("GameController requires game.");
        }

        if (!uiController) {
            throw new Error("GameController requires uiController.");
        }

        if (typeof render !== "function") {
            throw new TypeError("GameController render must be a function.");
        }

        this.game = game;
        this.ui = uiController;
        this.render = render;
    }

    async run(
        callback,
        {
            successMessage = "",
            renderBefore = true
        } = {}
    ) {
        if (this.ui.busy) {
            return null;
        }

        this.ui.setBusy(true);
        this.ui.clearMessage();

        if (renderBefore) {
            this.render();
        }

        try {
            const result = await callback(this.game);

            if (successMessage) {
                this.ui.setMessage(
                    successMessage,
                    "success"
                );
            }

            return result;
        }
        catch (error) {
            console.error(
                "Dashboard action failed",
                error
            );

            this.ui.setMessage(
                error?.message ?? String(error),
                "error"
            );

            return null;
        }
        finally {
            this.ui.setBusy(false);
            this.render();
        }
    }

    get summary() {
        return {
            version: GAME_CONTROLLER_VERSION,
            busy: this.ui.busy
        };
    }
}
