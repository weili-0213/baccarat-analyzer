/**
 * Baccarat Analyzer V7.3
 * casino/ai/reasoning/ReasoningEngine.js
 */
import { ReasoningState } from "./ReasoningState.js";
import ReasoningContext from "./ReasoningContext.js";
import ReasoningChain from "./ReasoningChain.js";
import HypothesisBuilder from "./HypothesisBuilder.js";
import EvidenceCollector from "./EvidenceCollector.js";
import ConflictResolver from "./ConflictResolver.js";
import ExplanationBuilder from "./ExplanationBuilder.js";
import ReasoningHistory from "./ReasoningHistory.js";

export const REASONING_ENGINE_VERSION = "7.3.0";

export const ReasoningEvent = Object.freeze({
    STATE_CHANGE: "reasoning-engine:state-change",
    STARTED: "reasoning-engine:started",
    HYPOTHESES_BUILT: "reasoning-engine:hypotheses-built",
    EVIDENCE_COLLECTED: "reasoning-engine:evidence-collected",
    CONFLICTS_RESOLVED: "reasoning-engine:conflicts-resolved",
    EXPLANATION_BUILT: "reasoning-engine:explanation-built",
    COMPLETED: "reasoning-engine:completed",
    PAUSED: "reasoning-engine:paused",
    RESUMED: "reasoning-engine:resumed",
    ERROR: "reasoning-engine:error",
    DESTROYED: "reasoning-engine:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

export default class ReasoningEngine {
    constructor({
        hypothesisBuilder = null,
        evidenceCollector = null,
        conflictResolver = null,
        explanationBuilder = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (eventBus !== null && !isFunction(eventBus.emit)) {
            throw new TypeError("eventBus requires emit().");
        }
        if (!isFunction(clock)) {
            throw new TypeError("clock must be a function.");
        }

        this.hypothesisBuilder = hypothesisBuilder ?? new HypothesisBuilder();
        this.evidenceCollector = evidenceCollector ?? new EvidenceCollector();
        this.conflictResolver = conflictResolver ?? new ConflictResolver();
        this.explanationBuilder = explanationBuilder ?? new ExplanationBuilder();
        this.history = history ?? new ReasoningHistory();
        this.eventBus = eventBus;
        this.clock = clock;
        this.sequence = 0;
        this.idFactory =
            idFactory ??
            (({ sequence, timestamp }) =>
                `reasoning-${timestamp}-${sequence}`);
        this.state = ReasoningState.IDLE;
        this.previousState = null;
        this.paused = false;
        this.lastResult = null;
        this.lastError = null;
        this.reasoningCount = 0;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(type, payload, {
                source: "reasoning-engine"
            }) ?? null
        );
    }

    setState(state) {
        const previous = this.state;
        this.previousState = previous;
        this.state = state;
        this.emit(ReasoningEvent.STATE_CHANGE, {
            previous,
            current: state
        });
        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error("ReasoningEngine has been destroyed.");
        }
    }

    async reason({ context = {}, knowledgeResult = null } = {}) {
        this.assertNotDestroyed();
        if (this.paused) {
            return null;
        }

        const reasoningContext =
            context instanceof ReasoningContext
                ? context
                : new ReasoningContext(context);

        this.sequence++;
        const timestamp = this.clock();
        const reasoningId = this.idFactory({
            sequence: this.sequence,
            timestamp
        });
        const chain = new ReasoningChain();

        this.setState(ReasoningState.BUILDING);
        this.emit(ReasoningEvent.STARTED, {
            reasoningId,
            context: reasoningContext
        });

        try {
            const hypotheses = await this.hypothesisBuilder.build({
                context: reasoningContext,
                knowledgeResult
            });

            chain.add({
                type: "hypothesis",
                message: "Hypotheses built",
                data: hypotheses,
                timestamp: this.clock()
            });
            this.emit(ReasoningEvent.HYPOTHESES_BUILT, hypotheses);

            this.setState(ReasoningState.COLLECTING);

            const evidence = await this.evidenceCollector.collect({
                context: reasoningContext,
                hypotheses,
                knowledgeResult
            });

            chain.add({
                type: "evidence",
                message: "Evidence collected",
                data: evidence,
                timestamp: this.clock()
            });
            this.emit(ReasoningEvent.EVIDENCE_COLLECTED, evidence);

            this.setState(ReasoningState.RESOLVING);

            const resolution = await this.conflictResolver.resolve({
                hypotheses,
                evidence
            });

            chain.add({
                type: "resolution",
                message: "Conflicts resolved",
                data: resolution,
                confidence: resolution.best?.confidence ?? 0,
                timestamp: this.clock()
            });
            this.emit(ReasoningEvent.CONFLICTS_RESOLVED, resolution);

            const explanation = await this.explanationBuilder.build({
                resolution,
                hypotheses,
                evidence
            });

            chain.add({
                type: "explanation",
                message: explanation.summary,
                data: explanation,
                confidence: explanation.confidence,
                timestamp: this.clock()
            });
            this.emit(ReasoningEvent.EXPLANATION_BUILT, explanation);

            const result = {
                version: REASONING_ENGINE_VERSION,
                reasoningId,
                createdAt: timestamp,
                context: reasoningContext.toJSON(),
                hypotheses,
                evidence,
                resolution,
                explanation,
                chain: chain.toJSON()
            };

            this.lastResult = result;
            this.reasoningCount++;
            this.history.add(result);

            this.setState(ReasoningState.COMPLETED);
            this.emit(ReasoningEvent.COMPLETED, result);

            return result;
        } catch (error) {
            return this.handleError(error, "reason");
        }
    }

    pause() {
        this.assertNotDestroyed();
        this.paused = true;
        this.setState(ReasoningState.PAUSED);
        this.emit(ReasoningEvent.PAUSED, this.summary);
        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();
        this.paused = false;
        this.setState(ReasoningState.IDLE);
        this.emit(ReasoningEvent.RESUMED, this.summary);
        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();
        this.history.clear();
        this.lastResult = null;
        this.lastError = null;
        this.reasoningCount = 0;
        this.paused = false;
        this.setState(ReasoningState.IDLE);
        return this;
    }

    handleError(error, phase) {
        this.lastError = error;
        this.setState(ReasoningState.ERROR);
        this.emit(ReasoningEvent.ERROR, {
            phase,
            message: error?.message ?? String(error)
        });
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
        this.setState(ReasoningState.DESTROYED);
        this.emit(ReasoningEvent.DESTROYED, null);
        return this;
    }

    get summary() {
        return {
            version: REASONING_ENGINE_VERSION,
            state: this.state,
            previousState: this.previousState,
            paused: this.paused,
            destroyed: this.destroyed,
            reasoningCount: this.reasoningCount,
            hasResult: Boolean(this.lastResult),
            lastError: this.lastError?.message ?? null,
            history: this.history.summary,
            components: {
                hypothesisBuilder: this.hypothesisBuilder.summary,
                evidenceCollector: this.evidenceCollector.summary,
                conflictResolver: this.conflictResolver.summary,
                explanationBuilder: this.explanationBuilder.summary
            }
        };
    }
}
