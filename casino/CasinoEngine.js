/**
 * Baccarat Analyzer V6.0
 * casino/CasinoEngine.js
 *
 * High-level baccarat domain engine.
 *
 * Coordinates:
 * - Shoe lifecycle
 * - Burn lifecycle
 * - Round lifecycle
 * - Dealer / draw rules
 * - Round result
 * - Engine state
 *
 * Existing project modules are injected through factories/adapters so this
 * engine does not hard-code a specific Shoe, Dealer, or Round implementation.
 */

export const CASINO_ENGINE_VERSION = "6.0.0";

export const CasinoEngineState = Object.freeze({
    IDLE: "idle",
    INITIALIZING: "initializing",
    READY: "ready",
    ROUND_ACTIVE: "round-active",
    ROUND_COMPLETE: "round-complete",
    SHOE_COMPLETE: "shoe-complete",
    STOPPED: "stopped",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const CasinoEngineEvent = Object.freeze({
    STATE_CHANGE: "casino-engine:state-change",
    SHOE_CREATED: "casino-engine:shoe-created",
    SHOE_BURNED: "casino-engine:shoe-burned",
    ROUND_STARTED: "casino-engine:round-started",
    CARD_DRAWN: "casino-engine:card-drawn",
    ROUND_COMPLETED: "casino-engine:round-completed",
    SHOE_COMPLETED: "casino-engine:shoe-completed",
    RESET: "casino-engine:reset",
    ERROR: "casino-engine:error",
    DESTROYED: "casino-engine:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

function cloneValue(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    if (
        typeof structuredClone ===
            "function"
    ) {
        try {
            return structuredClone(
                value
            );
        }
        catch {
            // Fall through.
        }
    }

    if (isFunction(value.toJSON)) {
        return cloneValue(
            value.toJSON()
        );
    }

    try {
        return JSON.parse(
            JSON.stringify(value)
        );
    }
    catch {
        return value;
    }
}

export default class CasinoEngine {
    constructor({
        shoeFactory,
        roundFactory,
        burnFactory = null,
        dealer = null,
        resultFactory = null,
        eventBus = null,
        clock = () => Date.now(),
        options = {}
    } = {}) {
        if (!isFunction(shoeFactory)) {
            throw new TypeError(
                "CasinoEngine requires shoeFactory()."
            );
        }

        if (!isFunction(roundFactory)) {
            throw new TypeError(
                "CasinoEngine requires roundFactory()."
            );
        }

        if (
            burnFactory !== null &&
            !isFunction(burnFactory)
        ) {
            throw new TypeError(
                "burnFactory must be a function."
            );
        }

        if (
            resultFactory !== null &&
            !isFunction(resultFactory)
        ) {
            throw new TypeError(
                "resultFactory must be a function."
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

        this.shoeFactory = shoeFactory;
        this.roundFactory = roundFactory;
        this.burnFactory = burnFactory;
        this.dealer = dealer;
        this.resultFactory = resultFactory;
        this.eventBus = eventBus;
        this.clock = clock;

        this.options = {
            deckCount:
                options.deckCount ??
                8,

            autoBurn:
                options.autoBurn ??
                true,

            minimumCards:
                options.minimumCards ??
                6,

            autoCompleteShoe:
                options.autoCompleteShoe ??
                true
        };

        this.state =
            CasinoEngineState.IDLE;

        this.previousState = null;

        this.shoe = null;
        this.burn = null;
        this.currentRound = null;
        this.lastRound = null;
        this.lastResult = null;

        this.shoeNumber = 0;
        this.roundNumber = 0;
        this.completedRounds = [];
        this.startedAt = null;
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
                        "casino-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                CasinoEngineState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown CasinoEngine state: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            CasinoEngineEvent.STATE_CHANGE,
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
                "CasinoEngine has been destroyed."
            );
        }
    }

    async initialize(options = {}) {
        this.assertNotDestroyed();

        this.setState(
            CasinoEngineState.INITIALIZING
        );

        try {
            this.startedAt =
                this.clock();

            await this.createShoe(
                options
            );

            this.setState(
                CasinoEngineState.READY
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "initialize"
            );
        }
    }

    async createShoe(options = {}) {
        this.assertNotDestroyed();

        if (this.currentRound) {
            throw new Error(
                "Cannot create a new shoe while a round is active."
            );
        }

        const deckCount =
            options.deckCount ??
            this.options.deckCount;

        this.shoe =
            await this.shoeFactory({
                deckCount,
                shoeNumber:
                    this.shoeNumber + 1,
                options
            });

        if (!this.shoe) {
            throw new Error(
                "shoeFactory() returned no shoe."
            );
        }

        this.shoeNumber++;
        this.roundNumber = 0;
        this.completedRounds = [];
        this.lastRound = null;
        this.lastResult = null;

        if (
            isFunction(this.shoe.create) &&
            this.shoe.remaining === 0
        ) {
            await this.shoe.create();
        }

        if (
            isFunction(this.shoe.shuffle) &&
            options.shuffle !== false
        ) {
            await this.shoe.shuffle();
        }

        this.emit(
            CasinoEngineEvent.SHOE_CREATED,
            {
                shoeNumber:
                    this.shoeNumber,

                deckCount,

                remaining:
                    this.getRemainingCards()
            }
        );

        if (
            this.options.autoBurn &&
            options.burn !== false
        ) {
            await this.executeBurn(
                options.burnOptions ??
                {}
            );
        }

        return this.shoe;
    }

    async executeBurn(options = {}) {
        if (!this.burnFactory) {
            return null;
        }

        this.burn =
            await this.burnFactory({
                shoe:
                    this.shoe,
                options
            });

        if (
            this.burn &&
            isFunction(this.burn.execute)
        ) {
            const result =
                await this.burn.execute();

            this.emit(
                CasinoEngineEvent.SHOE_BURNED,
                {
                    result,
                    remaining:
                        this.getRemainingCards()
                }
            );

            return result;
        }

        return this.burn;
    }

    canStartRound() {
        return (
            this.state ===
                CasinoEngineState.READY ||
            this.state ===
                CasinoEngineState.ROUND_COMPLETE
        ) &&
        !this.currentRound &&
        this.getRemainingCards() >=
            this.options.minimumCards;
    }

    async startRound(input = {}) {
        this.assertNotDestroyed();

        if (!this.shoe) {
            await this.initialize();
        }

        if (!this.canStartRound()) {
            if (
                this.options.autoCompleteShoe &&
                this.getRemainingCards() <
                    this.options.minimumCards
            ) {
                this.completeShoe();

                throw new Error(
                    "Not enough cards to start a new round."
                );
            }

            throw new Error(
                `Cannot start round from state: ${this.state}`
            );
        }

        try {
            this.roundNumber++;

            this.currentRound =
                await this.roundFactory({
                    shoe:
                        this.shoe,
                    dealer:
                        this.dealer,
                    roundNumber:
                        this.roundNumber,
                    shoeNumber:
                        this.shoeNumber,
                    input
                });

            if (!this.currentRound) {
                throw new Error(
                    "roundFactory() returned no round."
                );
            }

            this.setState(
                CasinoEngineState.ROUND_ACTIVE
            );

            this.emit(
                CasinoEngineEvent.ROUND_STARTED,
                {
                    shoeNumber:
                        this.shoeNumber,
                    roundNumber:
                        this.roundNumber,
                    input
                }
            );

            return this.currentRound;
        }
        catch (error) {
            return this.handleError(
                error,
                "startRound"
            );
        }
    }

    async drawCard(target = null) {
        this.assertNotDestroyed();

        if (
            this.state !==
                CasinoEngineState.ROUND_ACTIVE ||
            !this.currentRound
        ) {
            throw new Error(
                "No active round."
            );
        }

        let card;

        if (
            this.dealer &&
            isFunction(this.dealer.draw)
        ) {
            card =
                await this.dealer.draw({
                    shoe:
                        this.shoe,
                    round:
                        this.currentRound,
                    target
                });
        }
        else if (
            isFunction(this.currentRound.draw)
        ) {
            card =
                await this.currentRound.draw(
                    target
                );
        }
        else if (
            isFunction(this.shoe.draw)
        ) {
            card =
                await this.shoe.draw();
        }
        else {
            throw new Error(
                "No draw implementation is available."
            );
        }

        this.emit(
            CasinoEngineEvent.CARD_DRAWN,
            {
                target,
                card:
                    cloneValue(card),
                remaining:
                    this.getRemainingCards()
            }
        );

        return card;
    }

    async completeRound(input = {}) {
        this.assertNotDestroyed();

        if (
            this.state !==
                CasinoEngineState.ROUND_ACTIVE ||
            !this.currentRound
        ) {
            throw new Error(
                "No active round to complete."
            );
        }

        try {
            let rawResult;

            if (
                isFunction(
                    this.currentRound.complete
                )
            ) {
                rawResult =
                    await this.currentRound.complete(
                        input
                    );
            }
            else if (
                this.dealer &&
                isFunction(
                    this.dealer.completeRound
                )
            ) {
                rawResult =
                    await this.dealer.completeRound({
                        round:
                            this.currentRound,
                        shoe:
                            this.shoe,
                        input
                    });
            }
            else {
                rawResult = {
                    ...input
                };
            }

            const result =
                this.resultFactory
                    ? await this.resultFactory({
                        rawResult,
                        round:
                            this.currentRound,
                        shoe:
                            this.shoe,
                        shoeNumber:
                            this.shoeNumber,
                        roundNumber:
                            this.roundNumber
                    })
                    : rawResult;

            const completedRound =
                this.currentRound;

            this.currentRound = null;
            this.lastRound =
                completedRound;
            this.lastResult =
                result;

            this.completedRounds.push({
                shoeNumber:
                    this.shoeNumber,
                roundNumber:
                    this.roundNumber,
                result:
                    cloneValue(result)
            });

            this.setState(
                CasinoEngineState.ROUND_COMPLETE
            );

            this.emit(
                CasinoEngineEvent.ROUND_COMPLETED,
                {
                    shoeNumber:
                        this.shoeNumber,
                    roundNumber:
                        this.roundNumber,
                    result:
                        cloneValue(result),
                    remaining:
                        this.getRemainingCards()
                }
            );

            if (
                this.options.autoCompleteShoe &&
                this.getRemainingCards() <
                    this.options.minimumCards
            ) {
                this.completeShoe();
            }
            else {
                this.setState(
                    CasinoEngineState.READY
                );
            }

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "completeRound"
            );
        }
    }

    completeShoe() {
        this.currentRound = null;

        this.setState(
            CasinoEngineState.SHOE_COMPLETE
        );

        this.emit(
            CasinoEngineEvent.SHOE_COMPLETED,
            {
                shoeNumber:
                    this.shoeNumber,
                roundCount:
                    this.completedRounds.length,
                remaining:
                    this.getRemainingCards()
            }
        );

        return this.summary;
    }

    async reset(options = {}) {
        this.assertNotDestroyed();

        this.currentRound = null;
        this.lastRound = null;
        this.lastResult = null;
        this.completedRounds = [];

        await this.createShoe(
            options
        );

        this.setState(
            CasinoEngineState.READY
        );

        this.emit(
            CasinoEngineEvent.RESET,
            this.summary
        );

        return this.summary;
    }

    async stop() {
        this.assertNotDestroyed();

        this.currentRound = null;

        this.setState(
            CasinoEngineState.STOPPED
        );

        return this.summary;
    }

    handleError(error, phase) {
        this.lastError = error;

        this.setState(
            CasinoEngineState.ERROR
        );

        this.emit(
            CasinoEngineEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    getRemainingCards() {
        if (!this.shoe) {
            return 0;
        }

        if (
            Number.isFinite(
                this.shoe.remaining
            )
        ) {
            return this.shoe.remaining;
        }

        if (
            Array.isArray(
                this.shoe.cards
            )
        ) {
            return this.shoe.cards.length;
        }

        return 0;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.currentRound
            ?.destroy
            ?.();

        this.shoe
            ?.destroy
            ?.();

        this.dealer
            ?.destroy
            ?.();

        this.currentRound = null;
        this.shoe = null;
        this.burn = null;
        this.destroyed = true;

        this.setState(
            CasinoEngineState.DESTROYED
        );

        this.emit(
            CasinoEngineEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                CASINO_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            startedAt:
                this.startedAt,

            shoeNumber:
                this.shoeNumber,

            roundNumber:
                this.roundNumber,

            completedRoundCount:
                this.completedRounds.length,

            remainingCards:
                this.getRemainingCards(),

            hasShoe:
                Boolean(this.shoe),

            hasActiveRound:
                Boolean(
                    this.currentRound
                ),

            hasLastResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            options: {
                ...this.options
            }
        };
    }
}
