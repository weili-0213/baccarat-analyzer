/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/FailSafeController.js
 */
export const FAIL_SAFE_CONTROLLER_VERSION = "8.7.0";
export default class FailSafeController {
    decide({ guardrail, threat } = {}) {
        const score = threat?.threatScore ?? 0;
        if (guardrail?.allowed === true && score < 40) {
            return {
                activated: false,
                action: "continue",
                reason: null
            };
        }
        if (score >= 80) {
            return {
                activated: true,
                action: "emergency-stop",
                reason: "Critical threat detected."
            };
        }
        return {
            activated: true,
            action: "block",
            reason: "Safety guardrail blocked the action."
        };
    }
    get summary() {
        return { version: FAIL_SAFE_CONTROLLER_VERSION };
    }
}
