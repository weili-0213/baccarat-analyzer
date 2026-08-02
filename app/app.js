/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * app/app.js
 *
 * 應用程式入口與頁面整合。
 *
 * 流程：
 *
 * 首頁
 * → 建立新牌靴精靈
 * → 建立 Game
 * → 確認燒牌
 * → 第一局分析
 * → Dashboard
 *
 * 路由：
 *
 * #/
 * #/new-shoe
 * #/dashboard
 * #/test
 * #/history
 * #/settings
 */

import createHomePage
    from "../pages/home.js";

import createNewShoePage
    from "../pages/newShoe.js";

import createDashboard
    from "../pages/dashboard.js";


const ROUTES =
    Object.freeze({

        HOME:
            "/",

        NEW_SHOE:
            "/new-shoe",

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


function normalizeDeckCount(value) {

    const deckCount =
        Number(value);

    if (
        !Number.isInteger(deckCount) ||
        deckCount < 1 ||
        deckCount > 12
    ) {

        throw new RangeError(
            "Deck count must be an integer between 1 and 12."
        );

    }

    return deckCount;

}


function normalizeBurnCard(value) {

    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {

        throw new TypeError(
            "Burn card is required."
        );

    }

    const rank =
        String(
            value.rank ??
            ""
        ).toUpperCase();

    const suit =
        String(
            value.suit ??
            ""
        ).toUpperCase();

    if (!rank || !suit) {

        throw new Error(
            "Burn card rank and suit are required."
        );

    }

    return {

        rank,

        suit

    };

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

        /**
         * New Shoe Wizard 完成後，
         * 在切換 Dashboard 時使用。
         */
        this.pendingNewShoe =
            null;


        this.boundHashChange =
            () => {

                this.renderCurrentRoute()
                    .catch(
                        error =>
                            this.handleRouteError(
                                error
                            )
                    );

            };


        this.boundHomeNewShoe =
            () =>
                this.handleNewShoe();

        this.boundHomeContinueShoe =
            () =>
                this.handleContinueShoe();

        this.boundHomeTestMode =
            () =>
                this.handleTestMode();

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
                this.handleOpenShoe(
                    event
                );


        this.boundNewShoeConfirm =
            event =>
                this.handleNewShoeConfirm(
                    event
                );

        this.boundNewShoeCancel =
            () =>
                this.handleNewShoeCancel();


        this.boundAppNavigate =
            event =>
                this.handleAppNavigate(
                    event
                );

    }


    start() {

        this.bind();

        if (!window.location.hash) {

            window.location.hash =
                "#/";

            return this;

        }

        this.renderCurrentRoute()
            .catch(
                error =>
                    this.handleRouteError(
                        error
                    )
            );

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
            "new-shoe:confirm",
            this.boundNewShoeConfirm
        );

        this.root.addEventListener(
            "new-shoe:cancel",
            this.boundNewShoeCancel
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
            "new-shoe:confirm",
            this.boundNewShoeConfirm
        );

        this.root.removeEventListener(
            "new-shoe:cancel",
            this.boundNewShoeCancel
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


    destroy() {

        this.unbind();

        this.destroyPage();

        this.game =
            null;

        this.pendingNewShoe =
            null;

        return this;

    }


    navigate(
        route,
        {
            replace = false
        } = {}
    ) {

        const normalized =
            normalizeRoute(
                route
            );

        const hash =
            `#${normalized}`;

        if (
            window.location.hash ===
            hash
        ) {

            this.renderCurrentRoute()
                .catch(
                    error =>
                        this.handleRouteError(
                            error
                        )
                );

            return this;

        }

        if (replace) {

            window.history.replaceState(
                null,
                "",
                hash
            );

            this.renderCurrentRoute()
                .catch(
                    error =>
                        this.handleRouteError(
                            error
                        )
                );

            return this;

        }

        window.location.hash =
            normalized;

        return this;

    }


    async renderCurrentRoute() {

        const route =
            normalizeRoute(
                window.location.hash
            );

        switch (route) {

            case ROUTES.HOME:

                this.showHome();

                break;


            case ROUTES.NEW_SHOE:

                this.showNewShoe();

                break;


            case ROUTES.DASHBOARD:

                await this.showDashboard({

                    mode:
                        this.mode,

                    newShoe:
                        this.consumePendingNewShoe()

                });

                break;


            case ROUTES.TEST:

                this.mode =
                    "test";

                await this.showDashboard({

                    mode:
                        "test",

                    newShoe:
                        this.consumePendingNewShoe()

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


    showNewShoe() {

        this.destroyPage();

        this.pageName =
            "new-shoe";

        this.page =
            createNewShoePage({

                root:
                    this.root,

                deckCount:
                    8,

                rank:
                    "A",

                suit:
                    "S"

            });

        document.title =
            this.mode === "test"
                ? "建立測試牌靴｜Baccarat Analyzer"
                : "建立新牌靴｜Baccarat Analyzer";

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


    consumePendingNewShoe() {

        const value =
            this.pendingNewShoe;

        this.pendingNewShoe =
            null;

        return value;

    }


    async showDashboard({

        mode =
            this.mode,

        newShoe =
            null

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


        if (newShoe) {

            /*
             * Wizard 建立的是全新牌靴，
             * 不沿用舊 Game。
             */
            this.game =
                null;

            options.gameOptions =
                {
                    deckCount:
                        normalizeDeckCount(
                            newShoe.deckCount
                        )
                };

        }
        else if (this.game) {

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


        if (newShoe) {

            await this.initializeNewShoe(
                newShoe
            );

        }

        return this.page;

    }


    async initializeNewShoe(config) {

        if (
            !this.page ||
            this.pageName !==
                "dashboard"
        ) {

            throw new Error(
                "Dashboard is not ready."
            );

        }

        const burnCard =
            normalizeBurnCard(
                config.burnCard
            );


        /**
         * Dashboard 的公開方法會：
         *
         * 1. 建立並洗牌
         * 2. 確認燒牌
         * 3. 執行第一局分析
         * 4. 顯示成功／錯誤訊息
         */
        if (
            typeof this.page
                .startNewShoe !==
                "function" ||
            typeof this.page
                .confirmBurn !==
                "function"
        ) {

            throw new Error(
                "Dashboard does not support new shoe initialization."
            );

        }


        await this.page
            .startNewShoe();


        this.page.ui.selectedRank =
            burnCard.rank;

        this.page.ui.selectedSuit =
            burnCard.suit;

        this.page.render();


        await this.page
            .confirmBurn();


        if (
            !this.game
                ?.burnConfirmed
        ) {

            throw new Error(
                "Burn confirmation failed."
            );

        }

        return this.game;

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

        if (
            page.querySelector(
                ".testModeNotice"
            )
        ) {

            return;

        }

        const notice =
            document.createElement(
                "div"
            );

        notice.className =
            "dashboardMessage info testModeNotice";

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
                                目前可以先使用首頁、新牌靴精靈與 Dashboard。
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


    /**
     * 首頁：建立新牌靴
     */
    handleNewShoe() {

        this.mode =
            "normal";

        this.pendingNewShoe =
            null;

        this.navigate(
            ROUTES.NEW_SHOE
        );

    }


    /**
     * 首頁：繼續牌靴
     */
    handleContinueShoe() {

        if (!this.game) {

            this.handleNewShoe();

            return;

        }

        this.mode =
            "normal";

        this.navigate(
            ROUTES.DASHBOARD
        );

    }


    /**
     * 首頁：測試模式
     *
     * 測試模式也先經過 New Shoe Wizard。
     */
    handleTestMode() {

        this.mode =
            "test";

        this.pendingNewShoe =
            null;

        this.navigate(
            ROUTES.NEW_SHOE
        );

    }


    /**
     * Wizard：確認建立。
     */
    handleNewShoeConfirm(event) {

        try {

            const detail =
                event.detail ??
                {};

            this.pendingNewShoe =
                {
                    deckCount:
                        normalizeDeckCount(
                            detail.deckCount
                        ),

                    burnCard:
                        normalizeBurnCard(
                            detail.burnCard
                        )
                };


            this.game =
                null;


            this.navigate(
                this.mode === "test"
                    ? ROUTES.TEST
                    : ROUTES.DASHBOARD
            );

        }
        catch (error) {

            console.error(
                "Invalid new shoe configuration:",
                error
            );

            /*
             * 讓 Wizard 可再次提交。
             */
            if (
                this.pageName ===
                    "new-shoe" &&
                this.page?.state
            ) {

                this.page.state.submitting =
                    false;

                this.page.state.error =
                    error?.message ??
                    String(error);

                this.page.render();

            }

        }

    }


    /**
     * Wizard：取消。
     */
    handleNewShoeCancel() {

        this.pendingNewShoe =
            null;

        this.mode =
            "normal";

        this.navigate(
            ROUTES.HOME
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
         * 儲存／載入尚未完成。
         * 若目前有 Game，先回 Dashboard。
         */
        if (this.game) {

            this.navigate(
                ROUTES.DASHBOARD
            );

            return;

        }

        this.handleNewShoe();

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


    handleRouteError(error) {

        console.error(
            "Route rendering failed:",
            error
        );

        showBootError(
            error
        );

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
