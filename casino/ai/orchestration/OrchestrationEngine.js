/**
 * Baccarat Analyzer V8.9
 * casino/ai/orchestration/OrchestrationEngine.js
 */
import {
    OrchestrationState,
    OrchestrationDecision
} from "./OrchestrationState.js";

import OrchestrationContext
    from "./OrchestrationContext.js";

import TaskRegistry
    from "./TaskRegistry.js";

import TaskPrioritizer
    from "./TaskPrioritizer.js";

import DependencyResolver
    from "./DependencyResolver.js";

import ResourceAllocator
    from "./ResourceAllocator.js";

import EngineScheduler
    from "./EngineScheduler.js";

import ExecutionCoordinator
    from "./ExecutionCoordinator.js";

import GlobalStateSynchronizer
    from "./GlobalStateSynchronizer.js";

import OrchestrationHistory
    from "./OrchestrationHistory.js";


export const ORCHESTRATION_ENGINE_VERSION = "8.9.0";

export const OrchestrationEvent = Object.freeze({
    STATE_CHANGE: "orchestration-engine:state-change",
    STARTED: "orchestration-engine:started",
    TASKS_REGISTERED: "orchestration-engine:tasks-registered",
    TASKS_PRIORITIZED: "orchestration-engine:tasks-prioritized",
    DEPENDENCIES_RESOLVED: "orchestration-engine:dependencies-resolved",
    RESOURCES_ALLOCATED: "orchestration-engine:resources-allocated",
    SCHEDULE_CREATED: "orchestration-engine:schedule-created",
    EXECUTION_COMPLETED: "orchestration-engine:execution-completed",
    STATE_SYNCHRONIZED: "orchestration-engine:state-synchronized",
    COMPLETED: "orchestration-engine:completed",
    PAUSED: "orchestration-engine:paused",
    RESUMED: "orchestration-engine:resumed",
    ERROR: "orchestration-engine:error",
    DESTROYED: "orchestration-engine:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

export default class OrchestrationEngine {
    constructor({
        registry = null,
        prioritizer = null,
        resolver = null,
        allocator = null,
        scheduler = null,
        coordinator = null,
        synchronizer = null,
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
            new TaskRegistry();

        this.prioritizer =
            prioritizer ??
            new TaskPrioritizer();

        this.resolver =
            resolver ??
            new DependencyResolver();

        this.allocator =
            allocator ??
            new ResourceAllocator();

        this.scheduler =
            scheduler ??
            new EngineScheduler();

        this.coordinator =
            coordinator ??
            new ExecutionCoordinator();

        this.synchronizer =
            synchronizer ??
            new GlobalStateSynchronizer();

        this.history =
            history ??
            new OrchestrationHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            OrchestrationState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.runCount = 0;
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
                        "orchestration-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            OrchestrationEvent.STATE_CHANGE,
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
                "OrchestrationEngine has been destroyed."
            );
        }
    }

    registerTask(task) {
        return this.registry
            .register(
                task
            );
    }

    async orchestrate({
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const orchestrationContext =
            context instanceof
                OrchestrationContext
                ? context
                : new OrchestrationContext(
                    context
                );

        this.sequence++;

        const orchestrationId =
            `orchestration-${this.clock()}-${this.sequence}`;

        this.setState(
            OrchestrationState.PLANNING
        );

        this.emit(
            OrchestrationEvent.STARTED,
            {
                orchestrationId,
                context:
                    orchestrationContext
            }
        );

        try {
            this.registry.clear();

            for (const task of orchestrationContext.tasks) {
                this.registry.register(task);
            }

            const tasks =
                this.registry.all();

            this.emit(
                OrchestrationEvent.TASKS_REGISTERED,
                tasks
            );

            const prioritized =
                this.prioritizer
                    .prioritize(
                        tasks
                    );

            this.emit(
                OrchestrationEvent.TASKS_PRIORITIZED,
                prioritized
            );

            this.setState(
                OrchestrationState.RESOLVING
            );

            const resolved =
                this.resolver
                    .resolve(
                        prioritized.ranking
                    );

            this.emit(
                OrchestrationEvent.DEPENDENCIES_RESOLVED,
                resolved
            );

            this.setState(
                OrchestrationState.ALLOCATING
            );

            const allocation =
                this.allocator
                    .allocate({
                        tasks:
                            resolved.ordered,
                        capacity:
                            orchestrationContext.resources
                                .capacity ??
                            Infinity
                    });

            this.emit(
                OrchestrationEvent.RESOURCES_ALLOCATED,
                allocation
            );

            const schedule =
                this.scheduler
                    .schedule(
                        allocation.allocated
                    );

            this.emit(
                OrchestrationEvent.SCHEDULE_CREATED,
                schedule
            );

            this.setState(
                OrchestrationState.EXECUTING
            );

            const executionResults =
                await this.coordinator
                    .execute({
                        schedule,
                        engines:
                            orchestrationContext.engines
                    });

            this.emit(
                OrchestrationEvent.EXECUTION_COMPLETED,
                executionResults
            );

            this.setState(
                OrchestrationState.SYNCHRONIZING
            );

            const globalState =
                this.synchronizer
                    .synchronize({
                        globalState:
                            orchestrationContext.globalState,
                        results:
                            executionResults
                    });

            globalState.updatedAt =
                this.clock();

            this.emit(
                OrchestrationEvent.STATE_SYNCHRONIZED,
                globalState
            );

            const decision =
                allocation.deferred.length > 0
                    ? OrchestrationDecision.DEFER
                    : executionResults.every(
                        result =>
                            result.success
                    )
                        ? OrchestrationDecision.RUN
                        : OrchestrationDecision.BLOCK;

            const result = {
                version:
                    ORCHESTRATION_ENGINE_VERSION,
                orchestrationId,
                prioritized,
                resolved,
                allocation,
                schedule,
                executionResults,
                globalState,
                decision,
                completed:
                    decision !==
                    OrchestrationDecision.BLOCK,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.runCount++;

            this.history.add(
                result
            );

            this.setState(
                OrchestrationState.COMPLETED
            );

            this.emit(
                OrchestrationEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "orchestrate"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            OrchestrationState.PAUSED
        );

        this.emit(
            OrchestrationEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            OrchestrationState.IDLE
        );

        this.emit(
            OrchestrationEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.registry.clear();
        this.history.clear();

        this.runCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            OrchestrationState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            OrchestrationState.ERROR
        );

        this.emit(
            OrchestrationEvent.ERROR,
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
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            OrchestrationState.DESTROYED
        );

        this.emit(
            OrchestrationEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                ORCHESTRATION_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            runCount:
                this.runCount,
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
            prioritizer:
                this.prioritizer.summary,
            resolver:
                this.resolver.summary,
            allocator:
                this.allocator.summary,
            scheduler:
                this.scheduler.summary,
            coordinator:
                this.coordinator.summary,
            synchronizer:
                this.synchronizer.summary,
            history:
                this.history.summary
        };
    }
}
