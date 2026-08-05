/**
 * Baccarat Analyzer V8.4
 * casino/ai/consciousness/AwarenessEvaluator.js
 */

import {
    AwarenessLevel
} from "./ConsciousnessState.js";

export const AWARENESS_EVALUATOR_VERSION = "8.4.0";

export default class AwarenessEvaluator {
    evaluate({
        integratedExperience
    } = {}) {
        const score =
            integratedExperience
                ?.metacognitiveScore ??
            0;

        let level =
            AwarenessLevel.LOW;

        if (score >= 85) {
            level =
                AwarenessLevel.HIGH;
        } else if (score >= 60) {
            level =
                AwarenessLevel.MODERATE;
        }

        return {
            score,
            level,
            sufficient:
                level !==
                AwarenessLevel.LOW
        };
    }

    get summary() {
        return {
            version:
                AWARENESS_EVALUATOR_VERSION
        };
    }
}
