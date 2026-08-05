/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/SafetyEngine.js
 */
import { SafetyState } from "./SafetyState.js";
import SafetyContext from "./SafetyContext.js";
import HazardRegistry from "./HazardRegistry.js";
import ThreatEvaluator from "./ThreatEvaluator.js";
import GuardrailEngine from "./GuardrailEngine.js";
import FailSafeController from "./FailSafeController.js";
import IncidentManager from "./IncidentManager.js";
import SafetyScorer from "./SafetyScorer.js";
import SafetyHistory from "./SafetyHistory.js";

export const SAFETY_ENGINE_VERSION = "8.7.0";

export const SafetyEvent = Object.freeze({
    STATE_CHANGE: "safety-engine:state-change",
    STARTED: "safety-engine:started",
    HAZARDS_LOADED: "safety-engine:hazards-loaded",
    THREAT_EVALUATED: "safety-engine:threat-evaluated",
    GUARDRAIL_EVALUATED: "safety-engine:guardrail-evaluated",
    FAIL_SAFE_DECIDED: "safety-engine:fail-safe-decided",
    INCIDENT_CREATED: "safety-engine:incident-created",
    SCORE_CALCULATED: "safety-engine:score-calculated",
    COMPLETED: "safety-engine:completed",
    PAUSED: "safety-engine:paused",
    RESUMED: "safety-engine:resumed",
    ERROR: "safety-engine:error",
    DESTROYED: "safety-engine:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

export default class SafetyEngine {
    constructor({
        hazards = null,
        threatEvaluator = null,
        guardrail = null,
        failSafe = null,
        incidents = null,
        scorer = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (eventBus !== null && !isFunction(eventBus.emit)) {
            throw new TypeError("eventBus requires emit().");
        }

        if (!isFunction(clock)) {
            throw new TypeError("clock must be a function.");
        }

        this.hazards = hazards ?? new HazardRegistry();
        this.threatEvaluator =
            threatEvaluator ?? new ThreatEvaluator();
        this.guardrail = guardrail ?? new GuardrailEngine();
        this.failSafe = failSafe ?? new FailSafeController();
        this.incidents = incidents ?? new IncidentManager();
        this.scorer = scorer ?? new SafetyScorer();
        this.history = history ?? new SafetyHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state = SafetyState.IDLE;
        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.sequence = 0;
        this.checkCount = 0;
        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(type, payload, {
                source: "safety-engine"
            }) ?? null
        );
    }

    setState(state) {
        const previous = this.state;
        this.previousState = previous;
        this.state = state;
        this.emit(SafetyEvent.STATE_CHANGE, {
            previous,
            current: state
        });
        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error("SafetyEngine has been destroyed.");
        }
    }

    registerHazard(config) {
        return this.hazards.register(config);
    }

    async check({ context = {} } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const safetyContext =
            context instanceof SafetyContext
                ? context
                : new SafetyContext(context);

        this.sequence++;
        const safetyId =
            `safety-${this.clock()}-${this.sequence}`;

        this.setState(SafetyState.SCANNING);
        this.emit(SafetyEvent.STARTED, {
            safetyId,
            context: safetyContext
        });

        try {
            const hazards = this.hazards.all();

            this.emit(
                SafetyEvent.HAZARDS_LOADED,
                hazards.map(hazard => ({
                    hazardId: hazard.hazardId,
                    severity: hazard.severity
                }))
            );

            this.setState(SafetyState.EVALUATING);

            const threat = this.threatEvaluator.evaluate({
                hazards,
                context: safetyContext
            });

            this.emit(
                SafetyEvent.THREAT_EVALUATED,
                threat
            );

            this.setState(SafetyState.GUARDING);

            const guardrail = this.guardrail.evaluate({
                action: safetyContext.action ?? {},
                constraints: safetyContext.constraints,
                threat
            });

            this.emit(
                SafetyEvent.GUARDRAIL_EVALUATED,
                guardrail
            );

            this.setState(SafetyState.RESPONDING);

            const failSafe = this.failSafe.decide({
                guardrail,
                threat
            });

            this.emit(
                SafetyEvent.FAIL_SAFE_DECIDED,
                failSafe
            );

            const incident = this.incidents.create({
                threat,
                guardrail,
                failSafe,
                createdAt: this.clock()
            });

            this.emit(
                SafetyEvent.INCIDENT_CREATED,
                incident
            );

            const scored = this.scorer.score({
                threat,
                guardrail,
                failSafe
            });

            this.emit(
                SafetyEvent.SCORE_CALCULATED,
                scored
            );

            const result = {
                version: SAFETY_ENGINE_VERSION,
                safetyId,
                threat,
                guardrail,
                failSafe,
                incident,
                score: scored.score,
                level: scored.level,
                safe: scored.safe,
                createdAt: this.clock()
            };

            this.lastResult = result;
            this.checkCount++;
            this.history.add(result);

            this.setState(SafetyState.COMPLETED);
            this.emit(SafetyEvent.COMPLETED, result);

            return result;
        } catch (error) {
            return this.handleError(error, "check");
        }
    }

    pause() {
        this.assertNotDestroyed();
        this.paused = true;
        this.setState(SafetyState.PAUSED);
        this.emit(SafetyEvent.PAUSED, this.summary);
        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();
        this.paused = false;
        this.setState(SafetyState.IDLE);
        this.emit(SafetyEvent.RESUMED, this.summary);
        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();
        this.incidents.clear();
        this.history.clear();
        this.checkCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;
        this.setState(SafetyState.IDLE);
        return this;
    }

    handleError(error, phase) {
        this.lastError = error;
        this.setState(SafetyState.ERROR);
        this.emit(SafetyEvent.ERROR, {
            phase,
            message: error?.message ?? String(error)
        });
        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.hazards.clear();
        this.incidents.clear();
        this.history.clear();
        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(SafetyState.DESTROYED);
        this.emit(SafetyEvent.DESTROYED, null);

        return this;
    }

    get summary() {
        return {
            version: SAFETY_ENGINE_VERSION,
            state: this.state,
            previousState: this.previousState,
            paused: this.paused,
            destroyed: this.destroyed,
            checkCount: this.checkCount,
            hasResult: Boolean(this.lastResult),
            lastError: this.lastError?.message ?? null,
            hazards: this.hazards.summary,
            threatEvaluator: this.threatEvaluator.summary,
            guardrail: this.guardrail.summary,
            failSafe: this.failSafe.summary,
            incidents: this.incidents.summary,
            scorer: this.scorer.summary,
            history: this.history.summary
        };
    }
}
