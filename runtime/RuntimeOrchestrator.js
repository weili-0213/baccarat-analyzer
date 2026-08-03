/**
 * Baccarat Analyzer V5.8
 * runtime/RuntimeOrchestrator.js
 *
 * Highest-level coordinator for the complete Runtime stack.
 */

export const RUNTIME_ORCHESTRATOR_VERSION = "5.8.0";

export const OrchestratorState = Object.freeze({
    CREATED: "created",
    INITIALIZED: "initialized",
    BOOTING: "booting",
    READY: "ready",
    RUNNING: "running",
    PAUSED: "paused",
    STOPPED: "stopped",
    SHUTDOWN: "shutdown",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const OrchestratorEvent = Object.freeze({
    STATE_CHANGE: "orchestrator:state-change",
    INITIALIZE: "orchestrator:initialize",
    BOOT: "orchestrator:boot",
    START: "orchestrator:start",
    PAUSE: "orchestrator:pause",
    RESUME: "orchestrator:resume",
    STOP: "orchestrator:stop",
    RESTART: "orchestrator:restart",
    SHUTDOWN: "orchestrator:shutdown",
    ERROR: "orchestrator:error",
    DESTROY: "orchestrator:destroy"
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

export default class RuntimeOrchestrator {
    constructor({
        runtime,
        controller = null,
        pipeline = null,
        scheduler = null,
        monitor = null,
        recovery = null,
        eventBus = null,
        adapters = null,
        clock = () => Date.now()
    } = {}) {
        if (
            !runtime ||
            !isFunction(runtime.start) ||
            !isFunction(runtime.stop)
        ) {
            throw new TypeError(
                "RuntimeOrchestrator requires runtime.start() and runtime.stop()."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.runtime = runtime;
        this.controller = controller;
        this.pipeline = pipeline;
        this.scheduler = scheduler;
        this.monitor = monitor;
        this.recovery = recovery;
        this.eventBus = eventBus;
        this.adapters =
            adapters ??
            runtime.adapters ??
            null;
        this.clock = clock;

        this.state =
            OrchestratorState.CREATED;

        this.previousState = null;
        this.createdAt = this.clock();
        this.startedAt = null;
        this.stoppedAt = null;
        this.destroyedAt = null;

        this.lifecycleCount = 0;
        this.restartCount = 0;
        this.lastError = null;
        this.lastPipelineResult = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "runtime-orchestrator"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                OrchestratorState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown orchestrator state: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            OrchestratorEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (
            this.destroyed ||
            this.state ===
                OrchestratorState.DESTROYED
        ) {
            throw new Error(
                "RuntimeOrchestrator has been destroyed."
            );
        }
    }

    async initialize() {
        this.assertNotDestroyed();

        if (
            this.state !==
            OrchestratorState.CREATED &&
            this.state !==
            OrchestratorState.STOPPED &&
            this.state !==
            OrchestratorState.SHUTDOWN
        ) {
            return this.summary;
        }

        await callOptional(
            this.adapters,
            "initialize"
        );

        await callOptional(
            this.runtime,
            "initialize"
        );

        this.lifecycleCount++;

        this.setState(
            OrchestratorState.INITIALIZED
        );

        this.emit(
            OrchestratorEvent.INITIALIZE,
            this.summary
        );

        return this.summary;
    }

    async boot(options = {}) {
        this.assertNotDestroyed();

        if (
            this.state ===
            OrchestratorState.CREATED ||
            this.state ===
            OrchestratorState.STOPPED ||
            this.state ===
            OrchestratorState.SHUTDOWN
        ) {
            await this.initialize();
        }

        if (
            this.state !==
            OrchestratorState.INITIALIZED
        ) {
            return this.summary;
        }

        this.setState(
            OrchestratorState.BOOTING
        );

        try {
            await callOptional(
                this.monitor,
                "start"
            );

            await callOptional(
                this.pipeline,
                "prepare",
                options
            );

            this.setState(
                OrchestratorState.READY
            );

            this.emit(
                OrchestratorEvent.BOOT,
                this.summary
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "boot"
            );
        }
    }

    async start(options = {}) {
        this.assertNotDestroyed();

        if (
            [
                OrchestratorState.CREATED,
                OrchestratorState.INITIALIZED,
                OrchestratorState.STOPPED,
                OrchestratorState.SHUTDOWN
            ].includes(
                this.state
            )
        ) {
            await this.boot(options);
        }

        if (
            this.state ===
            OrchestratorState.RUNNING
        ) {
            return this.summary;
        }

        if (
            this.state !==
            OrchestratorState.READY
        ) {
            throw new Error(
                `Cannot start orchestrator from state: ${this.state}`
            );
        }

        try {
            const startResult =
                this.controller &&
                isFunction(
                    this.controller.start
                )
                    ? await this.controller.start(
                        options
                    )
                    : await this.runtime.start(
                        options
                    );

            await callOptional(
                this.scheduler,
                "start"
            );

            await callOptional(
                this.monitor,
                "start"
            );

            if (
                options.executePipeline !==
                    false &&
                this.pipeline &&
                isFunction(
                    this.pipeline.execute
                )
            ) {
                this.lastPipelineResult =
                    await this.pipeline.execute(
                        options.context ?? {},
                        {
                            orchestrator:
                                this,
                            runtime:
                                this.runtime
                        }
                    );
            }

            this.startedAt =
                this.clock();

            this.stoppedAt =
                null;

            this.setState(
                OrchestratorState.RUNNING
            );

            this.emit(
                OrchestratorEvent.START,
                {
                    startResult,
                    summary:
                        this.summary
                }
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "start",
                options
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        if (
            this.state !==
            OrchestratorState.RUNNING
        ) {
            return this.summary;
        }

        this.scheduler
            ?.pause
            ?.();

        if (
            this.controller &&
            isFunction(
                this.controller.pause
            )
        ) {
            this.controller.pause();
        }
        else {
            this.runtime
                ?.pause
                ?.();
        }

        this.setState(
            OrchestratorState.PAUSED
        );

        this.emit(
            OrchestratorEvent.PAUSE,
            this.summary
        );

        return this.summary;
    }

    async resume(options = {}) {
        this.assertNotDestroyed();

        if (
            this.state !==
            OrchestratorState.PAUSED
        ) {
            return this.summary;
        }

        if (
            this.controller &&
            isFunction(
                this.controller.resume
            )
        ) {
            this.controller.resume();
        }
        else {
            this.runtime
                ?.resume
                ?.();
        }

        this.scheduler
            ?.resume
            ?.();

        if (
            options.executePipeline ===
                true &&
            this.pipeline &&
            isFunction(
                this.pipeline.execute
            )
        ) {
            this.lastPipelineResult =
                await this.pipeline.execute(
                    options.context ?? {},
                    {
                        orchestrator:
                            this,
                        runtime:
                            this.runtime
                    }
                );
        }

        this.setState(
            OrchestratorState.RUNNING
        );

        this.emit(
            OrchestratorEvent.RESUME,
            this.summary
        );

        return this.summary;
    }

    async stop(options = {}) {
        this.assertNotDestroyed();

        if (
            [
                OrchestratorState.CREATED,
                OrchestratorState.INITIALIZED,
                OrchestratorState.READY,
                OrchestratorState.STOPPED
            ].includes(
                this.state
            )
        ) {
            this.setState(
                OrchestratorState.STOPPED
            );

            return this.summary;
        }

        try {
            this.pipeline
                ?.abort
                ?.(
                    "orchestrator-stop"
                );

            await callOptional(
                this.scheduler,
                "stop"
            );

            const stopResult =
                this.controller &&
                isFunction(
                    this.controller.stop
                )
                    ? await this.controller.stop(
                        options
                    )
                    : await this.runtime.stop(
                        options
                    );

            await callOptional(
                this.monitor,
                "stop"
            );

            this.stoppedAt =
                this.clock();

            this.setState(
                OrchestratorState.STOPPED
            );

            this.emit(
                OrchestratorEvent.STOP,
                {
                    stopResult,
                    summary:
                        this.summary
                }
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "stop",
                options
            );
        }
    }

    async restart(options = {}) {
        this.assertNotDestroyed();

        await this.stop(
            options.stop ?? {}
        );

        this.restartCount++;

        if (
            this.recovery &&
            isFunction(
                this.recovery.reset
            )
        ) {
            this.recovery.reset();
        }

        await this.initialize();

        await this.boot(
            options.boot ?? {}
        );

        const result =
            await this.start(
                options.start ?? {}
            );

        this.emit(
            OrchestratorEvent.RESTART,
            this.summary
        );

        return result;
    }

    async shutdown(options = {}) {
        this.assertNotDestroyed();

        if (
            this.state ===
            OrchestratorState.RUNNING ||
            this.state ===
            OrchestratorState.PAUSED ||
            this.state ===
            OrchestratorState.ERROR
        ) {
            await this.stop(
                options
            );
        }

        await callOptional(
            this.scheduler,
            "clear"
        );

        await callOptional(
            this.monitor,
            "reset"
        );

        this.setState(
            OrchestratorState.SHUTDOWN
        );

        this.emit(
            OrchestratorEvent.SHUTDOWN,
            this.summary
        );

        return this.summary;
    }

    async handleError(
        error,
        phase,
        context = {}
    ) {
        this.lastError = error;

        this.setState(
            OrchestratorState.ERROR
        );

        this.emit(
            OrchestratorEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        if (
            this.recovery &&
            isFunction(
                this.recovery.recover
            )
        ) {
            const recoveryResult =
                await this.recovery.recover({
                    error,
                    context: {
                        phase,
                        ...context
                    }
                });

            if (
                recoveryResult?.success
            ) {
                this.setState(
                    OrchestratorState.READY
                );

                return this.summary;
            }
        }

        throw error;
    }

    async destroy() {
        if (this.destroyed) {
            return this;
        }

        if (
            this.state !==
            OrchestratorState.SHUTDOWN
        ) {
            await this.shutdown();
        }

        await callOptional(
            this.recovery,
            "destroy"
        );

        await callOptional(
            this.monitor,
            "destroy"
        );

        await callOptional(
            this.pipeline,
            "destroy"
        );

        await callOptional(
            this.scheduler,
            "destroy"
        );

        await callOptional(
            this.controller,
            "destroy"
        );

        if (
            !this.controller
        ) {
            await callOptional(
                this.runtime,
                "destroy"
            );
        }

        await callOptional(
            this.adapters,
            "destroy"
        );

        this.destroyed =
            true;

        this.destroyedAt =
            this.clock();

        this.setState(
            OrchestratorState.DESTROYED
        );

        this.emit(
            OrchestratorEvent.DESTROY,
            null
        );

        await callOptional(
            this.eventBus,
            "destroy"
        );

        return this;
    }

    get uptime() {
        if (!this.startedAt) {
            return 0;
        }

        const end =
            this.stoppedAt ??
            this.destroyedAt ??
            this.clock();

        return Math.max(
            0,
            end - this.startedAt
        );
    }

    get summary() {
        return {
            version:
                RUNTIME_ORCHESTRATOR_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            createdAt:
                this.createdAt,

            startedAt:
                this.startedAt,

            stoppedAt:
                this.stoppedAt,

            destroyedAt:
                this.destroyedAt,

            uptime:
                this.uptime,

            lifecycleCount:
                this.lifecycleCount,

            restartCount:
                this.restartCount,

            lastError:
                this.lastError
                    ?.message ??
                null,

            hasPipelineResult:
                Boolean(
                    this.lastPipelineResult
                ),

            runtime:
                this.runtime
                    ?.summary ??
                null,

            controller:
                this.controller
                    ?.summary ??
                null,

            pipeline:
                this.pipeline
                    ?.summary ??
                null,

            scheduler:
                this.scheduler
                    ?.summary ??
                null,

            monitor:
                this.monitor
                    ?.summary ??
                null,

            recovery:
                this.recovery
                    ?.summary ??
                null,

            adapters:
                this.adapters
                    ?.summary ??
                null,

            eventBus:
                this.eventBus
                    ?.summary ??
                null
        };
    }
}
