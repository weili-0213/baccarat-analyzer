/**
 * Baccarat Analyzer V10.1
 * Path: pages/dashboard.js
 * Purpose: Main Dashboard page with Baccarat analysis areas
 *          and AI Closed-Loop UI Integration panel.
 */

export const DASHBOARD_PAGE_VERSION = "10.1.0";

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function renderAIClosedLoopPanel() {
    return `
        <section
            class="dashboard-section ai-panel"
            data-ai-closed-loop-panel
            aria-labelledby="ai-closed-loop-title"
        >
            <header class="dashboard-section__header">
                <div>
                    <p class="dashboard-section__eyebrow">V10.1</p>
                    <h2 id="ai-closed-loop-title">
                        AI Closed-Loop Intelligence
                    </h2>
                    <p class="dashboard-section__description">
                        模擬、預測、決策、策略、執行、回饋、學習與自適應整合。
                    </p>
                </div>

                <div class="ai-status-badge" aria-live="polite">
                    <span class="ai-status-badge__label">系統狀態</span>
                    <strong data-ai-status>idle</strong>
                </div>
            </header>

            <div class="ai-panel__grid">
                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">目前階段</span>
                    <strong class="ai-metric-card__value" data-ai-stage>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">模擬</span>
                    <strong class="ai-metric-card__value" data-ai-simulation>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">預測</span>
                    <strong class="ai-metric-card__value" data-ai-prediction>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">信心</span>
                    <strong class="ai-metric-card__value" data-ai-confidence>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">決策</span>
                    <strong class="ai-metric-card__value" data-ai-decision>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">策略</span>
                    <strong class="ai-metric-card__value" data-ai-strategy>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">下注計畫</span>
                    <strong class="ai-metric-card__value" data-ai-bet>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">執行</span>
                    <strong class="ai-metric-card__value" data-ai-execution>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">回饋</span>
                    <strong class="ai-metric-card__value" data-ai-feedback>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">學習</span>
                    <strong class="ai-metric-card__value" data-ai-learning>—</strong>
                </article>

                <article class="ai-metric-card">
                    <span class="ai-metric-card__label">自適應</span>
                    <strong class="ai-metric-card__value" data-ai-adaptive>—</strong>
                </article>
            </div>

            <div
                class="ai-panel__error"
                data-ai-error
                role="alert"
                aria-live="assertive"
            ></div>

            <div class="ai-panel__actions">
                <button
                    class="button button--primary"
                    type="button"
                    data-ai-analyze
                >
                    AI 分析
                </button>

                <button
                    class="button button--success"
                    type="button"
                    data-ai-submit-result
                >
                    提交開牌結果
                </button>

                <button
                    class="button button--warning"
                    type="button"
                    data-ai-pause
                >
                    暫停
                </button>

                <button
                    class="button button--secondary"
                    type="button"
                    data-ai-resume
                    disabled
                >
                    繼續
                </button>

                <button
                    class="button button--danger"
                    type="button"
                    data-ai-reset
                >
                    重設
                </button>
            </div>
        </section>
    `;
}

export function renderDashboard({
    title = "Baccarat Analyzer",
    subtitle = "百家樂分析、機率、EV、路單與 AI Closed-Loop Intelligence"
} = {}) {
    return `
        <main
            class="page dashboard-page"
            data-page="dashboard"
            data-dashboard-version="${DASHBOARD_PAGE_VERSION}"
        >
            <header class="dashboard-hero">
                <div>
                    <p class="dashboard-hero__eyebrow">
                        Baccarat Analyzer
                    </p>

                    <h1 class="dashboard-hero__title">
                        ${escapeHTML(title)}
                    </h1>

                    <p class="dashboard-hero__subtitle">
                        ${escapeHTML(subtitle)}
                    </p>
                </div>

                <div class="dashboard-hero__meta">
                    <span>Dashboard</span>
                    <strong>V10.1</strong>
                </div>
            </header>

            <div class="dashboard-layout">
                <div class="dashboard-layout__main">
                    <section
                        class="dashboard-section"
                        data-dashboard-card-input
                        aria-labelledby="dashboard-card-input-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Round Input
                                </p>

                                <h2 id="dashboard-card-input-title">
                                    牌局輸入
                                </h2>
                            </div>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="card-input"
                        >
                            <p class="dashboard-placeholder">
                                CardInput 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section"
                        data-dashboard-analysis
                        aria-labelledby="dashboard-analysis-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Analysis
                                </p>

                                <h2 id="dashboard-analysis-title">
                                    機率、EV 與推薦
                                </h2>
                            </div>
                        </header>

                        <div class="dashboard-analysis-grid">
                            <div
                                class="dashboard-mount"
                                data-component="probability-table"
                            >
                                <p class="dashboard-placeholder">
                                    ProbabilityTable 元件將掛載於此。
                                </p>
                            </div>

                            <div
                                class="dashboard-mount"
                                data-component="ev-table"
                            >
                                <p class="dashboard-placeholder">
                                    EVTable 元件將掛載於此。
                                </p>
                            </div>

                            <div
                                class="dashboard-mount"
                                data-component="recommendation"
                            >
                                <p class="dashboard-placeholder">
                                    Recommendation 元件將掛載於此。
                                </p>
                            </div>
                        </div>
                    </section>

                    ${renderAIClosedLoopPanel()}

                    <section
                        class="dashboard-section"
                        data-dashboard-roadmap
                        aria-labelledby="dashboard-roadmap-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Roadmap
                                </p>

                                <h2 id="dashboard-roadmap-title">
                                    路單
                                </h2>
                            </div>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="roadmap"
                        >
                            <p class="dashboard-placeholder">
                                珠盤路、大路、大眼仔、小路與曱甴路將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section"
                        data-dashboard-statistics
                        aria-labelledby="dashboard-statistics-title"
                    >
                        <header class="dashboard-section__header">
                            <div>
                                <p class="dashboard-section__eyebrow">
                                    Statistics
                                </p>

                                <h2 id="dashboard-statistics-title">
                                    統計
                                </h2>
                            </div>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="statistics"
                        >
                            <p class="dashboard-placeholder">
                                Statistics 與 Chart 元件將掛載於此。
                            </p>
                        </div>
                    </section>
                </div>

                <aside
                    class="dashboard-layout__sidebar"
                    aria-label="牌靴與資金資訊"
                >
                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-shoe-status
                    >
                        <header class="dashboard-section__header">
                            <h2>牌靴狀態</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="shoe-status"
                        >
                            <p class="dashboard-placeholder">
                                ShoeStatus 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-remaining-cards
                    >
                        <header class="dashboard-section__header">
                            <h2>剩餘牌</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="remaining-cards"
                        >
                            <p class="dashboard-placeholder">
                                RemainingCards 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-bankroll
                    >
                        <header class="dashboard-section__header">
                            <h2>資金管理</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="bankroll"
                        >
                            <p class="dashboard-placeholder">
                                Bankroll 與 KellyCard 元件將掛載於此。
                            </p>
                        </div>
                    </section>

                    <section
                        class="dashboard-section dashboard-section--compact"
                        data-dashboard-confidence
                    >
                        <header class="dashboard-section__header">
                            <h2>分析信心</h2>
                        </header>

                        <div
                            class="dashboard-mount"
                            data-component="confidence-bar"
                        >
                            <p class="dashboard-placeholder">
                                ConfidenceBar 元件將掛載於此。
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    `;
}

export default function dashboard(options = {}) {
    return renderDashboard(options);
}

dashboard.render = renderDashboard;
dashboard.version = DASHBOARD_PAGE_VERSION;
