/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/KnowledgeEngine.js
 *
 * Converts learning experiences into reusable knowledge
 * and performs explainable inference.
 */

import {
    KnowledgeState,
    KnowledgeType
} from "./KnowledgeState.js";

import KnowledgeRecord
    from "./KnowledgeRecord.js";

import KnowledgeBase
    from "./KnowledgeBase.js";

import PatternLibrary
    from "./PatternLibrary.js";

import RuleRepository
    from "./RuleRepository.js";

import KnowledgeGraph
    from "./KnowledgeGraph.js";

import InferenceEngine
    from "./InferenceEngine.js";


export const KNOWLEDGE_ENGINE_VERSION = "7.2.0";

export const KnowledgeEvent = Object.freeze({
    STATE_CHANGE: "knowledge-engine:state-change",
    KNOWLEDGE_ADDED: "knowledge-engine:knowledge-added",
    KNOWLEDGE_UPDATED: "knowledge-engine:knowledge-updated",
    EXPERIENCE_INGESTED: "knowledge-engine:experience-ingested",
    PATTERNS_MATCHED: "knowledge-engine:patterns-matched",
    RULES_EVALUATED: "knowledge-engine:rules-evaluated",
    INFERENCE_COMPLETED: "knowledge-engine:inference-completed",
    PAUSED: "knowledge-engine:paused",
    RESUMED: "knowledge-engine:resumed",
    ERROR: "knowledge-engine:error",
    DESTROYED: "knowledge-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class KnowledgeEngine {
    constructor({
        base = null,
        patterns = null,
        rules = null,
        graph = null,
        inference = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (
            eventBus !== null &&
            !isFunction(
                eventBus.emit
            )
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

        this.base =
            base ??
            new KnowledgeBase();

        this.patterns =
            patterns ??
            new PatternLibrary();

        this.rules =
            rules ??
            new RuleRepository();

        this.graph =
            graph ??
            new KnowledgeGraph();

        this.inference =
            inference ??
            new InferenceEngine();

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
                    `knowledge-${timestamp}-${sequence}`
            );

        this.state =
            KnowledgeState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.lastInference = null;
        this.lastError = null;
        this.ingestCount = 0;
        this.inferenceCount = 0;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "knowledge-engine"
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
            KnowledgeEvent.STATE_CHANGE,
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
                "KnowledgeEngine has been destroyed."
            );
        }
    }

    addKnowledge({
        type = KnowledgeType.FACT,
        key,
        value,
        confidence = 0.5,
        weight = 1,
        source = "manual",
        tags = [],
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        this.sequence++;

        const timestamp =
            this.clock();

        const record =
            new KnowledgeRecord({
                knowledgeId:
                    this.idFactory({
                        sequence:
                            this.sequence,
                        timestamp
                    }),

                type,
                key,
                value,
                confidence,
                weight,
                source,
                tags,
                metadata,
                createdAt:
                    timestamp,
                updatedAt:
                    timestamp
            });

        this.base.add(
            record
        );

        this.emit(
            KnowledgeEvent.KNOWLEDGE_ADDED,
            record
        );

        return record;
    }

    ingestExperience(
        experience = {}
    ) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        this.setState(
            KnowledgeState.COLLECTING
        );

        try {
            const state =
                experience.state ??
                {};

            const evaluation =
                experience.evaluation ??
                {};

            const reward =
                Number.isFinite(
                    experience.reward
                )
                    ? experience.reward
                    : 0;

            const confidence =
                Math.max(
                    0,
                    Math.min(
                        1,
                        (
                            state.confidence ??
                            0
                        ) *
                        (
                            reward >= 0
                                ? 1
                                : 0.5
                        )
                    )
                );

            const key =
                [
                    state.bestBet ??
                        "unknown",
                    state.risk ??
                        "unavailable",
                    evaluation.correct
                        ? "correct"
                        : "incorrect"
                ].join(":");

            const existing =
                this.base.findByKey(
                    key
                )[0];

            let record;

            if (existing) {
                const nextWeight =
                    existing.weight +
                    1;

                const nextConfidence =
                    (
                        existing.confidence *
                            existing.weight +
                        confidence
                    ) /
                    nextWeight;

                existing.update({
                    confidence:
                        nextConfidence,

                    weight:
                        nextWeight,

                    value: {
                        rewardAverage:
                            (
                                (
                                    existing.value
                                        ?.rewardAverage ??
                                    0
                                ) *
                                    existing.weight +
                                reward
                            ) /
                            nextWeight,

                        successCount:
                            (
                                existing.value
                                    ?.successCount ??
                                0
                            ) +
                            (
                                evaluation.correct
                                    ? 1
                                    : 0
                            )
                    },

                    updatedAt:
                        this.clock()
                });

                record =
                    existing;

                this.emit(
                    KnowledgeEvent.KNOWLEDGE_UPDATED,
                    record
                );
            }
            else {
                record =
                    this.addKnowledge({
                        type:
                            KnowledgeType.EXPERIENCE,

                        key,

                        value: {
                            rewardAverage:
                                reward,

                            successCount:
                                evaluation.correct
                                    ? 1
                                    : 0
                        },

                        confidence,
                        weight:
                            1,

                        source:
                            "learning-engine",

                        tags: [
                            state.bestBet ??
                                "unknown",

                            state.risk ??
                                "unavailable"
                        ],

                        metadata: {
                            decisionId:
                                experience.decisionId ??
                                null,

                            experienceId:
                                experience.experienceId ??
                                null
                        }
                    });
            }

            this.ingestCount++;

            this.setState(
                KnowledgeState.READY
            );

            this.emit(
                KnowledgeEvent.EXPERIENCE_INGESTED,
                record
            );

            return record;
        }
        catch (error) {
            return this.handleError(
                error,
                "ingestExperience"
            );
        }
    }

    infer(context = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        this.setState(
            KnowledgeState.INFERRING
        );

        try {
            const matchedPatterns =
                this.patterns.match(
                    context
                );

            this.emit(
                KnowledgeEvent.PATTERNS_MATCHED,
                matchedPatterns
            );

            const evaluatedRules =
                this.rules.evaluate(
                    context
                );

            this.emit(
                KnowledgeEvent.RULES_EVALUATED,
                evaluatedRules
            );

            const knowledge =
                context.query
                    ? this.base.search(
                        context.query
                    )
                    : [
                        ...this.base
                            .records
                            .values()
                    ];

            const result =
                this.inference.infer({
                    knowledge,
                    patterns:
                        matchedPatterns,
                    rules:
                        evaluatedRules,
                    minimumConfidence:
                        context.minimumConfidence ??
                        0.5
                });

            this.lastInference =
                result;

            this.inferenceCount++;

            this.setState(
                KnowledgeState.READY
            );

            this.emit(
                KnowledgeEvent.INFERENCE_COMPLETED,
                result
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "infer"
            );
        }
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            KnowledgeState.PAUSED
        );

        this.emit(
            KnowledgeEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            KnowledgeState.READY
        );

        this.emit(
            KnowledgeEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.base.clear();
        this.graph.clear();

        this.lastInference = null;
        this.lastError = null;
        this.ingestCount = 0;
        this.inferenceCount = 0;
        this.paused = false;

        this.setState(
            KnowledgeState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            KnowledgeState.ERROR
        );

        this.emit(
            KnowledgeEvent.ERROR,
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

        this.base.clear();
        this.patterns.clear();
        this.rules.clear();
        this.graph.clear();

        this.lastInference = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            KnowledgeState.DESTROYED
        );

        this.emit(
            KnowledgeEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                KNOWLEDGE_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            paused:
                this.paused,

            destroyed:
                this.destroyed,

            ingestCount:
                this.ingestCount,

            inferenceCount:
                this.inferenceCount,

            hasInference:
                Boolean(
                    this.lastInference
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            base:
                this.base.summary,

            patterns:
                this.patterns.summary,

            rules:
                this.rules.summary,

            graph:
                this.graph.summary,

            inference:
                this.inference.summary
        };
    }
}
