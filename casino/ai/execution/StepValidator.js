/**
 * Baccarat Analyzer V7.5
 * casino/ai/execution/StepValidator.js
 */

export const STEP_VALIDATOR_VERSION = "7.5.0";

export default class StepValidator {
    validate(step, context = {}) {
        const errors = [];

        if (!step || typeof step !== "object") {
            errors.push("Step is required.");
        }

        if (!step?.stepId) {
            errors.push("stepId is required.");
        }

        if (!step?.action) {
            errors.push("action is required.");
        }

        if (
            typeof step?.canExecute === "function" &&
            !step.canExecute(context)
        ) {
            errors.push("Step conditions failed.");
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    get summary() {
        return {
            version: STEP_VALIDATOR_VERSION
        };
    }
}
