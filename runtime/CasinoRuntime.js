/**
 * Baccarat Analyzer V5.0
 * runtime/CasinoRuntime.js
 *
 * Casino Runtime Core
 *
 * Orchestrates:
 * - Game lifecycle
 * - Session lifecycle
 * - Analysis lifecycle
 * - Dashboard lifecycle
 * - Runtime state transitions
 *
 * The runtime uses adapters instead of directly depending on a specific
 * Game, Analyzer, SessionStore, or Dashboard implementation.
 */

export const CASINO_RUNTIME_VERSION = "5.0.0";

export const RuntimeStatus = Object.freeze({
    IDLE: "idle",
    STARTING: "starting",
    READY: "ready",
    ROUND_ACTIVE: "round-active",
    ANALYZING: "analyzing",
    PAUSED: "paused",
    STOPPING: "stopping",
    STOPPED: "stopped",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const RuntimeEvent = Object.freeze({
    STATUS_CHANGE: "runtime:status-change",
    START: "runtime:start",
    STOP: "runtime:stop",
    PAUSE: "runtime:pause",
    RESUME: "runtime:resume",
    ROUND_START: "runtime:round-start",
    ROUND_COMPLETE: "runtime:round-complete",
    ANALYSIS_START: "runtime:analysis-start",
    ANALYSIS_COMPLETE: "runtime:analysis-complete",
    DASHBOARD_UPDATE: "runtime:dashboard-update",
    ERROR: "runtime:error",
    DESTROY: "runtime:destroy"
});

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function cloneValue(value) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        }
        catch {
            // Fall through.
        }
    }

    if (typeof value.toJSON === "function") {
        return cloneValue(
            value.toJSON()
        );
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

function requireMethod(
    target,
    method,
    name
) {
    if (
        !target ||
        typeof target[method] !==
            "function"
    ) {
        throw new TypeError(
            `${name} requires ${method}().`
        );
    }

    return target;
}

export default class CasinoRuntime {
    constructor({
        game,
        analyzer,
        sessionStore,
        dashboard = null,
        eventBus = null,
        clock = () => new Date().toISOString(),
        options = {}
    } = {}) {
        this.game =
            requireMethod(
                game,
                "startRound",
                "game"
            );

        requireMethod(
            game,
            "completeRound",
            "game"
        );

        this.analyzer =
            requireMethod(
                analyzer,
                "analyze",
                "analyzer"
            );

        this.sessionStore =
            requireMethod(
                sessionStore,
                "start",
                "sessionStore"
            );

        requireMethod(
            sessionStore,
            "addRound",
            "sessionStore"
        );

        requireMethod(
            sessionStore,
            "addAnalysis",
            "sessionStore"
        );

        requireMethod(
            sessionStore,
            "end",
            "sessionStore"
        );

        if (
            dashboard !== null &&
            typeof dashboard.refresh !==
                "function" &&
            typeof dashboard.renderSession !==
                "function"
        ) {
            throw new TypeError(
                "dashboard requires refresh() or renderSession()."
            );
        }

        if (
            eventBus !== null &&
            typeof eventBus.emit !==
                "function"
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.dashboard =
            dashboard;

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.options = {
            autoAnalyze:
                options.autoAnalyze ??
                true,

            autoDashboard:
                options.autoDashboard ??
                true,

            stopOnError:
                options.stopOnError ??
                false
        };

        this.status =
            RuntimeStatus.IDLE;

        this.previousStatus =
            null;

        this.currentRound =
            null;

        this.lastRound =
            null;

        this.lastAnalysis =
            null;

        this.lastError =
            null;

        this.startedAt =
            null;

        this.stoppedAt =
            null;

        this.roundCount =
            0;

        this.analysisCount =
            0;

        this.dashboardUpdateCount =
            0;

        this.listeners =
            new Map();

        this.lifecycleCount =
            0;
    }

    on(type, listener) {
        if (typeof listener !== "function") {
            throw new TypeError(
                "listener must be a function."
            );
        }

        if (!this.listeners.has(type)) {
            this.listeners.set(
                type,
                new Set()
            );
        }

        this.listeners
            .get(type)
            .add(listener);

        return () => {
            this.listeners
                .get(type)
                ?.delete(listener);
        };
    }

    emit(type, payload = null) {
        const event = {
            type,
            payload:
                cloneValue(payload),

            status:
                this.status,

            timestamp:
                this.clock()
        };

        for (
            const listener of
            this.listeners.get(type) ?? []
        ) {
            listener(event);
        }

        this.eventBus?.emit(
            type,
            event
        );

        return event;
    }

    setStatus(status) {
        if (
            !Object.values(RuntimeStatus)
                .includes(status)
        ) {
            throw new Error(
                `Unknown runtime status: ${status}`
            );
        }

        const previous =
            this.status;

        this.previousStatus =
            previous;

        this.status =
            status;

        this.emit(
            RuntimeEvent.STATUS_CHANGE,
            {
                previous,
                current:
                    status
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (
            this.status ===
            RuntimeStatus.DESTROYED
        ) {
            throw new Error(
                "CasinoRuntime has been destroyed."
            );
        }
    }

    assertReadyForRound() {
        if (
            ![
                RuntimeStatus.READY
            ].includes(
                this.status
            )
        ) {
            throw new Error(
                `Runtime cannot start a round from status: ${this.status}`
            );
        }
    }

    async start({
        session = {},
        game = {}
    } = {}) {
        this.assertNotDestroyed();

        if (
            ![
                RuntimeStatus.IDLE,
                RuntimeStatus.STOPPED
            ].includes(
                this.status
            )
        ) {
            throw new Error(
                `Runtime cannot start from status: ${this.status}`
            );
        }

        this.setStatus(
            RuntimeStatus.STARTING
        );

        try {
            this.startedAt =
                this.clock();

            this.stoppedAt =
                null;

            this.lastError =
                null;

            this.currentRound =
                null;

            this.lastRound =
                null;

            this.lastAnalysis =
                null;

            this.roundCount =
                0;

            this.analysisCount =
                0;

            this.dashboardUpdateCount =
                0;

            if (
                typeof this.game.start ===
                    "function"
            ) {
                await this.game.start(
                    game
                );
            }

            this.sessionStore.start({
                ...session,

                startedAt:
                    session.startedAt ??
                    this.startedAt
            });

            this.lifecycleCount++;

            this.setStatus(
                RuntimeStatus.READY
            );

            this.emit(
                RuntimeEvent.START,
                this.summary
            );

            if (
                this.options.autoDashboard
            ) {
                await this.updateDashboard(
                    "runtime-start"
                );
            }

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "start"
            );
        }
    }

    async startRound(input = {}) {
        this.assertNotDestroyed();
        this.assertReadyForRound();

        this.setStatus(
            RuntimeStatus.ROUND_ACTIVE
        );

        try {
            this.currentRound =
                await this.game
                    .startRound(
                        input
                    );

            this.emit(
                RuntimeEvent.ROUND_START,
                {
                    round:
                        this.currentRound
                }
            );

            return cloneValue(
                this.currentRound
            );
        }
        catch (error) {
            return this.handleError(
                error,
                "startRound"
            );
        }
    }

    async completeRound(input = {}) {
        this.assertNotDestroyed();

        if (
            this.status !==
            RuntimeStatus.ROUND_ACTIVE
        ) {
            throw new Error(
                `Runtime cannot complete a round from status: ${this.status}`
            );
        }

        try {
            const result =
                await this.game
                    .completeRound(
                        input
                    );

            this.lastRound =
                result;

            this.currentRound =
                null;

            this.roundCount++;

            this.sessionStore
                .addRound(
                    result
                );

            this.emit(
                RuntimeEvent.ROUND_COMPLETE,
                {
                    round:
                        result,

                    roundCount:
                        this.roundCount
                }
            );

            this.setStatus(
                RuntimeStatus.READY
            );

            if (
                this.options.autoAnalyze
            ) {
                await this.analyze({
                    round:
                        result
                });
            }
            else if (
                this.options.autoDashboard
            ) {
                await this.updateDashboard(
                    "round-complete"
                );
            }

            return cloneValue(
                result
            );
        }
        catch (error) {
            return this.handleError(
                error,
                "completeRound"
            );
        }
    }

    async analyze(options = {}) {
        this.assertNotDestroyed();

        if (
            ![
                RuntimeStatus.READY,
                RuntimeStatus.ANALYZING
            ].includes(
                this.status
            )
        ) {
            throw new Error(
                `Runtime cannot analyze from status: ${this.status}`
            );
        }

        this.setStatus(
            RuntimeStatus.ANALYZING
        );

        this.emit(
            RuntimeEvent.ANALYSIS_START,
            {
                round:
                    this.lastRound,

                options
            }
        );

        try {
            const result =
                await this.analyzer
                    .analyze(
                        options
                    );

            this.lastAnalysis =
                result;

            this.analysisCount++;

            this.sessionStore
                .addAnalysis(
                    result
                );

            this.emit(
                RuntimeEvent.ANALYSIS_COMPLETE,
                {
                    analysis:
                        result,

                    analysisCount:
                        this.analysisCount
                }
            );

            this.setStatus(
                RuntimeStatus.READY
            );

            if (
                this.options.autoDashboard
            ) {
                await this.updateDashboard(
                    "analysis-complete"
                );
            }

            return cloneValue(
                result
            );
        }
        catch (error) {
            return this.handleError(
                error,
                "analyze"
            );
        }
    }

    async addBet(bet) {
        this.assertNotDestroyed();

        requireMethod(
            this.sessionStore,
            "addBet",
            "sessionStore"
        );

        const result =
            this.sessionStore
                .addBet(
                    bet
                );

        if (
            this.options.autoDashboard
        ) {
            await this.updateDashboard(
                "bet-added"
            );
        }

        return result;
    }

    async updateDashboard(
        reason = "manual"
    ) {
        if (!this.dashboard) {
            return null;
        }

        const session =
            this.sessionStore.export();

        let result;

        if (
            typeof this.dashboard
                .renderSession ===
                "function"
        ) {
            result =
                await this.dashboard
                    .renderSession(
                        session
                    );
        }
        else {
            result =
                await this.dashboard
                    .refresh(
                        session
                    );
        }

        this.dashboardUpdateCount++;

        this.emit(
            RuntimeEvent.DASHBOARD_UPDATE,
            {
                reason,

                updateCount:
                    this.dashboardUpdateCount
            }
        );

        return result;
    }

    pause() {
        this.assertNotDestroyed();

        if (
            ![
                RuntimeStatus.READY,
                RuntimeStatus.ROUND_ACTIVE
            ].includes(
                this.status
            )
        ) {
            return this;
        }

        this.setStatus(
            RuntimeStatus.PAUSED
        );

        this.dashboard
            ?.pauseLive
            ?.();

        this.emit(
            RuntimeEvent.PAUSE,
            this.summary
        );

        return this;
    }

    resume() {
        this.assertNotDestroyed();

        if (
            this.status !==
            RuntimeStatus.PAUSED
        ) {
            return this;
        }

        this.setStatus(
            this.currentRound
                ? RuntimeStatus.ROUND_ACTIVE
                : RuntimeStatus.READY
        );

        this.dashboard
            ?.resumeLive
            ?.();

        this.emit(
            RuntimeEvent.RESUME,
            this.summary
        );

        return this;
    }

    async stop({
        session = {}
    } = {}) {
        this.assertNotDestroyed();

        if (
            [
                RuntimeStatus.IDLE,
                RuntimeStatus.STOPPED
            ].includes(
                this.status
            )
        ) {
            return this.summary;
        }

        this.setStatus(
            RuntimeStatus.STOPPING
        );

        try {
            this.stoppedAt =
                this.clock();

            if (
                typeof this.game.stop ===
                    "function"
            ) {
                await this.game.stop();
            }

            this.sessionStore.end({
                ...session,

                endedAt:
                    session.endedAt ??
                    this.stoppedAt
            });

            this.setStatus(
                RuntimeStatus.STOPPED
            );

            this.emit(
                RuntimeEvent.STOP,
                this.summary
            );

            if (
                this.options.autoDashboard
            ) {
                await this.updateDashboard(
                    "runtime-stop"
                );
            }

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "stop"
            );
        }
    }

    handleError(
        error,
        phase = "runtime"
    ) {
        this.lastError =
            error;

        this.setStatus(
            RuntimeStatus.ERROR
        );

        this.emit(
            RuntimeEvent.ERROR,
            {
                phase,

                message:
                    error?.message ??
                    String(error)
            }
        );

        if (this.options.stopOnError) {
            try {
                this.sessionStore
                    .end({
                        metadata: {
                            error:
                                error?.message ??
                                String(error),

                            phase
                        }
                    });
            }
            catch {
                // Preserve original error.
            }
        }

        throw error;
    }

    async reset({
        session = {},
        game = {}
    } = {}) {
        this.assertNotDestroyed();

        if (
            ![
                RuntimeStatus.IDLE,
                RuntimeStatus.STOPPED,
                RuntimeStatus.ERROR
            ].includes(
                this.status
            )
        ) {
            await this.stop();
        }

        if (
            typeof this.sessionStore
                .reset ===
                "function"
        ) {
            this.sessionStore.reset();
        }

        if (
            typeof this.game.reset ===
                "function"
        ) {
            await this.game.reset(
                game
            );
        }

        this.setStatus(
            RuntimeStatus.IDLE
        );

        return this.start({
            session,
            game
        });
    }

    destroy() {
        if (
            this.status ===
            RuntimeStatus.DESTROYED
        ) {
            return this;
        }

        try {
            this.dashboard
                ?.destroy
                ?.();

            this.game
                ?.destroy
                ?.();

            this.analyzer
                ?.destroy
                ?.();
        }
        finally {
            this.listeners.clear();

            this.currentRound =
                null;

            this.lastRound =
                null;

            this.lastAnalysis =
                null;

            this.setStatus(
                RuntimeStatus.DESTROYED
            );

            this.emit(
                RuntimeEvent.DESTROY,
                null
            );
        }

        return this;
    }

    get session() {
        return this.sessionStore
            .export();
    }

    get isRunning() {
        return [
            RuntimeStatus.READY,
            RuntimeStatus.ROUND_ACTIVE,
            RuntimeStatus.ANALYZING,
            RuntimeStatus.PAUSED
        ].includes(
            this.status
        );
    }

    get summary() {
        return {
            version:
                CASINO_RUNTIME_VERSION,

            status:
                this.status,

            previousStatus:
                this.previousStatus,

            running:
                this.isRunning,

            startedAt:
                this.startedAt,

            stoppedAt:
                this.stoppedAt,

            roundCount:
                this.roundCount,

            analysisCount:
                this.analysisCount,

            dashboardUpdateCount:
                this.dashboardUpdateCount,

            hasCurrentRound:
                Boolean(
                    this.currentRound
                ),

            hasLastRound:
                Boolean(
                    this.lastRound
                ),

            hasLastAnalysis:
                Boolean(
                    this.lastAnalysis
                ),

            lifecycleCount:
                this.lifecycleCount,

            lastError:
                this.lastError
                    ?.message ??
                null,

            options: {
                ...this.options
            }
        };
    }
}
