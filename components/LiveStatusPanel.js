/**
 * Baccarat Analyzer V4.6
 * components/LiveStatusPanel.js
 */

import {
    LiveDashboardStatus
} from "../dashboard/LiveDashboardController.js";


export const LIVE_STATUS_PANEL_VERSION = "4.6.0";


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function statusLabel(status) {
    return {
        [LiveDashboardStatus.IDLE]:
            "待命",

        [LiveDashboardStatus.RUNNING]:
            "即時更新中",

        [LiveDashboardStatus.PAUSED]:
            "已暫停",

        [LiveDashboardStatus.STOPPED]:
            "已停止",

        [LiveDashboardStatus.DESTROYED]:
            "已銷毀"
    }[status] ?? "未知";
}


export default class LiveStatusPanel {
    constructor({
        documentRef =
            globalThis.document ?? null,

        onToggle =
            null,

        onRefresh =
            null,

        onIntervalChange =
            null
    } = {}) {
        this.document =
            documentRef;

        this.onToggle =
            onToggle;

        this.onRefresh =
            onRefresh;

        this.onIntervalChange =
            onIntervalChange;

        this.root =
            null;

        this.state = {
            status:
                LiveDashboardStatus.IDLE,

            refreshInterval:
                250,

            refreshCount:
                0,

            eventCount:
                0,

            coalescedCount:
                0,

            lastRefreshAt:
                null
        };
    }

    template(state = this.state) {
        const running =
            state.status ===
            LiveDashboardStatus.RUNNING;

        return `
            <section class="live-status-panel"
                data-live-status-panel
                data-live-status="${escapeHTML(state.status)}">

                <div class="live-status-panel__identity">
                    <span class="live-status-panel__indicator"></span>

                    <div>
                        <strong>
                            ${escapeHTML(
                                statusLabel(state.status)
                            )}
                        </strong>

                        <small>
                            更新 ${escapeHTML(state.refreshCount)} 次
                            ·
                            事件 ${escapeHTML(state.eventCount)}
                            ·
                            合併 ${escapeHTML(state.coalescedCount)}
                        </small>
                    </div>
                </div>

                <div class="live-status-panel__controls">

                    <label>
                        <span>更新間隔</span>

                        <select data-live-interval>
                            ${[
                                [0, "即時"],
                                [100, "100 ms"],
                                [250, "250 ms"],
                                [500, "500 ms"],
                                [1000, "1 秒"]
                            ].map(([value, label]) => `
                                <option value="${value}"
                                    ${
                                        Number(
                                            state.refreshInterval
                                        ) === value
                                            ? "selected"
                                            : ""
                                    }>
                                    ${label}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <button type="button"
                        data-live-action="refresh">
                        立即刷新
                    </button>

                    <button type="button"
                        data-live-action="toggle">
                        ${running ? "暫停" : "繼續"}
                    </button>

                </div>

            </section>
        `;
    }

    bind() {
        if (!this.root) {
            return;
        }

        this.root
            .querySelector(
                "[data-live-action='toggle']"
            )
            ?.addEventListener(
                "click",
                () => {
                    this.onToggle?.();
                }
            );

        this.root
            .querySelector(
                "[data-live-action='refresh']"
            )
            ?.addEventListener(
                "click",
                () => {
                    this.onRefresh?.();
                }
            );

        this.root
            .querySelector(
                "[data-live-interval]"
            )
            ?.addEventListener(
                "change",
                event => {
                    this.onIntervalChange?.(
                        Number(
                            event.target.value
                        )
                    );
                }
            );
    }

    mount(target, state = this.state) {
        if (!this.document) {
            throw new Error(
                "LiveStatusPanel requires a document."
            );
        }

        const element =
            typeof target === "string"
                ? this.document
                    .querySelector(target)
                : target;

        if (!element) {
            throw new Error(
                "LiveStatusPanel mount target was not found."
            );
        }

        this.state = {
            ...this.state,
            ...state
        };

        element.innerHTML =
            this.template(
                this.state
            );

        this.root =
            element.querySelector(
                "[data-live-status-panel]"
            );

        this.bind();

        return this.root;
    }

    update(state) {
        this.state = {
            ...this.state,
            ...state
        };

        if (!this.root) {
            return null;
        }

        return this.mount(
            this.root.parentElement,
            this.state
        );
    }

    destroy() {
        if (this.root?.parentElement) {
            this.root
                .parentElement
                .innerHTML = "";
        }

        this.root = null;

        return this;
    }

    get summary() {
        return {
            version:
                LIVE_STATUS_PANEL_VERSION,

            mounted:
                Boolean(this.root),

            status:
                this.state.status,

            refreshInterval:
                this.state.refreshInterval
        };
    }
}
