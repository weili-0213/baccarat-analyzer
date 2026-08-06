/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/FeedbackRouter.js
 * Purpose: Routes normalized feedback to prediction, decision, strategy, adaptive and simulation targets.
 */
export const FEEDBACK_ROUTER_VERSION = "9.9.0";

export default class FeedbackRouter {
    route({
        executionFeedback = {},
        performance = {},
        input = {}
    } = {}) {
        const common = {
            correct: executionFeedback.correct,
            profit: executionFeedback.profit,
            roi: performance.roi,
            quality: performance.quality,
            reward: performance.reward
        };

        return {
            prediction: {
                ...common,
                predictedOutcome:
                    input.prediction?.predictedOutcome ??
                    null,
                actualOutcome:
                    executionFeedback.winner
            },
            decision: {
                ...common,
                bestBet:
                    input.decision?.recommendation?.bestBet ??
                    input.decision?.bestBet ??
                    null,
                actualOutcome:
                    executionFeedback.winner
            },
            strategy: {
                ...common,
                strategyId:
                    input.strategy?.selection?.strategy?.strategyId ??
                    input.strategy?.plan?.strategyId ??
                    null
            },
            adaptive: {
                ...common,
                severeNegative:
                    performance.severeNegative,
                positive:
                    performance.positive
            },
            simulation: {
                ...common,
                sourceCount:
                    input.simulation?.merged?.sourceCount ??
                    input.simulation?.sourceCount ??
                    0
            }
        };
    }

    get summary() {
        return {
            version: FEEDBACK_ROUTER_VERSION
        };
    }
}
