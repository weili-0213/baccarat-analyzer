/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/PlanStep.js
 */
export const PLAN_STEP_VERSION = "7.4.0";
export default class PlanStep {
    constructor({
        stepId,
        order,
        action,
        label,
        payload = {},
        conditions = [],
        optional = false,
        status = "pending"
    } = {}) {
        if (typeof stepId !== "string" || stepId.length === 0) {
            throw new TypeError("PlanStep stepId is required.");
        }
        this.version = PLAN_STEP_VERSION;
        this.stepId = stepId;
        this.order = Number.isFinite(order) ? order : 0;
        this.action = action;
        this.label = label ?? action;
        this.payload = { ...payload };
        this.conditions = Array.isArray(conditions) ? [...conditions] : [];
        this.optional = Boolean(optional);
        this.status = status;
    }
    mark(status) {
        this.status = status;
        return this;
    }
    canExecute(context = {}) {
        return this.conditions.every(condition =>
            typeof condition === "function"
                ? Boolean(condition(context))
                : true
        );
    }
    toJSON() {
        return {
            version: this.version,
            stepId: this.stepId,
            order: this.order,
            action: this.action,
            label: this.label,
            payload: { ...this.payload },
            optional: this.optional,
            status: this.status
        };
    }
}
