/**
 * Baccarat Analyzer V6.5
 * casino/analyzer/AnalyzerEngine.js
 *
 * Coordinates the complete analysis flow:
 * Probability -> EV -> Kelly -> Risk -> Confidence
 * -> Ranking -> Recommendation -> Result
 */

import {
    AnalyzerState
} from "./AnalyzerState.js";

import AnalysisHistory
    from "./AnalysisHistory.js";

import AnalysisCache
    from "./AnalysisCache.js";


export const ANALYZER_ENGINE_VERSION = "6.5.0";

export const AnalyzerEvent = Object.freeze({
    STATE_CHANGE: "analyzer-engine:state-change",
    STARTED: "analyzer-engine:started",
    PROBABILITY_COMPLETED: "analyzer-engine:probability-completed",
    EV_COMPLETED: "analyzer-engine:ev-completed",
    KELLY_COMPLETED: "analyzer-engine:kelly-completed",
    RISK_COMPLETED: "analyzer-engine:risk-completed",
    CONFIDENCE_COMPLETED: "analyzer-engine:confidence-completed",
    RANKING_COMPLETED: "analyzer-engine:ranking-completed",
    RECOMMENDATION_COMPLETED: "analyzer-engine:recommendation-completed",
    COMPLETED: "analyzer-engine:completed",
    CACHE_HIT: "analyzer-engine:cache-hit",
    ERROR: "analyzer-engine:error",
    DESTROYED: "analyzer-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


function stableStringify(value) {
    if (
        value === null ||
        typeof value !== "object"
    ) {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value
            .map(stableStringify)
            .join(",")}]`;
    }

    return `{${Object.keys(value)
        .sort()
        .map(
            key =>
                `${JSON.stringify(key)}:${stableStringify(
                    value[key]
                )}`
        )
        .join(",")}}`;
}


export default class AnalyzerEngine {
    constructor({
        probability,
        ev,
        kelly,
        risk = null,
        confidence,
        ranking,
        recommendation,
        resultResolver = null,
        history = null,
        cache = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        const required = {
            probability,
            ev,
            kelly,
            confidence,
            ranking,
            recommendation
        };

        for (
            const [name, handler] of
            Object.entries(required)
        ) {
            if (!isFunction(handler)) {
                throw new TypeError(
                    `AnalyzerEngine requires ${name}().`
                );
            }
        }

        if (
            risk !== null &&
            !isFunction(risk)
        ) {
            throw new TypeError(
                "risk must be a function."
            );
        }

        if (
            resultResolver !== null &&
            !isFunction(resultResolver)
        ) {
            throw new TypeError(
                "resultResolver must be a function."
            );
        }

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

        this.handlers = {
            probability,
            ev,
            kelly,
            risk,
            confidence,
            ranking,
            recommendation
        };

        this.resultResolver =
            resultResolver;

        this.history =
            history ??
            new AnalysisHistory();

        this.cache =
            cache ??
            new AnalysisCache();

        this.eventBus =
            eventBus;

        this.clock =
            clock;

        this.sequence = 0;

        this.idFactory =
            idFactory ??
            (
                ({
                    sequence,
                    timestamp
                }) =>
                    `analysis-${timestamp}-${sequence}`
            );

        this.state =
            AnalyzerState.IDLE;

        this.previousState = null;
        this.analysisId = null;

        this.startedAt = null;
        this.completedAt = null;

        this.lastInput = null;
        this.lastResult = null;
        this.lastError = null;

        this.analysisCount = 0;
        this.cacheHitCount = 0;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "analyzer-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                AnalyzerState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown AnalyzerState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            AnalyzerEvent.STATE_CHANGE,
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
                "AnalyzerEngine has been destroyed."
            );
        }
    }

    createCacheKey(
        mode,
        input,
        options
    ) {
        return stableStringify({
            mode,
            input,
            options
        });
    }

    async analyzeRound(
        input = {},
        options = {}
    ) {
        return this.analyze(
            "round",
            input,
            options
        );
    }

    async analyzeShoe(
        input = {},
        options = {}
    ) {
        return this.analyze(
            "shoe",
            input,
            options
        );
    }

    async analyzeSession(
        input = {},
        options = {}
    ) {
        return this.analyze(
            "session",
            input,
            options
        );
    }

    async analyze(
        mode,
        input = {},
        options = {}
    ) {
        this.assertNotDestroyed();

        const cacheKey =
            this.createCacheKey(
                mode,
                input,
                options
            );

        if (
            options.cache !== false &&
            this.cache.has(cacheKey)
        ) {
            this.cacheHitCount++;

            const cached =
                this.cache.get(
                    cacheKey
                );

            this.lastInput =
                input;

            this.lastResult =
                cached;

            this.emit(
                AnalyzerEvent.CACHE_HIT,
                {
                    mode,
                    analysisId:
                        cached.analysisId
                }
            );

            return cached;
        }

        this.sequence++;
        this.analysisCount++;

        this.analysisId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp:
                    this.clock()
            });

        this.startedAt =
            this.clock();

        this.completedAt = null;
        this.lastInput =
            input;
        this.lastError = null;

        this.setState(
            AnalyzerState.ANALYZING
        );

        this.emit(
            AnalyzerEvent.STARTED,
            {
                analysisId:
                    this.analysisId,
                mode,
                input,
                options
            }
        );

        try {
            const probability =
                await this.handlers
                    .probability({
                        mode,
                        input,
                        options
                    });

            this.emit(
                AnalyzerEvent.PROBABILITY_COMPLETED,
                probability
            );

            const ev =
                await this.handlers.ev({
                    mode,
                    input,
                    probability,
                    options
                });

            this.emit(
                AnalyzerEvent.EV_COMPLETED,
                ev
            );

            const kelly =
                await this.handlers.kelly({
                    mode,
                    input,
                    probability,
                    ev,
                    options
                });

            this.emit(
                AnalyzerEvent.KELLY_COMPLETED,
                kelly
            );

            const risk =
                this.handlers.risk
                    ? await this.handlers
                        .risk({
                            mode,
                            input,
                            probability,
                            ev,
                            kelly,
                            options
                        })
                    : null;

            if (risk !== null) {
                this.emit(
                    AnalyzerEvent.RISK_COMPLETED,
                    risk
                );
            }

            const confidence =
                await this.handlers
                    .confidence({
                        mode,
                        input,
                        probability,
                        ev,
                        kelly,
                        risk,
                        options
                    });

            this.emit(
                AnalyzerEvent.CONFIDENCE_COMPLETED,
                confidence
            );

            const ranking =
                await this.handlers
                    .ranking({
                        mode,
                        input,
                        probability,
                        ev,
                        kelly,
                        risk,
                        confidence,
                        options
                    });

            this.emit(
                AnalyzerEvent.RANKING_COMPLETED,
                ranking
            );

            const recommendation =
                await this.handlers
                    .recommendation({
                        mode,
                        input,
                        probability,
                        ev,
                        kelly,
                        risk,
                        confidence,
                        ranking,
                        options
                    });

            this.emit(
                AnalyzerEvent.RECOMMENDATION_COMPLETED,
                recommendation
            );

            this.completedAt =
                this.clock();

            const baseResult = {
                version:
                    ANALYZER_ENGINE_VERSION,

                analysisId:
                    this.analysisId,

                mode,

                success:
                    true,

                probability,
                ev,
                kelly,
                risk,
                confidence,
                ranking,
                recommendation,

                startedAt:
                    this.startedAt,

                completedAt:
                    this.completedAt,

                duration:
                    Math.max(
                        0,
                        this.completedAt -
                            this.startedAt
                    ),

                metadata: {
                    ...(options.metadata ?? {})
                }
            };

            const result =
                this.resultResolver
                    ? await this.resultResolver(
                        baseResult
                    )
                    : baseResult;

            this.lastResult =
                result;

            this.history.add({
                analysisId:
                    this.analysisId,
                mode,
                success:
                    true,
                result
            });

            if (
                options.cache !== false
            ) {
                this.cache.set(
                    cacheKey,
                    result
                );
            }

            this.setState(
                AnalyzerState.COMPLETED
            );

            this.emit(
                AnalyzerEvent.COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                mode
            );
        }
    }

    handleError(error, mode) {
        this.lastError =
            error;

        this.completedAt =
            this.clock();

        this.history.add({
            analysisId:
                this.analysisId,
            mode,
            success:
                false,
            error:
                error?.message ??
                String(error)
        });

        this.setState(
            AnalyzerState.ERROR
        );

        this.emit(
            AnalyzerEvent.ERROR,
            {
                analysisId:
                    this.analysisId,
                mode,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    reset() {
        this.assertNotDestroyed();

        this.analysisId = null;
        this.startedAt = null;
        this.completedAt = null;
        this.lastInput = null;
        this.lastResult = null;
        this.lastError = null;

        this.setState(
            AnalyzerState.IDLE
        );

        return this;
    }

    clearCache() {
        this.cache.clear();
        return this;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.history.clear();
        this.cache.clear();

        this.lastInput = null;
        this.lastResult = null;
        this.lastError = null;

        this.destroyed =
            true;

        this.setState(
            AnalyzerState.DESTROYED
        );

        this.emit(
            AnalyzerEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                ANALYZER_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            analysisId:
                this.analysisId,

            analysisCount:
                this.analysisCount,

            cacheHitCount:
                this.cacheHitCount,

            startedAt:
                this.startedAt,

            completedAt:
                this.completedAt,

            hasResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            history:
                this.history.summary,

            cache:
                this.cache.summary
        };
    }
}
