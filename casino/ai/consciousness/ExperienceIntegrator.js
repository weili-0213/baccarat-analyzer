/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/ExperienceIntegrator.js
 */

export const EXPERIENCE_INTEGRATOR_VERSION = "8.4.0";

export default class ExperienceIntegrator {
    integrate({
        attention,
        introspection,
        metacognition,
        selfModel,
        context
    } = {}) {
        return {
            focus:
                attention?.focused ??
                [],
            observations:
                introspection?.observations ??
                [],
            uncertainties:
                introspection?.uncertainties ??
                [],
            metacognitiveScore:
                metacognition?.score ??
                0,
            calibrated:
                metacognition?.calibrated ??
                false,
            selfModel:
                selfModel?.snapshot?.() ??
                selfModel ??
                null,
            task:
                context?.metadata
                    ?.task ??
                null,
            integratedAt:
                Date.now()
        };
    }

    get summary() {
        return {
            version:
                EXPERIENCE_INTEGRATOR_VERSION
        };
    }
}
