/**
 * Baccarat Analyzer V10.4.1
 * Path: tests/dashboardCompatibility.test.js
 * Purpose:
 *   Verifies legacy app/app.js Dashboard Page Object compatibility
 *   together with the V10.1 static/AI UI contract.
 */

import createDashboard, {
    DASHBOARD_VERSION,
    DASHBOARD_PAGE_VERSION,
    DASHBOARD_COMPATIBILITY_VERSION,
    Dashboard,
    DashboardMode,
    renderDashboard,
    renderAIClosedLoopPanel
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createRoot() {

    /*
     * Browser-safe DOM root.
     *
     * Use a real DOM node because Chrome does not allow direct construction
     * of the native Element base class.
     */
    const root =
        document.createElement(
            "div"
        );

    root.dataset.testRoot =
        "dashboard-compatibility";

    return root;
}

function createGame() {
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

        isAnalyzing:
            false,

        isManualRoundActive:
            false,

        canFinishManualRound:
            false,

        shoe: {
            deckCount:
                8
        },

        async confirmBurn({
            rank,
            suit
        } = {}) {
            this.burnConfirmed =
                true;

            this.burnCard = {
                rank:
                    rank ??
                    "A",
                suit:
                    suit ??
                    "S"
            };

            return {
                confirmed:
                    true,
                burnCard:
                    this.burnCard
            };
        },

        async startNewShoe() {
            this.burnConfirmed =
                false;

            return {
                started:
                    true
            };
        },

        async startRound() {
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
            "10.4.1",
        "V10.4.1 Dashboard compatibility version 錯誤"
    );

    messages.push(
        "✓ Legacy / V10.1 / V10.4.1 version contracts 正確"
    );


    /*
     * Static/template contract used by V10.1 Dashboard tests.
     */
    const staticHTML =
        createDashboard();

    assert(
        typeof staticHTML ===
            "string" &&
        staticHTML.includes(
            'data-page="dashboard"'
        ),
        "Static Dashboard factory 錯誤"
    );

    assert(
        staticHTML.includes(
            "data-ai-closed-loop-panel"
        ) &&
        staticHTML.includes(
            "data-ai-analyze"
        ) &&
        staticHTML.includes(
            "data-ai-submit-result"
        ),
        "V10.1 AI Closed-Loop static contract 錯誤"
    );

    assert(
        createDashboard.render ===
            renderDashboard &&
        createDashboard.version ===
            "10.1.0" &&
        createDashboard.compatibilityVersion ===
            "10.4.1" &&
        createDashboard.legacyVersion ===
            "3.4.3",
        "Dashboard factory metadata 錯誤"
    );

    messages.push(
        "✓ V10.1 Static Dashboard + AI Closed-Loop contract 正確"
    );


    /*
     * app/app.js runtime contract:
     * createDashboard({ root, game }) must return Page Object.
     */
    const root =
        createRoot();

    const game =
        createGame();

    const page =
        createDashboard({
            root,
            game,
            autoMount:
                false
        });

    assert(
        page instanceof
            Dashboard &&
        page.game ===
            game &&
        page.ui &&
        typeof page.render ===
            "function" &&
        typeof page.destroy ===
            "function" &&
        typeof page.confirmBurn ===
            "function",
        "app/app.js Dashboard Page Object contract 錯誤"
    );

    messages.push(
        "✓ app/app.js Dashboard Page Object contract 正確"
    );


    /*
     * Burn confirmation compatibility.
     * app/app.js writes these two state values before confirmBurn().
     */
    page.ui.selectedRank =
        "7";

    page.ui.selectedSuit =
        "H";

    page.render();

    const burn =
        await page.confirmBurn();

    assert(
        game.burnConfirmed ===
            true,
        "confirmBurn() 未設定 Game burnConfirmed"
    );

    assert(
        burn !== undefined,
        "confirmBurn() 未回傳結果"
    );

    messages.push(
        "✓ Burn confirmation compatibility 正確"
    );


    /*
     * AI panel must also exist in legacy runtime render.
     */
    page.render();

    assert(
        root.innerHTML.includes(
            "data-ai-closed-loop-panel"
        ),
        "Legacy runtime Dashboard 未掛載 AI Closed-Loop Panel"
    );

    assert(
        root.innerHTML.includes(
            "data-ai-status"
        ) &&
        root.innerHTML.includes(
            "data-ai-prediction"
        ) &&
        root.innerHTML.includes(
            "data-ai-decision"
        ),
        "Legacy runtime Dashboard AI selectors 錯誤"
    );

    messages.push(
        "✓ Legacy Runtime + V10.1 AI Panel integration 正確"
    );


    /*
     * New compatibility aliases.
     */
    assert(
        page.refresh() ===
            page,
        "refresh() compatibility alias 錯誤"
    );

    await page.submitResult({
        winner:
            "Banker"
    });

    assert(
        game.lastResult?.winner ===
            "Banker",
        "submitResult() compatibility API 錯誤"
    );

    await page.nextRound();

    assert(
        game.isManualRoundActive ===
            true,
        "nextRound() compatibility API 錯誤"
    );

    messages.push(
        "✓ refresh / submitResult / nextRound compatibility APIs 正確"
    );


    page.destroy();

    assert(
        root.innerHTML ===
            "",
        "Dashboard destroy() 錯誤"
    );

    messages.push(
        "✓ Dashboard destroy lifecycle 正確"
    );


    return `
${messages.join("\n")}

Dashboard Compatibility Refactor V10.4.1 測試完成

Legacy Dashboard API：通過
V10.1 Static Dashboard：通過
AI Closed-Loop Panel：通過
Burn Confirmation：通過
app/app.js Compatibility：通過
Runtime Compatibility APIs：通過
Lifecycle：通過
`;
}
