/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/ExperimentPlanner.js
 */

export const EXPERIMENT_PLANNER_VERSION = "8.1.0";

export default class ExperimentPlanner {
    plan({
        goal,
        parameters = {},
        step = 0.05
    } = {}) {
        if (!goal) {
            throw new TypeError(
                "ExperimentPlanner requires goal."
            );
        }

        const candidates = [];

        for (const [name, value] of Object.entries(parameters)) {
            if (Number.isFinite(value)) {
                candidates.push({
                    experimentId:
                        `${goal.goalId}-${name}-up`,
                    goalId:
                        goal.goalId,
                    parameter:
                        name,
                    before:
                        value,
                    after:
                        value + step
                });

                candidates.push({
                    experimentId:
                        `${goal.goalId}-${name}-down`,
                    goalId:
                        goal.goalId,
                    parameter:
                        name,
                    before:
                        value,
                    after:
                        Math.max(0, value - step)
                });
            }
        }

        return candidates;
    }

    get summary() {
        return {
            version: EXPERIMENT_PLANNER_VERSION
        };
    }
}
