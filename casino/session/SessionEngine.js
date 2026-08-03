/**
 * Baccarat Analyzer V6.4
 * casino/session/SessionEngine.js
 *
 * Coordinates a complete casino session across shoes and rounds.
 */

import {
    SessionState
} from "./SessionState.js";

import SessionHistory
    from "./SessionHistory.js";

import SessionStatistics
    from "./SessionStatistics.js";


export const SESSION_ENGINE_VERSION = "6.4.0";

export const SessionEvent = Object.freeze({
    STATE_CHANGE: "session-engine:state-change",
    STARTED: "session-engine:started",
    PAUSED: "session-engine:paused",
    RESUMED: "session-engine:resumed",
    SHOE_STARTED: "session-engine:shoe-started",
    ROUND_STARTED: "session-engine:round-started",
    ROUND_COMPLETED: "session-engine:round-completed",
    SHOE_COMPLETED: "session-engine:shoe-completed",
    COMPLETED: "session-engine:completed",
    RESET: "session-engine:reset",
    ERROR: "session-engine:error",
    DESTROYED: "session-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class SessionEngine {
    constructor({
        casinoEngine,
        shoeManager = null,
        roundEngine = null,
        history = null,
        statistics = null,
        store = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (
            !casinoEngine ||
            !isFunction(
                casinoEngine.startRound
            ) ||
            !isFunction(
                casinoEngine.completeRound
            )
        ) {
            throw new TypeError(
                "SessionEngine requires CasinoEngine-compatible startRound() and completeRound()."
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

        this.casinoEngine =
            casinoEngine;

        this.shoeManager =
            shoeManager;

        this.roundEngine =
            roundEngine;

        this.history =
            history ??
            new SessionHistory();

        this.statistics =
            statistics ??
            new SessionStatistics();

        this.store =
            store;

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.sequence = 0;

        this.idFactory =
            idFactory ??
            (
                ({
                    sequence,
                    timestamp
                }) =>
                    `session-${timestamp}-${sequence}`
            );

        this.state =
            SessionState.IDLE;

        this.previousState = null;
        this.sessionId = null;

        this.startedAt = null;
        this.completedAt = null;
        this.pausedAt = null;
        this.totalPausedDuration = 0;

        this.metadata = {};
        this.currentRound = null;
        this.lastResult = null;
        this.rounds = [];

        this.lastError = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "session-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                SessionState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown SessionState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            SessionEvent.STATE_CHANGE,
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
                "SessionEngine has been destroyed."
            );
        }
    }

    async start({
        metadata = {},
        shoeOptions = {}
    } = {}) {
        this.assertNotDestroyed();

        if (
            ![
                SessionState.IDLE,
                SessionState.COMPLETED
            ].includes(
                this.state
            )
        ) {
            throw new Error(
                `Cannot start session from state: ${this.state}`
            );
        }

        this.setState(
            SessionState.STARTING
        );

        try {
            this.sequence++;

            this.startedAt =
                this.clock();

            this.completedAt = null;
            this.pausedAt = null;
            this.totalPausedDuration = 0;

            this.sessionId =
                this.idFactory({
                    sequence:
                        this.sequence,
                    timestamp:
                        this.startedAt
                });

            this.metadata = {
                ...metadata
            };

            this.rounds = [];
            this.currentRound = null;
            this.lastResult = null;
            this.lastError = null;

            this.statistics.reset();

            if (
                this.store &&
                isFunction(this.store.start)
            ) {
                await this.store.start({
                    sessionId:
                        this.sessionId,
                    metadata:
                        this.metadata,
                    startedAt:
                        this.startedAt
                });
            }

            if (
                this.shoeManager &&
                isFunction(
                    this.shoeManager.create
                )
            ) {
                await this.shoeManager.create(
                    shoeOptions
                );

                this.emit(
                    SessionEvent.SHOE_STARTED,
                    {
                        sessionId:
                            this.sessionId,
                        shoe:
                            this.shoeManager.summary
                    }
                );
            }
            else if (
                isFunction(
                    this.casinoEngine.initialize
                ) &&
                !this.casinoEngine.summary
                    ?.hasShoe
            ) {
                await this.casinoEngine.initialize(
                    shoeOptions
                );
            }

            this.setState(
                SessionState.ACTIVE
            );

            this.emit(
                SessionEvent.STARTED,
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

    pause() {
        this.assertNotDestroyed();

        if (
            this.state !==
                SessionState.ACTIVE
        ) {
            return this.summary;
        }

        this.pausedAt =
            this.clock();

        this.setState(
            SessionState.PAUSED
        );

        this.emit(
            SessionEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        if (
            this.state !==
                SessionState.PAUSED
        ) {
            return this.summary;
        }

        const resumedAt =
            this.clock();

        if (this.pausedAt !== null) {
            this.totalPausedDuration +=
                Math.max(
                    0,
                    resumedAt -
                        this.pausedAt
                );
        }

        this.pausedAt = null;

        this.setState(
            SessionState.ACTIVE
        );

        this.emit(
            SessionEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    async startRound(input = {}) {
        this.assertNotDestroyed();

        if (
            this.state !==
                SessionState.ACTIVE
        ) {
            throw new Error(
                "Session must be active to start a round."
            );
        }

        if (this.currentRound) {
            throw new Error(
                "A session round is already active."
            );
        }

        if (
            this.shoeManager &&
            isFunction(
                this.shoeManager.needsNewShoe
            ) &&
            this.shoeManager.needsNewShoe()
        ) {
            this.shoeManager.complete?.(
                "new-shoe-required"
            );

            await this.shoeManager.reset();

            this.emit(
                SessionEvent.SHOE_STARTED,
                {
                    sessionId:
                        this.sessionId,
                    shoe:
                        this.shoeManager.summary
                }
            );
        }

        const shoeRound =
            this.shoeManager
                ?.beginRound
                ?.() ??
            null;

        this.currentRound =
            await this.casinoEngine.startRound({
                ...input,

                sessionId:
                    this.sessionId,

                shoeNumber:
                    shoeRound
                        ?.shoeNumber ??
                    this.casinoEngine.summary
                        ?.shoeNumber ??
                    null,

                roundNumber:
                    shoeRound
                        ?.roundNumber ??
                    this.casinoEngine.summary
                        ?.roundNumber ??
                    null
            });

        this.emit(
            SessionEvent.ROUND_STARTED,
            {
                sessionId:
                    this.sessionId,
                input,
                shoeRound
            }
        );

        return this.currentRound;
    }

    async completeRound(input = {}) {
        this.assertNotDestroyed();

        if (!this.currentRound) {
            throw new Error(
                "No active session round."
            );
        }

        try {
            const result =
                await this.casinoEngine.completeRound(
                    input
                );

            this.currentRound = null;
            this.lastResult =
                result;

            const record = {
                index:
                    this.rounds.length + 1,

                sessionId:
                    this.sessionId,

                timestamp:
                    this.clock(),

                result
            };

            this.rounds.push(record);

            this.statistics.recordRound(
                result
            );

            this.shoeManager
                ?.recordRound
                ?.(
                    result
                );

            if (
                this.store &&
                isFunction(
                    this.store.recordRound
                )
            ) {
                await this.store.recordRound(
                    record
                );
            }

            this.emit(
                SessionEvent.ROUND_COMPLETED,
                {
                    record,
                    statistics:
                        this.statistics.snapshot()
                }
            );

            if (
                this.shoeManager &&
                isFunction(
                    this.shoeManager.needsNewShoe
                ) &&
                this.shoeManager.needsNewShoe()
            ) {
                const completedShoe =
                    this.shoeManager.complete?.(
                        "cut-card"
                    );

                this.emit(
                    SessionEvent.SHOE_COMPLETED,
                    completedShoe
                );
            }

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "completeRound"
            );
        }
    }

    async stop(reason = "completed") {
        this.assertNotDestroyed();

        if (
            this.state ===
                SessionState.COMPLETED
        ) {
            return this.summary;
        }

        this.setState(
            SessionState.STOPPING
        );

        try {
            if (this.currentRound) {
                this.roundEngine
                    ?.cancel
                    ?.(
                        "session-stop"
                    );

                this.currentRound =
                    null;
            }

            this.completedAt =
                this.clock();

            const record = {
                sessionId:
                    this.sessionId,

                completed:
                    true,

                reason,

                startedAt:
                    this.startedAt,

                completedAt:
                    this.completedAt,

                duration:
                    this.duration,

                roundCount:
                    this.rounds.length,

                metadata: {
                    ...this.metadata
                },

                statistics:
                    this.statistics.snapshot(),

                rounds: [
                    ...this.rounds
                ]
            };

            this.history.add(record);

            if (
                this.store &&
                isFunction(this.store.end)
            ) {
                await this.store.end(
                    record
                );
            }

            this.setState(
                SessionState.COMPLETED
            );

            this.emit(
                SessionEvent.COMPLETED,
                record
            );

            return record;
        }
        catch (error) {
            return this.handleError(
                error,
                "stop"
            );
        }
    }

    async reset() {
        this.assertNotDestroyed();

        if (
            this.state ===
                SessionState.ACTIVE ||
            this.state ===
                SessionState.PAUSED
        ) {
            await this.stop(
                "reset"
            );
        }

        this.sessionId = null;
        this.startedAt = null;
        this.completedAt = null;
        this.pausedAt = null;
        this.totalPausedDuration = 0;

        this.metadata = {};
        this.currentRound = null;
        this.lastResult = null;
        this.rounds = [];
        this.lastError = null;

        this.statistics.reset();

        this.setState(
            SessionState.IDLE
        );

        this.emit(
            SessionEvent.RESET,
            this.summary
        );

        return this.summary;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            SessionState.ERROR
        );

        this.emit(
            SessionEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.currentRound = null;
        this.rounds = [];

        this.casinoEngine
            ?.destroy
            ?.();

        this.shoeManager
            ?.destroy
            ?.();

        this.roundEngine
            ?.destroy
            ?.();

        this.store
            ?.destroy
            ?.();

        this.destroyed =
            true;

        this.setState(
            SessionState.DESTROYED
        );

        this.emit(
            SessionEvent.DESTROYED,
            null
        );

        return this;
    }

    get duration() {
        if (this.startedAt === null) {
            return 0;
        }

        const end =
            this.completedAt ??
            this.clock();

        return Math.max(
            0,
            end -
                this.startedAt -
                this.totalPausedDuration
        );
    }

    get summary() {
        return {
            version:
                SESSION_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            sessionId:
                this.sessionId,

            startedAt:
                this.startedAt,

            completedAt:
                this.completedAt,

            duration:
                this.duration,

            pausedDuration:
                this.totalPausedDuration,

            roundCount:
                this.rounds.length,

            hasActiveRound:
                Boolean(
                    this.currentRound
                ),

            hasLastResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            metadata: {
                ...this.metadata
            },

            statistics:
                this.statistics.summary,

            history:
                this.history.summary
        };
    }
}
