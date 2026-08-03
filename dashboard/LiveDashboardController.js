/**
 * Baccarat Analyzer V4.6
 * dashboard/LiveDashboardController.js
 *
 * Live dashboard orchestration layer.
 *
 * Responsibilities:
 * - listen to SessionStore events
 * - schedule/coalesce refreshes
 * - pause/resume live rendering
 * - control refresh interval
 * - expose live status and metrics
 */

export const LIVE_DASHBOARD_VERSION = "4.6.0";

export const LiveDashboardStatus = Object.freeze({
    IDLE: "idle",
    RUNNING: "running",
    PAUSED: "paused",
    STOPPED: "stopped",
    DESTROYED: "destroyed"
});

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function finiteOr(value, fallback = 0) {
    return Number.isFinite(value)
        ? value
        : fallback;
}

export default class LiveDashboardController {
    constructor({
        sessionStore,
        onRefresh,
        refreshInterval = 250,
        immediate = true,
        scheduler = globalThis,
        clock = () => Date.now()
    } = {}) {
        if (
            !sessionStore ||
            typeof sessionStore.subscribe !== "function" ||
            typeof sessionStore.export !== "function"
        ) {
            throw new Error(
                "LiveDashboardController requires a SessionStore."
            );
        }

        if (typeof onRefresh !== "function") {
            throw new TypeError(
                "LiveDashboardController requires onRefresh()."
            );
        }

        if (
            !Number.isFinite(refreshInterval) ||
            refreshInterval < 0
        ) {
            throw new RangeError(
                "refreshInterval must be zero or greater."
            );
        }

        if (
            !scheduler ||
            typeof scheduler.setTimeout !== "function" ||
            typeof scheduler.clearTimeout !== "function"
        ) {
            throw new TypeError(
                "scheduler requires setTimeout() and clearTimeout()."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.sessionStore = sessionStore;
        this.onRefresh = onRefresh;
        this.refreshInterval = refreshInterval;
        this.immediate = Boolean(immediate);
        this.scheduler = scheduler;
        this.clock = clock;

        this.status = LiveDashboardStatus.IDLE;
        this.unsubscribe = null;
        this.timer = null;
        this.pendingSession = null;
        this.pendingReasons = new Set();

        this.refreshCount = 0;
        this.eventCount = 0;
        this.coalescedCount = 0;
        this.lastRefreshAt = null;
        this.lastEventAt = null;
        this.lastReason = null;
        this.lastError = null;
    }

    start() {
        if (
            this.status === LiveDashboardStatus.DESTROYED
        ) {
            throw new Error(
                "LiveDashboardController has been destroyed."
            );
        }

        if (
            this.status === LiveDashboardStatus.RUNNING
        ) {
            return this;
        }

        this.unsubscribe?.();

        this.unsubscribe =
            this.sessionStore.subscribe(
                event => this.handleStoreEvent(event)
            );

        this.status =
            LiveDashboardStatus.RUNNING;

        if (this.immediate) {
            this.requestRefresh(
                this.sessionStore.export(),
                "start"
            );
        }

        return this;
    }

    stop() {
        if (
            this.status === LiveDashboardStatus.DESTROYED
        ) {
            return this;
        }

        this.unsubscribe?.();
        this.unsubscribe = null;

        this.cancelScheduledRefresh();

        this.status =
            LiveDashboardStatus.STOPPED;

        return this;
    }

    pause() {
        if (
            this.status !== LiveDashboardStatus.RUNNING
        ) {
            return this;
        }

        this.status =
            LiveDashboardStatus.PAUSED;

        this.cancelScheduledRefresh();

        return this;
    }

    resume({
        refresh = true
    } = {}) {
        if (
            this.status === LiveDashboardStatus.DESTROYED
        ) {
            throw new Error(
                "LiveDashboardController has been destroyed."
            );
        }

        if (
            this.status === LiveDashboardStatus.IDLE ||
            this.status === LiveDashboardStatus.STOPPED
        ) {
            this.start();
            return this;
        }

        this.status =
            LiveDashboardStatus.RUNNING;

        if (refresh) {
            this.requestRefresh(
                this.pendingSession ??
                this.sessionStore.export(),
                "resume"
            );
        }

        return this;
    }

    toggle() {
        if (
            this.status === LiveDashboardStatus.PAUSED
        ) {
            return this.resume();
        }

        return this.pause();
    }

    setRefreshInterval(value) {
        if (
            !Number.isFinite(value) ||
            value < 0
        ) {
            throw new RangeError(
                "refreshInterval must be zero or greater."
            );
        }

        this.refreshInterval = value;

        if (this.timer !== null) {
            const session =
                this.pendingSession ??
                this.sessionStore.export();

            this.cancelScheduledRefresh();

            this.requestRefresh(
                session,
                "interval-change"
            );
        }

        return this;
    }

    handleStoreEvent(event) {
        this.eventCount++;
        this.lastEventAt = this.clock();

        if (
            [
                "save",
                "storage:remove"
            ].includes(event.type)
        ) {
            return;
        }

        this.requestRefresh(
            event.session,
            event.type
        );
    }

    requestRefresh(
        session = null,
        reason = "manual"
    ) {
        this.pendingSession =
            session ??
            this.sessionStore.export();

        this.pendingReasons.add(reason);
        this.lastReason = reason;

        if (
            this.status !== LiveDashboardStatus.RUNNING
        ) {
            return false;
        }

        if (this.refreshInterval === 0) {
            this.flush();
            return true;
        }

        if (this.timer !== null) {
            this.coalescedCount++;
            return false;
        }

        this.timer =
            this.scheduler.setTimeout(
                () => {
                    this.timer = null;
                    this.flush();
                },
                this.refreshInterval
            );

        return true;
    }

    flush() {
        if (
            this.status !== LiveDashboardStatus.RUNNING
        ) {
            return null;
        }

        this.cancelScheduledRefresh();

        const session =
            this.pendingSession ??
            this.sessionStore.export();

        const reasons =
            [...this.pendingReasons];

        this.pendingSession = null;
        this.pendingReasons.clear();

        try {
            const result =
                this.onRefresh(
                    session,
                    {
                        reasons,
                        eventCount:
                            this.eventCount,
                        refreshCount:
                            this.refreshCount + 1
                    }
                );

            this.refreshCount++;
            this.lastRefreshAt =
                this.clock();
            this.lastError = null;

            return result;
        }
        catch (error) {
            this.lastError = error;
            throw error;
        }
    }

    refreshNow(reason = "manual") {
        this.pendingSession =
            this.sessionStore.export();

        this.pendingReasons.add(reason);
        this.lastReason = reason;

        return this.flush();
    }

    cancelScheduledRefresh() {
        if (this.timer !== null) {
            this.scheduler.clearTimeout(
                this.timer
            );

            this.timer = null;
        }
    }

    clearPending() {
        this.cancelScheduledRefresh();
        this.pendingSession = null;
        this.pendingReasons.clear();

        return this;
    }

    destroy() {
        this.stop();
        this.clearPending();

        this.status =
            LiveDashboardStatus.DESTROYED;

        return this;
    }

    get isRunning() {
        return (
            this.status ===
            LiveDashboardStatus.RUNNING
        );
    }

    get isPaused() {
        return (
            this.status ===
            LiveDashboardStatus.PAUSED
        );
    }

    get summary() {
        return {
            version:
                LIVE_DASHBOARD_VERSION,

            status:
                this.status,

            running:
                this.isRunning,

            paused:
                this.isPaused,

            refreshInterval:
                this.refreshInterval,

            refreshCount:
                this.refreshCount,

            eventCount:
                this.eventCount,

            coalescedCount:
                this.coalescedCount,

            pending:
                this.timer !== null ||
                this.pendingSession !== null,

            pendingReasons:
                [...this.pendingReasons],

            lastRefreshAt:
                this.lastRefreshAt,

            lastEventAt:
                this.lastEventAt,

            lastReason:
                this.lastReason,

            lastError:
                this.lastError
                    ?.message ??
                null
        };
    }
}
