/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/GuardrailEngine.js
 */
export const GUARDRAIL_ENGINE_VERSION = "8.7.0";
export default class GuardrailEngine {
    evaluate({
        action = {},
        constraints = [],
        threat = {}
    } = {}) {
        const violations = [];
        for (const constraint of constraints) {
            const passed =
                typeof constraint.evaluate === "function"
                    ? Boolean(
                        constraint.evaluate({
                            action,
                            threat
                        })
                    )
                    : true;
            if (!passed) {
                violations.push({
                    constraintId:
                        constraint.constraintId ??
                        constraint.name ??
                        "unnamed",
                    reason:
                        constraint.reason ??
                        "Guardrail constraint failed."
                });
            }
        }
        if (threat.threatScore >= 70) {
            violations.push({
                constraintId: "threat-threshold",
                reason: "Threat score exceeds safe threshold."
            });
        }
        return {
            allowed: violations.length === 0,
            violations,
            action
        };
    }
    get summary() {
        return { version: GUARDRAIL_ENGINE_VERSION };
    }
}
