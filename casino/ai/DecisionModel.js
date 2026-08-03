/**
 * Baccarat Analyzer V7.0
 * casino/ai/DecisionModel.js
 */

import {
    AIAction
} from "./AIState.js";


export const DECISION_MODEL_VERSION = "7.0.0";


export default class DecisionModel {
    constructor({
        decisionId,
        action,
        bestBet = null,
        candidateBet = null,
        confidence = 0,
        score = 0,
        expectedValue = null,
        kelly = null,
        risk = null,
        fusedProbability = {},
        trend = null,
        patterns = [],
        reasons = [],
        metadata = {},
        createdAt = null
    } = {}) {
        if (
            !Object.values(
                AIAction
            ).includes(action)
        ) {
            throw new Error(
                `Unsupported AI action: ${action}`
            );
        }

        this.version =
            DECISION_MODEL_VERSION;

        this.decisionId =
            decisionId;

        this.action =
            action;

        this.bestBet =
            bestBet;

        this.candidateBet =
            candidateBet;

        this.confidence =
            confidence;

        this.score =
            score;

        this.expectedValue =
            expectedValue;

        this.kelly =
            kelly;

        this.risk =
            risk;

        this.fusedProbability = {
            ...fusedProbability
        };

        this.trend =
            trend;

        this.patterns = [
            ...patterns
        ];

        this.reasons = [
            ...reasons
        ];

        this.metadata = {
            ...metadata
        };

        this.createdAt =
            createdAt;
    }

    get shouldRecommend() {
        return (
            this.action ===
            AIAction.RECOMMEND
        );
    }

    get shouldSkip() {
        return (
            this.action ===
            AIAction.SKIP
        );
    }

    get shouldWait() {
        return (
            this.action ===
            AIAction.WAIT
        );
    }

    toJSON() {
        return {
            version:
                this.version,

            decisionId:
                this.decisionId,

            action:
                this.action,

            bestBet:
                this.bestBet,

            candidateBet:
                this.candidateBet,

            confidence:
                this.confidence,

            score:
                this.score,

            expectedValue:
                this.expectedValue,

            kelly:
                this.kelly,

            risk:
                this.risk,

            fusedProbability: {
                ...this.fusedProbability
            },

            trend:
                this.trend,

            patterns: [
                ...this.patterns
            ],

            reasons: [
                ...this.reasons
            ],

            metadata: {
                ...this.metadata
            },

            createdAt:
                this.createdAt
        };
    }
}
