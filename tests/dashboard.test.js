/**
 * Baccarat Analyzer V10.1
 * Path: tests/dashboard.test.js
 * Purpose: Tests the V10.1 Dashboard template and AI Closed-Loop UI panel.
 */

import createDashboard, {
    DASHBOARD_PAGE_VERSION,
    renderDashboard,
    renderAIClosedLoopPanel
} from "../pages/dashboard.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function countMatches(source, pattern) {
    return (source.match(pattern) ?? []).length;
}


export default async function dashboardTest() {
    const messages = [];

    /*
     * Version / exports
     */
    assert(
        DASHBOARD_PAGE_VERSION === "10.1.0",
        "Dashboard 頁面版本應為 10.1.0"
    );

    assert(
        typeof createDashboard === "function",
        "Dashboard default export 應為 function"
    );

    assert(
        typeof renderDashboard === "function",
        "缺少 renderDashboard export"
    );

    assert(
        typeof renderAIClosedLoopPanel === "function",
        "缺少 renderAIClosedLoopPanel export"
    );

    assert(
        createDashboard.version === DASHBOARD_PAGE_VERSION,
        "default dashboard.version 錯誤"
    );

    assert(
        createDashboard.render === renderDashboard,
        "default dashboard.render 應指向 renderDashboard"
    );

    messages.push(
        "✓ V10.1 Dashboard exports 與版本正確"
    );


    /*
     * Dashboard HTML
     */
    const html = createDashboard();

    assert(
        typeof html === "string" &&
        html.length > 0,
        "Dashboard 應輸出 HTML 字串"
    );

    assert(
        html.includes('data-page="dashboard"'),
        "缺少 data-page=dashboard"
    );

    assert(
        html.includes(
            'data-dashboard-version="10.1.0"'
        ),
        "Dashboard version attribute 錯誤"
    );

    assert(
        html.includes(
            "Baccarat Analyzer"
        ),
        "Dashboard 標題缺失"
    );

    messages.push(
        "✓ Dashboard HTML 基本結構正確"
    );


    /*
     * Main Dashboard mount zones
     */
    const mountTargets = [
        'data-component="card-input"',
        'data-component="probability-table"',
        'data-component="ev-table"',
        'data-component="recommendation"',
        'data-component="roadmap"',
        'data-component="statistics"',
        'data-component="shoe-status"',
        'data-component="remaining-cards"',
        'data-component="bankroll"',
        'data-component="confidence-bar"'
    ];

    for (const target of mountTargets) {
        assert(
            html.includes(target),
            `缺少 Dashboard mount target：${target}`
        );
    }

    messages.push(
        "✓ Dashboard 元件掛載區正確"
    );


    /*
     * Main layout
     */
    assert(
        html.includes(
            'class="dashboard-layout"'
        ),
        "缺少 dashboard-layout"
    );

    assert(
        html.includes(
            'class="dashboard-layout__main"'
        ),
        "缺少 dashboard-layout__main"
    );

    assert(
        html.includes(
            'class="dashboard-layout__sidebar"'
        ),
        "缺少 dashboard-layout__sidebar"
    );

    messages.push(
        "✓ Dashboard 主區與側欄結構正確"
    );


    /*
     * AI Closed-Loop panel
     */
    const aiPanel = renderAIClosedLoopPanel();

    assert(
        aiPanel.includes(
            "AI Closed-Loop Intelligence"
        ),
        "缺少 AI Closed-Loop 標題"
    );

    assert(
        aiPanel.includes(
            "data-ai-closed-loop-panel"
        ),
        "缺少 AI Closed-Loop Panel"
    );

    assert(
        html.includes(
            "data-ai-closed-loop-panel"
        ),
        "AI Panel 未插入 Dashboard"
    );

    messages.push(
        "✓ AI Closed-Loop Panel 正確"
    );


    /*
     * V10.1 renderer selectors.
     *
     * Must stay aligned with:
     * ui/closedloop/ClosedLoopUIRenderer.js
     */
    const aiDisplaySelectors = [
        "data-ai-status",
        "data-ai-stage",
        "data-ai-simulation",
        "data-ai-prediction",
        "data-ai-confidence",
        "data-ai-decision",
        "data-ai-strategy",
        "data-ai-bet",
        "data-ai-execution",
        "data-ai-feedback",
        "data-ai-learning",
        "data-ai-adaptive",
        "data-ai-error"
    ];

    for (const selector of aiDisplaySelectors) {
        assert(
            aiPanel.includes(selector),
            `AI Panel 缺少 ${selector}`
        );

        assert(
            countMatches(
                aiPanel,
                new RegExp(
                    selector,
                    "g"
                )
            ) === 1,
            `${selector} 應只存在一次`
        );
    }

    messages.push(
        "✓ V10.1 AI Renderer selectors 正確"
    );


    /*
     * V10.1 action selectors.
     *
     * Must stay aligned with:
     * ui/closedloop/ClosedLoopUIEventBinder.js
     */
    const aiActionSelectors = [
        "data-ai-analyze",
        "data-ai-submit-result",
        "data-ai-pause",
        "data-ai-resume",
        "data-ai-reset"
    ];

    for (const selector of aiActionSelectors) {
        assert(
            aiPanel.includes(selector),
            `AI Panel 缺少 ${selector}`
        );
    }

    assert(
        countMatches(
            aiPanel,
            /<button/g
        ) === 5,
        "AI Panel 應有 5 個控制按鈕"
    );

    assert(
        /data-ai-resume[\s\S]*?disabled/.test(
            aiPanel
        ),
        "Resume 初始狀態應為 disabled"
    );

    messages.push(
        "✓ V10.1 AI Action selectors 正確"
    );


    /*
     * Placement:
     * Analysis → AI Closed Loop → Roadmap
     */
    const analysisIndex =
        html.indexOf(
            "data-dashboard-analysis"
        );

    const aiIndex =
        html.indexOf(
            "data-ai-closed-loop-panel"
        );

    const roadmapIndex =
        html.indexOf(
            "data-dashboard-roadmap"
        );

    assert(
        analysisIndex >= 0 &&
        aiIndex > analysisIndex &&
        roadmapIndex > aiIndex,
        "AI Panel 應位於 Analysis 之後、Roadmap 之前"
    );

    messages.push(
        "✓ AI Panel Dashboard 插入位置正確"
    );


    /*
     * Dynamic text escaping
     */
    const escapedHTML =
        renderDashboard({
            title:
                '<script>alert("x")</script>',
            subtitle:
                '<b>unsafe</b>'
        });

    assert(
        !escapedHTML.includes(
            '<script>alert("x")</script>'
        ),
        "Dashboard title 未 escape"
    );

    assert(
        escapedHTML.includes(
            "&lt;script&gt;"
        ),
        "Dashboard title escape 結果錯誤"
    );

    assert(
        !escapedHTML.includes(
            "<b>unsafe</b>"
        ),
        "Dashboard subtitle 未 escape"
    );

    assert(
        escapedHTML.includes(
            "&lt;b&gt;unsafe&lt;/b&gt;"
        ),
        "Dashboard subtitle escape 結果錯誤"
    );

    messages.push(
        "✓ Dashboard 動態文字 escape 正確"
    );


    /*
     * Optional browser DOM verification.
     *
     * This block runs on the GitHub Pages Test Runner.
     * Node Runtime Test skips it automatically.
     */
    if (
        typeof document !== "undefined" &&
        document?.createElement
    ) {
        const root =
            document.createElement(
                "div"
            );

        root.innerHTML =
            html;

        document.body.appendChild(
            root
        );

        try {
            assert(
                root.querySelector(
                    '[data-page="dashboard"]'
                ),
                "DOM 缺少 Dashboard root"
            );

            assert(
                root.querySelector(
                    "[data-ai-closed-loop-panel]"
                ),
                "DOM 缺少 AI Closed-Loop Panel"
            );

            assert(
                root.querySelector(
                    "[data-ai-status]"
                ),
                "DOM 缺少 AI Status"
            );

            assert(
                root.querySelector(
                    "[data-ai-analyze]"
                ),
                "DOM 缺少 AI Analyze button"
            );

            assert(
                root.querySelector(
                    "[data-ai-submit-result]"
                ),
                "DOM 缺少 Submit Result button"
            );

            assert(
                root.querySelectorAll(
                    "[data-ai-closed-loop-panel] button"
                ).length === 5,
                "DOM AI Panel 控制按鈕數量錯誤"
            );

            messages.push(
                "✓ Browser DOM 驗證正確"
            );
        }
        finally {
            root.remove();
        }
    }


    return `
${messages.join("\n")}

Dashboard V10.1 Test Refactor 測試完成

Dashboard Version：通過
Dashboard Exports：通過
Dashboard HTML：通過
Component Mount Targets：通過
Dashboard Layout：通過
AI Closed-Loop Panel：通過
AI Renderer Selectors：通過
AI Action Selectors：通過
AI Panel Placement：通過
HTML Escaping：通過
Browser DOM：通過（瀏覽器環境執行）
`;
}
