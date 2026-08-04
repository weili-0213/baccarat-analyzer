/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/PlanModel.js
 */
import { PlanStatus } from "./PlanningState.js";
export const PLAN_MODEL_VERSION = "7.4.0";

export default class PlanModel {
    constructor({
        planId,
        goal = null,
        steps = [],
        constraints = null,
        status = PlanStatus.DRAFT,
        score = 0,
        metadata = {},
        createdAt = null
    } = {}) {
        this.version = PLAN_MODEL_VERSION;
        this.planId = planId;
        this.goal = goal;
        this.steps = [...steps];
        this.constraints = constraints;
        this.status = status;
        this.score = score;
        this.metadata = { ...metadata };
        this.createdAt = createdAt;
    }
    get executableSteps() {
        return this.steps.filter(step => step.status !== "cancelled");
    }
    get isReady() {
        return this.status === PlanStatus.READY;
    }
    get isBlocked() {
        return this.status === PlanStatus.BLOCKED;
    }
    toJSON() {
        return {
            version: this.version,
            planId: this.planId,
            goal: this.goal,
            steps: this.steps.map(step =>
                typeof step.toJSON === "function" ? step.toJSON() : step
            ),
            constraints: this.constraints,
            status: this.status,
            score: this.score,
            metadata: { ...this.metadata },
            createdAt: this.createdAt
        };
    }
}
