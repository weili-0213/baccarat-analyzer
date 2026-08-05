/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/SafetyScorer.js
 */
import { SafetyLevel } from "./SafetyState.js";
export const SAFETY_SCORER_VERSION = "8.7.0";
export default class SafetyScorer {
    score({
        threat,
        guardrail,
        failSafe
    } = {}) {
        let score = 100 - (threat?.threatScore ?? 0);

        if (guardrail?.allowed === false) {
            score -= 20;
        }

        if (failSafe?.activated === true) {
            score -= 20;
        }

        score = Math.max(
            0,
            Math.min(100, score)
        );

        let level = SafetyLevel.UNSAFE;

        if (score >= 80) {
            level = SafetyLevel.SAFE;
        } else if (score >= 50) {
            level = SafetyLevel.CAUTION;
        }

        return {
            score,
            level,
            safe: level === SafetyLevel.SAFE
        };
    }
    get summary() {
        return { version: SAFETY_SCORER_VERSION };
    }
}
