/**
 * Baccarat Analyzer V9.9
 * Path: integration/feedback/ExecutionFeedbackAnalyzer.js
 * Purpose: Evaluates execution acceptance, settlement and profitability.
 */
export const EXECUTION_FEEDBACK_ANALYZER_VERSION = "9.9.0";

export default class ExecutionFeedbackAnalyzer {
    analyze({
        execution = {},
        actualOutcome = {}
    } = {}) {
        const monitoring =
            execution.monitoring ??
            execution.receipt?.monitoring ??
            {};

        const accepted =
            Boolean(
                monitoring.accepted ??
                execution.accepted
            );

        const executedAmount =
            monitoring.amount ??
            execution.task?.plan?.amount ??
            0;

        const betType =
            monitoring.betType ??
            execution.task?.plan?.betType ??
            null;

        const winner =
            actualOutcome.winner ??
            actualOutcome.result ??
            null;

        const profit =
            Number.isFinite(actualOutcome.profit)
                ? actualOutcome.profit
                : 0;

        const correct =
            accepted &&
            Boolean(betType) &&
            betType === winner;

        return {
            accepted,
            executedAmount,
            betType,
            winner,
            correct,
            profit,
            profitable: profit > 0,
            settled: Boolean(winner)
        };
    }

    get summary() {
        return {
            version: EXECUTION_FEEDBACK_ANALYZER_VERSION
        };
    }
}
