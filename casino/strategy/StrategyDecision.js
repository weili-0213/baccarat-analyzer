/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyDecision.js
 */

import {
    StrategyAction
} from "./StrategyState.js";


export const STRATEGY_DECISION_VERSION = "6.9.0";


export default class StrategyDecision {
    constructor({
        decisionId,
        action,
        betType = null,
        amount = null,
        bankrollFraction = null,
        expectedValue = null,
        kelly = null,
        confidence = null,
        risk = null,
        reason = null,
        reasons = [],
        matchedRules = [],
        metadata = {},
        createdAt = null
    } = {}) {
        if (
            !Object.values(
                StrategyAction
            ).includes(action)
        ) {
            throw new Error(
                `Unsupported strategy action: ${action}`
            );
        }

        this.version =
            STRATEGY_DECISION_VERSION;

        this.decisionId =
            decisionId;

        this.action =
            action;

        this.betType =
            betType;

        this.amount =
            amount;

        this.bankrollFraction =
            bankrollFraction;

        this.expectedValue =
            expectedValue;

        this.kelly =
            kelly;

        this.confidence =
            confidence;

        this.risk =
            risk;

        this.reason =
            reason;

        this.reasons = [
            ...reasons
        ];

        this.matchedRules = [
            ...matchedRules
        ];

        this.metadata = {
            ...metadata
        };

        this.createdAt =
            createdAt;
    }

    get shouldBet() {
        return (
            this.action ===
            StrategyAction.BET
        );
    }

    get shouldSkip() {
        return (
            this.action ===
            StrategyAction.SKIP
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

            betType:
                this.betType,

            amount:
                this.amount,

            bankrollFraction:
                this.bankrollFraction,

            expectedValue:
                this.expectedValue,

            kelly:
                this.kelly,

            confidence:
                this.confidence,

            risk:
                this.risk,

            reason:
                this.reason,

            reasons: [
                ...this.reasons
            ],

            matchedRules: [
                ...this.matchedRules
            ],

            metadata: {
                ...this.metadata
            },

            createdAt:
                this.createdAt
        };
    }
}
