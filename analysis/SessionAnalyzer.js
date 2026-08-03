/**
 * Baccarat Analyzer V4.0
 * analysis/SessionAnalyzer.js
 *
 * Session-level analytics for one or more shoes.
 *
 * Supported input:
 *
 * {
 *     history,          // History instance or round array
 *     rounds,           // plain round array
 *     analyses,         // Analyzer result array
 *     bets,             // optional betting record array
 *     startedAt,
 *     endedAt,
 *     shoeNumber
 * }
 */

export const SESSION_ANALYZER_VERSION = "4.0.0";

export const SessionTrend = Object.freeze({
    PLAYER: "player",
    BANKER: "banker",
    TIE: "tie",
    BALANCED: "balanced",
    EMPTY: "empty"
});

const WINNERS = Object.freeze([
    "Player",
    "Banker",
    "Tie"
]);

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function finiteOr(value, fallback = 0) {
    return Number.isFinite(value)
        ? value
        : fallback;
}

function safeDivide(numerator, denominator) {
    return denominator > 0
        ? numerator / denominator
        : 0;
}

function cloneRound(round) {
    if (!round) {
        return null;
    }

    if (typeof round.toJSON === "function") {
        return round.toJSON();
    }

    return {
        ...round
    };
}

function normalizeWinner(value) {
    const text = String(value ?? "").toLowerCase();

    if (text === "player" || text === "p" || text === "閒") {
        return "Player";
    }

    if (text === "banker" || text === "b" || text === "莊") {
        return "Banker";
    }

    if (text === "tie" || text === "t" || text === "和") {
        return "Tie";
    }

    return null;
}

function resolveRounds(source) {
    if (Array.isArray(source)) {
        return source.map(cloneRound);
    }

    if (!source) {
        return [];
    }

    if (typeof source.getAll === "function") {
        const rounds = source.getAll();

        return Array.isArray(rounds)
            ? rounds.map(cloneRound)
            : [];
    }

    if (Array.isArray(source.rounds)) {
        return source.rounds.map(cloneRound);
    }

    if (Array.isArray(source.history)) {
        return source.history.map(cloneRound);
    }

    if (typeof source.toJSON === "function") {
        const json = source.toJSON();

        if (Array.isArray(json)) {
            return json.map(cloneRound);
        }
    }

    return [];
}

function normalizeBet(record, index) {
    if (!isObject(record)) {
        return null;
    }

    const amount = finiteOr(
        record.amount ??
        record.stake ??
        record.betAmount,
        0
    );

    const profit = finiteOr(
        record.profit ??
        record.netProfit ??
        record.resultAmount,
        0
    );

    return {
        index,
        round:
            record.round ??
            record.roundNumber ??
            index + 1,
        bet:
            record.bet ??
            record.name ??
            null,
        amount,
        profit,
        won:
            typeof record.won === "boolean"
                ? record.won
                : profit > 0,
        pushed:
            Boolean(record.pushed),
        timestamp:
            record.timestamp ??
            record.createdAt ??
            null
    };
}

export default class SessionAnalyzer {
    constructor({
        recentWindow = 20,
        trendThreshold = 0.08
    } = {}) {
        if (
            !Number.isInteger(recentWindow) ||
            recentWindow < 1
        ) {
            throw new RangeError(
                "recentWindow must be a positive integer."
            );
        }

        if (
            !Number.isFinite(trendThreshold) ||
            trendThreshold < 0 ||
            trendThreshold > 1
        ) {
            throw new RangeError(
                "trendThreshold must be between 0 and 1."
            );
        }

        this.options = {
            recentWindow,
            trendThreshold
        };

        this.lastReport = null;
        this.runCount = 0;
    }

    normalizeSession(session = {}) {
        if (!isObject(session)) {
            throw new TypeError(
                "Session data must be an object."
            );
        }

        const rounds = resolveRounds(
            session.rounds ??
            session.history
        )
            .map((round, index) => ({
                ...round,
                sessionIndex: index,
                winner: normalizeWinner(round?.winner)
            }))
            .filter(round =>
                WINNERS.includes(round.winner)
            );

        const analyses = Array.isArray(session.analyses)
            ? session.analyses.filter(isObject)
            : [];

        const bets = Array.isArray(session.bets)
            ? session.bets
                .map(normalizeBet)
                .filter(Boolean)
            : [];

        return {
            rounds,
            analyses,
            bets,
            startedAt:
                session.startedAt ??
                null,
            endedAt:
                session.endedAt ??
                null,
            shoeNumber:
                session.shoeNumber ??
                null,
            metadata:
                isObject(session.metadata)
                    ? { ...session.metadata }
                    : {}
        };
    }

    countWinners(rounds) {
        const counts = {
            player: 0,
            banker: 0,
            tie: 0
        };

        for (const round of rounds) {
            if (round.winner === "Player") {
                counts.player++;
            }
            else if (round.winner === "Banker") {
                counts.banker++;
            }
            else if (round.winner === "Tie") {
                counts.tie++;
            }
        }

        return counts;
    }

    calculateRates(counts, total) {
        return {
            player: safeDivide(counts.player, total),
            banker: safeDivide(counts.banker, total),
            tie: safeDivide(counts.tie, total)
        };
    }

    calculateSideStats(rounds) {
        const stats = {
            playerPair: 0,
            bankerPair: 0,
            eitherPair: 0,
            playerNatural: 0,
            bankerNatural: 0,
            natural: 0,
            super6: 0,
            playerDragonBonus: 0,
            bankerDragonBonus: 0
        };

        for (const round of rounds) {
            if (round.playerPair) {
                stats.playerPair++;
            }

            if (round.bankerPair) {
                stats.bankerPair++;
            }

            if (round.playerPair || round.bankerPair) {
                stats.eitherPair++;
            }

            if (round.playerNatural) {
                stats.playerNatural++;
            }

            if (round.bankerNatural) {
                stats.bankerNatural++;
            }

            if (round.playerNatural || round.bankerNatural) {
                stats.natural++;
            }

            if (round.super6) {
                stats.super6++;
            }

            if (
                round.playerDragonBonus === true ||
                (
                    round.winner === "Player" &&
                    (
                        round.playerNatural === true ||
                        finiteOr(round.margin) >= 4
                    )
                )
            ) {
                stats.playerDragonBonus++;
            }

            if (
                round.bankerDragonBonus === true ||
                (
                    round.winner === "Banker" &&
                    (
                        round.bankerNatural === true ||
                        finiteOr(round.margin) >= 4
                    )
                )
            ) {
                stats.bankerDragonBonus++;
            }
        }

        return stats;
    }

    calculateStreaks(rounds) {
        const longest = {
            player: 0,
            banker: 0,
            tie: 0
        };

        const sequences = [];

        let currentWinner = null;
        let currentLength = 0;
        let currentStart = 0;

        const commit = endIndex => {
            if (!currentWinner || currentLength <= 0) {
                return;
            }

            const key = currentWinner.toLowerCase();

            longest[key] = Math.max(
                longest[key],
                currentLength
            );

            sequences.push({
                winner: currentWinner,
                length: currentLength,
                startRound: currentStart + 1,
                endRound: endIndex + 1
            });
        };

        rounds.forEach((round, index) => {
            if (round.winner === currentWinner) {
                currentLength++;
                return;
            }

            commit(index - 1);

            currentWinner = round.winner;
            currentLength = 1;
            currentStart = index;
        });

        commit(rounds.length - 1);

        const current = sequences.length > 0
            ? sequences[sequences.length - 1]
            : null;

        return {
            longest,
            current,
            sequences
        };
    }

    calculateTrend(rounds) {
        if (rounds.length === 0) {
            return {
                type: SessionTrend.EMPTY,
                strength: 0,
                windowSize: 0,
                counts: {
                    player: 0,
                    banker: 0,
                    tie: 0
                },
                rates: {
                    player: 0,
                    banker: 0,
                    tie: 0
                }
            };
        }

        const recent = rounds.slice(
            -this.options.recentWindow
        );

        const counts = this.countWinners(recent);
        const rates = this.calculateRates(
            counts,
            recent.length
        );

        const difference =
            rates.player -
            rates.banker;

        let type = SessionTrend.BALANCED;

        if (
            difference >=
            this.options.trendThreshold
        ) {
            type = SessionTrend.PLAYER;
        }
        else if (
            difference <=
            -this.options.trendThreshold
        ) {
            type = SessionTrend.BANKER;
        }
        else if (
            rates.tie >
            Math.max(
                rates.player,
                rates.banker
            )
        ) {
            type = SessionTrend.TIE;
        }

        return {
            type,
            strength:
                Math.abs(difference),
            windowSize:
                recent.length,
            counts,
            rates
        };
    }

    calculateScoreStats(rounds) {
        if (rounds.length === 0) {
            return {
                playerAverage: 0,
                bankerAverage: 0,
                averageMargin: 0,
                maxMargin: 0
            };
        }

        let playerTotal = 0;
        let bankerTotal = 0;
        let marginTotal = 0;
        let maxMargin = 0;

        for (const round of rounds) {
            const playerScore = finiteOr(
                round.playerScore
            );

            const bankerScore = finiteOr(
                round.bankerScore
            );

            const margin = Number.isFinite(round.margin)
                ? round.margin
                : Math.abs(
                    playerScore -
                    bankerScore
                );

            playerTotal += playerScore;
            bankerTotal += bankerScore;
            marginTotal += margin;
            maxMargin = Math.max(
                maxMargin,
                margin
            );
        }

        return {
            playerAverage:
                playerTotal / rounds.length,
            bankerAverage:
                bankerTotal / rounds.length,
            averageMargin:
                marginTotal / rounds.length,
            maxMargin
        };
    }

    calculateAnalysisStats(analyses) {
        const summary = {
            count: analyses.length,
            shouldBetCount: 0,
            skipCount: 0,
            recommendationRate: 0,
            averageConfidence: null,
            averageDurationMs: null,
            recommendedBets: {
                player: 0,
                banker: 0,
                tie: 0,
                other: 0
            }
        };

        if (analyses.length === 0) {
            return summary;
        }

        let confidenceTotal = 0;
        let confidenceCount = 0;
        let durationTotal = 0;
        let durationCount = 0;

        for (const analysis of analyses) {
            if (analysis.shouldBet === true) {
                summary.shouldBetCount++;
            }
            else {
                summary.skipCount++;
            }

            const bet =
                analysis.recommendedBet ??
                analysis.recommendation?.bet ??
                null;

            if (bet in summary.recommendedBets) {
                summary.recommendedBets[bet]++;
            }
            else if (bet) {
                summary.recommendedBets.other++;
            }

            const confidence =
                analysis.overallConfidence
                    ?.confidenceScore ??
                analysis.overallConfidence ??
                null;

            if (Number.isFinite(confidence)) {
                confidenceTotal += confidence;
                confidenceCount++;
            }

            if (Number.isFinite(analysis.durationMs)) {
                durationTotal += analysis.durationMs;
                durationCount++;
            }
        }

        summary.recommendationRate =
            safeDivide(
                summary.shouldBetCount,
                analyses.length
            );

        summary.averageConfidence =
            confidenceCount > 0
                ? confidenceTotal / confidenceCount
                : null;

        summary.averageDurationMs =
            durationCount > 0
                ? durationTotal / durationCount
                : null;

        return summary;
    }

    calculateBettingStats(bets) {
        const result = {
            count: bets.length,
            totalStake: 0,
            totalProfit: 0,
            roi: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            winRate: 0,
            averageStake: 0,
            averageProfit: 0,
            maxDrawdown: 0,
            endingBankrollChange: 0,
            equityCurve: []
        };

        let equity = 0;
        let peak = 0;

        for (const bet of bets) {
            result.totalStake += bet.amount;
            result.totalProfit += bet.profit;

            if (bet.pushed) {
                result.pushes++;
            }
            else if (bet.profit > 0 || bet.won) {
                result.wins++;
            }
            else {
                result.losses++;
            }

            equity += bet.profit;
            peak = Math.max(peak, equity);

            const drawdown = peak - equity;

            result.maxDrawdown = Math.max(
                result.maxDrawdown,
                drawdown
            );

            result.equityCurve.push({
                round: bet.round,
                equity,
                profit: bet.profit
            });
        }

        result.roi = safeDivide(
            result.totalProfit,
            result.totalStake
        );

        result.winRate = safeDivide(
            result.wins,
            result.wins + result.losses
        );

        result.averageStake = safeDivide(
            result.totalStake,
            bets.length
        );

        result.averageProfit = safeDivide(
            result.totalProfit,
            bets.length
        );

        result.endingBankrollChange =
            result.totalProfit;

        return result;
    }

    calculateDuration(session) {
        if (!session.startedAt || !session.endedAt) {
            return null;
        }

        const start = new Date(session.startedAt);
        const end = new Date(session.endedAt);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end < start
        ) {
            return null;
        }

        return end.getTime() - start.getTime();
    }

    analyze(session = {}) {
        const normalized =
            this.normalizeSession(session);

        const totalRounds =
            normalized.rounds.length;

        const winners =
            this.countWinners(
                normalized.rounds
            );

        const report = {
            version:
                SESSION_ANALYZER_VERSION,

            shoeNumber:
                normalized.shoeNumber,

            startedAt:
                normalized.startedAt,

            endedAt:
                normalized.endedAt,

            durationMs:
                this.calculateDuration(
                    normalized
                ),

            rounds:
                totalRounds,

            winners,

            winRate:
                this.calculateRates(
                    winners,
                    totalRounds
                ),

            sideBets:
                this.calculateSideStats(
                    normalized.rounds
                ),

            streak:
                this.calculateStreaks(
                    normalized.rounds
                ),

            trend:
                this.calculateTrend(
                    normalized.rounds
                ),

            scores:
                this.calculateScoreStats(
                    normalized.rounds
                ),

            analysis:
                this.calculateAnalysisStats(
                    normalized.analyses
                ),

            betting:
                this.calculateBettingStats(
                    normalized.bets
                ),

            recentRounds:
                normalized.rounds.slice(
                    -this.options.recentWindow
                ),

            metadata:
                normalized.metadata,

            generatedAt:
                new Date().toISOString()
        };

        report.summary = {
            rounds:
                report.rounds,
            dominantWinner:
                this.getDominantWinner(
                    report.winners
                ),
            trend:
                report.trend.type,
            longestStreak:
                Math.max(
                    report.streak.longest.player,
                    report.streak.longest.banker,
                    report.streak.longest.tie
                ),
            analyses:
                report.analysis.count,
            recommendationRate:
                report.analysis.recommendationRate,
            bets:
                report.betting.count,
            roi:
                report.betting.roi,
            totalProfit:
                report.betting.totalProfit
        };

        this.lastReport = report;
        this.runCount++;

        return report;
    }

    getDominantWinner(winners) {
        const entries = Object.entries(winners);

        if (
            entries.every(([, value]) =>
                value === 0
            )
        ) {
            return null;
        }

        const sorted = [...entries].sort(
            ([, left], [, right]) =>
                right - left
        );

        if (
            sorted.length > 1 &&
            sorted[0][1] === sorted[1][1]
        ) {
            return "balanced";
        }

        return sorted[0][0];
    }

    compare(sessions = []) {
        if (!Array.isArray(sessions)) {
            throw new TypeError(
                "sessions must be an array."
            );
        }

        const reports = sessions.map(
            session => this.analyze(session)
        );

        const aggregate = {
            sessions:
                reports.length,
            rounds: 0,
            totalProfit: 0,
            totalStake: 0,
            winners: {
                player: 0,
                banker: 0,
                tie: 0
            }
        };

        for (const report of reports) {
            aggregate.rounds += report.rounds;
            aggregate.totalProfit +=
                report.betting.totalProfit;
            aggregate.totalStake +=
                report.betting.totalStake;
            aggregate.winners.player +=
                report.winners.player;
            aggregate.winners.banker +=
                report.winners.banker;
            aggregate.winners.tie +=
                report.winners.tie;
        }

        aggregate.roi = safeDivide(
            aggregate.totalProfit,
            aggregate.totalStake
        );

        aggregate.winRate =
            this.calculateRates(
                aggregate.winners,
                aggregate.rounds
            );

        return {
            version:
                SESSION_ANALYZER_VERSION,
            reports,
            aggregate
        };
    }

    clear() {
        this.lastReport = null;
        return this;
    }

    get summary() {
        return {
            version:
                SESSION_ANALYZER_VERSION,
            runCount:
                this.runCount,
            hasReport:
                Boolean(this.lastReport),
            lastRounds:
                this.lastReport?.rounds ??
                0,
            lastTrend:
                this.lastReport
                    ?.trend
                    ?.type ??
                SessionTrend.EMPTY,
            lastROI:
                this.lastReport
                    ?.betting
                    ?.roi ??
                0
        };
    }
}
