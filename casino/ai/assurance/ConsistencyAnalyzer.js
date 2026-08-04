/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/ConsistencyAnalyzer.js
 */

export const CONSISTENCY_ANALYZER_VERSION = "7.8.0";

export default class ConsistencyAnalyzer {
    analyze(context = {}) {
        const issues = [];

        const decisionBet =
            context.decision?.bestBet ??
            context.decision?.candidateBet ??
            null;

        const reasoningBet =
            context.reasoning?.explanation?.candidate ??
            null;

        const planBet =
            context.planning?.plan?.steps
                ?.find(step => step.action === "bet")
                ?.payload?.betType ??
            null;

        if (
            decisionBet &&
            reasoningBet &&
            decisionBet !== reasoningBet
        ) {
            issues.push(
                "Decision and reasoning candidate mismatch."
            );
        }

        if (
            decisionBet &&
            planBet &&
            decisionBet !== planBet
        ) {
            issues.push(
                "Decision and plan bet mismatch."
            );
        }

        if (
            context.governance?.blocked === true &&
            context.execution?.success === true
        ) {
            issues.push(
                "Execution succeeded despite governance block."
            );
        }

        return {
            passed: issues.length === 0,
            score: Math.max(
                0,
                100 -
                issues.length * 35
            ),
            issues
        };
    }

    get summary() {
        return {
            version: CONSISTENCY_ANALYZER_VERSION
        };
    }
}
