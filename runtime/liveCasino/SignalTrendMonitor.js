/**
 * Baccarat Analyzer V10.5.3
 * Path: runtime/liveCasino/SignalTrendMonitor.js
 *
 * Tracks evidence-based EV movement across completed rounds.
 * Trend never overrides the Decision Engine safety gates and never treats
 * streaks, roads, or previous winners as a reason to place a bet.
 */

export const SIGNAL_TREND_MONITOR_VERSION =
    "10.5.3";


export const SignalTrendDirection = Object.freeze({
    NEW: "new",
    STRENGTHENING: "strengthening",
    STABLE: "stable",
    WEAKENING: "weakening"
});


export const SignalOpportunityState = Object.freeze({
    ACTIONABLE: "actionable",
    POSITIVE_BLOCKED: "positive-blocked",
    APPROACHING: "approaching",
    WATCH: "watch",
    NONE: "none",
    INSUFFICIENT_DATA: "insufficient-data"
});


export const SIGNAL_TREND_DIRECTION_LABEL = Object.freeze({
    [SignalTrendDirection.NEW]: "等待趨勢",
    [SignalTrendDirection.STRENGTHENING]: "訊號增強",
    [SignalTrendDirection.STABLE]: "大致持平",
    [SignalTrendDirection.WEAKENING]: "訊號減弱"
});


export const SIGNAL_TREND_DIRECTION_SYMBOL = Object.freeze({
    [SignalTrendDirection.NEW]: "•",
    [SignalTrendDirection.STRENGTHENING]: "↑",
    [SignalTrendDirection.STABLE]: "→",
    [SignalTrendDirection.WEAKENING]: "↓"
});


export const SIGNAL_OPPORTUNITY_LABEL = Object.freeze({
    [SignalOpportunityState.ACTIONABLE]: "可執行機會",
    [SignalOpportunityState.POSITIVE_BLOCKED]: "正 EV 待放行",
    [SignalOpportunityState.APPROACHING]: "接近正 EV",
    [SignalOpportunityState.WATCH]: "進入觀察區",
    [SignalOpportunityState.NONE]: "尚無機會",
    [SignalOpportunityState.INSUFFICIENT_DATA]: "資料不足"
});


export const DEFAULT_SIGNAL_TREND_OPTIONS = Object.freeze({
    maxEntries: 12,
    trendWindow: 5,
    minMovement: 0.0005,
    nearPositiveDistance: 0.005,
    watchDistance: 0.01
});


const MAIN_BETS = Object.freeze([
    ["player", "閒家"],
    ["banker", "莊家"],
    ["tie", "和局"]
]);


function finite(value, fallback = null) {
    return Number.isFinite(value)
        ? value
        : fallback;
}


function normalizeKey(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function isMainKey(value) {
    return MAIN_BETS.some(([key]) =>
        key === value
    );
}


function labelFor(key) {
    return MAIN_BETS.find(([candidate]) =>
        candidate === key
    )?.[1] ?? "—";
}


function extractEV(analysis = {}, decision = {}) {
    const source =
        analysis.ev ??
        decision.ev ??
        {};

    return {
        player:
            finite(
                source.player ??
                source.Player
            ),
        banker:
            finite(
                source.banker ??
                source.Banker
            ),
        tie:
            finite(
                source.tie ??
                source.Tie
            )
    };
}


function extractRound(analysis = {}) {
    for (
        const candidate of [
            analysis.generatedAfterRound,
            analysis.roundCount,
            analysis.historyCount
        ]
    ) {
        if (
            Number.isInteger(candidate) &&
            candidate >= 0
        ) {
            return candidate;
        }
    }

    return null;
}


function normalizeShoeId(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return String(value);
}


function linearSlope(values) {
    const count =
        values.length;

    if (count < 2) {
        return null;
    }

    const meanX =
        (count - 1) / 2;
    const meanY =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / count;

    let numerator = 0;
    let denominator = 0;

    values.forEach((value, index) => {
        const x =
            index - meanX;

        numerator +=
            x * (value - meanY);
        denominator +=
            x * x;
    });

    return denominator > 0
        ? numerator / denominator
        : 0;
}


function createEmptySummary({
    shoeId = null
} = {}) {
    return {
        version:
            SIGNAL_TREND_MONITOR_VERSION,
        ready:
            false,
        shoeId,
        observedCount:
            0,
        targetKey:
            null,
        targetLabel:
            "—",
        currentEV:
            null,
        previousEV:
            null,
        deltaEV:
            null,
        windowDelta:
            null,
        slope:
            null,
        direction:
            SignalTrendDirection.NEW,
        directionLabel:
            SIGNAL_TREND_DIRECTION_LABEL[
                SignalTrendDirection.NEW
            ],
        directionSymbol:
            SIGNAL_TREND_DIRECTION_SYMBOL[
                SignalTrendDirection.NEW
            ],
        trendSampleCount:
            0,
        trendEvidenceQualified:
            false,
        bestStreak:
            0,
        minPositiveEV:
            0,
        distanceToPositiveEV:
            null,
        opportunityState:
            SignalOpportunityState.INSUFFICIENT_DATA,
        opportunityLabel:
            SIGNAL_OPPORTUNITY_LABEL[
                SignalOpportunityState.INSUFFICIENT_DATA
            ],
        opportunityReason:
            "尚未累積可比較的下一局分析。",
        passedGateCount:
            0,
        totalGateCount:
            5,
        gates: {
            positiveEV: false,
            evidence: false,
            confidence: false,
            volatility: false,
            kelly: false
        },
        primaryBlocker:
            null,
        series: []
    };
}


export default class SignalTrendMonitor {
    constructor(options = {}) {
        this.options = {
            ...DEFAULT_SIGNAL_TREND_OPTIONS,
            ...options
        };

        this.validateOptions();

        this.entries = [];
        this.currentShoeId = null;
        this.objectIds = new WeakMap();
        this.nextObjectId = 1;
        this.lastSummary =
            createEmptySummary();
    }


    validateOptions() {
        const {
            maxEntries,
            trendWindow,
            minMovement,
            nearPositiveDistance,
            watchDistance
        } = this.options;

        if (
            !Number.isInteger(maxEntries) ||
            maxEntries < 2
        ) {
            throw new RangeError(
                "maxEntries must be an integer >= 2."
            );
        }

        if (
            !Number.isInteger(trendWindow) ||
            trendWindow < 2 ||
            trendWindow > maxEntries
        ) {
            throw new RangeError(
                "trendWindow must be between 2 and maxEntries."
            );
        }

        for (
            const [name, value] of [
                ["minMovement", minMovement],
                ["nearPositiveDistance", nearPositiveDistance],
                ["watchDistance", watchDistance]
            ]
        ) {
            if (
                !Number.isFinite(value) ||
                value < 0
            ) {
                throw new RangeError(
                    `${name} must be a non-negative finite number.`
                );
            }
        }

        if (
            watchDistance <
                nearPositiveDistance
        ) {
            throw new RangeError(
                "watchDistance must be >= nearPositiveDistance."
            );
        }
    }


    resolveShoeId(
        analysis,
        context
    ) {
        return normalizeShoeId(
            context.shoeId ??
            context.shoeNumber ??
            analysis.shoeId ??
            analysis.shoeNumber
        );
    }


    resolveEntryId(
        analysis,
        shoeId,
        round
    ) {
        const shoeKey =
            shoeId ?? "shoe";

        if (Number.isInteger(round)) {
            return `${shoeKey}:round:${round}`;
        }

        for (
            const value of [
                analysis.analyzedAt,
                analysis.generatedAt
            ]
        ) {
            if (
                typeof value === "string" &&
                value.length > 0
            ) {
                return `${shoeKey}:time:${value}`;
            }
        }

        if (
            analysis &&
            typeof analysis === "object"
        ) {
            if (!this.objectIds.has(analysis)) {
                this.objectIds.set(
                    analysis,
                    this.nextObjectId++
                );
            }

            return `${shoeKey}:object:${this.objectIds.get(analysis)}`;
        }

        return `${shoeKey}:sequence:${this.nextObjectId++}`;
    }


    shouldResetForRound(round) {
        const previous =
            this.entries.at(-1);

        return Number.isInteger(round) &&
            Number.isInteger(previous?.round) &&
            round < previous.round;
    }


    createSnapshot(
        analysis,
        decision,
        {
            shoeId,
            round,
            id
        }
    ) {
        const ev =
            extractEV(
                analysis,
                decision
            );

        const targetKey =
            normalizeKey(
                decision.action === "BET"
                    ? decision.strictKey ??
                        decision.recommendationKey ??
                        decision.relativeKey
                    : decision.relativeKey ??
                        decision.recommendationKey
            );

        if (
            !isMainKey(targetKey) ||
            !Number.isFinite(ev[targetKey])
        ) {
            return null;
        }

        return {
            id,
            shoeId,
            round,
            targetKey,
            targetLabel:
                decision.relativeLabel ??
                labelFor(targetKey),
            ev,
            category:
                decision.category ?? null,
            action:
                decision.action ?? "WAIT",
            evidenceSource:
                decision.evidence?.source ??
                "none",
            evidenceLabel:
                decision.evidence?.shortLabel ??
                "—",
            primaryBlocker:
                decision.primaryBlocker ??
                null,
            observedAt:
                Date.now()
        };
    }


    upsertSnapshot(snapshot) {
        const index =
            this.entries.findIndex(entry =>
                entry.id === snapshot.id
            );

        if (index >= 0) {
            this.entries[index] = {
                ...snapshot,
                observedAt:
                    this.entries[index]
                        .observedAt
            };
        }
        else {
            this.entries.push(snapshot);
        }

        if (
            this.entries.length >
                this.options.maxEntries
        ) {
            this.entries.splice(
                0,
                this.entries.length -
                    this.options.maxEntries
            );
        }
    }


    buildTrend(targetKey) {
        const points =
            this.entries
                .filter(entry =>
                    Number.isFinite(
                        entry.ev[targetKey]
                    )
                )
                .slice(
                    -this.options
                        .trendWindow
                );

        const values =
            points.map(entry =>
                entry.ev[targetKey]
            );

        const currentEV =
            values.at(-1) ??
            null;
        const previousEV =
            values.length >= 2
                ? values.at(-2)
                : null;
        const deltaEV =
            Number.isFinite(previousEV)
                ? currentEV - previousEV
                : null;
        const windowDelta =
            values.length >= 2
                ? currentEV - values[0]
                : null;
        const slope =
            linearSlope(values);

        let direction =
            SignalTrendDirection.NEW;

        if (Number.isFinite(slope)) {
            if (
                slope >
                    this.options.minMovement
            ) {
                direction =
                    SignalTrendDirection.STRENGTHENING;
            }
            else if (
                slope <
                    -this.options.minMovement
            ) {
                direction =
                    SignalTrendDirection.WEAKENING;
            }
            else {
                direction =
                    SignalTrendDirection.STABLE;
            }
        }

        return {
            points,
            currentEV,
            previousEV,
            deltaEV,
            windowDelta,
            slope,
            direction,
            evidenceQualified:
                points.length >= 2 &&
                points.every(point =>
                    point.evidenceSource ===
                        "exact" ||
                    point.evidenceSource ===
                        "hybrid-exact"
                )
        };
    }


    getBestStreak(targetKey) {
        let count = 0;

        for (
            let index =
                this.entries.length - 1;
            index >= 0;
            index--
        ) {
            if (
                this.entries[index]
                    .targetKey !== targetKey
            ) {
                break;
            }

            count++;
        }

        return count;
    }


    buildGates(decision, currentEV) {
        const thresholds =
            decision.thresholds ??
            {};
        const minPositiveEV =
            finite(
                thresholds.minPositiveEV,
                0
            );
        const minConfidence =
            finite(
                thresholds.minConfidence,
                0.70
            );
        const maxRelativeRisk =
            finite(
                thresholds.maxRelativeRisk,
                1.05
            );
        const evidence =
            decision.evidence ??
            {};
        const sizing =
            decision.sizing ??
            {};

        const gates = {
            positiveEV:
                currentEV > minPositiveEV,
            evidence:
                evidence.uncertaintyComplete ===
                    true,
            confidence:
                Number.isFinite(
                    evidence.confidence
                ) &&
                evidence.confidence >=
                    minConfidence,
            volatility:
                Number.isFinite(
                    decision.risk
                ) &&
                decision.risk <=
                    maxRelativeRisk,
            kelly:
                Number.isFinite(
                    sizing.calculatedAmount
                ) &&
                (
                    Number.isFinite(
                        sizing.minBet
                    )
                        ? sizing.calculatedAmount >=
                            sizing.minBet
                        : sizing.calculatedAmount > 0
                )
        };

        return {
            minPositiveEV,
            gates,
            passedGateCount:
                Object.values(gates)
                    .filter(Boolean)
                    .length,
            totalGateCount:
                Object.keys(gates)
                    .length
        };
    }


    classifyOpportunity({
        decision,
        currentEV,
        distanceToPositiveEV,
        direction,
        trendSampleCount,
        trendEvidenceQualified
    }) {
        if (
            decision.action === "BET"
        ) {
            return SignalOpportunityState.ACTIONABLE;
        }

        if (
            currentEV >
                finite(
                    decision.thresholds
                        ?.minPositiveEV,
                    0
                )
        ) {
            return SignalOpportunityState.POSITIVE_BLOCKED;
        }

        if (
            trendSampleCount >= 2 &&
            trendEvidenceQualified &&
            direction ===
                SignalTrendDirection.STRENGTHENING &&
            distanceToPositiveEV <=
                this.options
                    .nearPositiveDistance
        ) {
            return SignalOpportunityState.APPROACHING;
        }

        if (
            distanceToPositiveEV <=
                this.options.watchDistance
        ) {
            return SignalOpportunityState.WATCH;
        }

        return SignalOpportunityState.NONE;
    }


    opportunityReason({
        state,
        targetLabel,
        distanceToPositiveEV,
        primaryBlocker
    }) {
        switch (state) {
            case SignalOpportunityState.ACTIONABLE:
                return `${targetLabel}已通過正 EV、證據、波動與 Kelly 門檻。`;

            case SignalOpportunityState.POSITIVE_BLOCKED:
                return primaryBlocker ??
                    `${targetLabel}已有正 EV，但仍有安全門檻未通過。`;

            case SignalOpportunityState.APPROACHING:
                return `${targetLabel} EV 正在增強，距正 EV 尚差 ${(distanceToPositiveEV * 100).toFixed(2)}%。`;

            case SignalOpportunityState.WATCH:
                return `${targetLabel}已進入正 EV 前 ${(this.options.watchDistance * 100).toFixed(2)}% 觀察區，但尚不可下注。`;

            default:
                return `${targetLabel}距正 EV 尚差 ${(distanceToPositiveEV * 100).toFixed(2)}%。`;
        }
    }


    buildSummary(decision, snapshot) {
        const trend =
            this.buildTrend(
                snapshot.targetKey
            );
        const gateSummary =
            this.buildGates(
                decision,
                trend.currentEV
            );
        const distanceToPositiveEV =
            Math.max(
                0,
                gateSummary.minPositiveEV -
                    trend.currentEV
            );
        const opportunityState =
            this.classifyOpportunity({
                decision,
                currentEV:
                    trend.currentEV,
                distanceToPositiveEV,
                direction:
                    trend.direction,
                trendSampleCount:
                    trend.points.length,
                trendEvidenceQualified:
                    trend.evidenceQualified
            });

        const series =
            trend.points.map(entry => ({
                round:
                    entry.round,
                ev:
                    entry.ev[
                        snapshot.targetKey
                    ],
                bestKey:
                    entry.targetKey,
                evidenceLabel:
                    entry.evidenceLabel
            }));

        return {
            version:
                SIGNAL_TREND_MONITOR_VERSION,
            ready:
                true,
            shoeId:
                this.currentShoeId,
            observedCount:
                this.entries.length,
            targetKey:
                snapshot.targetKey,
            targetLabel:
                snapshot.targetLabel,
            currentEV:
                trend.currentEV,
            previousEV:
                trend.previousEV,
            deltaEV:
                trend.deltaEV,
            windowDelta:
                trend.windowDelta,
            slope:
                trend.slope,
            direction:
                trend.direction,
            directionLabel:
                SIGNAL_TREND_DIRECTION_LABEL[
                    trend.direction
                ],
            directionSymbol:
                SIGNAL_TREND_DIRECTION_SYMBOL[
                    trend.direction
                ],
            trendSampleCount:
                trend.points.length,
            trendEvidenceQualified:
                trend.evidenceQualified,
            bestStreak:
                this.getBestStreak(
                    snapshot.targetKey
                ),
            minPositiveEV:
                gateSummary.minPositiveEV,
            distanceToPositiveEV,
            opportunityState,
            opportunityLabel:
                SIGNAL_OPPORTUNITY_LABEL[
                    opportunityState
                ],
            opportunityReason:
                this.opportunityReason({
                    state:
                        opportunityState,
                    targetLabel:
                        snapshot.targetLabel,
                    distanceToPositiveEV,
                    primaryBlocker:
                        decision.primaryBlocker
                }),
            passedGateCount:
                gateSummary
                    .passedGateCount,
            totalGateCount:
                gateSummary
                    .totalGateCount,
            gates:
                gateSummary.gates,
            primaryBlocker:
                decision.primaryBlocker ??
                null,
            series
        };
    }


    observe(
        analysis = null,
        decision = null,
        context = {}
    ) {
        if (
            !analysis ||
            !decision?.ready
        ) {
            return this.lastSummary;
        }

        const runtimeContext =
            context ?? {};
        const shoeId =
            this.resolveShoeId(
                analysis,
                runtimeContext
            );
        const round =
            extractRound(analysis);

        if (
            shoeId !== null &&
            this.currentShoeId !== null &&
            shoeId !==
                this.currentShoeId
        ) {
            this.reset({
                shoeId
            });
        }
        else if (
            this.shouldResetForRound(
                round
            )
        ) {
            this.reset({
                shoeId
            });
        }

        if (
            this.currentShoeId === null &&
            shoeId !== null
        ) {
            this.currentShoeId =
                shoeId;
        }

        const id =
            this.resolveEntryId(
                analysis,
                shoeId,
                round
            );
        const snapshot =
            this.createSnapshot(
                analysis,
                decision,
                {
                    shoeId,
                    round,
                    id
                }
            );

        if (!snapshot) {
            return this.lastSummary;
        }

        this.upsertSnapshot(snapshot);

        this.lastSummary =
            this.buildSummary(
                decision,
                snapshot
            );

        return this.lastSummary;
    }


    reset({
        shoeId = null
    } = {}) {
        this.entries = [];
        this.currentShoeId =
            normalizeShoeId(shoeId);
        this.lastSummary =
            createEmptySummary({
                shoeId:
                    this.currentShoeId
            });

        return this;
    }


    get history() {
        return this.entries.map(entry => ({
            ...entry,
            ev: {
                ...entry.ev
            }
        }));
    }


    get summary() {
        return this.lastSummary;
    }
}
