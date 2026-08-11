/**
 * Baccarat Analyzer V10.9.0
 * Path: runtime/liveCasino/FifteenSecondEightMarketPredictionEngine.js
 * Purpose:
 *   Build one exact, eight-market prediction snapshot for a 15-second
 *   live decision window. Prediction and formal betting remain separate.
 */

export const FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION = "10.9.0";
export const FIFTEEN_SECOND_DECISION_WINDOW_MS = 15000;

export const PredictionMarketGroup = Object.freeze({
    MAIN: "main",
    SPECIAL: "special"
});

export const EIGHT_PREDICTION_MARKETS = Object.freeze([
    Object.freeze({
        key: "player",
        label: "閒家",
        shortLabel: "閒",
        group: PredictionMarketGroup.MAIN
    }),
    Object.freeze({
        key: "banker",
        label: "莊家",
        shortLabel: "莊",
        group: PredictionMarketGroup.MAIN
    }),
    Object.freeze({
        key: "tie",
        label: "和局",
        shortLabel: "和",
        group: PredictionMarketGroup.MAIN
    }),
    Object.freeze({
        key: "playerPair",
        label: "閒對",
        shortLabel: "閒對",
        group: PredictionMarketGroup.SPECIAL
    }),
    Object.freeze({
        key: "bankerPair",
        label: "莊對",
        shortLabel: "莊對",
        group: PredictionMarketGroup.SPECIAL
    }),
    Object.freeze({
        key: "super6",
        label: "超級 6",
        shortLabel: "超 6",
        group: PredictionMarketGroup.SPECIAL
    }),
    Object.freeze({
        key: "playerDragonBonus",
        label: "閒龍寶",
        shortLabel: "閒龍寶",
        group: PredictionMarketGroup.SPECIAL
    }),
    Object.freeze({
        key: "bankerDragonBonus",
        label: "莊龍寶",
        shortLabel: "莊龍寶",
        group: PredictionMarketGroup.SPECIAL
    })
]);

const DRAGON_KEYS = new Set([
    "playerDragonBonus",
    "bankerDragonBonus"
]);

function finite(value) {
    return Number.isFinite(value)
        ? value
        : null;
}

function clamp(value, min = 0, max = 1) {
    return Math.min(
        max,
        Math.max(min, value)
    );
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

function winnerKey(result = {}) {
    const winner = String(
        result.winner ?? ""
    ).trim().toLowerCase();

    if (
        winner === "player" ||
        winner === "banker" ||
        winner === "tie"
    ) {
        return winner;
    }

    if (result.playerWin === true) {
        return "player";
    }

    if (result.bankerWin === true) {
        return "banker";
    }

    if (result.tie === true) {
        return "tie";
    }

    return null;
}

function marginFor(result = {}) {
    if (Number.isFinite(result.margin)) {
        return Math.abs(result.margin);
    }

    if (
        Number.isFinite(result.playerScore) &&
        Number.isFinite(result.bankerScore)
    ) {
        return Math.abs(
            result.playerScore -
            result.bankerScore
        );
    }

    return null;
}

function hitFor(key, result = {}) {
    const winner = winnerKey(result);

    switch (key) {
    case "player":
    case "banker":
    case "tie":
        return winner === key;
    case "playerPair":
        return result.playerPair === true;
    case "bankerPair":
        return result.bankerPair === true;
    case "super6":
        return result.super6 === true ||
            (
                winner === "banker" &&
                result.bankerScore === 6
            );
    case "playerDragonBonus":
        return winner === "player" &&
            (
                result.playerNatural === true ||
                (marginFor(result) ?? -1) >= 4
            );
    case "bankerDragonBonus":
        return winner === "banker" &&
            (
                result.bankerNatural === true ||
                (marginFor(result) ?? -1) >= 4
            );
    default:
        return false;
    }
}

function hasExactEvidence(analysis = null) {
    if (!analysis) {
        return false;
    }

    const method = String(
        analysis.method ?? ""
    ).toLowerCase();

    return (
        method === "exact" ||
        method === "hybrid" ||
        Boolean(analysis.exact)
    );
}

function probabilitySource(analysis = {}) {
    const probability =
        analysis.probability ?? {};

    return EIGHT_PREDICTION_MARKETS.every(
        market => {
            const value =
                probability[market.key];

            return Number.isFinite(value) &&
                value >= 0 &&
                value <= 1;
        }
    )
        ? probability
        : null;
}

function strengthFor(gap) {
    if (!Number.isFinite(gap)) {
        return {
            key: "waiting",
            label: "等待 Exact"
        };
    }

    if (gap >= 0.01) {
        return {
            key: "clear",
            label: "明顯領先"
        };
    }

    if (gap >= 0.004) {
        return {
            key: "lean",
            label: "小幅領先"
        };
    }

    return {
        key: "close",
        label: "非常接近"
    };
}

function pickHighest(markets) {
    return [...markets]
        .filter(item =>
            Number.isFinite(item.probability)
        )
        .sort((left, right) =>
            right.probability -
            left.probability
        )[0] ?? null;
}

function formalBet(decision = {}) {
    const bet =
        decision.action === "BET" &&
        typeof decision.strictKey === "string";

    return {
        action:
            bet ? "BET" : "WAIT",
        actionLabel:
            bet ? "正式下注" : "觀望",
        key:
            bet ? decision.strictKey : null,
        label:
            bet
                ? decision.strictLabel ??
                    decision.recommendationLabel ??
                    "可下注"
                : "不下注",
        amount:
            bet && Number.isFinite(decision.amount)
                ? decision.amount
                : 0,
        reason:
            decision.primaryBlocker ??
            decision.reason ??
            "預測結果不等於具備正期望值。"
    };
}

export default class FifteenSecondEightMarketPredictionEngine {
    constructor({
        decisionWindowMs =
            FIFTEEN_SECOND_DECISION_WINDOW_MS,
        minimumHistoryRounds = 5
    } = {}) {
        if (
            !Number.isFinite(decisionWindowMs) ||
            decisionWindowMs < 1000
        ) {
            throw new RangeError(
                "decisionWindowMs must be >= 1000."
            );
        }

        if (
            !Number.isInteger(minimumHistoryRounds) ||
            minimumHistoryRounds < 1
        ) {
            throw new RangeError(
                "minimumHistoryRounds must be a positive integer."
            );
        }

        this.decisionWindowMs =
            decisionWindowMs;
        this.minimumHistoryRounds =
            minimumHistoryRounds;
    }

    build({
        analysis = null,
        decision = null,
        history = null,
        windowStartedAt = null,
        now = Date.now()
    } = {}) {
        const rounds =
            historyArray(history);
        const elapsedMs =
            Number.isFinite(windowStartedAt)
                ? Math.max(0, now - windowStartedAt)
                : 0;
        const remainingMs =
            Number.isFinite(windowStartedAt)
                ? Math.max(
                    0,
                    this.decisionWindowMs - elapsedMs
                )
                : this.decisionWindowMs;
        const exact =
            hasExactEvidence(analysis);
        const probability =
            exact
                ? probabilitySource(analysis)
                : null;

        const formal =
            formalBet(decision ?? {});

        if (!probability) {
            return {
                version:
                    FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION,
                ready: false,
                source: "waiting-exact",
                sourceLabel: "Exact 精算中",
                decisionWindowMs:
                    this.decisionWindowMs,
                elapsedMs,
                remainingMs,
                expired:
                    remainingMs <= 0,
                historySample:
                    rounds.length,
                markets: [],
                mainPick: null,
                specialPick: null,
                strength: strengthFor(null),
                formal,
                message:
                    "正在依剩餘牌組完成 Exact；快速 MC 不會先顯示成第二套答案。"
            };
        }

        const ev =
            analysis.ev ?? {};
        const evStatus =
            analysis.evStatus ?? {};

        const markets =
            EIGHT_PREDICTION_MARKETS.map(
                definition => {
                    const hitCount =
                        rounds.reduce(
                            (total, result) =>
                                total + (
                                    hitFor(
                                        definition.key,
                                        result
                                    )
                                        ? 1
                                        : 0
                                ),
                            0
                        );
                    const probabilityValue =
                        clamp(
                            probability[
                                definition.key
                            ]
                        );
                    const historyRate =
                        rounds.length > 0
                            ? hitCount /
                                rounds.length
                            : null;
                    const dragon =
                        DRAGON_KEYS.has(
                            definition.key
                        );
                    const evAvailable =
                        !dragon &&
                        evStatus[
                            definition.key
                        ] !== "unavailable" &&
                        Number.isFinite(
                            ev[definition.key]
                        );

                    return {
                        ...definition,
                        probability:
                            probabilityValue,
                        fairDecimalOdds:
                            probabilityValue > 0
                                ? 1 / probabilityValue
                                : null,
                        historySample:
                            rounds.length,
                        hitCount,
                        historyRate,
                        historyQualified:
                            rounds.length >=
                                this.minimumHistoryRounds,
                        ev:
                            evAvailable
                                ? finite(
                                    ev[
                                        definition.key
                                    ]
                                )
                                : null,
                        evAvailable,
                        positiveEV:
                            evAvailable &&
                            ev[
                                definition.key
                            ] > 0,
                        note:
                            dragon
                                ? "分級賠率 EV 尚不可用"
                                : null
                    };
                }
            );

        const mainMarkets =
            markets.filter(item =>
                item.group ===
                    PredictionMarketGroup.MAIN
            );
        const specialMarkets =
            markets.filter(item =>
                item.group ===
                    PredictionMarketGroup.SPECIAL
            );
        const rankedMain =
            [...mainMarkets].sort(
                (left, right) =>
                    right.probability -
                    left.probability
            );
        const mainPick =
            rankedMain[0] ?? null;
        const mainRunnerUp =
            rankedMain[1] ?? null;
        const mainGap =
            mainPick && mainRunnerUp
                ? mainPick.probability -
                    mainRunnerUp.probability
                : null;
        const specialPick =
            pickHighest(specialMarkets);
        const strength =
            strengthFor(mainGap);

        return {
            version:
                FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION,
            ready: true,
            source: "exact",
            sourceLabel: "最終 Exact",
            decisionWindowMs:
                this.decisionWindowMs,
            elapsedMs,
            remainingMs,
            expired:
                remainingMs <= 0,
            historySample:
                rounds.length,
            markets,
            mainPick,
            mainRunnerUp,
            specialPick,
            mainGap,
            strength,
            formal,
            remainingCards:
                finite(
                    analysis.observableRemaining ??
                    analysis.remainingCards
                ),
            message:
                `大膽預測 ${mainPick?.label ?? "—"}；${strength.label}。正式下注仍以正 EV 安全門檻為準。`,
            overlapNotice:
                "對子、超級 6、龍寶可與閒／莊／和同時發生，八項機率不會加總為 100%。"
        };
    }

    get summary() {
        return {
            version:
                FIFTEEN_SECOND_EIGHT_MARKET_PREDICTION_VERSION,
            decisionWindowMs:
                this.decisionWindowMs,
            minimumHistoryRounds:
                this.minimumHistoryRounds,
            markets:
                EIGHT_PREDICTION_MARKETS.map(
                    item => item.key
                ),
            exactOnly:
                true,
            predictionIsNotBet:
                true
        };
    }
}
