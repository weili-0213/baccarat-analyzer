/**
 * Baccarat Analyzer V8.8
 * casino/ai/meta/MetaIntelligenceEngine.js
 */

import {
    MetaIntelligenceState
} from "./MetaIntelligenceState.js";

import MetaIntelligenceContext
    from "./MetaIntelligenceContext.js";

import CapabilityRegistry
    from "./CapabilityRegistry.js";

import CapabilityAssessor
    from "./CapabilityAssessor.js";

import StrategyArbitrator
    from "./StrategyArbitrator.js";

import CrossEngineConflictResolver
    from "./CrossEngineConflictResolver.js";

import MetaSynthesisEngine
    from "./MetaSynthesisEngine.js";

import MetaIntelligenceHistory
    from "./MetaIntelligenceHistory.js";


export const META_INTELLIGENCE_ENGINE_VERSION = "8.8.0";

export const MetaIntelligenceEvent = Object.freeze({
    STATE_CHANGE: "meta-intelligence-engine:state-change",
    STARTED: "meta-intelligence-engine:started",
    CAPABILITIES_LOADED: "meta-intelligence-engine:capabilities-loaded",
    CAPABILITIES_ASSESSED: "meta-intelligence-engine:capabilities-assessed",
    STRATEGY_SELECTED: "meta-intelligence-engine:strategy-selected",
    CONFLICTS_RESOLVED: "meta-intelligence-engine:conflicts-resolved",
    SYNTHESIS_COMPLETED: "meta-intelligence-engine:synthesis-completed",
    COMPLETED: "meta-intelligence-engine:completed",
    PAUSED: "meta-intelligence-engine:paused",
    RESUMED: "meta-intelligence-engine:resumed",
    ERROR: "meta-intelligence-engine:error",
    DESTROYED: "meta-intelligence-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class MetaIntelligenceEngine {
    constructor({
        capabilities = null,
        assessor = null,
        arbitrator = null,
        resolver = null,
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

        this.capabilities =
            capabilities ??
            new CapabilityRegistry();

        this.assessor =
            assessor ??
            new CapabilityAssessor();

        this.arbitrator =
            arbitrator ??
            new StrategyArbitrator();

        this.resolver =
            resolver ??
            new CrossEngineConflictResolver();

        this.synthesizer =
            synthesizer ??
            new MetaSynthesisEngine();

        this.history =
            history ??
            new MetaIntelligenceHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            MetaIntelligenceState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.analysisCount = 0;
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
                        "meta-intelligence-engine"
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
            MetaIntelligenceEvent.STATE_CHANGE,
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
                "MetaIntelligenceEngine has been destroyed."
            );
        }
    }

    registerCapability(config) {
        return this.capabilities
            .register(
                config
            );
    }

    async analyze({
        context = {},
        strategies = []
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const metaContext =
            context instanceof
                MetaIntelligenceContext
                ? context
                : new MetaIntelligenceContext(
                    context
                );

        this.sequence++;

        const metaId =
            `meta-${this.clock()}-${this.sequence}`;

        this.setState(
            MetaIntelligenceState.OBSERVING
        );

        this.emit(
            MetaIntelligenceEvent.STARTED,
            {
                metaId,
                context:
                    metaContext
            }
        );

        try {
            const capabilities =
                this.capabilities.all();

            this.emit(
                MetaIntelligenceEvent.CAPABILITIES_LOADED,
                capabilities.map(
                    capability => ({
                        capabilityId:
                            capability.capabilityId,
                        weight:
                            capability.weight
                    })
                )
            );

            this.setState(
                MetaIntelligenceState.ASSESSING
            );

            const capabilityResults =
                await this.assessor
                    .assess({
                        capabilities,
                        context:
                            metaContext
                    });

            this.emit(
                MetaIntelligenceEvent.CAPABILITIES_ASSESSED,
                capabilityResults
            );

            this.setState(
                MetaIntelligenceState.COORDINATING
            );

            const strategySelection =
                this.arbitrator
                    .select(
                        strategies
                    );

            this.emit(
                MetaIntelligenceEvent.STRATEGY_SELECTED,
                strategySelection
            );

            const resolution =
                this.resolver
                    .resolve({
                        context:
                            metaContext,
                        capabilityResults,
                        strategySelection
                    });

            this.emit(
                MetaIntelligenceEvent.CONFLICTS_RESOLVED,
                resolution
            );

            this.setState(
                MetaIntelligenceState.SYNTHESIZING
            );

            const synthesis =
                this.synthesizer
                    .synthesize({
                        capabilityResults,
                        strategySelection,
                        resolution
                    });

            this.emit(
                MetaIntelligenceEvent.SYNTHESIS_COMPLETED,
                synthesis
            );

            const result = {
                version:
                    META_INTELLIGENCE_ENGINE_VERSION,
                metaId,
                capabilityResults,
                strategySelection,
                resolution,
                synthesis,
                decision:
                    synthesis.decision,
                proceed:
                    synthesis.proceed,
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.analysisCount++;

            this.history.add(
                result
            );

            this.setState(
                MetaIntelligenceState.COMPLETED
            );

            this.emit(
                MetaIntelligenceEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "analyze"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            MetaIntelligenceState.PAUSED
        );

        this.emit(
            MetaIntelligenceEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            MetaIntelligenceState.IDLE
        );

        this.emit(
            MetaIntelligenceEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.analysisCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.setState(
            MetaIntelligenceState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            MetaIntelligenceState.ERROR
        );

        this.emit(
            MetaIntelligenceEvent.ERROR,
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

        this.capabilities.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            MetaIntelligenceState.DESTROYED
        );

        this.emit(
            MetaIntelligenceEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                META_INTELLIGENCE_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            analysisCount:
                this.analysisCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            capabilities:
                this.capabilities.summary,
            assessor:
                this.assessor.summary,
            arbitrator:
                this.arbitrator.summary,
            resolver:
                this.resolver.summary,
            synthesizer:
                this.synthesizer.summary,
            history:
                this.history.summary
        };
    }
}
