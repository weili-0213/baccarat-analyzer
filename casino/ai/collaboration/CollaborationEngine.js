/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/CollaborationEngine.js
 */

import {
    CollaborationState,
    AgentStatus,
    MessageType
} from "./CollaborationState.js";

import SharedContext
    from "./SharedContext.js";

import AgentRegistry
    from "./AgentRegistry.js";

import CollaborationMessage
    from "./CollaborationMessage.js";

import AgentMessageBus
    from "./AgentMessageBus.js";

import TaskRouter
    from "./TaskRouter.js";

import ConsensusEngine
    from "./ConsensusEngine.js";

import CollaborationHistory
    from "./CollaborationHistory.js";


export const COLLABORATION_ENGINE_VERSION = "7.6.0";

export const CollaborationEvent = Object.freeze({
    STATE_CHANGE: "collaboration-engine:state-change",
    STARTED: "collaboration-engine:started",
    TASK_ROUTED: "collaboration-engine:task-routed",
    AGENT_STARTED: "collaboration-engine:agent-started",
    AGENT_COMPLETED: "collaboration-engine:agent-completed",
    AGENT_FAILED: "collaboration-engine:agent-failed",
    CONSENSUS_COMPLETED: "collaboration-engine:consensus-completed",
    COMPLETED: "collaboration-engine:completed",
    PAUSED: "collaboration-engine:paused",
    RESUMED: "collaboration-engine:resumed",
    ERROR: "collaboration-engine:error",
    DESTROYED: "collaboration-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class CollaborationEngine {
    constructor({
        registry = null,
        bus = null,
        router = null,
        consensus = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
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
            new AgentRegistry();

        this.bus =
            bus ??
            new AgentMessageBus();

        this.router =
            router ??
            new TaskRouter();

        this.consensus =
            consensus ??
            new ConsensusEngine();

        this.history =
            history ??
            new CollaborationHistory();

        this.eventBus = eventBus;
        this.clock = clock;
        this.sequence = 0;

        this.idFactory =
            idFactory ??
            (
                ({
                    sequence,
                    timestamp
                }) =>
                    `collaboration-${timestamp}-${sequence}`
            );

        this.state =
            CollaborationState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.lastResult = null;
        this.lastError = null;
        this.collaborationCount = 0;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "collaboration-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous = this.state;

        this.previousState = previous;
        this.state = state;

        this.emit(
            CollaborationEvent.STATE_CHANGE,
            {
                previous,
                current: state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "CollaborationEngine has been destroyed."
            );
        }
    }

    registerAgent(config) {
        return this.registry.register(
            config
        );
    }

    unregisterAgent(agentId) {
        return this.registry.unregister(
            agentId
        );
    }

    createMessage({
        type = MessageType.REQUEST,
        from = "collaboration-engine",
        to = null,
        topic = null,
        payload = null,
        correlationId = null,
        metadata = {}
    } = {}) {
        this.sequence++;

        const timestamp =
            this.clock();

        return new CollaborationMessage({
            messageId:
                `message-${timestamp}-${this.sequence}`,
            type,
            from,
            to,
            topic,
            payload,
            correlationId,
            timestamp,
            metadata
        });
    }

    async collaborate({
        task,
        context = {},
        requireConsensus = false,
        parallel = true
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        if (!task) {
            throw new TypeError(
                "CollaborationEngine requires task."
            );
        }

        const sharedContext =
            context instanceof
                SharedContext
                ? context
                : new SharedContext({
                    ...context,
                    task
                });

        this.sequence++;

        const timestamp =
            this.clock();

        const collaborationId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp
            });

        this.setState(
            CollaborationState.COORDINATING
        );

        this.emit(
            CollaborationEvent.STARTED,
            {
                collaborationId,
                task,
                context:
                    sharedContext
            }
        );

        try {
            this.setState(
                CollaborationState.ROUTING
            );

            const route =
                this.router.route({
                    task,
                    registry:
                        this.registry
                });

            this.emit(
                CollaborationEvent.TASK_ROUTED,
                route
            );

            if (
                route.candidates.length ===
                0
            ) {
                throw new Error(
                    `No agent available for capability: ${route.capability}`
                );
            }

            const message =
                this.createMessage({
                    type:
                        MessageType.REQUEST,
                    topic:
                        task.capability ??
                        task.type ??
                        "task",
                    payload:
                        task,
                    correlationId:
                        collaborationId
                });

            this.bus.publish(
                message
            );

            const runAgent =
                async agent => {
                    agent.status =
                        AgentStatus.BUSY;

                    agent.taskCount++;

                    this.emit(
                        CollaborationEvent.AGENT_STARTED,
                        {
                            collaborationId,
                            agentId:
                                agent.agentId
                        }
                    );

                    try {
                        const output =
                            await agent.handler({
                                task,
                                context:
                                    sharedContext,
                                message
                            });

                        agent.status =
                            AgentStatus.READY;

                        const response = {
                            agentId:
                                agent.agentId,
                            value:
                                output?.value ??
                                output,
                            confidence:
                                output?.confidence ??
                                1,
                            weight:
                                output?.weight ??
                                1,
                            output
                        };

                        this.emit(
                            CollaborationEvent.AGENT_COMPLETED,
                            response
                        );

                        return response;
                    }
                    catch (error) {
                        agent.status =
                            AgentStatus.ERROR;

                        agent.errorCount++;

                        const failed = {
                            agentId:
                                agent.agentId,
                            error:
                                error?.message ??
                                String(error)
                        };

                        this.emit(
                            CollaborationEvent.AGENT_FAILED,
                            failed
                        );

                        return failed;
                    }
                };

            const agents =
                requireConsensus
                    ? route.candidates
                    : [
                        route.selected
                    ];

            const responses =
                parallel
                    ? await Promise.all(
                        agents.map(
                            agent =>
                                runAgent(agent)
                        )
                    )
                    : [];

            if (!parallel) {
                for (const agent of agents) {
                    responses.push(
                        await runAgent(agent)
                    );
                }
            }

            const successful =
                responses.filter(
                    response =>
                        !response.error
                );

            let consensusResult =
                null;

            if (
                requireConsensus &&
                successful.length > 0
            ) {
                this.setState(
                    CollaborationState.VOTING
                );

                consensusResult =
                    this.consensus.resolve(
                        successful
                    );

                this.emit(
                    CollaborationEvent.CONSENSUS_COMPLETED,
                    consensusResult
                );
            }

            const result = {
                version:
                    COLLABORATION_ENGINE_VERSION,

                collaborationId,

                task,

                route: {
                    capability:
                        route.capability,

                    selectedAgentId:
                        route.selected
                            ?.agentId ??
                        null,

                    candidateAgentIds:
                        route.candidates
                            .map(
                                agent =>
                                    agent.agentId
                            )
                },

                responses,

                consensus:
                    consensusResult,

                output:
                    consensusResult
                        ?.consensus
                        ?.value ??
                    successful[0]
                        ?.value ??
                    null,

                success:
                    successful.length > 0,

                createdAt:
                    timestamp
            };

            this.lastResult =
                result;

            this.collaborationCount++;

            this.history.add(
                result
            );

            this.setState(
                CollaborationState.COMPLETED
            );

            this.emit(
                CollaborationEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "collaborate"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            CollaborationState.PAUSED
        );

        this.emit(
            CollaborationEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            CollaborationState.IDLE
        );

        this.emit(
            CollaborationEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.bus.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.collaborationCount = 0;
        this.paused = false;

        for (
            const agent of
            this.registry.agents.values()
        ) {
            if (
                agent.status !==
                AgentStatus.OFFLINE
            ) {
                agent.status =
                    AgentStatus.READY;
            }
        }

        this.setState(
            CollaborationState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            CollaborationState.ERROR
        );

        this.emit(
            CollaborationEvent.ERROR,
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

        this.bus.clear();
        this.history.clear();
        this.registry.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            CollaborationState.DESTROYED
        );

        this.emit(
            CollaborationEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                COLLABORATION_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            paused:
                this.paused,

            destroyed:
                this.destroyed,

            collaborationCount:
                this.collaborationCount,

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

            bus:
                this.bus.summary,

            router:
                this.router.summary,

            consensus:
                this.consensus.summary,

            history:
                this.history.summary
        };
    }
}
