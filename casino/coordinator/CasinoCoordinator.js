/**
 * Baccarat Analyzer V6.7
 * casino/coordinator/CasinoCoordinator.js
 *
 * Coordinates the complete V6 engine stack:
 * Session -> Casino -> Dealer -> Round -> Shoe
 * -> Analyzer -> Dashboard
 */

import {
    CoordinatorState
} from "./CoordinatorState.js";

import EngineRegistry
    from "./EngineRegistry.js";

import CoordinatorHistory
    from "./CoordinatorHistory.js";


export const CASINO_COORDINATOR_VERSION = "6.7.0";

export const CoordinatorEvent = Object.freeze({
    STATE_CHANGE: "casino-coordinator:state-change",
    INITIALIZED: "casino-coordinator:initialized",
    STARTED: "casino-coordinator:started",
    ROUND_STARTED: "casino-coordinator:round-started",
    ROUND_COMPLETED: "casino-coordinator:round-completed",
    ANALYSIS_COMPLETED: "casino-coordinator:analysis-completed",
    DASHBOARD_UPDATED: "casino-coordinator:dashboard-updated",
    PAUSED: "casino-coordinator:paused",
    RESUMED: "casino-coordinator:resumed",
    STOPPED: "casino-coordinator:stopped",
    HEALTH_CHECKED: "casino-coordinator:health-checked",
    ERROR: "casino-coordinator:error",
    DESTROYED: "casino-coordinator:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


async function callOptional(
    target,
    method,
    ...args
) {
    if (
        target &&
        isFunction(target[method])
    ) {
        return target[method](...args);
    }

    return null;
}


export default class CasinoCoordinator {
    constructor({
        session,
        casino,
        dealer = null,
        round = null,
        shoe = null,
        analyzer,
        dashboard,
        runtime = null,
        eventBus = null,
        registry = null,
        history = null,
        clock = () => Date.now()
    } = {}) {
        if (
            !session ||
            !isFunction(
                session.start
            ) ||
            !isFunction(
                session.startRound
            ) ||
            !isFunction(
                session.completeRound
            ) ||
            !isFunction(
                session.stop
            )
        ) {
            throw new TypeError(
                "CasinoCoordinator requires a SessionEngine-compatible object."
            );
        }

        if (
            !casino ||
            !isFunction(
                casino.startRound
            ) ||
            !isFunction(
                casino.completeRound
            )
        ) {
            throw new TypeError(
                "CasinoCoordinator requires a CasinoEngine-compatible object."
            );
        }

        if (
            !analyzer ||
            !isFunction(
                analyzer.analyzeRound
            )
        ) {
            throw new TypeError(
                "CasinoCoordinator requires an AnalyzerEngine-compatible object."
            );
        }

        if (
            !dashboard ||
            !isFunction(
                dashboard.updateFromAnalysis
            )
        ) {
            throw new TypeError(
                "CasinoCoordinator requires a DashboardEngine-compatible object."
            );
        }

        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (!isFunction(clock)) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.session = session;
        this.casino = casino;
        this.dealer = dealer;
        this.round = round;
        this.shoe = shoe;
        this.analyzer = analyzer;
        this.dashboard = dashboard;
        this.runtime = runtime;
        this.eventBus = eventBus;
        this.clock = clock;

        this.registry =
            registry ??
            new EngineRegistry();

        this.history =
            history ??
            new CoordinatorHistory();

        this.state =
            CoordinatorState.IDLE;

        this.previousState = null;

        this.startedAt = null;
        this.stoppedAt = null;
        this.destroyedAt = null;

        this.currentRound = null;
        this.lastRoundResult = null;
        this.lastAnalysis = null;
        this.lastDashboard = null;
        this.lastHealth = null;
        this.lastError = null;

        this.operationCount = 0;
        this.destroyed = false;

        this.registerDefaults();
    }

    registerDefaults() {
        const defaults = {
            session:
                this.session,
            casino:
                this.casino,
            dealer:
                this.dealer,
            round:
                this.round,
            shoe:
                this.shoe,
            analyzer:
                this.analyzer,
            dashboard:
                this.dashboard,
            runtime:
                this.runtime
        };

        for (
            const [name, engine] of
            Object.entries(defaults)
        ) {
            if (engine) {
                this.registry.register(
                    name,
                    engine
                );
            }
        }

        return this;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "casino-coordinator"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                CoordinatorState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown CoordinatorState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            CoordinatorEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "CasinoCoordinator has been destroyed."
            );
        }
    }

    async initialize({
        dashboardTarget = null
    } = {}) {
        this.assertNotDestroyed();

        if (
            this.state !==
                CoordinatorState.IDLE &&
            this.state !==
                CoordinatorState.STOPPED
        ) {
            return this.summary;
        }

        this.setState(
            CoordinatorState.INITIALIZING
        );

        try {
            await callOptional(
                this.runtime,
                "initialize"
            );

            await callOptional(
                this.dashboard,
                "mount",
                dashboardTarget
            );

            this.setState(
                CoordinatorState.READY
            );

            this.emit(
                CoordinatorEvent.INITIALIZED,
                this.summary
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "initialize"
            );
        }
    }

    async start(options = {}) {
        this.assertNotDestroyed();

        if (
            this.state ===
                CoordinatorState.IDLE ||
            this.state ===
                CoordinatorState.STOPPED
        ) {
            await this.initialize(
                options
            );
        }

        if (
            this.state !==
                CoordinatorState.READY
        ) {
            return this.summary;
        }

        try {
            await callOptional(
                this.runtime,
                "start",
                options.runtime ??
                {}
            );

            await this.session.start(
                options.session ??
                {}
            );

            this.startedAt =
                this.clock();

            this.stoppedAt =
                null;

            this.setState(
                CoordinatorState.RUNNING
            );

            this.emit(
                CoordinatorEvent.STARTED,
                this.summary
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "start"
            );
        }
    }

    async playRound({
        roundInput = {},
        completeInput = {},
        analysisOptions = {},
        dashboardMetadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (
            this.state !==
                CoordinatorState.RUNNING
        ) {
            throw new Error(
                "CasinoCoordinator must be running to play a round."
            );
        }

        if (this.currentRound) {
            throw new Error(
                "A coordinated round is already active."
            );
        }

        try {
            this.operationCount++;

            this.currentRound =
                await this.session.startRound(
                    roundInput
                );

            this.emit(
                CoordinatorEvent.ROUND_STARTED,
                {
                    roundInput,
                    currentRound:
                        this.currentRound
                }
            );

            const roundResult =
                await this.session.completeRound(
                    completeInput
                );

            this.currentRound =
                null;

            this.lastRoundResult =
                roundResult;

            this.emit(
                CoordinatorEvent.ROUND_COMPLETED,
                roundResult
            );

            const analysis =
                await this.analyzer
                    .analyzeRound(
                        {
                            round:
                                roundResult,

                            session:
                                this.session.summary,

                            shoe:
                                this.shoe
                                    ?.summary ??
                                null
                        },
                        analysisOptions
                    );

            this.lastAnalysis =
                analysis;

            this.emit(
                CoordinatorEvent.ANALYSIS_COMPLETED,
                analysis
            );

            const dashboardResult =
                await this.dashboard
                    .updateFromAnalysis({
                        analysis,

                        session:
                            this.session.summary,

                        shoe:
                            this.shoe
                                ?.summary ??
                            null,

                        round:
                            roundResult,

                        statistics:
                            this.session.summary
                                ?.statistics ??
                            null,

                        metadata:
                            dashboardMetadata
                    });

            this.lastDashboard =
                dashboardResult;

            this.emit(
                CoordinatorEvent.DASHBOARD_UPDATED,
                dashboardResult
            );

            const record = {
                index:
                    this.operationCount,

                timestamp:
                    this.clock(),

                roundResult,

                analysis,

                dashboard:
                    dashboardResult
            };

            this.history.add(
                record
            );

            return record;
        }
        catch (error) {
            this.currentRound =
                null;

            return this.handleError(
                error,
                "playRound"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        if (
            this.state !==
                CoordinatorState.RUNNING
        ) {
            return this.summary;
        }

        this.session
            ?.pause
            ?.();

        this.dashboard
            ?.pause
            ?.();

        this.runtime
            ?.pause
            ?.();

        this.setState(
            CoordinatorState.PAUSED
        );

        this.emit(
            CoordinatorEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        if (
            this.state !==
                CoordinatorState.PAUSED
        ) {
            return this.summary;
        }

        this.runtime
            ?.resume
            ?.();

        this.session
            ?.resume
            ?.();

        this.dashboard
            ?.resume
            ?.();

        this.setState(
            CoordinatorState.RUNNING
        );

        this.emit(
            CoordinatorEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    async stop(reason = "completed") {
        this.assertNotDestroyed();

        if (
            this.state ===
                CoordinatorState.STOPPED
        ) {
            return this.summary;
        }

        try {
            if (this.currentRound) {
                this.round
                    ?.cancel
                    ?.(
                        "coordinator-stop"
                    );

                this.currentRound =
                    null;
            }

            await this.session.stop(
                reason
            );

            await callOptional(
                this.runtime,
                "stop"
            );

            this.dashboard
                ?.pause
                ?.();

            this.stoppedAt =
                this.clock();

            this.setState(
                CoordinatorState.STOPPED
            );

            this.emit(
                CoordinatorEvent.STOPPED,
                this.summary
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "stop"
            );
        }
    }

    healthCheck() {
        this.assertNotDestroyed();

        const engines = {};

        let healthyCount = 0;
        let unhealthyCount = 0;

        for (
            const [name, engine] of
            this.registry.entries()
        ) {
            const summary =
                engine.summary ??
                null;

            const destroyed =
                Boolean(
                    summary?.destroyed
                );

            const error =
                summary?.lastError ??
                null;

            const healthy =
                !destroyed &&
                !error;

            engines[name] = {
                healthy,
                destroyed,
                error,
                state:
                    summary?.state ??
                    null
            };

            if (healthy) {
                healthyCount++;
            }
            else {
                unhealthyCount++;
            }
        }

        const result = {
            timestamp:
                this.clock(),

            healthy:
                unhealthyCount === 0,

            healthyCount,
            unhealthyCount,
            engines
        };

        this.lastHealth =
            result;

        this.emit(
            CoordinatorEvent.HEALTH_CHECKED,
            result
        );

        return result;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            CoordinatorState.ERROR
        );

        this.emit(
            CoordinatorEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    async destroy() {
        if (this.destroyed) {
            return this;
        }

        if (
            this.state ===
                CoordinatorState.RUNNING ||
            this.state ===
                CoordinatorState.PAUSED
        ) {
            await this.stop(
                "destroy"
            );
        }

        const destroyed =
            new Set();

        for (
            const engine of
            this.registry.values()
                .reverse()
        ) {
            if (
                engine &&
                !destroyed.has(engine)
            ) {
                await callOptional(
                    engine,
                    "destroy"
                );

                destroyed.add(engine);
            }
        }

        this.registry.clear();
        this.history.clear();

        this.currentRound = null;
        this.lastRoundResult = null;
        this.lastAnalysis = null;
        this.lastDashboard = null;

        this.destroyed =
            true;

        this.destroyedAt =
            this.clock();

        this.setState(
            CoordinatorState.DESTROYED
        );

        this.emit(
            CoordinatorEvent.DESTROYED,
            null
        );

        return this;
    }

    get uptime() {
        if (this.startedAt === null) {
            return 0;
        }

        const end =
            this.stoppedAt ??
            this.destroyedAt ??
            this.clock();

        return Math.max(
            0,
            end -
                this.startedAt
        );
    }

    get summary() {
        return {
            version:
                CASINO_COORDINATOR_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            startedAt:
                this.startedAt,

            stoppedAt:
                this.stoppedAt,

            uptime:
                this.uptime,

            operationCount:
                this.operationCount,

            hasActiveRound:
                Boolean(
                    this.currentRound
                ),

            hasRoundResult:
                Boolean(
                    this.lastRoundResult
                ),

            hasAnalysis:
                Boolean(
                    this.lastAnalysis
                ),

            hasDashboard:
                Boolean(
                    this.lastDashboard
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            registry:
                this.registry.summary,

            history:
                this.history.summary,

            health:
                this.lastHealth
        };
    }
}
