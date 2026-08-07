/**
 * Baccarat Analyzer V10.4.4
 * Path: tests/dashboardCompatibility.test.js
 * Purpose:
 *   Verifies Dashboard burn compatibility across:
 *   - legacy/current Game.confirmBurnIndicator()
 *   - runtime/adapter Game.confirmBurn()
 *   while preserving V10.1 static AI Dashboard contracts.
 */

import createDashboard, {
    DASHBOARD_VERSION,
    DASHBOARD_PAGE_VERSION,
    DASHBOARD_COMPATIBILITY_VERSION,
    Dashboard,
    renderDashboard
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createRoot() {
    const root =
        document.createElement(
            "div"
        );

    root.dataset.testRoot =
        "dashboard-burn-compatibility";

    document.body?.appendChild?.(
        root
    );

    return root;
}


function createLegacyGame() {
    return {
        state:
            "WAITING_BURN_INDICATOR",

        manualState:
            "IDLE",

        burnConfirmed:
            false,

        burnInfo:
            null,

        roundCount:
            0,

        nextAnalysis:
            null,

        hasNextAnalysis:
            false,

        isAnalyzing:
            false,

        isManualRoundActive:
            false,

        canFinishManualRound:
            false,

        canStartManualRound:
            false,

        manualCards:
            [],

        shoe: {
            deckCount:
                8
        },

        confirmBurnIndicator({
            rank,
            suit
        }) {
            this.burnConfirmed =
                true;

            this.canStartManualRound =
                true;

            this.burnInfo = {
                confirmed:
                    true,

                indicator: {
                    rank,
                    suit
                }
            };

            return this.burnInfo;
        },

        async analyzeNextRound() {
            this.nextAnalysis = {
                recommendation:
                    "Banker"
            };

            this.hasNextAnalysis =
                true;

            return this.nextAnalysis;
        },

        async waitForAnalysis() {
            return this.nextAnalysis;
        },

        async startNewShoe() {
            this.burnConfirmed =
                false;

            return {
                started:
                    true
            };
        },

        async startManualRound() {
            this.isManualRoundActive =
                true;

            return {
                started:
                    true
            };
        },

        async finishManualRound(result = {}) {
            this.isManualRoundActive =
                false;

            this.roundCount++;

            return result;
        }
    };
}


function createRuntimeFacadeGame() {
    return {
        state:
            "ready",

        manualState:
            "idle",

        burnConfirmed:
            false,

        roundCount:
            0,

        nextAnalysis:
            null,

        hasNextAnalysis:
            false,

        isAnalyzing:
            false,

        isManualRoundActive:
            false,

        canFinishManualRound:
            false,

        manualCards:
            [],

        shoe: {
            deckCount:
                8
        },

        async confirmBurn({
            rank,
            suit
        } = {}) {
            this.burnCard = {
                rank:
                    rank ??
                    "A",

                suit:
                    suit ??
                    "S"
            };

            /*
             * Deliberately do NOT set burnConfirmed.
             * V10.4.2 Dashboard must normalize it when confirmed:true.
             */
            return {
                confirmed:
                    true,

                burnCard:
                    this.burnCard
            };
        },

        async analyzeNextRound() {
            this.nextAnalysis = {
                recommendation:
                    "Player"
            };

            this.hasNextAnalysis =
                true;

            return this.nextAnalysis;
        },

        async waitForAnalysis() {
            return this.nextAnalysis;
        },

        async startNewShoe() {
            this.burnConfirmed =
                false;

            return {
                started:
                    true
            };
        },

        async startManualRound() {
            this.isManualRoundActive =
                true;

            return {
                started:
                    true
            };
        },

        async completeRound(result) {
            this.lastResult =
                result;

            this.roundCount++;

            return result;
        }
    };
}


export default async function dashboardCompatibilityTest() {
    const messages = [];

    assert(
        DASHBOARD_VERSION ===
            "3.4.3",
        "Legacy Dashboard contract version 錯誤"
    );

    assert(
        DASHBOARD_PAGE_VERSION ===
            "10.1.0",
        "V10.1 Dashboard template contract version 錯誤"
    );

    assert(
        DASHBOARD_COMPATIBILITY_VERSION ===
            "10.4.4",
        "V10.4.4 Dashboard live compatibility version 錯誤"
    );

    messages.push(
        "✓ V3.4.3 / V10.1 / V10.4.4 version contracts 正確"
    );


    const staticHTML =
        createDashboard();

    assert(
        typeof staticHTML ===
            "string" &&
        staticHTML.includes(
            'data-page="dashboard"'
        ) &&
        staticHTML.includes(
            "data-ai-closed-loop-panel"
        ) &&
        staticHTML.includes(
            "data-ai-analyze"
        ),
        "V10.1 Static Dashboard contract 錯誤"
    );

    assert(
        createDashboard.render ===
            renderDashboard &&
        createDashboard.version ===
            "10.1.0" &&
        createDashboard.compatibilityVersion ===
            "10.4.4" &&
        createDashboard.legacyVersion ===
            "3.4.3",
        "Dashboard factory metadata 錯誤"
    );

    messages.push(
        "✓ V10.1 Static Dashboard / AI Panel contract 正確"
    );


    /*
     * Primary production path:
     * Game.confirmBurnIndicator() -> AnalysisController.confirmBurn().
     */
    const legacyRoot =
        createRoot();

    const legacyGame =
        createLegacyGame();

    const legacyPage =
        createDashboard({
            root:
                legacyRoot,

            game:
                legacyGame,

            autoMount:
                false
        });

    assert(
        legacyPage instanceof
            Dashboard,
        "Legacy Dashboard instance 建立錯誤"
    );

    legacyPage.ui.selectedRank =
        "7";

    legacyPage.ui.selectedSuit =
        "H";

    const legacyBurn =
        await legacyPage.confirmBurn();

    assert(
        legacyGame.burnConfirmed ===
            true,
        "Legacy confirmBurnIndicator() 未設定 burnConfirmed"
    );

    assert(
        legacyBurn?.confirmed ===
            true &&
        legacyBurn?.indicator?.rank ===
            "7" &&
        legacyBurn?.indicator?.suit ===
            "H",
        "Legacy burn result 錯誤"
    );

    await new Promise(resolve =>
        setTimeout(resolve, 0)
    );

    assert(
        legacyGame.hasNextAnalysis ===
            true,
        "Legacy burn 後背景第一局分析未完成"
    );

    messages.push(
        "✓ Legacy confirmBurnIndicator → AnalysisController → Analysis 正確"
    );


    /*
     * V10.x / runtime adapter fallback path:
     * Game.confirmBurn() only.
     */
    const runtimeRoot =
        createRoot();

    const runtimeGame =
        createRuntimeFacadeGame();

    const runtimePage =
        createDashboard({
            root:
                runtimeRoot,

            game:
                runtimeGame,

            autoMount:
                false
        });

    runtimePage.ui.selectedRank =
        "K";

    runtimePage.ui.selectedSuit =
        "D";

    const runtimeBurn =
        await runtimePage.confirmBurn();

    assert(
        runtimeBurn?.confirmed ===
            true,
        "Runtime confirmBurn() result 錯誤"
    );

    assert(
        runtimeGame.burnConfirmed ===
            true,
        "V10.4.4 fallback 未正規化 game.burnConfirmed"
    );

    assert(
        runtimeGame.burnCard?.rank ===
            "K" &&
        runtimeGame.burnCard?.suit ===
            "D",
        "V10.4.4 fallback burn card 錯誤"
    );

    await new Promise(resolve =>
        setTimeout(resolve, 0)
    );

    assert(
        runtimeGame.hasNextAnalysis ===
            true,
        "V10.4.4 fallback burn 後未觸發背景分析"
    );

    messages.push(
        "✓ Runtime Game.confirmBurn fallback → burnConfirmed → Analysis 正確"
    );


    /*
     * app/app.js public contract.
     */
    assert(
        typeof runtimePage.render ===
            "function" &&
        typeof runtimePage.destroy ===
            "function" &&
        typeof runtimePage.confirmBurn ===
            "function" &&
        runtimePage.ui,
        "app/app.js Dashboard public contract 錯誤"
    );

    messages.push(
        "✓ app/app.js Dashboard public API 正確"
    );


    runtimePage.render();

    assert(
        runtimeRoot.innerHTML.includes(
            "data-ai-closed-loop-panel"
        ),
        "Runtime Dashboard 未保留 AI Closed-Loop Panel"
    );

    messages.push(
        "✓ Legacy Runtime render + AI Closed-Loop Panel 正確"
    );


    runtimePage.destroy();
    legacyPage.destroy();

    legacyRoot.remove?.();
    runtimeRoot.remove?.();

    messages.push(
        "✓ Dashboard lifecycle 正確"
    );


    return `
${messages.join("\n")}

Dashboard Live Compatibility V10.4.4 測試完成

Version Contracts：通過
V10.1 Static Dashboard：通過
Legacy Burn Flow：通過
Runtime Burn Fallback：通過
First Analysis Flow：通過
app/app.js Compatibility：通過
AI Closed-Loop Panel：通過
Lifecycle：通過
`;
}
