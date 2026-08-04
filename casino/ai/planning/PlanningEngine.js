/**
 * Baccarat Analyzer V7.4
 * casino/ai/planning/PlanningEngine.js
 */
import { PlanningState, PlanStatus } from "./PlanningState.js";
import PlanningContext from "./PlanningContext.js";
import GoalManager from "./GoalManager.js";
import ConstraintEvaluator from "./ConstraintEvaluator.js";
import ActionPlanner from "./ActionPlanner.js";
import PlanModel from "./PlanModel.js";
import PlanEvaluator from "./PlanEvaluator.js";
import PlanningHistory from "./PlanningHistory.js";

export const PLANNING_ENGINE_VERSION = "7.4.0";

export const PlanningEvent = Object.freeze({
    STATE_CHANGE: "planning-engine:state-change",
    STARTED: "planning-engine:started",
    GOAL_SELECTED: "planning-engine:goal-selected",
    CONSTRAINTS_EVALUATED: "planning-engine:constraints-evaluated",
    STEPS_BUILT: "planning-engine:steps-built",
    PLAN_EVALUATED: "planning-engine:plan-evaluated",
    COMPLETED: "planning-engine:completed",
    PAUSED: "planning-engine:paused",
    RESUMED: "planning-engine:resumed",
    ERROR: "planning-engine:error",
    DESTROYED: "planning-engine:destroyed"
});

function isFunction(value) {
    return typeof value === "function";
}

export default class PlanningEngine {
    constructor({
        goals = null,
        constraintEvaluator = null,
        actionPlanner = null,
        planEvaluator = null,
        history = null,
        eventBus = null,
        clock = () => Date.now(),
        idFactory = null
    } = {}) {
        if (eventBus !== null && !isFunction(eventBus.emit)) {
            throw new TypeError("eventBus requires emit().");
        }
        if (!isFunction(clock)) {
            throw new TypeError("clock must be a function.");
        }

        this.goals = goals ?? new GoalManager();
        this.constraintEvaluator =
            constraintEvaluator ?? new ConstraintEvaluator();
        this.actionPlanner = actionPlanner ?? new ActionPlanner();
        this.planEvaluator = planEvaluator ?? new PlanEvaluator();
        this.history = history ?? new PlanningHistory();
        this.eventBus = eventBus;
        this.clock = clock;
        this.sequence = 0;
        this.idFactory =
            idFactory ??
            (({ sequence, timestamp }) => `plan-${timestamp}-${sequence}`);
        this.state = PlanningState.IDLE;
        this.previousState = null;
        this.paused = false;
        this.lastPlan = null;
        this.lastError = null;
        this.planCount = 0;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return (
            this.eventBus?.emit(type, payload, {
                source: "planning-engine"
            }) ?? null
        );
    }

    setState(state) {
        const previous = this.state;
        this.previousState = previous;
        this.state = state;
        this.emit(PlanningEvent.STATE_CHANGE, {
            previous,
            current: state
        });
        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error("PlanningEngine has been destroyed.");
        }
    }

    async plan({ context = {}, goalId = null } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const planningContext =
            context instanceof PlanningContext
                ? context
                : new PlanningContext(context);

        this.sequence++;
        const timestamp = this.clock();
        const planId = this.idFactory({
            sequence: this.sequence,
            timestamp
        });

        this.setState(PlanningState.PREPARING);
        this.emit(PlanningEvent.STARTED, {
            planId,
            context: planningContext
        });

        try {
            const selectedGoal = goalId
                ? this.goals.get(goalId)
                : this.goals.active()[0] ??
                    planningContext.goal ??
                    null;

            this.emit(PlanningEvent.GOAL_SELECTED, selectedGoal);

            const constraintResult =
                await this.constraintEvaluator.evaluate({
                    context: planningContext,
                    constraints: planningContext.constraints
                });

            this.emit(
                PlanningEvent.CONSTRAINTS_EVALUATED,
                constraintResult
            );

            this.setState(PlanningState.PLANNING);

            const steps = await this.actionPlanner.build({
                context: planningContext,
                goal: selectedGoal,
                constraintResult
            });

            this.emit(PlanningEvent.STEPS_BUILT, steps);

            const plan = new PlanModel({
                planId,
                goal: selectedGoal,
                steps,
                constraints: constraintResult,
                status: constraintResult.passed
                    ? PlanStatus.READY
                    : PlanStatus.BLOCKED,
                createdAt: timestamp,
                metadata: planningContext.metadata
            });

            this.setState(PlanningState.EVALUATING);

            const evaluation = await this.planEvaluator.evaluate({
                plan,
                context: planningContext
            });

            plan.score = evaluation.score;

            if (!evaluation.acceptable && !plan.isBlocked) {
                plan.status = PlanStatus.BLOCKED;
            }

            const result = {
                plan,
                evaluation
            };

            this.emit(PlanningEvent.PLAN_EVALUATED, result);

            this.lastPlan = plan;
            this.planCount++;
            this.history.add(plan.toJSON());

            this.setState(PlanningState.COMPLETED);
            this.emit(PlanningEvent.COMPLETED, result);

            return result;
        } catch (error) {
            return this.handleError(error, "plan");
        }
    }

    pause() {
        this.assertNotDestroyed();
        this.paused = true;
        this.setState(PlanningState.PAUSED);
        this.emit(PlanningEvent.PAUSED, this.summary);
        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();
        this.paused = false;
        this.setState(PlanningState.IDLE);
        this.emit(PlanningEvent.RESUMED, this.summary);
        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();
        this.history.clear();
        this.lastPlan = null;
        this.lastError = null;
        this.planCount = 0;
        this.paused = false;
        this.setState(PlanningState.IDLE);
        return this;
    }

    handleError(error, phase) {
        this.lastError = error;
        this.setState(PlanningState.ERROR);
        this.emit(PlanningEvent.ERROR, {
            phase,
            message: error?.message ?? String(error)
        });
        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }
        this.goals.clear();
        this.history.clear();
        this.lastPlan = null;
        this.lastError = null;
        this.destroyed = true;
        this.setState(PlanningState.DESTROYED);
        this.emit(PlanningEvent.DESTROYED, null);
        return this;
    }

    get summary() {
        return {
            version: PLANNING_ENGINE_VERSION,
            state: this.state,
            previousState: this.previousState,
            paused: this.paused,
            destroyed: this.destroyed,
            planCount: this.planCount,
            hasPlan: Boolean(this.lastPlan),
            lastError: this.lastError?.message ?? null,
            goals: this.goals.summary,
            history: this.history.summary,
            components: {
                constraintEvaluator: this.constraintEvaluator.summary,
                actionPlanner: this.actionPlanner.summary,
                planEvaluator: this.planEvaluator.summary
            }
        };
    }
}
