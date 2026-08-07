/**
 * Baccarat Analyzer V10.4.4
 * Path: renderers/DashboardRenderer.js
 *
 * Dashboard 外框與共用區塊渲染。
 */

export const DASHBOARD_RENDERER_VERSION =
    "3.4.3";

export const DASHBOARD_RENDERER_LIVE_VERSION =
    "10.4.4";


function escapeHTML(value) {

    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        );

}


export default class DashboardRenderer {

    constructor({

        version,
        sections,
        modes

    } = {}) {

        this.version =
            version;

        this.sections =
            sections;

        this.modes =
            modes;

    }


    renderShell({

        ui,
        statusHTML,
        roundHTML,
        recommendationHTML,
        analysisHTML,
        historyHTML,
        roadmapHTML,
        roundCount,
        hasAnalysis,
        isManualRoundActive

    }) {

        return `

            <main
                class="dashboardV33"
                data-mobile-section="${escapeHTML(
                    ui.mobileSection
                )}"
            >

                ${this.renderHeader(
                    ui
                )}

                ${this.renderMessage(
                    ui
                )}

                ${statusHTML}

                ${this.renderMobileNavigation({

                    ui,

                    roundCount,

                    hasAnalysis,

                    isManualRoundActive

                })}


                <div class="v33CasinoGrid">

                    <section
                        class="v33InputZone"
                        data-v33-section="input"
                    >
                        ${roundHTML}
                    </section>


                    <section
                        class="v33InsightZone"
                        data-v33-section="insight"
                    >
                        ${recommendationHTML}

                        ${analysisHTML}
                    </section>


                    <aside class="v33HistoryZone">
                        ${historyHTML}
                    </aside>


                    <section
                        class="v33RoadZone"
                        data-v33-section="roadmap"
                    >
                        ${roadmapHTML}
                    </section>

                </div>

            </main>

        `;

    }


    renderHeader(ui) {

        return `

            <header class="v3Header dashboardCard v1044Header">

                <div class="v1044Brand">

                    <small>
                        BACCARAT ANALYZER V${escapeHTML(
                            this.version
                        )}
                    </small>

                    <h1>
                        百家樂分析儀
                    </h1>

                </div>


                <div class="v3HeaderActions v1044HeaderActions">

                    <span
                        class="v31FastBadge"
                        title="Casino Fast Input 已啟用"
                    >
                        FAST INPUT
                    </span>

                    <div
                        class="v1044ControlRow"
                        role="group"
                        aria-label="Dashboard 控制"
                    >
                        <div
                            class="v3ModeSwitch v1044ModeSwitch"
                            role="group"
                            aria-label="分析模式"
                        >

                            ${this.modeButton({
                                mode:
                                    this.modes.QUICK,
                                label:
                                    "快速",
                                activeMode:
                                    ui.mode
                            })}

                            ${this.modeButton({
                                mode:
                                    this.modes.FULL,
                                label:
                                    "完整",
                                activeMode:
                                    ui.mode
                            })}

                        </div>

                        <button
                            type="button"
                            class="button primary v1044NewShoe"
                            data-action="new-shoe"
                            ${ui.busy
                                ? "disabled"
                                : ""}
                        >
                            新牌靴
                        </button>
                    </div>

                </div>

            </header>

        `;

    }


    modeButton({

        mode,
        label,
        activeMode

    }) {

        return `

            <button
                type="button"
                class="${activeMode === mode
                    ? "active"
                    : ""}"
                data-action="set-dashboard-mode"
                data-mode="${escapeHTML(
                    mode
                )}"
            >
                ${escapeHTML(
                    label
                )}
            </button>

        `;

    }


    renderMessage(ui) {

        if (!ui.message) {
            return "";
        }

        const type =
            String(
                ui.messageType ??
                "info"
            ).toLowerCase();

        if (
            type !== "error" &&
            type !== "danger"
        ) {
            return "";
        }

        return `
            <div
                class="v3Message ${escapeHTML(type)} v1044ErrorMessage"
                role="alert"
            >
                <span>${escapeHTML(ui.message)}</span>
            </div>
        `;

    }


    renderMobileNavigation({

        ui,
        roundCount,
        hasAnalysis,
        isManualRoundActive

    }) {

        const items = [

            {

                section:
                    this.sections.INPUT,

                label:
                    "輸牌",

                hint:
                    isManualRoundActive
                        ? "本局輸入中"
                        : "牌局操作"

            },

            {

                section:
                    this.sections.INSIGHT,

                label:
                    "分析",

                hint:
                    hasAnalysis
                        ? "建議已更新"
                        : "等待分析"

            },

            {

                section:
                    this.sections.ROADMAP,

                label:
                    "路單",

                hint:
                    `${roundCount ?? 0} 局`

            }

        ];


        return `

            <nav
                class="v33MobileNav"
                aria-label="手機 Dashboard 區域"
            >

                ${items
                    .map(
                        item => `

                            <button
                                type="button"
                                class="${ui.mobileSection === item.section
                                    ? "active"
                                    : ""}"
                                data-action="set-mobile-section"
                                data-section="${escapeHTML(
                                    item.section
                                )}"
                            >

                                <strong>
                                    ${escapeHTML(
                                        item.label
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        item.hint
                                    )}
                                </small>

                            </button>

                        `
                    )
                    .join(
                        ""
                    )}

            </nav>

        `;

    }


    get summary() {

        return {

            version:
                DASHBOARD_RENDERER_VERSION

        };

    }

}
