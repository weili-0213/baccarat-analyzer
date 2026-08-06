/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/createAIClosedLoopIntelligenceSystem.js
 * Purpose: Factory for the V10.0 AI Closed-Loop Intelligence System.
 */
import {
    ClosedLoopState
} from "./ClosedLoopState.js";

import ClosedLoopStageGateway
    from "./ClosedLoopStageGateway.js";

import ClosedLoopPipeline
    from "./ClosedLoopPipeline.js";

import AIClosedLoopIntelligenceSystem
    from "./AIClosedLoopIntelligenceSystem.js";


export const AI_CLOSED_LOOP_INTELLIGENCE_SYSTEM_FACTORY_VERSION = "10.0.0";


export default function createAIClosedLoopIntelligenceSystem({
    simulation,
    prediction,
    decision,
    strategy,
    execution,
    feedback,
    learning,
    adaptive,
    observationCollector = null,
    checkpointStore = null,
    history = null,
    eventBus = null,
    clock = () => Date.now()
} = {}) {
    const pipeline =
        new ClosedLoopPipeline({
            stages: [
                {
                    stageId:
                        "simulation",
                    state:
                        ClosedLoopState.SIMULATING,
                    outputKey:
                        "simulation",
                    order:
                        1,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "simulation",
                            target:
                                simulation,
                            method:
                                "simulate"
                        }),
                    input({
                        context
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                ...context.observation
                            }
                        };
                    }
                },
                {
                    stageId:
                        "prediction",
                    state:
                        ClosedLoopState.PREDICTING,
                    outputKey:
                        "prediction",
                    order:
                        2,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "prediction",
                            target:
                                prediction,
                            method:
                                "predict"
                        }),
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                simulation:
                                    outputs.simulation
                            }
                        };
                    }
                },
                {
                    stageId:
                        "decision",
                    state:
                        ClosedLoopState.DECIDING,
                    outputKey:
                        "decision",
                    order:
                        3,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "decision",
                            target:
                                decision,
                            method:
                                "analyze"
                        }),
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                simulation:
                                    outputs.simulation,
                                prediction:
                                    outputs.prediction
                            }
                        };
                    }
                },
                {
                    stageId:
                        "strategy",
                    state:
                        ClosedLoopState.STRATEGIZING,
                    outputKey:
                        "strategy",
                    order:
                        4,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "strategy",
                            target:
                                strategy,
                            method:
                                "strategize"
                        }),
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                simulation:
                                    outputs.simulation,
                                prediction:
                                    outputs.prediction,
                                decision:
                                    outputs.decision
                            }
                        };
                    }
                },
                {
                    stageId:
                        "execution",
                    state:
                        ClosedLoopState.EXECUTING,
                    outputKey:
                        "execution",
                    order:
                        5,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "execution",
                            target:
                                execution,
                            method:
                                "execute"
                        }),
                    shouldRun({
                        outputs
                    }) {
                        return Boolean(
                            outputs.strategy?.plan
                        );
                    },
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                strategy:
                                    outputs.strategy,
                                betPlan:
                                    outputs.strategy?.plan
                            }
                        };
                    }
                },
                {
                    stageId:
                        "feedback",
                    state:
                        ClosedLoopState.FEEDBACK,
                    outputKey:
                        "feedback",
                    order:
                        6,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "feedback",
                            target:
                                feedback,
                            method:
                                "feedback"
                        }),
                    shouldRun({
                        context,
                        outputs
                    }) {
                        return Boolean(
                            outputs.execution &&
                            context.actualOutcome
                        );
                    },
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                execution:
                                    outputs.execution,
                                actualOutcome:
                                    context.actualOutcome,
                                simulation:
                                    outputs.simulation,
                                prediction:
                                    outputs.prediction,
                                decision:
                                    outputs.decision,
                                strategy:
                                    outputs.strategy
                            }
                        };
                    }
                },
                {
                    stageId:
                        "learning",
                    state:
                        ClosedLoopState.LEARNING,
                    outputKey:
                        "learning",
                    order:
                        7,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "learning",
                            target:
                                learning,
                            method:
                                "learn"
                        }),
                    shouldRun({
                        context
                    }) {
                        return Boolean(
                            context.actualOutcome
                        );
                    },
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                simulation:
                                    outputs.simulation,
                                prediction:
                                    outputs.prediction,
                                decision:
                                    outputs.decision,
                                actualOutcome:
                                    context.actualOutcome
                            }
                        };
                    }
                },
                {
                    stageId:
                        "adaptive",
                    state:
                        ClosedLoopState.ADAPTING,
                    outputKey:
                        "adaptive",
                    order:
                        8,
                    gateway:
                        new ClosedLoopStageGateway({
                            stageId:
                                "adaptive",
                            target:
                                adaptive,
                            method:
                                "adapt"
                        }),
                    shouldRun({
                        outputs
                    }) {
                        return Boolean(
                            outputs.learning
                        );
                    },
                    input({
                        context,
                        outputs
                    }) {
                        return {
                            context: {
                                ...context.snapshot(),
                                learning:
                                    outputs.learning
                            }
                        };
                    }
                }
            ]
        });

    return new AIClosedLoopIntelligenceSystem({
        pipeline,
        observationCollector,
        checkpointStore,
        history,
        eventBus,
        clock
    });
}
