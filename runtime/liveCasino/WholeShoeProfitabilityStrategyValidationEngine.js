/**
 * Baccarat Analyzer V10.8.0
 * Path: runtime/liveCasino/WholeShoeProfitabilityStrategyValidationEngine.js
 *
 * Whole-shoe policy validation layer.
 *
 * This engine deliberately does not predict future card order and never
 * changes the V10.7 canonical action, amount, side, probability, EV, risk, or
 * Kelly result. It provides two separate views:
 *
 * 1. Realized validation
 *    - Player / Banker flat-bet baselines are rebuilt from actual shoe history.
 *    - Relative-best and Exact-only policies are settled walk-forward from the
 *      first V10.8 decision observed in the current browser session.
 *
 * 2. Conditional projection
 *    - Uses the current Exact probabilities as a constant-rate scenario for a
 *      configurable 50-60 round shoe range.
 *    - Explicitly labels the output as a projection, not a prediction.
 *    - Future Exact-positive opportunity frequency remains unknown; it is not
 *      fabricated from road or streak history.
 */

import {
    LiveDecisionAction
} from "./AILiveDecisionEngine.js";


export const WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION =
    "10.8.0";


export const WholeShoePolicy = Object.freeze({
    NO_BET: "no-bet",
    PLAYER_FLAT: "player-flat",
    BANKER_FLAT: "banker-flat",
    RELATIVE_BEST: "relative-best",
    EXACT_POSITIVE_ONLY: "exact-positive-only"
});


export const WHOLE_SHOE_POLICY_LABEL = Object.freeze({
    [WholeShoePolicy.NO_BET]:
        "停止下注",
    [WholeShoePolicy.PLAYER_FLAT]:
        "每局固定閒家",
    [WholeShoePolicy.BANKER_FLAT]:
        "每局固定莊家",
    [WholeShoePolicy.RELATIVE_BEST]:
        "每局相對最佳",
    [WholeShoePolicy.EXACT_POSITIVE_ONLY]:
        "只執行 Exact 正 EV"
});


export const DEFAULT_WHOLE_SHOE_OPTIONS = Object.freeze({
    minRoundsPerShoe: 50,
    maxRoundsPerShoe: 60,
    projectionRoundsPerShoe: 55,
    unitSize: 1,
    playerWinPayout: 1,
    bankerWinPayout: 1,
    bankerSixPayout: 0.5,
    tieWinPayout: 8
});


const SUPPORTED_KEYS = Object.freeze([
    "player",
    "banker",
    "tie"
]);


function finite(value, fallback = null) {
    return Number.isFinite(value)
        ? value
        : fallback;
}


function clamp(value, min = 0, max = 1) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function rounded(value, digits = 6) {
    if (!Number.isFinite(value)) {
        return null;
    }

    const scale = 10 ** digits;

    return Math.round(value * scale) /
        scale;
}


function deepFreeze(value, seen = new WeakSet()) {
    if (
        !value ||
        typeof value !== "object" ||
        seen.has(value)
    ) {
        return value;
    }

    seen.add(value);

    for (const child of Object.values(value)) {
        deepFreeze(child, seen);
    }

    return Object.freeze(value);
}


function normalizeKey(value) {
    const key = String(value ?? "")
        .trim()
        .toLowerCase();

    return SUPPORTED_KEYS.includes(key)
        ? key
        : null;
}


function labelForKey(key) {
    switch (key) {
    case "player":
        return "閒家";
    case "banker":
        return "莊家";
    case "tie":
        return "和局";
    default:
        return "觀望";
    }
}


function normalizeWinner(value) {
    const winner = String(value ?? "")
        .trim()
        .toLowerCase();

    switch (winner) {
    case "player":
        return "player";
    case "banker":
        return "banker";
    case "tie":
        return "tie";
    default:
        return null;
    }
}


function resultSnapshot(result = null) {
    if (!result) {
        return null;
    }

    const winner =
        normalizeWinner(result.winner);

    if (!winner) {
        return null;
    }

    return {
        winner,
        playerScore:
            finite(result.playerScore),
        bankerScore:
            finite(result.bankerScore),
        super6:
            result.super6 === true ||
            (
                winner === "banker" &&
                result.bankerScore === 6
            )
    };
}


function historyArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (
        value &&
        typeof value.getAll === "function"
    ) {
        return value.getAll();
    }

    if (Array.isArray(value?.rounds)) {
        return value.rounds;
    }

    return [];
}


function createLedger(
    key,
    label,
    scope
) {
    return {
        key,
        label,
        scope,
        evaluatedRounds: 0,
        bets: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        profitUnits: 0,
        firstTargetRound: null,
        lastSettledRound: null
    };
}


function settleUnitBet(
    key,
    result,
    options
) {
    const normalizedKey =
        normalizeKey(key);
    const snapshot =
        resultSnapshot(result);

    if (!normalizedKey || !snapshot) {
        return {
            bet: false,
            outcome: "wait",
            profitUnits: 0
        };
    }

    if (normalizedKey === "player") {
        if (snapshot.winner === "tie") {
            return {
                bet: true,
                outcome: "push",
                profitUnits: 0
            };
        }

        const win =
            snapshot.winner === "player";

        return {
            bet: true,
            outcome:
                win ? "win" : "loss",
            profitUnits:
                win
                    ? options.playerWinPayout
                    : -1
        };
    }

    if (normalizedKey === "banker") {
        if (snapshot.winner === "tie") {
            return {
                bet: true,
                outcome: "push",
                profitUnits: 0
            };
        }

        const win =
            snapshot.winner === "banker";

        return {
            bet: true,
            outcome:
                win ? "win" : "loss",
            profitUnits:
                win
                    ? snapshot.super6
                        ? options
                            .bankerSixPayout
                        : options
                            .bankerWinPayout
                    : -1
        };
    }

    const win =
        snapshot.winner === "tie";

    return {
        bet: true,
        outcome:
            win ? "win" : "loss",
        profitUnits:
            win
                ? options.tieWinPayout
                : -1
    };
}


function applySettlement(
    ledger,
    settlement,
    targetRound
) {
    ledger.evaluatedRounds++;
    ledger.firstTargetRound =
        ledger.firstTargetRound ??
        targetRound;
    ledger.lastSettledRound =
        targetRound;

    if (!settlement.bet) {
        return ledger;
    }

    ledger.bets++;
    ledger.profitUnits +=
        settlement.profitUnits;

    switch (settlement.outcome) {
    case "win":
        ledger.wins++;
        break;
    case "loss":
        ledger.losses++;
        break;
    case "push":
        ledger.pushes++;
        break;
    }

    return ledger;
}


function finalizeLedger(ledger) {
    const resolved =
        ledger.wins + ledger.losses;

    return {
        ...ledger,
        profitUnits:
            rounded(ledger.profitUnits),
        resolvedBets:
            resolved,
        winRate:
            resolved > 0
                ? rounded(
                    ledger.wins / resolved
                )
                : null,
        averageProfitPerBet:
            ledger.bets > 0
                ? rounded(
                    ledger.profitUnits /
                        ledger.bets
                )
                : null
    };
}


function evaluateFlatHistory(
    history,
    key,
    policyKey,
    options
) {
    const ledger = createLedger(
        policyKey,
        WHOLE_SHOE_POLICY_LABEL[
            policyKey
        ],
        "entire-shoe-realized-baseline"
    );

    history.forEach((result, index) => {
        const settlement =
            settleUnitBet(
                key,
                result,
                options
            );

        applySettlement(
            ledger,
            settlement,
            index + 1
        );
    });

    return finalizeLedger(ledger);
}


function probabilitySnapshot(decision = {}) {
    const source =
        decision.probability ??
        decision.probabilities ??
        {};

    const player =
        finite(
            source.player ??
            source.Player
        );
    const banker =
        finite(
            source.banker ??
            source.Banker
        );
    const tie =
        finite(
            source.tie ??
            source.Tie
        );

    if (
        !Number.isFinite(player) ||
        !Number.isFinite(banker) ||
        !Number.isFinite(tie)
    ) {
        return null;
    }

    const total = player + banker + tie;

    if (!(total > 0)) {
        return null;
    }

    return {
        player:
            player / total,
        banker:
            banker / total,
        tie:
            tie / total
    };
}


function evFor(decision, key) {
    return finite(
        decision?.ev?.[key]
    );
}


function inferBankerSixProbability(
    probability,
    bankerEV,
    options
) {
    const denominator =
        options.bankerWinPayout -
        options.bankerSixPayout;

    if (
        !Number.isFinite(bankerEV) ||
        denominator <= 0
    ) {
        return null;
    }

    const value =
        (
            probability.banker *
                options.bankerWinPayout -
            probability.player -
            bankerEV
        ) /
        denominator;

    return clamp(
        value,
        0,
        probability.banker
    );
}


function projectionOutcomes(
    key,
    probability,
    decision,
    options
) {
    switch (key) {
    case "player":
        return [
            {
                deltaHalfUnits:
                    Math.round(
                        options.playerWinPayout * 2
                    ),
                probability:
                    probability.player
            },
            {
                deltaHalfUnits: -2,
                probability:
                    probability.banker
            },
            {
                deltaHalfUnits: 0,
                probability:
                    probability.tie
            }
        ];
    case "banker": {
        const bankerSix =
            inferBankerSixProbability(
                probability,
                evFor(decision, "banker"),
                options
            );

        if (!Number.isFinite(bankerSix)) {
            return null;
        }

        return [
            {
                deltaHalfUnits:
                    Math.round(
                        options.bankerWinPayout * 2
                    ),
                probability:
                    probability.banker -
                    bankerSix
            },
            {
                deltaHalfUnits:
                    Math.round(
                        options.bankerSixPayout * 2
                    ),
                probability:
                    bankerSix
            },
            {
                deltaHalfUnits: -2,
                probability:
                    probability.player
            },
            {
                deltaHalfUnits: 0,
                probability:
                    probability.tie
            }
        ];
    }
    case "tie":
        return [
            {
                deltaHalfUnits:
                    Math.round(
                        options.tieWinPayout * 2
                    ),
                probability:
                    probability.tie
            },
            {
                deltaHalfUnits: -2,
                probability:
                    probability.player +
                    probability.banker
            }
        ];
    default:
        return null;
    }
}


function conditionalProjection({
    policyKey,
    label,
    key,
    decision,
    currentProfitUnits,
    remainingRounds,
    options
}) {
    const probability =
        probabilitySnapshot(decision);
    const normalizedKey =
        normalizeKey(key);

    if (
        !probability ||
        !normalizedKey
    ) {
        return {
            policyKey,
            label,
            selectedKey:
                normalizedKey,
            selectedLabel:
                labelForKey(normalizedKey),
            ready: false,
            projectionType:
                "unavailable",
            remainingRounds,
            positiveProbability: null,
            breakEvenProbability: null,
            lossProbability: null,
            expectedFinalProfitUnits: null,
            expectedAdditionalProfitUnits: null,
            currentEV: null,
            reason:
                "尚未取得完整 Exact 主注機率。"
        };
    }

    const outcomes = projectionOutcomes(
        normalizedKey,
        probability,
        decision,
        options
    );

    if (!outcomes) {
        return {
            policyKey,
            label,
            selectedKey:
                normalizedKey,
            selectedLabel:
                labelForKey(normalizedKey),
            ready: false,
            projectionType:
                "unavailable",
            remainingRounds,
            positiveProbability: null,
            breakEvenProbability: null,
            lossProbability: null,
            expectedFinalProfitUnits: null,
            expectedAdditionalProfitUnits: null,
            currentEV:
                evFor(decision, normalizedKey),
            reason:
                "目前賠率資料不足，無法建立條件投影。"
        };
    }

    let distribution = new Map([
        [
            Math.round(
                currentProfitUnits * 2
            ),
            1
        ]
    ]);

    for (
        let round = 0;
        round < remainingRounds;
        round++
    ) {
        const next = new Map();

        for (
            const [score, chance] of
            distribution
        ) {
            for (const outcome of outcomes) {
                const nextScore =
                    score +
                    outcome.deltaHalfUnits;
                const nextChance =
                    chance *
                    outcome.probability;

                next.set(
                    nextScore,
                    (
                        next.get(nextScore) ??
                        0
                    ) + nextChance
                );
            }
        }

        distribution = next;
    }

    let positiveProbability = 0;
    let breakEvenProbability = 0;
    let lossProbability = 0;

    for (
        const [score, chance] of
        distribution
    ) {
        if (score > 0) {
            positiveProbability += chance;
        }
        else if (score === 0) {
            breakEvenProbability += chance;
        }
        else {
            lossProbability += chance;
        }
    }

    const currentEV =
        evFor(decision, normalizedKey);
    const expectedAdditional =
        Number.isFinite(currentEV)
            ? remainingRounds *
                currentEV *
                options.unitSize
            : null;

    return {
        policyKey,
        label,
        selectedKey:
            normalizedKey,
        selectedLabel:
            labelForKey(normalizedKey),
        ready: true,
        projectionType:
            "constant-current-exact-scenario",
        remainingRounds,
        positiveProbability:
            rounded(positiveProbability),
        breakEvenProbability:
            rounded(breakEvenProbability),
        lossProbability:
            rounded(lossProbability),
        expectedFinalProfitUnits:
            Number.isFinite(expectedAdditional)
                ? rounded(
                    currentProfitUnits +
                    expectedAdditional
                )
                : null,
        expectedAdditionalProfitUnits:
            rounded(expectedAdditional),
        currentEV,
        probability,
        reason:
            "以目前 Exact 機率固定不變推演；僅供條件比較，不代表未來牌序。"
    };
}


function noBetProjection(
    currentProfitUnits,
    remainingRounds
) {
    return {
        policyKey:
            WholeShoePolicy.NO_BET,
        label:
            WHOLE_SHOE_POLICY_LABEL[
                WholeShoePolicy.NO_BET
            ],
        selectedKey: null,
        selectedLabel: "觀望",
        ready: true,
        projectionType:
            "capital-preservation",
        remainingRounds,
        positiveProbability:
            currentProfitUnits > 0
                ? 1
                : 0,
        breakEvenProbability:
            currentProfitUnits === 0
                ? 1
                : 0,
        lossProbability:
            currentProfitUnits < 0
                ? 1
                : 0,
        expectedFinalProfitUnits:
            rounded(currentProfitUnits),
        expectedAdditionalProfitUnits: 0,
        currentEV: 0,
        reason:
            "不增加曝險，保留目前已實現損益。"
    };
}


function unforecastableExactPolicy(
    ledger,
    remainingRounds
) {
    return {
        policyKey:
            WholeShoePolicy.EXACT_POSITIVE_ONLY,
        label:
            WHOLE_SHOE_POLICY_LABEL[
                WholeShoePolicy.EXACT_POSITIVE_ONLY
            ],
        selectedKey: null,
        selectedLabel: "逐局重算",
        ready: true,
        projectionType:
            "future-exact-gated",
        remainingRounds,
        positiveProbability: null,
        breakEvenProbability: null,
        lossProbability: null,
        expectedFinalProfitUnits: null,
        expectedAdditionalProfitUnits: null,
        currentEV: null,
        realizedProfitUnits:
            ledger.profitUnits,
        reason:
            "未來正 EV 機會不可由路單預測；每局必須重新取得 Exact 結果。"
    };
}


function isFormalExact(decision = {}) {
    return (
        decision.stableDecisionFinal ===
            true &&
        Boolean(decision.finalSnapshot)
    ) ||
    (
        decision.decisionIntelligence
            ?.canonical?.authority ===
            "final-exact" &&
        decision.decisionIntelligence
            ?.canonical?.formal === true
    );
}


function relativeKeyFor(decision = {}) {
    return normalizeKey(
        decision.relativeKey ??
        decision.recommendationKey
    );
}


function formalKeyFor(decision = {}) {
    if (
        decision.action !==
            LiveDecisionAction.BET &&
        String(decision.action ?? "")
            .toLowerCase() !== "bet"
    ) {
        return null;
    }

    return normalizeKey(
        decision.strictKey ??
        decision.recommendationKey
    );
}


function snapshotIdFor(
    decision,
    targetRound
) {
    return String(
        decision.finalSnapshot
            ?.snapshotId ??
        decision.decisionIntelligence
            ?.canonical?.snapshotId ??
        `round-${targetRound}`
    );
}


function validateOptions(options) {
    for (
        const key of [
            "minRoundsPerShoe",
            "maxRoundsPerShoe",
            "projectionRoundsPerShoe"
        ]
    ) {
        if (
            !Number.isInteger(options[key]) ||
            options[key] < 1
        ) {
            throw new RangeError(
                `${key} must be a positive integer.`
            );
        }
    }

    if (
        options.minRoundsPerShoe >
            options.maxRoundsPerShoe ||
        options.projectionRoundsPerShoe <
            options.minRoundsPerShoe ||
        options.projectionRoundsPerShoe >
            options.maxRoundsPerShoe
    ) {
        throw new RangeError(
            "projectionRoundsPerShoe must stay inside the configured shoe range."
        );
    }

    for (
        const key of [
            "unitSize",
            "playerWinPayout",
            "bankerWinPayout",
            "bankerSixPayout",
            "tieWinPayout"
        ]
    ) {
        if (
            !Number.isFinite(options[key]) ||
            options[key] < 0
        ) {
            throw new RangeError(
                `${key} must be a non-negative number.`
            );
        }
    }
}


export default class WholeShoeProfitabilityStrategyValidationEngine {
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_WHOLE_SHOE_OPTIONS,
            ...options
        };

        validateOptions(this.options);
        this.reset();
    }


    reset({
        shoeId = null,
        roundCount = 0
    } = {}) {
        this.shoeId =
            shoeId === null ||
            shoeId === undefined
                ? null
                : String(shoeId);
        this.lastRoundCount =
            Number.isInteger(roundCount) &&
            roundCount >= 0
                ? roundCount
                : 0;
        this.trackedDecisions =
            new Map();
        this.settledSnapshotIds =
            new Set();
        this.relativeLedger =
            createLedger(
                WholeShoePolicy.RELATIVE_BEST,
                WHOLE_SHOE_POLICY_LABEL[
                    WholeShoePolicy.RELATIVE_BEST
                ],
                "session-walk-forward"
            );
        this.exactLedger =
            createLedger(
                WholeShoePolicy.EXACT_POSITIVE_ONLY,
                WHOLE_SHOE_POLICY_LABEL[
                    WholeShoePolicy.EXACT_POSITIVE_ONLY
                ],
                "session-walk-forward"
            );
        this.lastReport = null;

        return this.summary;
    }


    synchronizeShoe({
        shoeId = null,
        roundCount = 0
    } = {}) {
        const normalizedShoe =
            shoeId === null ||
            shoeId === undefined
                ? null
                : String(shoeId);
        const changed =
            this.shoeId !== null &&
            normalizedShoe !== null &&
            normalizedShoe !==
                this.shoeId;
        const rewound =
            Number.isInteger(roundCount) &&
            roundCount <
                this.lastRoundCount;

        if (changed || rewound) {
            this.reset({
                shoeId:
                    normalizedShoe,
                roundCount
            });
        }
        else if (
            this.shoeId === null &&
            normalizedShoe !== null
        ) {
            this.shoeId =
                normalizedShoe;
        }

        this.lastRoundCount =
            Math.max(
                this.lastRoundCount,
                Number.isInteger(roundCount)
                    ? roundCount
                    : 0
            );
    }


    settleTrackedDecisions(
        history,
        roundCount
    ) {
        for (
            const [targetRound, record] of
            this.trackedDecisions
        ) {
            if (
                record.settled ||
                targetRound > roundCount
            ) {
                continue;
            }

            const result =
                history[targetRound - 1];

            if (!resultSnapshot(result)) {
                continue;
            }

            applySettlement(
                this.relativeLedger,
                settleUnitBet(
                    record.relativeKey,
                    result,
                    this.options
                ),
                targetRound
            );

            applySettlement(
                this.exactLedger,
                settleUnitBet(
                    record.formalKey,
                    result,
                    this.options
                ),
                targetRound
            );

            record.settled = true;
            record.result =
                resultSnapshot(result);
            this.settledSnapshotIds
                .add(record.snapshotId);
        }
    }


    captureFormalDecision(
        decision,
        roundCount
    ) {
        if (!isFormalExact(decision)) {
            return;
        }

        const targetRound =
            roundCount + 1;
        const snapshotId =
            snapshotIdFor(
                decision,
                targetRound
            );

        if (
            this.trackedDecisions.has(
                targetRound
            ) ||
            this.settledSnapshotIds.has(
                snapshotId
            )
        ) {
            return;
        }

        this.trackedDecisions.set(
            targetRound,
            {
                targetRound,
                snapshotId,
                relativeKey:
                    relativeKeyFor(decision),
                formalKey:
                    formalKeyFor(decision),
                formalAction:
                    decision.action ??
                    LiveDecisionAction.WAIT,
                selectedEV:
                    evFor(
                        decision,
                        formalKeyFor(decision) ??
                        relativeKeyFor(decision)
                    ),
                settled: false,
                result: null
            }
        );
    }


    buildReport(
        decision,
        context,
        history
    ) {
        const roundCount =
            Number.isInteger(
                context.roundCount
            )
                ? context.roundCount
                : history.length;
        const minRemaining =
            Math.max(
                0,
                this.options
                    .minRoundsPerShoe -
                roundCount
            );
        const maxRemaining =
            Math.max(
                0,
                this.options
                    .maxRoundsPerShoe -
                roundCount
            );
        const projectionRemaining =
            Math.max(
                0,
                this.options
                    .projectionRoundsPerShoe -
                roundCount
            );
        const playerBaseline =
            evaluateFlatHistory(
                history,
                "player",
                WholeShoePolicy.PLAYER_FLAT,
                this.options
            );
        const bankerBaseline =
            evaluateFlatHistory(
                history,
                "banker",
                WholeShoePolicy.BANKER_FLAT,
                this.options
            );
        const relativeLedger =
            finalizeLedger({
                ...this.relativeLedger
            });
        const exactLedger =
            finalizeLedger({
                ...this.exactLedger
            });
        const currentRelativeKey =
            relativeKeyFor(decision);
        const projections = {
            noBet:
                noBetProjection(
                    0,
                    projectionRemaining
                ),
            playerFlat:
                conditionalProjection({
                    policyKey:
                        WholeShoePolicy.PLAYER_FLAT,
                    label:
                        WHOLE_SHOE_POLICY_LABEL[
                            WholeShoePolicy.PLAYER_FLAT
                        ],
                    key: "player",
                    decision,
                    currentProfitUnits:
                        playerBaseline
                            .profitUnits,
                    remainingRounds:
                        projectionRemaining,
                    options:
                        this.options
                }),
            bankerFlat:
                conditionalProjection({
                    policyKey:
                        WholeShoePolicy.BANKER_FLAT,
                    label:
                        WHOLE_SHOE_POLICY_LABEL[
                            WholeShoePolicy.BANKER_FLAT
                        ],
                    key: "banker",
                    decision,
                    currentProfitUnits:
                        bankerBaseline
                            .profitUnits,
                    remainingRounds:
                        projectionRemaining,
                    options:
                        this.options
                }),
            currentRelativeFlat:
                conditionalProjection({
                    policyKey:
                        WholeShoePolicy.RELATIVE_BEST,
                    label:
                        `目前相對最佳固定${labelForKey(currentRelativeKey)}`,
                    key:
                        currentRelativeKey,
                    decision,
                    currentProfitUnits:
                        relativeLedger
                            .profitUnits,
                    remainingRounds:
                        projectionRemaining,
                    options:
                        this.options
                }),
            exactPositiveOnly:
                unforecastableExactPolicy(
                    exactLedger,
                    projectionRemaining
                )
        };
        const formalKey =
            formalKeyFor(decision);
        const currentOpportunity = {
            formalExact:
                isFormalExact(decision),
            actionable:
                Boolean(formalKey),
            key:
                formalKey,
            label:
                labelForKey(formalKey),
            ev:
                formalKey
                    ? evFor(
                        decision,
                        formalKey
                    )
                    : null,
            amount:
                finite(decision.amount, 0),
            message:
                formalKey
                    ? `本局 Exact 已確認${labelForKey(formalKey)}正 EV；沿用 V10.7 正式建議。`
                    : isFormalExact(decision)
                        ? "本局 Exact 未確認正 EV；正式策略維持觀望。"
                        : "等待本局 Exact 完成後再更新整靴政策。"
        };
        const pending = [
            ...this.trackedDecisions
                .values()
        ].find(item =>
            !item.settled
        ) ?? null;
        const safePolicy = {
            key:
                WholeShoePolicy.EXACT_POSITIVE_ONLY,
            label:
                WHOLE_SHOE_POLICY_LABEL[
                    WholeShoePolicy.EXACT_POSITIVE_ONLY
                ],
            actionNow:
                formalKey
                    ? LiveDecisionAction.BET
                    : LiveDecisionAction.WAIT,
            reason:
                formalKey
                    ? "只執行已鎖定的 Exact 正 EV；下一局重新計算。"
                    : "目前所有正式主注均未通過正 EV；不以整靴勝率名義強迫下注。"
        };

        return deepFreeze({
            version:
                WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION,
            shoeId:
                this.shoeId,
            roundsCompleted:
                roundCount,
            remainingRoundRange: {
                minimum:
                    minRemaining,
                maximum:
                    maxRemaining,
                projection:
                    projectionRemaining,
                label:
                    minRemaining ===
                        maxRemaining
                        ? `${minRemaining} 局`
                        : `${minRemaining}–${maxRemaining} 局`
            },
            realizedValidation: {
                playerFlat:
                    playerBaseline,
                bankerFlat:
                    bankerBaseline,
                relativeBest:
                    relativeLedger,
                exactPositiveOnly:
                    exactLedger,
                walkForwardStartRound:
                    relativeLedger
                        .firstTargetRound ??
                    pending
                        ?.targetRound ??
                    null,
                pendingTargetRound:
                    pending
                        ?.targetRound ??
                    null,
                note:
                    "固定閒／莊使用整靴實際歷史；相對最佳與 Exact-only 只計入 V10.8 啟動後的 walk-forward 決策。"
            },
            conditionalProjection: {
                ...projections,
                assumption:
                    `以 ${this.options.projectionRoundsPerShoe} 局中位牌靴與目前 Exact 機率固定推演，並非未來牌序預測。`
            },
            currentOpportunity,
            opportunityForecast: {
                available: false,
                probability: null,
                expectedCount: null,
                reason:
                    "未來正 EV 機會不可由路單、連莊或既往輸贏推算；系統將逐局 Exact 重算。"
            },
            safePolicy,
            rules: {
                playerWinPayout:
                    this.options
                        .playerWinPayout,
                bankerWinPayout:
                    this.options
                        .bankerWinPayout,
                bankerSixPayout:
                    this.options
                        .bankerSixPayout,
                tieWinPayout:
                    this.options
                        .tieWinPayout,
                label:
                    this.options
                        .bankerSixPayout ===
                        0.5
                        ? "免佣百家樂｜莊 6 半賠"
                        : "自訂百家樂賠率"
            },
            safetyContract: {
                changesDecision: false,
                predictsFutureCardOrder: false,
                roadCanForceBet: false,
                profitProbabilityCanForceBet: false,
                exactOnlyFormalBet: true,
                negativeEVCanBet: false
            }
        });
    }


    explain(decision = {}, context = {}) {
        const history =
            historyArray(
                context.history
            );
        const roundCount =
            Number.isInteger(
                context.roundCount
            )
                ? context.roundCount
                : history.length;

        this.synchronizeShoe({
            shoeId:
                context.shoeId ??
                context.shoeNumber ??
                null,
            roundCount
        });

        this.settleTrackedDecisions(
            history,
            roundCount
        );
        this.captureFormalDecision(
            decision,
            roundCount
        );

        const report =
            this.buildReport(
                decision,
                {
                    ...context,
                    roundCount
                },
                history
            );

        this.lastReport = report;

        return {
            ...decision,
            wholeShoeStrategyVersion:
                WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION,
            wholeShoeStrategy:
                report,
            shoeProfitability:
                report
        };
    }


    get summary() {
        return {
            version:
                WHOLE_SHOE_PROFITABILITY_STRATEGY_VALIDATION_VERSION,
            minRoundsPerShoe:
                this.options
                    .minRoundsPerShoe,
            maxRoundsPerShoe:
                this.options
                    .maxRoundsPerShoe,
            projectionRoundsPerShoe:
                this.options
                    .projectionRoundsPerShoe,
            unitSize:
                this.options.unitSize,
            rules: {
                playerWinPayout:
                    this.options
                        .playerWinPayout,
                bankerWinPayout:
                    this.options
                        .bankerWinPayout,
                bankerSixPayout:
                    this.options
                        .bankerSixPayout,
                tieWinPayout:
                    this.options
                        .tieWinPayout
            },
            trackedDecisions:
                this.trackedDecisions
                    .size,
            settledDecisions:
                this.settledSnapshotIds
                    .size,
            changesDecision: false,
            predictsFutureCardOrder: false,
            lastReport:
                this.lastReport
        };
    }
}
