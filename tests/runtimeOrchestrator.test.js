/**
 * Baccarat Analyzer V5.8
 * tests/runtimeOrchestrator.test.js
 */

import RuntimeOrchestrator, {
    RUNTIME_ORCHESTRATOR_VERSION,
    OrchestratorState,
    OrchestratorEvent
} from "../runtime/RuntimeOrchestrator.js";

import {
    RUNTIME_ORCHESTRATOR_FACTORY_VERSION
} from "../runtime/createRuntimeOrchestrator.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createComponents() {
    const events = [];

    const eventBus = {
        destroyed: false,

        emit(type, payload) {
            events.push({
                type,
                payload
            });
        },

        destroy() {
            this.destroyed = true;
        },

        get summary() {
            return {
                emittedCount:
                    events.length,
                destroyed:
                    this.destroyed
            };
        }
    };

    const runtime = {
        started: 0,
        stopped: 0,
        destroyed: 0,
        paused: 0,
        resumed: 0,

        async start() {
            this.started++;
            return {
                status: "ready"
            };
        },

        async stop() {
            this.stopped++;
            return {
                status: "stopped"
            };
        },

        pause() {
            this.paused++;
        },

        resume() {
            this.resumed++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                started:
                    this.started,
                stopped:
                    this.stopped
            };
        }
    };

    const controller = {
        started: 0,
        stopped: 0,
        paused: 0,
        resumed: 0,
        destroyed: 0,

        async start() {
            this.started++;
            return {
                status: "ready"
            };
        },

        async stop() {
            this.stopped++;
            return {
                status: "stopped"
            };
        },

        pause() {
            this.paused++;
        },

        resume() {
            this.resumed++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                started:
                    this.started,
                stopped:
                    this.stopped
            };
        }
    };

    const scheduler = {
        started: 0,
        stopped: 0,
        paused: 0,
        resumed: 0,
        cleared: 0,
        destroyed: 0,

        start() {
            this.started++;
        },

        stop() {
            this.stopped++;
        },

        pause() {
            this.paused++;
        },

        resume() {
            this.resumed++;
        },

        clear() {
            this.cleared++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                started:
                    this.started,
                stopped:
                    this.stopped
            };
        }
    };

    const pipeline = {
        executions: 0,
        aborts: 0,
        destroyed: 0,

        async execute(context) {
            this.executions++;

            return {
                success: true,
                duration: 5,
                context
            };
        },

        abort() {
            this.aborts++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                executions:
                    this.executions,
                aborts:
                    this.aborts
            };
        }
    };

    const monitor = {
        started: 0,
        stopped: 0,
        resetCount: 0,
        destroyed: 0,

        start() {
            this.started++;
        },

        stop() {
            this.stopped++;
        },

        reset() {
            this.resetCount++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                started:
                    this.started,
                stopped:
                    this.stopped
            };
        }
    };

    const recovery = {
        resetCount: 0,
        destroyed: 0,

        reset() {
            this.resetCount++;
        },

        destroy() {
            this.destroyed++;
        },

        get summary() {
            return {
                resetCount:
                    this.resetCount
            };
        }
    };

    return {
        events,
        eventBus,
        runtime,
        controller,
        scheduler,
        pipeline,
        monitor,
        recovery
    };
}


export default async function runtimeOrchestratorTest() {
    const messages = [];

    assert(
        RUNTIME_ORCHESTRATOR_VERSION ===
            "5.8.0" &&
        RUNTIME_ORCHESTRATOR_FACTORY_VERSION ===
            "5.8.0",
        "V5.8 Orchestrator 版本錯誤"
    );

    messages.push(
        "✓ V5.8 Orchestrator 版本正確"
    );

    let now = 0;

    const components =
        createComponents();

    const orchestrator =
        new RuntimeOrchestrator({
            ...components,

            clock:
                () => now++
        });

    assert(
        orchestrator.state ===
            OrchestratorState.CREATED,
        "Initial state 錯誤"
    );

    await orchestrator.initialize();

    assert(
        orchestrator.state ===
            OrchestratorState.INITIALIZED &&
        orchestrator.summary
            .lifecycleCount ===
            1,
        "initialize() 錯誤"
    );

    messages.push(
        "✓ initialize() 正確"
    );

    await orchestrator.boot();

    assert(
        orchestrator.state ===
            OrchestratorState.READY &&
        components.monitor
            .started === 1,
        "boot() 錯誤"
    );

    messages.push(
        "✓ boot() 正確"
    );

    await orchestrator.start({
        context: {
            shoe: 1
        }
    });

    assert(
        orchestrator.state ===
            OrchestratorState.RUNNING &&
        components.controller
            .started === 1 &&
        components.scheduler
            .started === 1 &&
        components.pipeline
            .executions === 1 &&
        orchestrator.summary
            .hasPipelineResult ===
            true,
        "start() 錯誤"
    );

    messages.push(
        "✓ start() 與 Component Coordination 正確"
    );

    orchestrator.pause();

    assert(
        orchestrator.state ===
            OrchestratorState.PAUSED &&
        components.scheduler
            .paused === 1 &&
        components.controller
            .paused === 1,
        "pause() 錯誤"
    );

    await orchestrator.resume({
        executePipeline: true
    });

    assert(
        orchestrator.state ===
            OrchestratorState.RUNNING &&
        components.scheduler
            .resumed === 1 &&
        components.controller
            .resumed === 1 &&
        components.pipeline
            .executions === 2,
        "resume() 錯誤"
    );

    messages.push(
        "✓ pause()／resume() 正確"
    );

    await orchestrator.stop();

    assert(
        orchestrator.state ===
            OrchestratorState.STOPPED &&
        components.pipeline
            .aborts === 1 &&
        components.scheduler
            .stopped === 1 &&
        components.controller
            .stopped === 1 &&
        components.monitor
            .stopped === 1,
        "stop() 錯誤"
    );

    messages.push(
        "✓ stop() 正確"
    );

    await orchestrator.restart({
        start: {
            executePipeline: false
        }
    });

    assert(
        orchestrator.state ===
            OrchestratorState.RUNNING &&
        orchestrator.summary
            .restartCount ===
            1 &&
        components.recovery
            .resetCount === 1 &&
        components.controller
            .started === 2,
        "restart() 錯誤"
    );

    messages.push(
        "✓ restart() 正確"
    );

    await orchestrator.shutdown();

    assert(
        orchestrator.state ===
            OrchestratorState.SHUTDOWN &&
        components.scheduler
            .cleared === 1 &&
        components.monitor
            .resetCount === 1,
        "shutdown() 錯誤"
    );

    messages.push(
        "✓ shutdown() 正確"
    );

    const stateEvents =
        components.events.filter(
            event =>
                event.type ===
                OrchestratorEvent.STATE_CHANGE
        );

    assert(
        stateEvents.length > 0 &&
        components.events.some(
            event =>
                event.type ===
                OrchestratorEvent.START
        ) &&
        components.events.some(
            event =>
                event.type ===
                OrchestratorEvent.RESTART
        ) &&
        components.events.some(
            event =>
                event.type ===
                OrchestratorEvent.SHUTDOWN
        ),
        "Runtime Events 錯誤"
    );

    messages.push(
        "✓ Runtime Events 正確"
    );

    assert(
        orchestrator.summary.version ===
            "5.8.0" &&
        orchestrator.summary
            .state ===
            OrchestratorState.SHUTDOWN &&
        orchestrator.summary.runtime &&
        orchestrator.summary.controller &&
        orchestrator.summary.pipeline &&
        orchestrator.summary.scheduler &&
        orchestrator.summary.monitor &&
        orchestrator.summary.recovery,
        "Summary 錯誤"
    );

    await orchestrator.destroy();

    assert(
        orchestrator.state ===
            OrchestratorState.DESTROYED &&
        orchestrator.summary
            .destroyed === true &&
        components.recovery
            .destroyed === 1 &&
        components.monitor
            .destroyed === 1 &&
        components.pipeline
            .destroyed === 1 &&
        components.scheduler
            .destroyed === 1 &&
        components.controller
            .destroyed === 1 &&
        components.eventBus
            .destroyed === true,
        "destroy() 錯誤"
    );

    messages.push(
        "✓ Summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Runtime Orchestrator V5.8 測試完成

Initialize：通過
Boot：通過
Start：通過
Pause／Resume：通過
Stop：通過
Restart：通過
Shutdown：通過
State Machine：通過
Component Coordination：通過
Runtime Events：通過
Summary：通過
Lifecycle：通過
`;
}
