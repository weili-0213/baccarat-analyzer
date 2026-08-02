/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * app/app.js
 *
 * 應用程式入口。
 *
 * 負責：
 *
 * - 啟動首頁
 * - 首頁與 Dashboard 切換
 * - 建立新牌靴
 * - 保留目前 Game
 * - 處理瀏覽器上一頁／下一頁
 * - 顯示尚未完成頁面的提示
 *
 * 路由：
 *
 * #/
 * #/dashboard
 * #/test
 * #/history
 * #/settings
 */

import createHomePage
    from "../pages/home.js";

import createDashboard
    from "../pages/dashboard.js";


const ROUTES =
    Object.freeze({

        HOME:
            "/",

        DASHBOARD:
            "/dashboard",

        TEST:
            "/test",

        HISTORY:
            "/history",

        SETTINGS:
            "/settings"

    });


function normalizeRoute(value) {

    const route =
        String(
            value ??
            ""
        )
            .replace(/^#/, "")
            .trim();

    if (
        route === "" ||
        route === "/"
    ) {

        return ROUTES.HOME;

    }

    return route.startsWith("/")
        ? route
        : `/${route}`;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


class BaccaratApplication {

    constructor({

        root = "#app"

    } = {}) {

        this.root =
            typeof root === "string"
                ? document.querySelector(root)
                : root;

        if (!(this.root instanceof Element)) {

            throw new Error(
                "Application root was not found."
            );

        }


        this.page =
            null;

        this.pageName =
            null;

        this.game =
            null;

        this.mode =
            "normal";

        this.boundHashChange =
            () =>
                this.renderCurrentRoute();

        this.boundHomeNewShoe =
            event =>
                this.handleNewShoe(event);

        this.boundHomeContinueShoe =
            event =>
                this.handleContinueShoe(event);

        this.boundHomeTestMode =
            event =>
                this.handleTestMode(event);

        this.boundHomeHistory =
            () =>
                this.navigate(
                    ROUTES.HISTORY
                );

        this.boundHomeSettings =
            () =>
                this.navigate(
                    ROUTES.SETTINGS
                );

        this.boundHomeOpenShoe =
            event =>
                this.handleOpenShoe(event);

        this.boundAppNavigate =
            event =>
                this.handleAppNavigate(event);

    }


    start() {

        this.bind();

        if (!window.location.hash) {

            window.location.hash =
                "#/";

            return this;

        }

        this.renderCurrentRoute();

        return this;

    }


    bind() {

        window.addEventListener(
            "hashchange",
            this.boundHashChange
        );

        this.root.addEventListener(
            "home:new-shoe",
            this.boundHomeNewShoe
        );

        this.root.addEventListener(
            "home:continue-shoe",
            this.boundHomeContinueShoe
        );

        this.root.addEventListener(
            "home:test-mode",
            this.boundHomeTestMode
        );

        this.root.addEventListener(
            "home:history",
            this.boundHomeHistory
        );

        this.root.addEventListener(
            "home:settings",
            this.boundHomeSettings
        );

        this.root.addEventListener(
            "home:open-shoe",
            this.boundHomeOpenShoe
        );

        this.root.addEventListener(
            "app:navigate",
            this.boundAppNavigate
        );

        return this;

    }


    unbind() {

        window.removeEventListener(
            "hashchange",
            this.boundHashChange
        );

        this.root.removeEventListener(
            "home:new-shoe",
            this.boundHomeNewShoe
        );

        this.root.removeEventListener(
            "home:continue-shoe",
            this.boundHomeContinueShoe
        );

        this.root.removeEventListener(
            "home:test-mode",
            this.boundHomeTestMode
        );

        this.root.removeEventListener(
            "home:history",
            this.boundHomeHistory
        );

        this.root.removeEventListener(
            "home:settings",
            this.boundHomeSettings
        );

        this.root.removeEventListener(
            "home:open-shoe",
            this.boundHomeOpenShoe
        );

        this.root.removeEventListener(
            "app:navigate",
            this.boundAppNavigate
        );

        return this;

    }


    destroyPage() {

        if (
            this.page &&
            typeof this.page.destroy ===
                "function"
        ) {

            /*
             * Dashboard destroy() 只清除畫面；
             * Game 另外保留在 this.game，
             * 因此返回首頁後仍可繼續。
             */
            if (
                this.pageName ===
                    "dashboard" &&
                this.page.game
            ) {

                this.game =
                    this.page.game;

            }

            this.page.destroy();

        }

        this.page =
            null;

        this.pageName =
            null;

        this.root.innerHTML =
            "";

        return this;

    }


    navigate(
        route,
        {
            replace = false
        } = {}
    ) {

        const normalized =
            normalizeRoute(route);

        const hash =
            `#${normalized}`;

        if (
            window.location.hash ===
            hash
        ) {

            this.renderCurrentRoute();

            return this;

        }

        if (replace) {

            window.history.replaceState(
                null,
                "",
                hash
            );

            this.renderCurrentRoute();

            return this;

        }

        window.location.hash =
            normalized;

        return this;

    }


    renderCurrentRoute() {

        const route =
            normalizeRoute(
                window.location.hash
            );

        switch (route) {

            case ROUTES.HOME:

                this.showHome();

                break;


            case ROUTES.DASHBOARD:

                this.showDashboard();

                break;


            case ROUTES.TEST:

                this.showDashboard({

                    mode:
                        "test",

                    startNew:
                        !this.game

                });

                break;


            case ROUTES.HISTORY:

                this.showPlaceholder({

                    title:
                        "歷史紀錄",

                    description:
                        "歷史紀錄頁尚在建置中。",

                    route:
                        ROUTES.HISTORY

                });

                break;


            case ROUTES.SETTINGS:

                this.showPlaceholder({

                    title:
                        "設定",

                    description:
                        "設定頁尚在建置中。",

                    route:
                        ROUTES.SETTINGS

                });

                break;


            default:

                this.navigate(
                    ROUTES.HOME,
                    {
                        replace:
                            true
                    }
                );

        }

        return this;

    }


    showHome() {

        this.destroyPage();

        this.pageName =
            "home";

        this.page =
            createHomePage({

                root:
                    this.root,

                data:
                    this.createHomeData()

            });

        document.title =
            "Baccarat Analyzer";

        return this.page;

    }


    createHomeData() {

        const game =
            this.game;

        const roundCount =
            Number(
                game?.roundCount ??
                game?.history?.count ??
                0
            );

        const currentShoe =
            game
                ? {
                    number:
                        game.shoeNumber ??
                        1,

                    deckCount:
                        game.shoe?.deckCount ??
                        game.deckCount ??
                        8,

                    roundCount,

                    remainingCards:
                        game.remainingCards ??
                        game.shoe?.remaining ??
                        "—"
                }
                : null;


        return {

            version:
                "Beta",

            currentShoe,

            recentShoes:
                [],

            statistics:
                {
                    totalShoes:
                        game
                            ? 1
                            : 0,

                    totalRounds:
                        roundCount,

                    completedAnalyses:
                        game?.nextAnalysis
                            ? Math.max(
                                1,
                                roundCount
                            )
                            : 0
                }

        };

    }


    showDashboard({

        mode =
            this.mode,

        startNew =
            false

    } = {}) {

        this.destroyPage();

        this.mode =
            mode;

        this.pageName =
            "dashboard";

        const options = {

            root:
                this.root

        };

        if (this.game) {

            options.game =
                this.game;

        }
        else {

            options.gameOptions =
                {
                    deckCount:
                        8
                };

        }

        this.page =
            createDashboard(
                options
            );

        this.game =
            this.page.game ??
            this.game;

        document.title =
            mode === "test"
                ? "測試模式｜Baccarat Analyzer"
                : "牌靴｜Baccarat Analyzer";


        this.insertDashboardNavigation();


        if (
            mode === "test"
        ) {

            this.insertTestModeNotice();

        }


        if (
            startNew &&
            typeof this.page.startNewShoe ===
                "function"
        ) {

            Promise.resolve(
                this.page.startNewShoe()
            ).catch(
                error => {

                    console.error(
                        "Failed to start new shoe:",
                        error
                    );

                }
            );

        }

        return this.page;

    }


    insertDashboardNavigation() {

        const header =
            this.root.querySelector(
                ".dashboardHeader"
            );

        if (!header) {

            return;

        }

        if (
            header.querySelector(
                '[data-app-action="home"]'
            )
        ) {

            return;

        }

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "button secondary";

        button.dataset.appAction =
            "home";

        button.textContent =
            "返回首頁";

        button.addEventListener(
            "click",
            () =>
                this.navigate(
                    ROUTES.HOME
                )
        );

        const actions =
            header.querySelector(
                ".dashboardHeaderActions"
            );

        if (actions) {

            actions.prepend(
                button
            );

        }
        else {

            header.appendChild(
                button
            );

        }

    }


    insertTestModeNotice() {

        const page =
            this.root.querySelector(
                ".dashboardPage"
            );

        if (!page) {

            return;

        }

        const notice =
            document.createElement(
                "div"
            );

        notice.className =
            "dashboardMessage info";

        notice.setAttribute(
            "role",
            "status"
        );

        notice.innerHTML = `

            <span>
                測試模式：請先以記錄與驗證為主，不計入真實資金。
            </span>

        `;

        const header =
            page.querySelector(
                ".dashboardHeader"
            );

        if (header) {

            header.insertAdjacentElement(
                "afterend",
                notice
            );

        }

    }


    showPlaceholder({

        title,

        description,

        route

    }) {

        this.destroyPage();

        this.pageName =
            route;

        this.root.innerHTML = `

            <main class="homePage">

                <header class="homeHero">

                    <div class="homeHeroInner">

                        <div class="homeBrand">

                            <span class="homeBrandMark">
                                BA
                            </span>

                            <div>

                                <p class="homeEyebrow">
                                    BACCARAT ANALYZER
                                </p>

                                <h1>
                                    ${escapeHTML(title)}
                                </h1>

                                <p class="homeSubtitle">
                                    ${escapeHTML(description)}
                                </p>

                            </div>

                        </div>

                    </div>

                </header>

                <section class="homeContent">

                    <section class="homeSection">

                        <div class="homeEmptyState">

                            <strong>
                                此功能尚未完成
                            </strong>

                            <p>
                                目前可以先使用首頁、建立新牌靴與 Dashboard。
                            </p>

                            <button
                                type="button"
                                class="homeButton homeButtonPrimary"
                                data-app-action="home"
                            >
                                返回首頁
                            </button>

                        </div>

                    </section>

                </section>

            </main>

        `;

        this.root
            .querySelector(
                '[data-app-action="home"]'
            )
            ?.addEventListener(
                "click",
                () =>
                    this.navigate(
                        ROUTES.HOME
                    )
            );

        document.title =
            `${title}｜Baccarat Analyzer`;

    }


    handleNewShoe() {

        /*
         * 明確建立全新 Game：
         * 不沿用上一個牌靴。
         */
        this.game =
            null;

        this.mode =
            "normal";

        this.navigate(
            ROUTES.DASHBOARD
        );

        /*
         * hashchange 完成後 Dashboard
         * 會自動建立並開始新牌靴。
         */
        queueMicrotask(
            () => {

                if (
                    this.pageName ===
                        "dashboard" &&
                    typeof this.page
                        ?.startNewShoe ===
                        "function"
                ) {

                    this.page
                        .startNewShoe();

                }

            }
        );

    }


    handleContinueShoe() {

        if (!this.game) {

            this.handleNewShoe();

            return;

        }

        this.navigate(
            ROUTES.DASHBOARD
        );

    }


    handleTestMode() {

        this.game =
            null;

        this.mode =
            "test";

        this.navigate(
            ROUTES.TEST
        );

    }


    handleOpenShoe(event) {

        const id =
            event.detail?.id;

        console.info(
            "Open saved shoe:",
            id
        );

        /*
         * 儲存／載入牌靴尚未完成，
         * 目前先進入 Dashboard。
         */
        this.navigate(
            ROUTES.DASHBOARD
        );

    }


    handleAppNavigate(event) {

        const route =
            event.detail?.route;

        if (route) {

            this.navigate(
                route
            );

        }

    }

}


function showBootError(error) {

    console.error(
        "Application boot failed:",
        error
    );

    const root =
        document.getElementById(
            "app"
        );

    if (!root) {

        return;

    }

    root.innerHTML = `

        <main class="homePage">

            <section class="homeContent">

                <section class="homeSection">

                    <div class="homeEmptyState">

                        <strong>
                            應用程式載入失敗
                        </strong>

                        <p>
                            ${escapeHTML(
                                error?.message ??
                                String(error)
                            )}
                        </p>

                        <button
                            type="button"
                            class="homeButton homeButtonPrimary"
                            onclick="window.location.reload()"
                        >
                            重新載入
                        </button>

                    </div>

                </section>

            </section>

        </main>

    `;

}


function boot() {

    try {

        const application =
            new BaccaratApplication({

                root:
                    "#app"

            });

        application.start();

        /*
         * 開發與除錯時可在 Console 使用：
         *
         * window.baccaratApp
         */
        window.baccaratApp =
            application;

    }
    catch (error) {

        showBootError(
            error
        );

    }

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        boot,
        {
            once:
                true
        }
    );

}
else {

    boot();

}


export {
    BaccaratApplication,
    ROUTES
};
