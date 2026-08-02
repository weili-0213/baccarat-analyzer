/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * Game Mock
 *
 * Dashboard 與 UI 元件測試共用的 Game Mock。
 *
 * 目的：
 *
 * - 避免每個測試各自維護一份 Game Mock
 * - 模擬 Dashboard 需要的公開 API
 * - 模擬 Shoe / Burn / History / Roadmap / Analysis 狀態
 * - 支援手動輸入牌局流程
 *
 * 注意：
 *
 * 這不是 engine/game.js 的替代品。
 * 它只用於瀏覽器測試。
 */


/**
 * Game 狀態。
 */
export const MockGameState = Object.freeze({

    WAITING_BURN_INDICATOR:
        "WAITING_BURN_INDICATOR",

    SHOE_ACTIVE:
        "SHOE_ACTIVE",

    ROUND_INPUT:
        "ROUND_INPUT",

    ANALYZING:
        "ANALYZING",

    ERROR:
        "ERROR"

});


/**
 * 手動牌局狀態。
 */
export const MockManualRoundState =
    Object.freeze({

        IDLE:
            "IDLE",

        INITIAL:
            "INITIAL",

        READY_TO_FINISH:
            "READY_TO_FINISH",

        FINISHED:
            "FINISHED"

    });


/**
 * 分析狀態。
 */
export const MockAnalysisState =
    Object.freeze({

        IDLE:
            "IDLE",

        RUNNING:
            "RUNNING",

        COMPLETED:
            "COMPLETED",

        ERROR:
            "ERROR"

    });


/**
 * Rank 對應百家樂點數。
 */
function baccaratValue(rank) {

    if (rank === "A") {

        return 1;

    }

    if (
        rank === "10" ||
        rank === "J" ||
        rank === "Q" ||
        rank === "K"
    ) {

        return 0;

    }

    return Number(rank);

}


/**
 * Suit 符號。
 */
function suitSymbol(suit) {

    return {

        S:
            "♠",

        H:
            "♥",

        D:
            "♦",

        C:
            "♣"

    }[suit] ?? suit;

}


/**
 * 建立 Card Mock。
 */
export function createMockCard({

    rank = "A",

    suit = "S",

    deck = 1

} = {}) {

    return {

        rank,

        suit,

        deck,

        deckNumber:
            deck,

        baccaratValue:
            baccaratValue(rank),

        pairValue:
            rank,

        shortName:
            `${rank}${suit}`,

        id:
            `${deck}-${suit}-${rank}`,

        equals(other) {

            return Boolean(

                other &&

                other.rank ===
                    this.rank &&

                other.suit ===
                    this.suit &&

                (
                    other.deck ??
                    other.deckNumber
                ) ===
                    (
                        this.deck ??
                        this.deckNumber
                    )

            );

        },

        toString() {

            return `${this.rank}${suitSymbol(
                this.suit
            )}`;

        },

        toJSON() {

            return {

                rank:
                    this.rank,

                suit:
                    this.suit,

                deck:
                    this.deck

            };

        }

    };

}


/**
 * 建立 History Mock。
 */
export function createMockHistory(
    initial = []
) {

    return {

        items:
            [
                ...initial
            ],

        get count() {

            return this.items.length;

        },

        get last() {

            return (

                this.items[
                    this.items.length - 1
                ] ??
                null
            );

        },

        add(result) {

            this.items.push(
                result
            );

            return result;

        },

        addAll(results = []) {

            this.items.push(
                ...results
            );

            return this;

        },

        clear() {

            this.items = [];

            return this;

        },

        all() {

            return [
                ...this.items
            ];

        },

        lastRounds(limit = 20) {

            return this.items.slice(
                -limit
            );

        },

        toJSON() {

            return {

                items:
                    this.items.map(
                        item => ({

                            ...item

                        })
                    )

            };

        }

    };

}


/**
 * 建立預設分析結果。
 */
export function createMockAnalysis({

    roundCount = 0,

    shouldBet = true,

    bet = "banker",

    amount = 300,

    confidence = 0.8

} = {}) {

    const ev = {

        player:
            -0.01,

        banker:
            0.008,

        tie:
            -0.13,

        playerPair:
            -0.04,

        bankerPair:
            -0.04,

        eitherPair:
            -0.03,

        super6:
            -0.05,

        playerNatural:
            -0.02,

        bankerNatural:
            -0.02,

        natural:
            -0.02,

        big:
            -0.01,

        small:
            -0.01,

        playerDragonBonus:
            -0.05,

        bankerDragonBonus:
            -0.05

    };

    if (
        Object.prototype
            .hasOwnProperty
            .call(
                ev,
                bet
            )
    ) {

        ev[bet] =
            shouldBet
                ? 0.008
                : -0.01;

    }


    const best = {

        key:
            bet,

        name:
            bet,

        bet,

        score:
            shouldBet
                ? 0.9
                : 0.4,

        ev:
            ev[bet] ??
            null,

        value:
            ev[bet] ??
            null,

        kelly:
            shouldBet
                ? 0.03
                : 0,

        risk:
            0.2,

        amount:
            shouldBet
                ? amount
                : 0,

        confidence

    };


    return {

        method:
            "mock",

        generatedAfterRound:
            roundCount,

        physicalRemaining:
            Math.max(
                0,
                410 -
                roundCount * 4
            ),

        probability: {

            player:
                0.44,

            banker:
                0.47,

            tie:
                0.09,

            playerPair:
                0.074,

            bankerPair:
                0.075,

            eitherPair:
                0.143,

            super6:
                0.052,

            playerNatural:
                0.16,

            bankerNatural:
                0.16,

            natural:
                0.29,

            big:
                0.75,

            small:
                0.25,

            playerDragonBonus:
                0.03,

            bankerDragonBonus:
                0.03

        },

        ev,

        kelly: {

            [bet]:
                best.kelly

        },

        risk: {

            [bet]:
                best.risk

        },

        confidence: {

            overall:
                confidence

        },

        overallConfidence:
            confidence,

        ranking: [

            best,

            {
                key:
                    bet === "banker"
                        ? "player"
                        : "banker",

                name:
                    bet === "banker"
                        ? "player"
                        : "banker",

                score:
                    0.5,

                ev:
                    -0.01,

                confidence:
                    0.6
            },

            {
                key:
                    "small",

                name:
                    "small",

                score:
                    0.4,

                ev:
                    -0.02,

                confidence:
                    0.5
            },

            {
                key:
                    "tie",

                name:
                    "tie",

                score:
                    0.1,

                ev:
                    -0.13,

                confidence:
                    0.3
            }

        ],

        best,

        shouldBet,

        recommendation: {

            shouldBet,

            key:
                shouldBet
                    ? bet
                    : null,

            name:
                shouldBet
                    ? bet
                    : null,

            bet:
                shouldBet
                    ? bet
                    : null,

            amount:
                shouldBet
                    ? amount
                    : 0,

            ev:
                shouldBet
                    ? best.ev
                    : null,

            kelly:
                shouldBet
                    ? best.kelly
                    : null,

            risk:
                shouldBet
                    ? best.risk
                    : null,

            confidence,

            reason:
                shouldBet

                    ? "目前最高排名選項具有正期望值。"

                    : "目前沒有符合條件的正期望下注。",

            message:
                shouldBet

                    ? "建議下注。"

                    : "建議觀望。"

        }

    };

}


/**
 * 建立預設空路單。
 */
export function createEmptyRoads() {

    return {

        beadRoad:
            [],

        bigRoad:
            [],

        bigEyeRoad:
            [],

        smallRoad:
            [],

        cockroachRoad:
            []

    };

}


/**
 * 計算手牌點數。
 */
function handScore(cards) {

    return cards.reduce(
        (
            total,
            card
        ) =>
            total +
            card.baccaratValue,
        0
    ) % 10;

}


/**
 * 判斷勝方。
 */
function determineWinner(
    playerScore,
    bankerScore
) {

    if (
        playerScore >
        bankerScore
    ) {

        return "Player";

    }

    if (
        bankerScore >
        playerScore
    ) {

        return "Banker";

    }

    return "Tie";

}


/**
 * 建立完整 Game Mock。
 */
export default function createGameMock({

    deckCount = 8,

    shoeNumber = 1,

    history = [],

    autoAnalyze = true,

    analysisFactory =
        createMockAnalysis,

    initialAnalysis = null

} = {}) {

    const total =
        deckCount * 52;

    const mockHistory =
        createMockHistory(
            history
        );

    const roads =
        createEmptyRoads();


    const game = {

        /**
         * 基本設定。
         */
        deckCount,

        autoAnalyze,

        analysisFactory,


        /**
         * 狀態。
         */
        state:
            MockGameState
                .WAITING_BURN_INDICATOR,

        manualState:
            MockManualRoundState
                .IDLE,

        analysisState:
            initialAnalysis
                ? MockAnalysisState
                    .COMPLETED
                : MockAnalysisState
                    .IDLE,

        error:
            null,


        /**
         * Shoe。
         */
        shoeNumber,

        shoe: {

            deckCount,

            total,

            cards:
                new Array(total)
                    .fill(null),

            discarded:
                [],

            burned:
                [],

            unknownBurnedCount:
                0,

            get remaining() {

                return game
                    .observableRemainingCards;

            },

            get observableRemaining() {

                return game
                    .observableRemainingCards;

            },

            get physicalRemaining() {

                return game
                    .remainingCards;

            },

            get used() {

                return game
                    .usedCards;

            },

            get history() {

                return [
                    ...this.discarded
                ];

            },

            get summary() {

                return {

                    deckCount:
                        this.deckCount,

                    total:
                        this.total,

                    observableRemaining:
                        this.observableRemaining,

                    physicalRemaining:
                        this.physicalRemaining,

                    unknownBurnedCount:
                        this.unknownBurnedCount,

                    used:
                        this.used

                };

            }

        },

        observableRemainingCards:
            total,

        remainingCards:
            total,

        usedCards:
            0,

        unknownBurnedCount:
            0,


        /**
         * Burn。
         */
        burnConfirmed:
            false,

        isWaitingBurnIndicator:
            true,

        burnInfo:
            null,

        burn: {

            state:
                "WAITING_INDICATOR",

            confirmed:
                false,

            isConfirmed:
                false,

            indicator:
                null,

            hiddenCount:
                0,

            totalRemoved:
                0,

            get info() {

                return game.burnInfo;

            }

        },


        /**
         * Analysis。
         */
        nextAnalysis:
            initialAnalysis,

        latestAnalysis:
            initialAnalysis,

        analysis:
            initialAnalysis,

        isAnalyzing:
            false,

        hasNextAnalysis:
            Boolean(
                initialAnalysis
            ),

        analysisError:
            null,

        analysisSummary: {

            state:
                initialAnalysis
                    ? MockAnalysisState
                        .COMPLETED
                    : MockAnalysisState
                        .IDLE,

            hasResult:
                Boolean(
                    initialAnalysis
                ),

            error:
                null

        },

        analyzer: {

            state:
                initialAnalysis
                    ? MockAnalysisState
                        .COMPLETED
                    : MockAnalysisState
                        .IDLE,

            result:
                initialAnalysis,

            lastResult:
                initialAnalysis,

            error:
                null

        },


        /**
         * History。
         */
        history:
            mockHistory,


        /**
         * Roadmap。
         */
        roadMatrices:
            roads,

        roadmapViewModel: {

            roads,

            summary: {

                roundCount:
                    mockHistory.count

            }

        },

        roadmapAnalyzer: {

            state:
                "READY",

            roads,

            viewModel: {

                roads

            }

        },


        /**
         * Manual Round。
         */
        currentRound:
            null,

        manualRound:
            null,

        isManualRoundActive:
            false,

        canStartManualRound:
            false,

        canFinishManualRound:
            false,

        nextManualSide:
            null,

        nextManualInput:
            null,

        manualCards:
            [],

        manualProgress: {

            playerCards:
                [],

            bankerCards:
                [],

            playerScore:
                null,

            bankerScore:
                null

        },

        winner:
            null,

        result:
            null,


        /**
         * 狀態物件，支援不同 Dashboard 寫法。
         */
        shoeStatus: {

            state:
                "WAITING_BURN",

            ready:
                false,

            burnConfirmed:
                false

        },

        burnStatus: {

            state:
                "WAITING_INDICATOR",

            confirmed:
                false

        },

        roundStatus: {

            state:
                MockManualRoundState
                    .IDLE,

            active:
                false,

            canFinish:
                false

        },

        analyzerStatus: {

            state:
                initialAnalysis
                    ? MockAnalysisState
                        .COMPLETED
                    : MockAnalysisState
                        .IDLE,

            hasResult:
                Boolean(
                    initialAnalysis
                )

        },


        /**
         * 呼叫次數。
         */
        calls: {

            startNewShoe:
                0,

            confirmBurnIndicator:
                0,

            analyzeNextRound:
                0,

            waitForAnalysis:
                0,

            startManualRound:
                0,

            addManualCard:
                0,

            undoManualCard:
                0,

            cancelManualRound:
                0,

            finishManualRound:
                0,

            validateConsistency:
                0

        },


        /**
         * 衍生值。
         */
        get roundCount() {

            return this.history.count;

        },

        get finished() {

            return (
                this.manualState ===
                MockManualRoundState
                    .FINISHED
            );

        },


        /**
         * 開始新牌靴。
         */
        startNewShoe({

            clearHistory = true

        } = {}) {

            this.calls
                .startNewShoe++;

            this.shoeNumber++;

            this.state =
                MockGameState
                    .WAITING_BURN_INDICATOR;

            this.manualState =
                MockManualRoundState
                    .IDLE;

            this.analysisState =
                MockAnalysisState
                    .IDLE;

            this.observableRemainingCards =
                total;

            this.remainingCards =
                total;

            this.usedCards =
                0;

            this.unknownBurnedCount =
                0;

            this.shoe
                .unknownBurnedCount =
                0;

            this.shoe.cards =
                new Array(total)
                    .fill(null);

            this.shoe.discarded =
                [];

            this.shoe.burned =
                [];

            this.burnConfirmed =
                false;

            this.isWaitingBurnIndicator =
                true;

            this.burnInfo =
                null;

            this.burn.state =
                "WAITING_INDICATOR";

            this.burn.confirmed =
                false;

            this.burn.isConfirmed =
                false;

            this.burn.indicator =
                null;

            this.burn.hiddenCount =
                0;

            this.burn.totalRemoved =
                0;

            this.nextAnalysis =
                null;

            this.latestAnalysis =
                null;

            this.analysis =
                null;

            this.isAnalyzing =
                false;

            this.hasNextAnalysis =
                false;

            this.analysisError =
                null;

            this.analysisSummary = {

                state:
                    MockAnalysisState
                        .IDLE,

                hasResult:
                    false,

                error:
                    null

            };

            this.analyzer.state =
                MockAnalysisState
                    .IDLE;

            this.analyzer.result =
                null;

            this.analyzer.lastResult =
                null;

            this.analyzer.error =
                null;

            this.resetManualRound();

            this.winner =
                null;

            this.result =
                null;

            this.shoeStatus.state =
                "WAITING_BURN";

            this.shoeStatus.ready =
                false;

            this.shoeStatus
                .burnConfirmed =
                false;

            this.burnStatus.state =
                "WAITING_INDICATOR";

            this.burnStatus.confirmed =
                false;

            this.roundStatus.state =
                MockManualRoundState
                    .IDLE;

            this.roundStatus.active =
                false;

            this.roundStatus.canFinish =
                false;

            this.analyzerStatus.state =
                MockAnalysisState
                    .IDLE;

            this.analyzerStatus
                .hasResult =
                false;

            if (clearHistory) {

                this.history.clear();

            }

            for (
                const key of
                Object.keys(
                    this.roadMatrices
                )
            ) {

                this.roadMatrices[
                    key
                ] = [];

                this.roadmapViewModel
                    .roads[
                        key
                    ] =
                    this.roadMatrices[
                        key
                    ];

                this.roadmapAnalyzer
                    .roads[
                        key
                    ] =
                    this.roadMatrices[
                        key
                    ];

            }

            this.roadmapViewModel
                .summary
                .roundCount =
                this.roundCount;

            return this;

        },


        /**
         * 確認燒牌指示牌。
         */
        confirmBurnIndicator(card) {

            this.calls
                .confirmBurnIndicator++;

            const indicator =
                createMockCard(
                    card
                );

            const hiddenCount =

                indicator.rank === "A"

                    ? 1

                    : [
                        "10",
                        "J",
                        "Q",
                        "K"
                    ].includes(
                        indicator.rank
                    )

                        ? 10

                        : Number(
                            indicator.rank
                        );

            this.burnConfirmed =
                true;

            this.isWaitingBurnIndicator =
                false;

            this.unknownBurnedCount =
                hiddenCount;

            this.observableRemainingCards =
                total - 1;

            this.remainingCards =

                total -

                hiddenCount -

                1;

            this.usedCards =
                1;

            this.shoe
                .unknownBurnedCount =
                hiddenCount;

            this.shoe.discarded =
                [
                    indicator
                ];

            this.burnInfo = {

                confirmed:
                    true,

                indicator,

                hiddenCount,

                totalRemoved:
                    hiddenCount + 1

            };

            this.burn.state =
                "CONFIRMED";

            this.burn.confirmed =
                true;

            this.burn.isConfirmed =
                true;

            this.burn.indicator =
                indicator;

            this.burn.hiddenCount =
                hiddenCount;

            this.burn.totalRemoved =
                hiddenCount + 1;

            this.burnStatus.state =
                "CONFIRMED";

            this.burnStatus.confirmed =
                true;

            this.shoeStatus.state =
                "READY";

            this.shoeStatus.ready =
                true;

            this.shoeStatus
                .burnConfirmed =
                true;

            this.state =
                MockGameState
                    .SHOE_ACTIVE;

            this.canStartManualRound =
                true;

            return this.burnInfo;

        },


        /**
         * 分析下一局。
         */
        async analyzeNextRound() {

            this.calls
                .analyzeNextRound++;

            this.isAnalyzing =
                true;

            this.state =
                MockGameState
                    .ANALYZING;

            this.analysisState =
                MockAnalysisState
                    .RUNNING;

            this.analysisSummary.state =
                MockAnalysisState
                    .RUNNING;

            this.analyzer.state =
                MockAnalysisState
                    .RUNNING;

            this.analyzerStatus.state =
                MockAnalysisState
                    .RUNNING;

            await Promise.resolve();

            const result =
                this.analysisFactory({

                    roundCount:
                        this.roundCount

                });

            this.nextAnalysis =
                result;

            this.latestAnalysis =
                result;

            this.analysis =
                result;

            this.isAnalyzing =
                false;

            this.hasNextAnalysis =
                true;

            this.analysisState =
                MockAnalysisState
                    .COMPLETED;

            this.analysisSummary = {

                state:
                    MockAnalysisState
                        .COMPLETED,

                hasResult:
                    true,

                error:
                    null

            };

            this.analyzer.state =
                MockAnalysisState
                    .COMPLETED;

            this.analyzer.result =
                result;

            this.analyzer.lastResult =
                result;

            this.analyzerStatus.state =
                MockAnalysisState
                    .COMPLETED;

            this.analyzerStatus
                .hasResult =
                true;

            this.state =
                MockGameState
                    .SHOE_ACTIVE;

            return result;

        },


        /**
         * 等待分析。
         */
        async waitForAnalysis() {

            this.calls
                .waitForAnalysis++;

            if (
                this.nextAnalysis
            ) {

                return this.nextAnalysis;

            }

            return this
                .analyzeNextRound();

        },


        /**
         * 開始手動牌局。
         */
        startManualRound() {

            if (
                !this.burnConfirmed
            ) {

                throw new Error(
                    "Burn must be confirmed before starting a round."
                );

            }

            this.calls
                .startManualRound++;

            this.resetManualRound();

            this.state =
                MockGameState
                    .ROUND_INPUT;

            this.manualState =
                MockManualRoundState
                    .INITIAL;

            this.isManualRoundActive =
                true;

            this.canStartManualRound =
                false;

            this.nextManualSide =
                "player";

            this.nextManualInput = {

                side:
                    "player",

                cardNumber:
                    1,

                label:
                    "Player 第 1 張"

            };

            this.manualProgress = {

                playerCards:
                    [],

                bankerCards:
                    [],

                playerScore:
                    0,

                bankerScore:
                    0

            };

            this.currentRound = {

                state:
                    "INPUT",

                playerCards:
                    this.manualProgress
                        .playerCards,

                bankerCards:
                    this.manualProgress
                        .bankerCards

            };

            this.manualRound =
                this.currentRound;

            this.roundStatus.state =
                MockManualRoundState
                    .INITIAL;

            this.roundStatus.active =
                true;

            this.roundStatus.canFinish =
                false;

            return this.currentRound;

        },


        /**
         * 加入一張手動牌。
         */
        addManualCard(
            side,
            card
        ) {

            if (
                !this.isManualRoundActive
            ) {

                throw new Error(
                    "Manual round is not active."
                );

            }

            this.calls
                .addManualCard++;

            const stored =
                createMockCard(
                    card
                );

            this.manualCards.push({

                side,

                card:
                    stored

            });

            const cards =

                side === "player"

                    ? this.manualProgress
                        .playerCards

                    : this.manualProgress
                        .bankerCards;

            cards.push(
                stored
            );

            this.manualProgress
                .playerScore =
                handScore(
                    this.manualProgress
                        .playerCards
                );

            this.manualProgress
                .bankerScore =
                handScore(
                    this.manualProgress
                        .bankerCards
                );

            this.observableRemainingCards--;

            this.remainingCards--;

            this.usedCards++;

            this.shoe.discarded.push(
                stored
            );

            const sequence = [

                {
                    side:
                        "player",

                    cardNumber:
                        1,

                    label:
                        "Player 第 1 張"
                },

                {
                    side:
                        "banker",

                    cardNumber:
                        1,

                    label:
                        "Banker 第 1 張"
                },

                {
                    side:
                        "player",

                    cardNumber:
                        2,

                    label:
                        "Player 第 2 張"
                },

                {
                    side:
                        "banker",

                    cardNumber:
                        2,

                    label:
                        "Banker 第 2 張"
                }

            ];

            const next =
                sequence[
                    this.manualCards.length
                ] ??
                null;

            if (next) {

                this.nextManualInput =
                    next;

                this.nextManualSide =
                    next.side;

            }
            else {

                this.nextManualInput =
                    null;

                this.nextManualSide =
                    null;

                this.manualState =
                    MockManualRoundState
                        .READY_TO_FINISH;

                this.canFinishManualRound =
                    true;

                this.roundStatus.state =
                    MockManualRoundState
                        .READY_TO_FINISH;

                this.roundStatus
                    .canFinish =
                    true;

            }

            return stored;

        },


        /**
         * 復原最後一張牌。
         */
        undoManualCard() {

            this.calls
                .undoManualCard++;

            const removed =
                this.manualCards.pop() ??
                null;

            if (!removed) {

                return null;

            }

            const cards =

                removed.side ===
                    "player"

                    ? this.manualProgress
                        .playerCards

                    : this.manualProgress
                        .bankerCards;

            cards.pop();

            this.observableRemainingCards++;

            this.remainingCards++;

            this.usedCards--;

            this.shoe.discarded.pop();

            this.manualProgress
                .playerScore =
                handScore(
                    this.manualProgress
                        .playerCards
                );

            this.manualProgress
                .bankerScore =
                handScore(
                    this.manualProgress
                        .bankerCards
                );

            this.manualState =
                MockManualRoundState
                    .INITIAL;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                removed.side;

            this.nextManualInput = {

                side:
                    removed.side,

                cardNumber:
                    cards.length + 1,

                label:
                    `${removed.side ===
                        "player"
                            ? "Player"
                            : "Banker"} 第 ${cards.length + 1} 張`

            };

            this.roundStatus.state =
                MockManualRoundState
                    .INITIAL;

            this.roundStatus.canFinish =
                false;

            return removed;

        },


        /**
         * 取消目前牌局。
         */
        cancelManualRound() {

            this.calls
                .cancelManualRound++;

            const count =
                this.manualCards.length;

            this.observableRemainingCards +=
                count;

            this.remainingCards +=
                count;

            this.usedCards -=
                count;

            this.shoe.discarded.splice(
                Math.max(
                    1,
                    this.shoe
                        .discarded
                        .length -
                    count
                ),
                count
            );

            this.resetManualRound();

            this.state =
                MockGameState
                    .SHOE_ACTIVE;

            this.canStartManualRound =
                true;

            return this;

        },


        /**
         * 完成牌局。
         */
        async finishManualRound({

            analyze =
                this.autoAnalyze

        } = {}) {

            if (
                !this.canFinishManualRound
            ) {

                throw new Error(
                    "Manual round is not ready to finish."
                );

            }

            this.calls
                .finishManualRound++;

            const playerCards =
                this.manualProgress
                    .playerCards;

            const bankerCards =
                this.manualProgress
                    .bankerCards;

            const playerScore =
                handScore(
                    playerCards
                );

            const bankerScore =
                handScore(
                    bankerCards
                );

            const winner =
                determineWinner(
                    playerScore,
                    bankerScore
                );

            const result = {

                winner,

                playerScore,

                bankerScore,

                playerPair:

                    playerCards.length >= 2 &&

                    playerCards[0]
                        .pairValue ===
                    playerCards[1]
                        .pairValue,

                bankerPair:

                    bankerCards.length >= 2 &&

                    bankerCards[0]
                        .pairValue ===
                    bankerCards[1]
                        .pairValue,

                super6:

                    winner === "Banker" &&

                    bankerScore === 6,

                playerCards:
                    [
                        ...playerCards
                    ],

                bankerCards:
                    [
                        ...bankerCards
                    ]

            };

            this.history.add(
                result
            );

            this.result =
                result;

            this.winner =
                winner;

            this.manualState =
                MockManualRoundState
                    .FINISHED;

            this.isManualRoundActive =
                false;

            this.canStartManualRound =
                true;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                null;

            this.nextManualInput =
                null;

            this.state =
                MockGameState
                    .SHOE_ACTIVE;

            this.roundStatus.state =
                MockManualRoundState
                    .FINISHED;

            this.roundStatus.active =
                false;

            this.roundStatus.canFinish =
                false;

            this.updateRoads(
                result
            );

            if (analyze) {

                await this
                    .analyzeNextRound();

            }

            return result;

        },


        /**
         * 重設手動牌局。
         */
        resetManualRound() {

            this.manualState =
                MockManualRoundState
                    .IDLE;

            this.isManualRoundActive =
                false;

            this.canFinishManualRound =
                false;

            this.nextManualSide =
                null;

            this.nextManualInput =
                null;

            this.manualCards = [];

            this.manualProgress = {

                playerCards:
                    [],

                bankerCards:
                    [],

                playerScore:
                    null,

                bankerScore:
                    null

            };

            this.currentRound =
                null;

            this.manualRound =
                null;

            this.roundStatus.state =
                MockManualRoundState
                    .IDLE;

            this.roundStatus.active =
                false;

            this.roundStatus.canFinish =
                false;

            return this;

        },


        /**
         * 更新簡化路單。
         */
        updateRoads(result) {

            const beadCell = {

                winner:
                    result.winner,

                playerPair:
                    result.playerPair,

                bankerPair:
                    result.bankerPair,

                super6:
                    result.super6

            };

            this.roadMatrices
                .beadRoad = [

                    ...this.roadMatrices
                        .beadRoad,

                    [
                        beadCell
                    ]

                ];

            const mainCell = {

                winner:
                    result.winner,

                tieCount:
                    result.winner ===
                        "Tie"
                        ? 1
                        : 0

            };

            this.roadMatrices
                .bigRoad = [

                    ...this.roadMatrices
                        .bigRoad,

                    [
                        mainCell
                    ]

                ];

            this.roadmapViewModel
                .roads =
                this.roadMatrices;

            this.roadmapViewModel
                .summary
                .roundCount =
                this.roundCount;

            this.roadmapAnalyzer
                .roads =
                this.roadMatrices;

            this.roadmapAnalyzer
                .viewModel
                .roads =
                this.roadMatrices;

            return this.roadMatrices;

        },


        /**
         * 一致性檢查。
         */
        validateConsistency() {

            this.calls
                .validateConsistency++;

            const errors = [];

            if (
                this.observableRemainingCards <
                0
            ) {

                errors.push(
                    "observableRemainingCards is negative."
                );

            }

            if (
                this.remainingCards <
                0
            ) {

                errors.push(
                    "remainingCards is negative."
                );

            }

            if (
                this.remainingCards >
                this.observableRemainingCards
            ) {

                errors.push(
                    "physical remaining exceeds observable remaining."
                );

            }

            return {

                valid:
                    errors.length === 0,

                errors

            };

        },


        /**
         * JSON。
         */
        toJSON() {

            return {

                state:
                    this.state,

                manualState:
                    this.manualState,

                analysisState:
                    this.analysisState,

                shoeNumber:
                    this.shoeNumber,

                observableRemainingCards:
                    this
                        .observableRemainingCards,

                remainingCards:
                    this.remainingCards,

                usedCards:
                    this.usedCards,

                unknownBurnedCount:
                    this.unknownBurnedCount,

                burnConfirmed:
                    this.burnConfirmed,

                burnInfo:
                    this.burnInfo,

                history:
                    this.history
                        .toJSON(),

                roadMatrices:
                    this.roadMatrices,

                nextAnalysis:
                    this.nextAnalysis

            };

        }

    };


    /**
     * 初始分析同步。
     */
    if (initialAnalysis) {

        game.state =
            MockGameState
                .SHOE_ACTIVE;

        game.burnConfirmed =
            true;

        game.isWaitingBurnIndicator =
            false;

        game.canStartManualRound =
            true;

        game.shoeStatus.state =
            "READY";

        game.shoeStatus.ready =
            true;

        game.shoeStatus
            .burnConfirmed =
            true;

        game.analyzerStatus.state =
            MockAnalysisState
                .COMPLETED;

        game.analyzerStatus
            .hasResult =
            true;

    }


    return game;

}
