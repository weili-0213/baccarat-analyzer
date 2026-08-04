/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/RiskGuard.js
 */

export const RISK_GUARD_VERSION = "7.7.0";

export default class RiskGuard {
    constructor({
        maxBetRatio = 0.05,
        maxSessionLossRatio = 0.2,
        minimumConfidence = 0.5,
        blockHighRisk = true
    } = {}) {
        this.config = {
            maxBetRatio,
            maxSessionLossRatio,
            minimumConfidence,
            blockHighRisk: Boolean(blockHighRisk)
        };
    }

    evaluate(context = {}) {
        const violations = [];
        const bankroll =
            Number.isFinite(
                context.bankroll?.balance
            )
                ? context.bankroll.balance
                : 0;

        const betAmount =
            context.execution?.amount ??
            context.plan?.amount ??
            context.decision?.amount ??
            0;

        const confidence =
            context.decision?.confidence ??
            context.plan?.confidence ??
            0;

        const risk =
            context.decision?.risk ??
            context.plan?.risk ??
            "unavailable";

        const sessionLoss =
            Math.abs(
                Math.min(
                    0,
                    context.session?.profit ??
                    0
                )
            );

        if (
            bankroll > 0 &&
            Number.isFinite(betAmount) &&
            betAmount >
                bankroll *
                this.config.maxBetRatio
        ) {
            violations.push({
                code: "BET_RATIO_EXCEEDED",
                message: "Bet exceeds bankroll ratio limit.",
                severity: "deny"
            });
        }

        if (
            bankroll > 0 &&
            sessionLoss >
                bankroll *
                this.config.maxSessionLossRatio
        ) {
            violations.push({
                code: "SESSION_LOSS_LIMIT",
                message: "Session loss limit exceeded.",
                severity: "deny"
            });
        }

        if (
            Number.isFinite(confidence) &&
            confidence <
                this.config.minimumConfidence
        ) {
            violations.push({
                code: "LOW_CONFIDENCE",
                message: "Confidence below governance threshold.",
                severity: "warn"
            });
        }

        if (
            this.config.blockHighRisk &&
            risk === "high"
        ) {
            violations.push({
                code: "HIGH_RISK_BLOCKED",
                message: "High-risk action is blocked.",
                severity: "deny"
            });
        }

        return {
            passed:
                !violations.some(
                    item =>
                        item.severity === "deny"
                ),
            violations
        };
    }

    get summary() {
        return {
            version: RISK_GUARD_VERSION,
            config: { ...this.config }
        };
    }
}
