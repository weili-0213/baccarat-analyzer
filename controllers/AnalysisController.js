/**
 * Baccarat Analyzer V3.4.2
 * controllers/AnalysisController.js
 *
 * 燒牌確認與下一局分析。
 */

export const ANALYSIS_CONTROLLER_VERSION = "3.4.2";

export default class AnalysisController {
    constructor({
        game,
        actionController,
        uiController
    } = {}) {
        if (!game || !actionController || !uiController) {
            throw new Error(
                "AnalysisController requires game, actionController and uiController."
            );
        }

        this.game = game;
        this.actions = actionController;
        this.ui = uiController;
    }

    confirmBurn() {
        return this.actions.run(
            async () => {
                this.game.confirmBurnIndicator({
                    rank: this.ui.state.selectedRank,
                    suit: this.ui.state.selectedSuit
                });

                if (!this.game.hasNextAnalysis) {
                    await this.game.analyzeNextRound();
                }
                else {
                    await this.game.waitForAnalysis();
                }
            },
            {
                successMessage:
                    "燒牌已確認，第一局分析完成。"
            }
        );
    }

    analyze() {
        return this.actions.run(
            async () =>
                this.game.analyzeNextRound(),
            {
                successMessage:
                    "下一局分析完成。"
            }
        );
    }

    get summary() {
        return {
            version: ANALYSIS_CONTROLLER_VERSION,
            analyzing: Boolean(this.game.isAnalyzing),
            hasAnalysis: Boolean(this.game.nextAnalysis)
        };
    }
}
