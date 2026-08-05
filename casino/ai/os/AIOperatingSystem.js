/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/AIOperatingSystem.js
 */
import {
    AIOperatingState,
    AIOperatingDecision
} from "./AIOperatingState.js";

import AIOperatingContext
    from "./AIOperatingContext.js";

import EngineRegistry
    from "./EngineRegistry.js";

import RuntimeFacade
    from "./RuntimeFacade.js";

import PipelineCoordinator
    from "./PipelineCoordinator.js";

import SystemHealthMonitor
    from "./SystemHealthMonitor.js";

import GlobalStateStore
    from "./GlobalStateStore.js";

import AIOperatingHistory
    from "./AIOperatingHistory.js";


export const AI_OPERATING_SYSTEM_VERSION = "9.0.0";

export const AIOperatingEvent = Object.freeze({
    STATE_CHANGE: "ai-operating-system:state-change",
    BOOT_STARTED: "ai-operating-system:boot-started",
    BOOT_COMPLETED: "ai-operating-system:boot-completed",
    PROCESS_STARTED: "ai-operating-system:process-started",
    PIPELINE_COMPLETED: "ai-operating-system:pipeline-completed",
    STATE_SYNCHRONIZED: "ai-operating-system:state-synchronized",
    PROCESS_COMPLETED: "ai-operating-system:process-completed",
    PAUSED: "ai-operating-system:paused",
    RESUMED: "ai-operating-system:resumed",
    SHUTDOWN: "ai-operating-system:shutdown",
    ERROR: "ai-operating-system:error",
    DESTROYED: "ai-operating-system:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

export default class AIOperatingSystem {
    constructor({
        registry = null,
        facade = null,
        pipeline = null,
        health = null,
        globalState = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
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

        this.registry =
            registry ??
            new EngineRegistry();

        this.facade =
            facade ??
            new RuntimeFacade({
                registry:
                    this.registry
            });

        this.pipeline =
            pipeline ??
            new PipelineCoordinator({
                facade:
                    this.facade
            });

        this.health =
            health ??
            new SystemHealthMonitor();

        this.globalState =
            globalState ??
            new GlobalStateStore();

        this.history =
            history ??
            new AIOperatingHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            AIOperatingState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.booted = false;
        this.sequence = 0;
        this.processCount = 0;
        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "ai-operating-system"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous = this.state;
        this.previousState = previous;
        this.state = state;

        this.emit(
            AIOperatingEvent.STATE_CHANGE,
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
                "AIOperatingSystem has been destroyed."
            );
        }
    }

    registerEngine(config) {
        return this.registry
            .register(
                config
            );
    }

    boot() {
        this.assertNotDestroyed();

        this.setState(
            AIOperatingState.BOOTING
        );

        this.emit(
            AIOperatingEvent.BOOT_STARTED,
            null
        );

        const health =
            this.health.check(
                this.registry
            );

        if (!health.healthy) {
            const error =
                new Error(
                    `Required engines unavailable: ${health.missingRequired.join(", ")}`
                );

            return this.handleError(
                error,
                "boot"
            );
        }

        this.booted = true;

        this.globalState.update({
            booted: true,
            engineCount:
                this.registry.summary.count,
            bootedAt:
                this.clock()
        });

        this.setState(
            AIOperatingState.READY
        );

        this.emit(
            AIOperatingEvent.BOOT_COMPLETED,
            {
                health,
                state:
                    this.globalState.snapshot()
            }
        );

        return {
            health,
            state:
                this.globalState.snapshot()
        };
    }

    async process({
        context = {},
        steps = []
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        if (!this.booted) {
            this.boot();
        }

        const operatingContext =
            context instanceof
                AIOperatingContext
                ? context
                : new AIOperatingContext(
                    context
                );

        this.sequence++;

        const processId =
            `aios-${this.clock()}-${this.sequence}`;

        this.setState(
            AIOperatingState.PROCESSING
        );

        this.emit(
            AIOperatingEvent.PROCESS_STARTED,
            {
                processId,
                context:
                    operatingContext
            }
        );

        try {
            const pipelineResult =
                await this.pipeline
                    .run({
                        steps,
                        context:
                            operatingContext
                    });

            this.emit(
                AIOperatingEvent.PIPELINE_COMPLETED,
                pipelineResult
            );

            this.setState(
                AIOperatingState.SYNCHRONIZING
            );

            const decision =
                pipelineResult.timeline
                    .some(
                        item =>
                            item.success ===
                            false
                    )
                    ? AIOperatingDecision.REVIEW
                    : (
                        pipelineResult.outputs
                            .safety?.safe ===
                        false
                    )
                        ? AIOperatingDecision.HALT
                        : AIOperatingDecision.PROCEED;

            const globalState =
                this.globalState
                    .update({
                        processId,
                        decision,
                        lastOutputs:
                            pipelineResult.outputs,
                        lastTimeline:
                            pipelineResult.timeline,
                        updatedAt:
                            this.clock()
                    });

            this.emit(
                AIOperatingEvent.STATE_SYNCHRONIZED,
                globalState
            );

            const result = {
                version:
                    AI_OPERATING_SYSTEM_VERSION,
                processId,
                pipeline:
                    pipelineResult,
                decision,
                proceed:
                    decision ===
                    AIOperatingDecision.PROCEED,
                globalState,
                createdAt:
                    this.clock()
            };

            this.lastResult = result;
            this.processCount++;

            this.history.add(result);

            this.setState(
                AIOperatingState.READY
            );

            this.emit(
                AIOperatingEvent.PROCESS_COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "process"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            AIOperatingState.PAUSED
        );

        this.emit(
            AIOperatingEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            this.booted
                ? AIOperatingState.READY
                : AIOperatingState.IDLE
        );

        this.emit(
            AIOperatingEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.globalState.reset();
        this.history.clear();

        this.processCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;
        this.booted = false;

        this.setState(
            AIOperatingState.IDLE
        );

        return this;
    }

    shutdown() {
        this.assertNotDestroyed();

        this.paused = false;
        this.booted = false;

        this.setState(
            AIOperatingState.SHUTDOWN
        );

        this.emit(
            AIOperatingEvent.SHUTDOWN,
            this.summary
        );

        return this.summary;
    }

    handleError(error, phase) {
        this.lastError = error;

        this.setState(
            AIOperatingState.ERROR
        );

        this.emit(
            AIOperatingEvent.ERROR,
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

        this.registry.clear();
        this.globalState.reset();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.booted = false;
        this.destroyed = true;

        this.setState(
            AIOperatingState.DESTROYED
        );

        this.emit(
            AIOperatingEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_OPERATING_SYSTEM_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            booted:
                this.booted,
            destroyed:
                this.destroyed,
            processCount:
                this.processCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            registry:
                this.registry.summary,
            facade:
                this.facade.summary,
            pipeline:
                this.pipeline.summary,
            health:
                this.health.summary,
            globalState:
                this.globalState.snapshot(),
            history:
                this.history.summary
        };
    }
}
