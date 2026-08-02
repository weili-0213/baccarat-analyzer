/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * pages/home.js
 *
 * 首頁（Desktop + Mobile）
 *
 * 功能：
 *
 * - 建立新牌靴
 * - 繼續最近牌靴
 * - 進入測試模式
 * - 查看歷史紀錄
 * - 進入設定
 * - 顯示最近牌靴與簡要統計
 *
 * HomePage 不直接建立 Game。
 * 它只派發事件，交由 app/router.js 或 app/app.js 處理。
 */

function isObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatDate(value) {

    if (!value) {

        return "—";

    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {

        return "—";

    }

    return new Intl.DateTimeFormat(
        "zh-TW",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


export class HomePage {

    constructor({

        root = null,

        data = {},

        autoMount = true

    } = {}) {

        if (
            root !== null &&
            !(root instanceof Element) &&
            typeof root !== "string"
        ) {

            throw new TypeError(
                "HomePage root must be an Element, selector, or null."
            );

        }

        if (!isObject(data)) {

            throw new TypeError(
                "HomePage data must be an object."
            );

        }


        this.root =
            this.resolveRoot(root);

        this.data = {

            appName:
                data.appName ??
                "Baccarat Analyzer",

            subtitle:
                data.subtitle ??
                "牌靴管理、機率分析與路單整合工具",

            version:
                data.version ??
                "Beta",

            currentShoe:
                data.currentShoe ??
                null,

            recentShoes:
                Array.isArray(data.recentShoes)
                    ? [...data.recentShoes]
                    : [],

            statistics:
                {

                    totalShoes:
                        Number(
                            data.statistics?.totalShoes ??
                            0
                        ),

                    totalRounds:
                        Number(
                            data.statistics?.totalRounds ??
                            0
                        ),

                    completedAnalyses:
                        Number(
                            data.statistics?.completedAnalyses ??
                            0
                        )

                }

        };


        this.boundClick =
            event =>
                this.handleClick(event);


        if (
            autoMount &&
            this.root
        ) {

            this.mount();

        }

    }


    resolveRoot(root) {

        if (root instanceof Element) {

            return root;

        }

        if (typeof root === "string") {

            return document.querySelector(root);

        }

        return (
            document.querySelector("[data-page='home']") ??
            document.getElementById("home") ??
            document.getElementById("app") ??
            null
        );

    }


    mount(root = this.root) {

        const resolved =
            this.resolveRoot(root);

        if (!resolved) {

            throw new Error(
                "HomePage root element was not found."
            );

        }

        this.unbind();

        this.root =
            resolved;

        this.root.addEventListener(
            "click",
            this.boundClick
        );

        this.render();

        return this;

    }


    unbind() {

        if (!this.root) {

            return this;

        }

        this.root.removeEventListener(
            "click",
            this.boundClick
        );

        return this;

    }


    destroy() {

        this.unbind();

        if (this.root) {

            this.root.innerHTML =
                "";

        }

        return this;

    }


    setData(data = {}) {

        if (!isObject(data)) {

            throw new TypeError(
                "HomePage data must be an object."
            );

        }

        this.data = {

            ...this.data,

            ...data,

            statistics:
                {

                    ...this.data.statistics,

                    ...(
                        data.statistics ??
                        {}
                    )

                },

            recentShoes:
                Array.isArray(data.recentShoes)
                    ? [...data.recentShoes]
                    : this.data.recentShoes

        };

        this.render();

        return this;

    }


    emit(
        name,
        detail = {}
    ) {

        this.root?.dispatchEvent(
            new CustomEvent(
                name,
                {
                    bubbles: true,
                    detail
                }
            )
        );

        return this;

    }


    handleClick(event) {

        const button =
            event.target.closest(
                "[data-home-action]"
            );

        if (
            !button ||
            !this.root?.contains(button)
        ) {

            return;

        }

        event.preventDefault();

        const action =
            button.dataset.homeAction;

        switch (action) {

            case "new-shoe":

                this.emit(
                    "home:new-shoe"
                );

                break;


            case "continue-shoe":

                this.emit(
                    "home:continue-shoe",
                    {
                        shoe:
                            this.data.currentShoe
                    }
                );

                break;


            case "test-mode":

                this.emit(
                    "home:test-mode"
                );

                break;


            case "history":

                this.emit(
                    "home:history"
                );

                break;


            case "settings":

                this.emit(
                    "home:settings"
                );

                break;


            case "open-shoe":

                this.emit(
                    "home:open-shoe",
                    {
                        id:
                            button.dataset.shoeId
                    }
                );

                break;


            default:

                console.warn(
                    `Unknown home action: ${action}`
                );

        }

    }


    render() {

        if (!this.root) {

            return this;

        }

        this.root.innerHTML = `

            <main class="homePage">

                ${this.renderHero()}

                <section class="homeContent">

                    ${this.renderPrimaryActions()}

                    ${this.renderCurrentShoe()}

                    ${this.renderStatistics()}

                    ${this.renderRecentShoes()}

                    ${this.renderSecondaryActions()}

                </section>

                ${this.renderMobileBar()}

                <footer class="homeFooter">

                    <span>
                        ${escapeHTML(
                            this.data.appName
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            this.data.version
                        )}
                    </span>

                </footer>

            </main>

        `;

        return this;

    }


    renderHero() {

        return `

            <header class="homeHero">

                <div class="homeHeroInner">

                    <div class="homeBrand">

                        <span class="homeBrandMark">
                            BA
                        </span>

                        <div>

                            <p class="homeEyebrow">
                                BACCARAT ANALYSIS SYSTEM
                            </p>

                            <h1>
                                ${escapeHTML(
                                    this.data.appName
                                )}
                            </h1>

                            <p class="homeSubtitle">
                                ${escapeHTML(
                                    this.data.subtitle
                                )}
                            </p>

                        </div>

                    </div>

                    <div class="homeHeroActions">

                        <button
                            type="button"
                            class="homeButton homeButtonPrimary"
                            data-home-action="new-shoe"
                        >
                            <span class="homeButtonIcon">
                                ＋
                            </span>

                            <span>
                                建立新牌靴
                            </span>
                        </button>

                        <button
                            type="button"
                            class="homeButton homeButtonSecondary"
                            data-home-action="test-mode"
                        >
                            測試模式
                        </button>

                    </div>

                </div>

            </header>

        `;

    }


    renderPrimaryActions() {

        return `

            <section class="homeSection homeQuickActions">

                <div class="homeSectionHeader">

                    <div>

                        <p class="homeEyebrow">
                            QUICK START
                        </p>

                        <h2>
                            快速開始
                        </h2>

                    </div>

                </div>

                <div class="homeActionGrid">

                    ${this.renderActionCard({
                        action: "new-shoe",
                        icon: "＋",
                        title: "建立新牌靴",
                        description:
                            "建立 8 副牌牌靴，輸入燒牌後開始分析。",
                        primary: true
                    })}

                    ${this.renderActionCard({
                        action: "test-mode",
                        icon: "🧪",
                        title: "測試模式",
                        description:
                            "只記錄建議與結果，不計入真實資金。",
                        primary: false
                    })}

                    ${this.renderActionCard({
                        action: "history",
                        icon: "◷",
                        title: "歷史紀錄",
                        description:
                            "查看過去牌靴、牌局與分析紀錄。",
                        primary: false
                    })}

                    ${this.renderActionCard({
                        action: "settings",
                        icon: "⚙",
                        title: "設定",
                        description:
                            "調整牌靴、分析、下注與顯示設定。",
                        primary: false
                    })}

                </div>

            </section>

        `;

    }


    renderActionCard({

        action,

        icon,

        title,

        description,

        primary

    }) {

        return `

            <button
                type="button"
                class="homeActionCard ${primary
                    ? "primary"
                    : ""}"
                data-home-action="${escapeHTML(action)}"
            >

                <span class="homeActionIcon">
                    ${escapeHTML(icon)}
                </span>

                <span class="homeActionBody">

                    <strong>
                        ${escapeHTML(title)}
                    </strong>

                    <small>
                        ${escapeHTML(description)}
                    </small>

                </span>

                <span class="homeActionArrow">
                    →
                </span>

            </button>

        `;

    }


    renderCurrentShoe() {

        const shoe =
            this.data.currentShoe;

        if (!shoe) {

            return `

                <section class="homeSection homeCurrentShoe">

                    <div class="homeSectionHeader">

                        <div>

                            <p class="homeEyebrow">
                                CURRENT SHOE
                            </p>

                            <h2>
                                目前牌靴
                            </h2>

                        </div>

                    </div>

                    <div class="homeEmptyState">

                        <strong>
                            尚未建立牌靴
                        </strong>

                        <p>
                            建立新牌靴後，即可輸入燒牌並開始測試。
                        </p>

                        <button
                            type="button"
                            class="homeButton homeButtonPrimary"
                            data-home-action="new-shoe"
                        >
                            建立第一個牌靴
                        </button>

                    </div>

                </section>

            `;

        }


        return `

            <section class="homeSection homeCurrentShoe">

                <div class="homeSectionHeader">

                    <div>

                        <p class="homeEyebrow">
                            CURRENT SHOE
                        </p>

                        <h2>
                            目前牌靴
                        </h2>

                    </div>

                    <span class="homeStatusBadge">
                        進行中
                    </span>

                </div>

                <div class="homeShoeCard current">

                    <div class="homeShoeMain">

                        <div>

                            <strong>
                                牌靴 #${escapeHTML(
                                    shoe.number ??
                                    "—"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    shoe.deckCount ??
                                    8
                                )} 副牌
                            </span>

                        </div>

                        <div class="homeShoeMetrics">

                            <span>
                                <small>已完成</small>
                                <strong>
                                    ${escapeHTML(
                                        shoe.roundCount ??
                                        0
                                    )} 局
                                </strong>
                            </span>

                            <span>
                                <small>剩餘</small>
                                <strong>
                                    ${escapeHTML(
                                        shoe.remainingCards ??
                                        "—"
                                    )} 張
                                </strong>
                            </span>

                        </div>

                    </div>

                    <button
                        type="button"
                        class="homeButton homeButtonPrimary"
                        data-home-action="continue-shoe"
                    >
                        繼續使用
                    </button>

                </div>

            </section>

        `;

    }


    renderStatistics() {

        const statistics =
            this.data.statistics;

        return `

            <section class="homeSection">

                <div class="homeSectionHeader">

                    <div>

                        <p class="homeEyebrow">
                            OVERVIEW
                        </p>

                        <h2>
                            測試摘要
                        </h2>

                    </div>

                </div>

                <div class="homeStatGrid">

                    ${this.renderStat(
                        "牌靴",
                        statistics.totalShoes
                    )}

                    ${this.renderStat(
                        "牌局",
                        statistics.totalRounds
                    )}

                    ${this.renderStat(
                        "完成分析",
                        statistics.completedAnalyses
                    )}

                </div>

            </section>

        `;

    }


    renderStat(
        label,
        value
    ) {

        return `

            <div class="homeStatCard">

                <span>
                    ${escapeHTML(label)}
                </span>

                <strong>
                    ${escapeHTML(value)}
                </strong>

            </div>

        `;

    }


    renderRecentShoes() {

        const shoes =
            this.data.recentShoes
                .slice(0, 5);

        return `

            <section class="homeSection">

                <div class="homeSectionHeader">

                    <div>

                        <p class="homeEyebrow">
                            RECENT
                        </p>

                        <h2>
                            最近牌靴
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="homeTextButton"
                        data-home-action="history"
                    >
                        查看全部
                    </button>

                </div>

                ${shoes.length === 0
                    ? `
                        <div class="homeEmptyInline">
                            尚無最近牌靴
                        </div>
                    `
                    : `
                        <div class="homeRecentList">

                            ${shoes.map(
                                shoe =>
                                    this.renderRecentShoe(
                                        shoe
                                    )
                            ).join("")}

                        </div>
                    `}

            </section>

        `;

    }


    renderRecentShoe(shoe) {

        return `

            <button
                type="button"
                class="homeRecentItem"
                data-home-action="open-shoe"
                data-shoe-id="${escapeHTML(
                    shoe.id ??
                    ""
                )}"
            >

                <span class="homeRecentIcon">
                    #
                </span>

                <span class="homeRecentBody">

                    <strong>
                        牌靴 ${escapeHTML(
                            shoe.number ??
                            "—"
                        )}
                    </strong>

                    <small>
                        ${escapeHTML(
                            shoe.roundCount ??
                            0
                        )} 局 ·
                        ${escapeHTML(
                            formatDate(
                                shoe.updatedAt
                            )
                        )}
                    </small>

                </span>

                <span class="homeActionArrow">
                    →
                </span>

            </button>

        `;

    }


    renderSecondaryActions() {

        return `

            <section class="homeSection homeSecondaryActions">

                <button
                    type="button"
                    class="homeSecondaryButton"
                    data-home-action="history"
                >
                    歷史紀錄
                </button>

                <button
                    type="button"
                    class="homeSecondaryButton"
                    data-home-action="settings"
                >
                    應用程式設定
                </button>

            </section>

        `;

    }


    renderMobileBar() {

        return `

            <nav class="homeMobileBar">

                <button
                    type="button"
                    data-home-action="history"
                >
                    <span>◷</span>
                    <small>歷史</small>
                </button>

                <button
                    type="button"
                    class="primary"
                    data-home-action="new-shoe"
                >
                    <span>＋</span>
                    <small>新牌靴</small>
                </button>

                <button
                    type="button"
                    data-home-action="settings"
                >
                    <span>⚙</span>
                    <small>設定</small>
                </button>

            </nav>

        `;

    }

}


export default function createHomePage(
    options = {}
) {

    return new HomePage(
        options
    );

}
