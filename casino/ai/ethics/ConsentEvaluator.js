/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/ConsentEvaluator.js
 */

export const CONSENT_EVALUATOR_VERSION = "8.6.0";

export default class ConsentEvaluator {
    evaluate({
        subject = {},
        action = {}
    } = {}) {
        const required =
            action.requiresConsent ===
            true;

        const granted =
            subject.consent ===
            true;

        const informed =
            subject.informed ===
            true;

        const valid =
            !required ||
            (
                granted &&
                informed
            );

        return {
            required,
            granted,
            informed,
            valid,
            score:
                valid
                    ? 100
                    : 0,
            reason:
                valid
                    ? null
                    : "Required informed consent is missing."
        };
    }

    get summary() {
        return {
            version:
                CONSENT_EVALUATOR_VERSION
        };
    }
}
