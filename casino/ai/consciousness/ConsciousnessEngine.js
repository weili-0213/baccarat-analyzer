/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/ConsciousnessEngine.js
 *
 * This framework implements software self-observation,
 * attention, introspection, and metacognitive calibration.
 * It does not claim subjective consciousness.
 */

import {
    ConsciousnessState
} from "./ConsciousnessState.js";

import ConsciousnessContext
    from "./ConsciousnessContext.js";

import AttentionManager
    from "./AttentionManager.js";

import SelfModel
    from "./SelfModel.js";

import IntrospectionEngine
    from "./IntrospectionEngine.js";

import MetaCognitionEngine
    from "./MetaCognitionEngine.js";

import ExperienceIntegrator
    from "./ExperienceIntegrator.js";

import AwarenessEvaluator
    from "./AwarenessEvaluator.js";

import ConsciousnessHistory
    from "./ConsciousnessHistory.js";


export const CONSCIOUSNESS_ENGINE_VERSION = "8.4.0";

export const ConsciousnessEvent = Object.freeze({
    STATE_CHANGE: "consciousness-engine:state-change",
    STARTED: "consciousness-engine:started",
    ATTENTION_FOCUSED: "consciousness-engine:attention-focused",
    INTROSPECTION_COMPLETED: "consciousness-engine:introspection-completed",
    META_COGNITION_COMPLETED: "consciousness-engine:meta-cognition-completed",
    EXPERIENCE_INTEGRATED: "consciousness-engine:experience-integrated",
    AWARENESS_EVALUATED: "consciousness-engine:awareness-evaluated",
    COMPLETED: "consciousness-engine:completed",
    PAUSED: "consciousness-engine:paused",
    RESUMED: "consciousness-engine:resumed",
    ERROR: "consciousness-engine:error",
    DESTROYED: "consciousness-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class ConsciousnessEngine {
    constructor({
        attention = null,
        selfModel = null,
        introspection = null,
        metacognition = null,
        integrator = null,
        awareness = null,
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

        this.attention =
            attention ??
            new AttentionManager();

        this.selfModel =
            selfModel ??
            new SelfModel();

        this.introspection =
            introspection ??
            new IntrospectionEngine();

        this.metacognition =
            metacognition ??
            new MetaCognitionEngine();

        this.integrator =
            integrator ??
            new ExperienceIntegrator();

        this.awareness =
            awareness ??
            new AwarenessEvaluator();

        this.history =
            history ??
            new ConsciousnessHistory();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.state =
            ConsciousnessState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
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
                        "consciousness-engine"
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
            ConsciousnessEvent.STATE_CHANGE,
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
                "ConsciousnessEngine has been destroyed."
            );
        }
    }

    async process({
        context = {},
        stimuli = []
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const consciousnessContext =
            context instanceof
                ConsciousnessContext
                ? context
                : new ConsciousnessContext(
                    context
                );

        this.sequence++;

        const consciousnessId =
            `consciousness-${this.clock()}-${this.sequence}`;

        this.setState(
            ConsciousnessState.OBSERVING
        );

        this.emit(
            ConsciousnessEvent.STARTED,
            {
                consciousnessId,
                context:
                    consciousnessContext
            }
        );

        try {
            this.setState(
                ConsciousnessState.ATTENDING
            );

            const attention =
                this.attention.focus(
                    stimuli
                );

            this.emit(
                ConsciousnessEvent.ATTENTION_FOCUSED,
                attention
            );

            this.setState(
                ConsciousnessState.REFLECTING
            );

            const introspection =
                this.introspection
                    .inspect(
                        consciousnessContext
                    );

            this.emit(
                ConsciousnessEvent.INTROSPECTION_COMPLETED,
                introspection
            );

            const metacognition =
                this.metacognition
                    .evaluate({
                        introspection,
                        selfModel:
                            this.selfModel
                    });

            this.emit(
                ConsciousnessEvent.META_COGNITION_COMPLETED,
                metacognition
            );

            this.setState(
                ConsciousnessState.INTEGRATING
            );

            const integratedExperience =
                this.integrator
                    .integrate({
                        attention,
                        introspection,
                        metacognition,
                        selfModel:
                            this.selfModel,
                        context:
                            consciousnessContext
                    });

            integratedExperience.integratedAt =
                this.clock();

            this.emit(
                ConsciousnessEvent.EXPERIENCE_INTEGRATED,
                integratedExperience
            );

            const awareness =
                this.awareness
                    .evaluate({
                        integratedExperience
                    });

            this.emit(
                ConsciousnessEvent.AWARENESS_EVALUATED,
                awareness
            );

            this.selfModel.update({
                state: {
                    awarenessLevel:
                        awareness.level,
                    awarenessScore:
                        awareness.score,
                    calibrated:
                        metacognition.calibrated,
                    lastProcessId:
                        consciousnessId
                }
            });

            const result = {
                version:
                    CONSCIOUSNESS_ENGINE_VERSION,
                consciousnessId,
                attention,
                introspection,
                metacognition,
                integratedExperience,
                awareness,
                selfModel:
                    this.selfModel.snapshot(),
                createdAt:
                    this.clock()
            };

            this.lastResult =
                result;

            this.processCount++;

            this.history.add(
                result
            );

            this.setState(
                ConsciousnessState.COMPLETED
            );

            this.emit(
                ConsciousnessEvent.COMPLETED,
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
            ConsciousnessState.PAUSED
        );

        this.emit(
            ConsciousnessEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            ConsciousnessState.IDLE
        );

        this.emit(
            ConsciousnessEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.processCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.selfModel.update({
            state: {}
        });

        this.setState(
            ConsciousnessState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            ConsciousnessState.ERROR
        );

        this.emit(
            ConsciousnessEvent.ERROR,
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

        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            ConsciousnessState.DESTROYED
        );

        this.emit(
            ConsciousnessEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                CONSCIOUSNESS_ENGINE_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
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
            attention:
                this.attention.summary,
            selfModel:
                this.selfModel.snapshot(),
            introspection:
                this.introspection.summary,
            metacognition:
                this.metacognition.summary,
            integrator:
                this.integrator.summary,
            awareness:
                this.awareness.summary,
            history:
                this.history.summary
        };
    }
}
