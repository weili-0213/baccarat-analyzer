/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/WeaknessDetector.js
 */

export const WEAKNESS_DETECTOR_VERSION = "8.1.0";

export default class WeaknessDetector {
    detect(context = {}) {
        const weaknesses = [];

        const assuranceScore =
            context.assurance?.score ??
            context.current?.assuranceScore ??
            100;

        const reward =
            context.learning?.reward ??
            context.current?.reward ??
            0;

        const successRate =
            context.autonomous?.successRate ??
            context.current?.successRate ??
            1;

        const confidence =
            context.current?.confidence ??
            context.baseline?.confidence ??
            1;

        if (assuranceScore < 85) {
            weaknesses.push({
                code: "LOW_ASSURANCE",
                metric: "assuranceScore",
                value: assuranceScore,
                severity: assuranceScore < 60 ? "high" : "medium"
            });
        }

        if (reward < 0) {
            weaknesses.push({
                code: "NEGATIVE_REWARD",
                metric: "reward",
                value: reward,
                severity: reward < -5 ? "high" : "medium"
            });
        }

        if (successRate < 0.6) {
            weaknesses.push({
                code: "LOW_SUCCESS_RATE",
                metric: "successRate",
                value: successRate,
                severity: successRate < 0.4 ? "high" : "medium"
            });
        }

        if (confidence < 0.5) {
            weaknesses.push({
                code: "LOW_CONFIDENCE",
                metric: "confidence",
                value: confidence,
                severity: "medium"
            });
        }

        return {
            detected: weaknesses.length > 0,
            weaknesses
        };
    }

    get summary() {
        return {
            version: WEAKNESS_DETECTOR_VERSION
        };
    }
}
