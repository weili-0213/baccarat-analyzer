/**
 * Baccarat Analyzer V6.2
 * casino/round/RoundEngine.js
 */

import {
    RoundState
} from "./RoundState.js";

import RoundResultBuilder
    from "./RoundResultBuilder.js";

import RoundHistory
    from "./RoundHistory.js";


export const ROUND_ENGINE_VERSION = "6.2.0";

export const RoundEvent = Object.freeze({
    STATE_CHANGE: "round-engine:state-change",
    STARTED: "round-engine:started",
    DEALER_COMPLETED: "round-engine:dealer-completed",
    COMPLETED: "round-engine:completed",
    CANCELLED: "round-engine:cancelled",
    ERROR: "round-engine:error",
    DESTROYED: "round-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class RoundEngine {
    constructor({
        dealer,
        resultBuilder = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (
            !dealer ||
            !isFunction(dealer.run)
        ) {
            throw new TypeError(
                "RoundEngine requires dealer.run()."
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

        this.dealer = dealer;

        this.resultBuilder =
            resultBuilder ??
            new RoundResultBuilder();

        this.history =
            history ??
            new RoundHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.sequence = 0;

        this.idFactory =
            idFactory ??
            (
                ({
                    shoeNumber,
                    roundNumber
                }) =>
                    `shoe-${shoeNumber}-round-${roundNumber}`
            );

        this.state =
            RoundState.IDLE;

        this.previousState = null;

        this.roundId = null;
        this.shoeNumber = 0;
        this.roundNumber = 0;

        this.startedAt = null;
        this.completedAt = null;

        this.metadata = {};
        this.lastDealerResult = null;
        this.lastResult = null;
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
                        "round-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                RoundState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown RoundState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            RoundEvent.STATE_CHANGE,
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
                "RoundEngine has been destroyed."
            );
        }
    }

    canStart() {
        return (
            this.state ===
                RoundState.IDLE ||
            this.state ===
                RoundState.COMPLETED ||
            this.state ===
                RoundState.CANCELLED
        );
    }

    start({
        shoeNumber,
        roundNumber,
        metadata = {}
    } = {}) {
        this.assertNotDestroyed();

        if (!this.canStart()) {
            throw new Error(
                `Cannot start round from state: ${this.state}`
            );
        }

        if (
            !Number.isInteger(
                shoeNumber
            ) ||
            shoeNumber < 1
        ) {
            throw new RangeError(
                "shoeNumber must be a positive integer."
            );
        }

        if (
            !Number.isInteger(
                roundNumber
            ) ||
            roundNumber < 1
        ) {
            throw new RangeError(
                "roundNumber must be a positive integer."
            );
        }

        this.setState(
            RoundState.STARTING
        );

        this.sequence++;
        this.shoeNumber =
            shoeNumber;
        this.roundNumber =
            roundNumber;

        this.roundId =
            this.idFactory({
                shoeNumber,
                roundNumber,
                sequence:
                    this.sequence
            });

        this.startedAt =
            this.clock();

        this.completedAt = null;
        this.metadata = {
            ...metadata
        };

        this.lastDealerResult = null;
        this.lastResult = null;
        this.lastError = null;

        this.emit(
            RoundEvent.STARTED,
            {
                roundId:
                    this.roundId,
                shoeNumber,
                roundNumber,
                metadata:
                    this.metadata
            }
        );

        return this.summary;
    }

    async run({
        shoe,
        shoeNumber,
        roundNumber,
        metadata = {},
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        try {
            this.start({
                shoeNumber,
                roundNumber,
                metadata
            });

            this.setState(
                RoundState.DEALING
            );

            const dealerResult =
                await this.dealer.run({
                    shoe,
                    context: {
                        ...context,
                        roundId:
                            this.roundId,
                        shoeNumber,
                        roundNumber,
                        metadata:
                            this.metadata
                    }
                });

            this.lastDealerResult =
                dealerResult;

            this.emit(
                RoundEvent.DEALER_COMPLETED,
                {
                    roundId:
                        this.roundId,
                    dealerResult
                }
            );

            this.setState(
                RoundState.RESOLVING
            );

            this.completedAt =
                this.clock();

            const result =
                await this.resultBuilder.build({
                    roundId:
                        this.roundId,

                    shoeNumber:
                        this.shoeNumber,

                    roundNumber:
                        this.roundNumber,

                    playerHand:
                        this.dealer
                            .playerHand,

                    bankerHand:
                        this.dealer
                            .bankerHand,

                    dealerResult,

                    startedAt:
                        this.startedAt,

                    completedAt:
                        this.completedAt,

                    metadata:
                        this.metadata
                });

            this.lastResult =
                result;

            this.history.add({
                roundId:
                    this.roundId,

                shoeNumber:
                    this.shoeNumber,

                roundNumber:
                    this.roundNumber,

                result,

                timeline:
                    [
                        ...(
                            this.dealer
                                .timeline ??
                            []
                        )
                    ]
            });

            this.setState(
                RoundState.COMPLETED
            );

            this.emit(
                RoundEvent.COMPLETED,
                {
                    result,
                    summary:
                        this.summary
                }
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "run"
            );
        }
    }

    cancel(reason = "cancelled") {
        this.assertNotDestroyed();

        if (
            this.state ===
                RoundState.COMPLETED
        ) {
            return this.summary;
        }

        this.completedAt =
            this.clock();

        this.setState(
            RoundState.CANCELLED
        );

        this.emit(
            RoundEvent.CANCELLED,
            {
                roundId:
                    this.roundId,
                reason
            }
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.dealer
            ?.reset
            ?.();

        this.roundId = null;
        this.shoeNumber = 0;
        this.roundNumber = 0;

        this.startedAt = null;
        this.completedAt = null;

        this.metadata = {};
        this.lastDealerResult = null;
        this.lastResult = null;
        this.lastError = null;

        this.setState(
            RoundState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.completedAt =
            this.clock();

        this.setState(
            RoundState.ERROR
        );

        this.emit(
            RoundEvent.ERROR,
            {
                phase,
                roundId:
                    this.roundId,
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

        this.dealer
            ?.destroy
            ?.();

        this.history.clear();

        this.roundId = null;
        this.lastResult = null;
        this.lastDealerResult = null;

        this.destroyed =
            true;

        this.setState(
            RoundState.DESTROYED
        );

        this.emit(
            RoundEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                ROUND_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            roundId:
                this.roundId,

            shoeNumber:
                this.shoeNumber,

            roundNumber:
                this.roundNumber,

            startedAt:
                this.startedAt,

            completedAt:
                this.completedAt,

            duration:
                this.startedAt !== null &&
                this.completedAt !== null
                    ? Math.max(
                        0,
                        this.completedAt -
                            this.startedAt
                    )
                    : 0,

            hasDealerResult:
                Boolean(
                    this.lastDealerResult
                ),

            hasResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            history:
                this.history.summary
        };
    }
}
