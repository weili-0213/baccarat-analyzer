/**
 * Baccarat Analyzer V6.8
 * casino/bet/BetEngine.js
 *
 * Handles bet creation, cancellation, settlement and bankroll updates.
 */

import {
    BetState,
    BetStatus,
    BetType
} from "./BetState.js";

import BetHistory
    from "./BetHistory.js";

import Bankroll
    from "./Bankroll.js";

import PayoutResolver
    from "./PayoutResolver.js";


export const BET_ENGINE_VERSION = "6.8.0";

export const BetEvent = Object.freeze({
    STATE_CHANGE: "bet-engine:state-change",
    CREATED: "bet-engine:created",
    CANCELLED: "bet-engine:cancelled",
    VOIDED: "bet-engine:voided",
    SETTLEMENT_STARTED: "bet-engine:settlement-started",
    SETTLED: "bet-engine:settled",
    BANKROLL_UPDATED: "bet-engine:bankroll-updated",
    ERROR: "bet-engine:error",
    DESTROYED: "bet-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class BetEngine {
    constructor({
        bankroll = null,
        payoutResolver = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null,
        limits = {}
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

        this.bankroll =
            bankroll ??
            new Bankroll({
                balance:
                    0
            });

        this.payoutResolver =
            payoutResolver ??
            new PayoutResolver();

        this.history =
            history ??
            new BetHistory();

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
                    `bet-${timestamp}-${sequence}`
            );

        this.limits = {
            minimum:
                limits.minimum ??
                1,

            maximum:
                limits.maximum ??
                Number.POSITIVE_INFINITY
        };

        this.state =
            BetState.IDLE;

        this.previousState = null;
        this.openBets = new Map();
        this.lastBet = null;
        this.lastSettlement = null;
        this.lastError = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "bet-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                BetState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown BetState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;
        this.state =
            state;

        this.emit(
            BetEvent.STATE_CHANGE,
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
                "BetEngine has been destroyed."
            );
        }
    }

    validateBet({
        betType,
        amount,
        roundId
    }) {
        if (
            !Object.values(BetType)
                .includes(betType)
        ) {
            throw new Error(
                `Unsupported bet type: ${betType}`
            );
        }

        if (
            !Number.isFinite(amount) ||
            amount <
                this.limits.minimum ||
            amount >
                this.limits.maximum
        ) {
            throw new RangeError(
                "Bet amount is outside configured limits."
            );
        }

        if (
            typeof roundId !== "string" ||
            roundId.length === 0
        ) {
            throw new TypeError(
                "roundId is required."
            );
        }
    }

    createBet({
        roundId,
        betType,
        amount,
        odds = null,
        expectedValue = null,
        kelly = null,
        confidence = null,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        this.validateBet({
            roundId,
            betType,
            amount
        });

        this.bankroll.reserve(
            amount
        );

        this.sequence++;

        const createdAt =
            this.clock();

        const betId =
            this.idFactory({
                sequence:
                    this.sequence,
                timestamp:
                    createdAt
            });

        const bet = {
            version:
                BET_ENGINE_VERSION,

            betId,
            roundId,
            betType,
            amount,

            odds:
                odds ??
                this.payoutResolver
                    .payouts[betType] ??
                null,

            expectedValue,
            kelly,
            confidence,

            status:
                BetStatus.PENDING,

            createdAt,
            settledAt:
                null,

            returnAmount:
                null,

            profit:
                null,

            metadata: {
                ...metadata
            }
        };

        this.openBets.set(
            betId,
            bet
        );

        this.lastBet =
            bet;

        this.setState(
            BetState.OPEN
        );

        this.emit(
            BetEvent.CREATED,
            bet
        );

        this.emit(
            BetEvent.BANKROLL_UPDATED,
            this.bankroll.summary
        );

        return bet;
    }

    createFromRecommendation({
        roundId,
        recommendation,
        amount = null,
        bankrollFraction = null,
        metadata = {}
    } = {}) {
        if (!recommendation) {
            throw new TypeError(
                "recommendation is required."
            );
        }

        const betType =
            recommendation.bestBet ??
            recommendation.betType ??
            null;

        const resolvedAmount =
            amount ??
            (
                Number.isFinite(
                    bankrollFraction
                )
                    ? this.bankroll.available *
                        bankrollFraction
                    : null
            );

        return this.createBet({
            roundId,
            betType,
            amount:
                resolvedAmount,

            expectedValue:
                recommendation.expectedValue ??
                recommendation.ev ??
                null,

            kelly:
                recommendation.kelly ??
                null,

            confidence:
                recommendation.confidence ??
                null,

            metadata: {
                source:
                    "recommendation",
                ...metadata
            }
        });
    }

    cancelBet(
        betId,
        reason = "cancelled"
    ) {
        this.assertNotDestroyed();

        const bet =
            this.openBets.get(
                betId
            );

        if (!bet) {
            return false;
        }

        this.bankroll.release(
            bet.amount
        );

        bet.status =
            BetStatus.CANCELLED;

        bet.settledAt =
            this.clock();

        bet.returnAmount =
            bet.amount;

        bet.profit =
            0;

        bet.reason =
            reason;

        this.openBets.delete(
            betId
        );

        this.history.add({
            ...bet
        });

        this.lastSettlement =
            bet;

        this.setState(
            BetState.CANCELLED
        );

        this.emit(
            BetEvent.CANCELLED,
            bet
        );

        this.emit(
            BetEvent.BANKROLL_UPDATED,
            this.bankroll.summary
        );

        return bet;
    }

    voidBet(
        betId,
        reason = "voided"
    ) {
        this.assertNotDestroyed();

        const bet =
            this.openBets.get(
                betId
            );

        if (!bet) {
            return false;
        }

        this.bankroll.release(
            bet.amount
        );

        bet.status =
            BetStatus.VOIDED;

        bet.settledAt =
            this.clock();

        bet.returnAmount =
            bet.amount;

        bet.profit =
            0;

        bet.reason =
            reason;

        this.openBets.delete(
            betId
        );

        this.history.add({
            ...bet
        });

        this.lastSettlement =
            bet;

        this.setState(
            BetState.VOIDED
        );

        this.emit(
            BetEvent.VOIDED,
            bet
        );

        this.emit(
            BetEvent.BANKROLL_UPDATED,
            this.bankroll.summary
        );

        return bet;
    }

    settleBet(
        betId,
        result = {}
    ) {
        this.assertNotDestroyed();

        const bet =
            this.openBets.get(
                betId
            );

        if (!bet) {
            throw new Error(
                `Open bet was not found: ${betId}`
            );
        }

        this.setState(
            BetState.SETTLING
        );

        this.emit(
            BetEvent.SETTLEMENT_STARTED,
            {
                betId,
                result
            }
        );

        try {
            const settlement =
                this.payoutResolver
                    .resolve({
                        betType:
                            bet.betType,
                        amount:
                            bet.amount,
                        result
                    });

            const bankrollResult =
                this.bankroll.settle({
                    stake:
                        bet.amount,
                    returnAmount:
                        settlement.returnAmount
                });

            bet.status =
                settlement.status;

            bet.settledAt =
                this.clock();

            bet.returnAmount =
                settlement.returnAmount;

            bet.profit =
                settlement.profit;

            bet.result =
                result;

            this.openBets.delete(
                betId
            );

            this.history.add({
                ...bet
            });

            this.lastSettlement =
                bet;

            this.setState(
                BetState.SETTLED
            );

            this.emit(
                BetEvent.SETTLED,
                bet
            );

            this.emit(
                BetEvent.BANKROLL_UPDATED,
                bankrollResult.summary
            );

            return bet;
        }
        catch (error) {
            return this.handleError(
                error,
                "settleBet"
            );
        }
    }

    settleRound(
        roundId,
        result = {}
    ) {
        const settled = [];

        for (
            const [betId, bet] of
            [
                ...this.openBets.entries()
            ]
        ) {
            if (
                bet.roundId ===
                roundId
            ) {
                settled.push(
                    this.settleBet(
                        betId,
                        result
                    )
                );
            }
        }

        return settled;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            BetState.ERROR
        );

        this.emit(
            BetEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    reset({
        balance =
            this.bankroll.initialBalance
    } = {}) {
        this.assertNotDestroyed();

        this.openBets.clear();
        this.lastBet = null;
        this.lastSettlement = null;
        this.lastError = null;

        this.bankroll.reset({
            balance
        });

        this.setState(
            BetState.IDLE
        );

        return this;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        for (
            const betId of
            [
                ...this.openBets.keys()
            ]
        ) {
            this.voidBet(
                betId,
                "engine-destroyed"
            );
        }

        this.history.clear();

        this.destroyed =
            true;

        this.setState(
            BetState.DESTROYED
        );

        this.emit(
            BetEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                BET_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            openBetCount:
                this.openBets.size,

            hasLastBet:
                Boolean(
                    this.lastBet
                ),

            hasLastSettlement:
                Boolean(
                    this.lastSettlement
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            limits: {
                ...this.limits
            },

            bankroll:
                this.bankroll.summary,

            history:
                this.history.summary
        };
    }
}
