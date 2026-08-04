/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/ActionPlanner.js
 */
import PlanStep from "./PlanStep.js";
import { PlanActionType } from "./PlanningState.js";
export const ACTION_PLANNER_VERSION = "7.4.0";

export default class ActionPlanner {
    build({ context = {}, goal = null, constraintResult = null } = {}) {
        const steps = [
            new PlanStep({
                stepId: "review-context",
                order: 1,
                action: PlanActionType.REVIEW,
                label: "Review current decision and reasoning",
                payload: { goal: goal?.name ?? null }
            })
        ];

        if (constraintResult && !constraintResult.passed) {
            steps.push(
                new PlanStep({
                    stepId: "stop-blocked",
                    order: 2,
                    action: PlanActionType.STOP,
                    label: "Stop because required constraints failed",
                    payload: { blocking: constraintResult.blocking }
                })
            );
            return steps;
        }

        const action =
            context.decision?.action ??
            context.strategy?.action ??
            "skip";

        if (action === "recommend" || action === "bet") {
            steps.push(
                new PlanStep({
                    stepId: "confirm-analysis",
                    order: 2,
                    action: PlanActionType.ANALYZE,
                    label: "Confirm EV, risk, confidence and bankroll"
                }),
                new PlanStep({
                    stepId: "execute-bet",
                    order: 3,
                    action: PlanActionType.BET,
                    label: "Execute approved bet",
                    payload: {
                        betType:
                            context.decision?.bestBet ??
                            context.strategy?.betType ??
                            null,
                        amount: context.strategy?.amount ?? null
                    }
                }),
                new PlanStep({
                    stepId: "review-outcome",
                    order: 4,
                    action: PlanActionType.REVIEW,
                    label: "Review outcome and send to learning engine"
                })
            );
        } else if (action === "wait") {
            steps.push(
                new PlanStep({
                    stepId: "wait-next-round",
                    order: 2,
                    action: PlanActionType.WAIT,
                    label: "Wait for stronger evidence"
                })
            );
        } else {
            steps.push(
                new PlanStep({
                    stepId: "skip-round",
                    order: 2,
                    action: PlanActionType.SKIP,
                    label: "Skip current round"
                })
            );
        }

        return steps;
    }
    get summary() {
        return { version: ACTION_PLANNER_VERSION };
    }
}
