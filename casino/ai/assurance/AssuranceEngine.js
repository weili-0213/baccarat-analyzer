/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/AssuranceEngine.js
 */

import {
    AssuranceState
} from "./AssuranceState.js";

import AssuranceContext
    from "./AssuranceContext.js";

import AssuranceCheck
    from "./AssuranceCheck.js";

import CheckRegistry
    from "./CheckRegistry.js";

import IntegrityValidator
    from "./IntegrityValidator.js";

import ConsistencyAnalyzer
    from "./ConsistencyAnalyzer.js";

import DriftDetector
    from "./DriftDetector.js";

import AssuranceScorer
    from "./AssuranceScorer.js";

import AssuranceHistory
    from "./AssuranceHistory.js";


export const ASSURANCE_ENGINE_VERSION = "7.8.0";

export const AssuranceEvent = Object.freeze({
    STATE_CHANGE: "assurance-engine:state-change",
    STARTED: "assurance-engine:started",
    CHECK_STARTED: "assurance-engine:check-started",
    CHECK_COMPLETED: "assurance-engine:check-completed",
    SCORE_CALCULATED: "assurance-engine:score-calculated",
    COMPLETED: "assurance-engine:completed",
    PAUSED: "assurance-engine:paused",
    RESUMED: "assurance-engine:resumed",
    ERROR: "assurance-engine:error",
    DESTROYED: "assurance-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class AssuranceEngine {
    constructor({
        checks = null,
        integrityValidator = null,
        consistencyAnalyzer = null,
        driftDetector = null,
        scorer = null,
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

        this.checks =
            checks ??
            new CheckRegistry();

        this.integrityValidator =
            integrityValidator ??
            new IntegrityValidator();

        this.consistencyAnalyzer =
            consistencyAnalyzer ??
            new ConsistencyAnalyzer();

        this.driftDetector =
            driftDetector ??
            new DriftDetector();

        this.scorer =
            scorer ??
            new AssuranceScorer();

        this.history =
            history ??
            new AssuranceHistory();

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
                    `assurance-${timestamp}-${sequence}`
            );

        this.state =
            AssuranceState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.lastResult = null;
        this.lastError = null;
        this.assuranceCount = 0;

        this.registerDefaultChecks();
    }

    registerDefaultChecks() {
        if (
            this.checks.summary.count >
            0
        ) {
            return;
        }

        this.checks.register(
            new AssuranceCheck({
                checkId: "integrity",
                name: "Integrity Check",
                type: "integrity",
                weight: 1.2,
                evaluate:
                    context =>
                        this.integrityValidator
                            .validate(context)
            })
        );

        this.checks.register(
            new AssuranceCheck({
                checkId: "consistency",
                name: "Consistency Check",
                type: "consistency",
                weight: 1.3,
                evaluate:
                    context =>
                        this.consistencyAnalyzer
                            .analyze(context)
            })
        );

        this.checks.register(
            new AssuranceCheck({
                checkId: "drift",
                name: "Drift Check",
                type: "drift",
                weight: 1,
                evaluate:
                    context =>
                        this.driftDetector
                            .detect(context)
            })
        );
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "assurance-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous =
            this.state;

        this.previousState = previous;
        this.state = state;

        this.emit(
            AssuranceEvent.STATE_CHANGE,
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
                "AssuranceEngine has been destroyed."
            );
        }
    }

    registerCheck(check) {
        return this.checks.register(
            check
        );
    }

    async inspect({
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const assuranceContext =
            context instanceof
                AssuranceContext
                ? context
                : new AssuranceContext(
                    context
                );

        this.sequence++;

        const timestamp =
            this.clock();

        const assuranceId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp
            });

        this.setState(
            AssuranceState.INSPECTING
        );

        this.emit(
            AssuranceEvent.STARTED,
            {
                assuranceId,
                context:
                    assuranceContext
            }
        );

        try {
            this.setState(
                AssuranceState.VALIDATING
            );

            const results = [];

            for (
                const check of
                this.checks.all()
            ) {
                this.emit(
                    AssuranceEvent.CHECK_STARTED,
                    {
                        checkId:
                            check.checkId
                    }
                );

                const result =
                    await check.run(
                        assuranceContext
                    );

                results.push(
                    result
                );

                this.emit(
                    AssuranceEvent.CHECK_COMPLETED,
                    result
                );
            }

            this.setState(
                AssuranceState.SCORING
            );

            const scoreResult =
                this.scorer.score(
                    results
                );

            this.emit(
                AssuranceEvent.SCORE_CALCULATED,
                scoreResult
            );

            const issues =
                results.flatMap(
                    result =>
                        result.issues.map(
                            issue => ({
                                checkId:
                                    result.checkId,
                                issue
                            })
                        )
                );

            const result = {
                version:
                    ASSURANCE_ENGINE_VERSION,

                assuranceId,

                level:
                    scoreResult.level,

                score:
                    scoreResult.score,

                passed:
                    scoreResult.passed,

                results,

                issues,

                createdAt:
                    timestamp
            };

            this.lastResult =
                result;

            this.assuranceCount++;

            this.history.add(
                result
            );

            this.setState(
                AssuranceState.COMPLETED
            );

            this.emit(
                AssuranceEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "inspect"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            AssuranceState.PAUSED
        );

        this.emit(
            AssuranceEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            AssuranceState.IDLE
        );

        this.emit(
            AssuranceEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.assuranceCount = 0;
        this.paused = false;

        this.setState(
            AssuranceState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError = error;

        this.setState(
            AssuranceState.ERROR
        );

        this.emit(
            AssuranceEvent.ERROR,
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

        this.checks.clear();
        this.history.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            AssuranceState.DESTROYED
        );

        this.emit(
            AssuranceEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                ASSURANCE_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            paused:
                this.paused,

            destroyed:
                this.destroyed,

            assuranceCount:
                this.assuranceCount,

            hasResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            checks:
                this.checks.summary,

            integrityValidator:
                this.integrityValidator
                    .summary,

            consistencyAnalyzer:
                this.consistencyAnalyzer
                    .summary,

            driftDetector:
                this.driftDetector
                    .summary,

            scorer:
                this.scorer.summary,

            history:
                this.history.summary
        };
    }
}
