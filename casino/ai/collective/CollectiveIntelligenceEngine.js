/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/CollectiveIntelligenceEngine.js
 */

import {
    CollectiveState
} from "./CollectiveState.js";

import CollectiveContext
    from "./CollectiveContext.js";

import CollectiveAgent
    from "./CollectiveAgent.js";

import CollectiveRegistry
    from "./CollectiveRegistry.js";

import ContributionCollector
    from "./ContributionCollector.js";

import DeliberationEngine
    from "./DeliberationEngine.js";

import ConflictMediator
    from "./ConflictMediator.js";

import CollectiveSynthesizer
    from "./CollectiveSynthesizer.js";

import CollectiveHistory
    from "./CollectiveHistory.js";


export const COLLECTIVE_INTELLIGENCE_ENGINE_VERSION = "8.3.0";

export const CollectiveEvent = Object.freeze({
    STATE_CHANGE: "collective-intelligence-engine:state-change",
    STARTED: "collective-intelligence-engine:started",
    AGENTS_DISCOVERED: "collective-intelligence-engine:agents-discovered",
    CONTRIBUTION_COLLECTED: "collective-intelligence-engine:contribution-collected",
    DELIBERATION_COMPLETED: "collective-intelligence-engine:deliberation-completed",
    CONFLICT_MEDIATED: "collective-intelligence-engine:conflict-mediated",
    SYNTHESIS_COMPLETED: "collective-intelligence-engine:synthesis-completed",
    COMPLETED: "collective-intelligence-engine:completed",
    PAUSED: "collective-intelligence-engine:paused",
    RESUMED: "collective-intelligence-engine:resumed",
    ERROR: "collective-intelligence-engine:error",
    DESTROYED: "collective-intelligence-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class CollectiveIntelligenceEngine {
    constructor({
        registry = null,
        collector = null,
        deliberation = null,
        mediator = null,
        synthesizer = null,
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
            new CollectiveRegistry();

        this.collector =
            collector ??
            new ContributionCollector();

        this.deliberation =
            deliberation ??
            new DeliberationEngine();

        this.mediator =
            mediator ??
            new ConflictMediator();

        this.synthesizer =
            synthesizer ??
            new CollectiveSynthesizer();

        this.history =
            history ??
            new CollectiveHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.state =
            CollectiveState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.collectiveCount = 0;
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
                        "collective-intelligence-engine"
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
            CollectiveEvent.STATE_CHANGE,
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
                "CollectiveIntelligenceEngine has been destroyed."
            );
        }
    }

    registerAgent(config) {
        const agent =
            config instanceof
                CollectiveAgent
                ? config
                : new CollectiveAgent(
                    config
                );

        return this.registry
            .register(
                agent
            );
    }

    unregisterAgent(agentId) {
        return this.registry
            .unregister(
                agentId
            );
    }

    async decide({
        task,
        context = {},
        expertise = null,
        parallel = true
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        if (!task) {
            throw new TypeError(
                "CollectiveIntelligenceEngine requires task."
            );
        }

        const collectiveContext =
            context instanceof
                CollectiveContext
                ? context
                : new CollectiveContext({
                    ...context,
                    task
                });

        this.sequence++;

        const collectiveId =
            `collective-${this.clock()}-${this.sequence}`;

        this.setState(
            CollectiveState.DISCOVERING
        );

        this.emit(
            CollectiveEvent.STARTED,
            {
                collectiveId,
                task,
                context:
                    collectiveContext
            }
        );

        try {
            const agents =
                expertise
                    ? this.registry
                        .findByExpertise(
                            expertise
                        )
                    : this.registry
                        .all();

            if (
                agents.length ===
                0
            ) {
                throw new Error(
                    "No collective agents available."
                );
            }

            this.emit(
                CollectiveEvent.AGENTS_DISCOVERED,
                agents.map(
                    agent => ({
                        agentId:
                            agent.agentId,
                        role:
                            agent.role,
                        weight:
                            agent.weight
                    })
                )
            );

            this.setState(
                CollectiveState.GATHERING
            );

            const contributions =
                await this.collector
                    .collect({
                        agents,
                        task,
                        context:
                            collectiveContext,
                        parallel
                    });

            for (const contribution of contributions) {
                this.emit(
                    CollectiveEvent.CONTRIBUTION_COLLECTED,
                    contribution
                );
            }

            this.setState(
                CollectiveState.DELIBERATING
            );

            const deliberation =
                this.deliberation
                    .deliberate(
                        contributions
                    );

            this.emit(
                CollectiveEvent.DELIBERATION_COMPLETED,
                deliberation
            );

            const mediation =
                this.mediator
                    .mediate(
                        deliberation
                    );

            this.emit(
                CollectiveEvent.CONFLICT_MEDIATED,
                mediation
            );

            this.setState(
                CollectiveState.SYNTHESIZING
            );

            const synthesis =
                this.synthesizer
                    .synthesize({
                        task,
                        contributions,
                        deliberation,
                        mediation
                    });

            this.emit(
                CollectiveEvent.SYNTHESIS_COMPLETED,
                synthesis
            );

            const result = {
                version:
                    COLLECTIVE_INTELLIGENCE_ENGINE_VERSION,
                collectiveId,
                task,
                agentCount:
                    agents.length,
                contributions,
                deliberation,
                mediation,
                synthesis,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.collectiveCount++;

            this.history.add(
                result
            );

            this.setState(
                CollectiveState.COMPLETED
            );

            this.emit(
                CollectiveEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "decide"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            CollectiveState.PAUSED
        );

        this.emit(
            CollectiveEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            CollectiveState.IDLE
        );

        this.emit(
            CollectiveEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.collectiveCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            CollectiveState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            CollectiveState.ERROR
        );

        this.emit(
            CollectiveEvent.ERROR,
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
            CollectiveState.DESTROYED
        );

        this.emit(
            CollectiveEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                COLLECTIVE_INTELLIGENCE_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            collectiveCount:
                this.collectiveCount,
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
            collector:
                this.collector.summary,
            deliberation:
                this.deliberation.summary,
            mediator:
                this.mediator.summary,
            synthesizer:
                this.synthesizer.summary,
            history:
                this.history.summary
        };
    }
}
