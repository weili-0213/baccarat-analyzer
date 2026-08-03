/**
 * Baccarat Analyzer V6.1
 * casino/dealer/DealerEngine.js
 *
 * Executes baccarat dealing flow:
 * - initial four-card deal
 * - natural 8/9
 * - Player third-card rule
 * - Banker third-card rule
 * - round completion
 *
 * Existing Hand / Rule implementations are injected through factories
 * and rule callbacks.
 */

export const DEALER_ENGINE_VERSION = "6.1.0";

export const DealerState = Object.freeze({
    IDLE: "idle",
    DEALING_INITIAL: "dealing-initial",
    CHECKING_NATURAL: "checking-natural",
    PLAYER_DECISION: "player-decision",
    BANKER_DECISION: "banker-decision",
    COMPLETED: "completed",
    ERROR: "error",
    DESTROYED: "destroyed"
});

export const DealerEvent = Object.freeze({
    STATE_CHANGE: "dealer:state-change",
    INITIAL_DEAL_STARTED: "dealer:initial-deal-started",
    CARD_DEALT: "dealer:card-dealt",
    NATURAL_FOUND: "dealer:natural-found",
    PLAYER_STOOD: "dealer:player-stood",
    PLAYER_DREW: "dealer:player-drew",
    BANKER_STOOD: "dealer:banker-stood",
    BANKER_DREW: "dealer:banker-drew",
    ROUND_COMPLETED: "dealer:round-completed",
    ERROR: "dealer:error",
    DESTROYED: "dealer:destroyed"
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
        typeof structuredClone === "function"
    ) {
        try {
            return structuredClone(value);
        }
        catch {
            // Fall through.
        }
    }

    if (isFunction(value.toJSON)) {
        return cloneValue(value.toJSON());
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

function getHandValue(hand) {
    if (
        hand &&
        Number.isFinite(hand.value)
    ) {
        return hand.value;
    }

    if (
        hand &&
        isFunction(hand.getValue)
    ) {
        return hand.getValue();
    }

    throw new Error(
        "Hand value is unavailable."
    );
}

function getHandCards(hand) {
    if (
        hand &&
        isFunction(hand.getCards)
    ) {
        return hand.getCards();
    }

    if (
        hand &&
        Array.isArray(hand.cards)
    ) {
        return [...hand.cards];
    }

    return [];
}

export default class DealerEngine {
    constructor({
        handFactory,
        playerRule,
        bankerRule,
        resultResolver,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        if (!isFunction(handFactory)) {
            throw new TypeError(
                "DealerEngine requires handFactory()."
            );
        }

        if (!isFunction(playerRule)) {
            throw new TypeError(
                "DealerEngine requires playerRule()."
            );
        }

        if (!isFunction(bankerRule)) {
            throw new TypeError(
                "DealerEngine requires bankerRule()."
            );
        }

        if (!isFunction(resultResolver)) {
            throw new TypeError(
                "DealerEngine requires resultResolver()."
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

        this.handFactory = handFactory;
        this.playerRule = playerRule;
        this.bankerRule = bankerRule;
        this.resultResolver = resultResolver;
        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            DealerState.IDLE;

        this.previousState = null;
        this.playerHand = null;
        this.bankerHand = null;
        this.timeline = [];
        this.lastResult = null;
        this.lastError = null;
        this.startedAt = null;
        this.completedAt = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "dealer-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                DealerState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown DealerState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.emit(
            DealerEvent.STATE_CHANGE,
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
                "DealerEngine has been destroyed."
            );
        }
    }

    createHands() {
        this.playerHand =
            this.handFactory({
                side: "player"
            });

        this.bankerHand =
            this.handFactory({
                side: "banker"
            });

        if (
            !this.playerHand ||
            !this.bankerHand
        ) {
            throw new Error(
                "handFactory() returned no hand."
            );
        }

        return this;
    }

    record(action, payload = {}) {
        const entry = {
            index:
                this.timeline.length + 1,

            action,

            timestamp:
                this.clock(),

            ...cloneValue(payload)
        };

        this.timeline.push(entry);

        return entry;
    }

    async dealCard({
        shoe,
        side,
        position,
        draw = null
    }) {
        if (!shoe) {
            throw new TypeError(
                "DealerEngine requires a shoe."
            );
        }

        const hand =
            side === "player"
                ? this.playerHand
                : this.bankerHand;

        let card;

        if (isFunction(draw)) {
            card =
                await draw({
                    shoe,
                    side,
                    position,
                    hand
                });
        }
        else if (isFunction(shoe.draw)) {
            card =
                await shoe.draw();
        }
        else {
            throw new Error(
                "Shoe draw() is unavailable."
            );
        }

        if (!card) {
            throw new Error(
                `No card returned for ${side}.`
            );
        }

        if (isFunction(hand.add)) {
            hand.add(card);
        }
        else if (Array.isArray(hand.cards)) {
            hand.cards.push(card);
        }
        else {
            throw new Error(
                "Hand add() is unavailable."
            );
        }

        const entry =
            this.record(
                "card-dealt",
                {
                    side,
                    position,
                    card:
                        cloneValue(card),
                    value:
                        getHandValue(hand)
                }
            );

        this.emit(
            DealerEvent.CARD_DEALT,
            entry
        );

        return card;
    }

    async dealInitial({
        shoe,
        draw = null
    } = {}) {
        this.assertNotDestroyed();

        this.createHands();
        this.timeline = [];
        this.lastResult = null;
        this.lastError = null;
        this.startedAt =
            this.clock();
        this.completedAt = null;

        this.setState(
            DealerState.DEALING_INITIAL
        );

        this.emit(
            DealerEvent.INITIAL_DEAL_STARTED,
            {
                remaining:
                    shoe?.remaining ??
                    shoe?.cards?.length ??
                    null
            }
        );

        await this.dealCard({
            shoe,
            draw,
            side: "player",
            position: 1
        });

        await this.dealCard({
            shoe,
            draw,
            side: "banker",
            position: 1
        });

        await this.dealCard({
            shoe,
            draw,
            side: "player",
            position: 2
        });

        await this.dealCard({
            shoe,
            draw,
            side: "banker",
            position: 2
        });

        return {
            playerHand:
                this.playerHand,
            bankerHand:
                this.bankerHand
        };
    }

    isNatural() {
        const playerValue =
            getHandValue(
                this.playerHand
            );

        const bankerValue =
            getHandValue(
                this.bankerHand
            );

        return (
            playerValue >= 8 ||
            bankerValue >= 8
        );
    }

    async run({
        shoe,
        draw = null,
        context = {}
    } = {}) {
        this.assertNotDestroyed();

        try {
            await this.dealInitial({
                shoe,
                draw
            });

            this.setState(
                DealerState.CHECKING_NATURAL
            );

            if (this.isNatural()) {
                this.record(
                    "natural",
                    {
                        playerValue:
                            getHandValue(
                                this.playerHand
                            ),

                        bankerValue:
                            getHandValue(
                                this.bankerHand
                            )
                    }
                );

                this.emit(
                    DealerEvent.NATURAL_FOUND,
                    {
                        playerValue:
                            getHandValue(
                                this.playerHand
                            ),

                        bankerValue:
                            getHandValue(
                                this.bankerHand
                            )
                    }
                );

                return this.complete({
                    context,
                    reason:
                        "natural"
                });
            }

            this.setState(
                DealerState.PLAYER_DECISION
            );

            const playerDecision =
                await this.playerRule({
                    hand:
                        this.playerHand,
                    bankerHand:
                        this.bankerHand,
                    context
                });

            let playerThirdCard = null;

            if (playerDecision?.draw) {
                playerThirdCard =
                    await this.dealCard({
                        shoe,
                        draw,
                        side: "player",
                        position: 3
                    });

                this.record(
                    "player-draw",
                    {
                        card:
                            cloneValue(
                                playerThirdCard
                            )
                    }
                );

                this.emit(
                    DealerEvent.PLAYER_DREW,
                    {
                        card:
                            cloneValue(
                                playerThirdCard
                            )
                    }
                );
            }
            else {
                this.record(
                    "player-stand",
                    {
                        reason:
                            playerDecision
                                ?.reason ??
                            null
                    }
                );

                this.emit(
                    DealerEvent.PLAYER_STOOD,
                    {
                        reason:
                            playerDecision
                                ?.reason ??
                            null
                    }
                );
            }

            this.setState(
                DealerState.BANKER_DECISION
            );

            const bankerDecision =
                await this.bankerRule({
                    hand:
                        this.bankerHand,
                    playerHand:
                        this.playerHand,
                    playerThirdCard,
                    context
                });

            if (bankerDecision?.draw) {
                const bankerThirdCard =
                    await this.dealCard({
                        shoe,
                        draw,
                        side: "banker",
                        position: 3
                    });

                this.record(
                    "banker-draw",
                    {
                        card:
                            cloneValue(
                                bankerThirdCard
                            )
                    }
                );

                this.emit(
                    DealerEvent.BANKER_DREW,
                    {
                        card:
                            cloneValue(
                                bankerThirdCard
                            )
                    }
                );
            }
            else {
                this.record(
                    "banker-stand",
                    {
                        reason:
                            bankerDecision
                                ?.reason ??
                            null
                    }
                );

                this.emit(
                    DealerEvent.BANKER_STOOD,
                    {
                        reason:
                            bankerDecision
                                ?.reason ??
                            null
                    }
                );
            }

            return this.complete({
                context,
                reason:
                    "rules-complete"
            });
        }
        catch (error) {
            return this.handleError(
                error,
                "run"
            );
        }
    }

    async complete({
        context = {},
        reason = "complete"
    } = {}) {
        const result =
            await this.resultResolver({
                playerHand:
                    this.playerHand,
                bankerHand:
                    this.bankerHand,
                context,
                reason,
                timeline:
                    cloneValue(
                        this.timeline
                    )
            });

        this.lastResult =
            result;

        this.completedAt =
            this.clock();

        this.record(
            "round-complete",
            {
                reason,
                result:
                    cloneValue(result)
            }
        );

        this.setState(
            DealerState.COMPLETED
        );

        this.emit(
            DealerEvent.ROUND_COMPLETED,
            {
                result:
                    cloneValue(result),
                timeline:
                    cloneValue(
                        this.timeline
                    )
            }
        );

        return result;
    }

    reset() {
        this.playerHand = null;
        this.bankerHand = null;
        this.timeline = [];
        this.lastResult = null;
        this.lastError = null;
        this.startedAt = null;
        this.completedAt = null;

        this.setState(
            DealerState.IDLE
        );

        return this;
    }

    handleError(error, phase) {
        this.lastError = error;

        this.setState(
            DealerState.ERROR
        );

        this.emit(
            DealerEvent.ERROR,
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

        this.playerHand
            ?.destroy
            ?.();

        this.bankerHand
            ?.destroy
            ?.();

        this.playerHand = null;
        this.bankerHand = null;
        this.timeline = [];
        this.lastResult = null;
        this.destroyed = true;

        this.setState(
            DealerState.DESTROYED
        );

        this.emit(
            DealerEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                DEALER_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            startedAt:
                this.startedAt,

            completedAt:
                this.completedAt,

            playerValue:
                this.playerHand
                    ? getHandValue(
                        this.playerHand
                    )
                    : null,

            bankerValue:
                this.bankerHand
                    ? getHandValue(
                        this.bankerHand
                    )
                    : null,

            playerCardCount:
                this.playerHand
                    ? getHandCards(
                        this.playerHand
                    ).length
                    : 0,

            bankerCardCount:
                this.bankerHand
                    ? getHandCards(
                        this.bankerHand
                    ).length
                    : 0,

            timelineCount:
                this.timeline.length,

            hasResult:
                Boolean(
                    this.lastResult
                ),

            lastError:
                this.lastError
                    ?.message ??
                null
        };
    }
}
