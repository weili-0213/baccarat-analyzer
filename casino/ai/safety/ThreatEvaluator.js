/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/ThreatEvaluator.js
 */
export const THREAT_EVALUATOR_VERSION = "8.7.0";
export default class ThreatEvaluator {
    evaluate({ hazards = [], context } = {}) {
        const detections = [];
        for (const hazard of hazards) {
            const result = hazard.detect({ context });
            if (result?.detected === true) {
                detections.push({
                    hazardId: hazard.hazardId,
                    severity: hazard.severity,
                    score: Number.isFinite(result.score)
                        ? result.score
                        : hazard.severity * 20,
                    reason: result.reason ?? "Hazard detected."
                });
            }
        }
        const threatScore = Math.min(
            100,
            detections.reduce(
                (total, item) => total + item.score,
                0
            )
        );
        return {
            detected: detections.length > 0,
            threatScore,
            detections
        };
    }
    get summary() {
        return { version: THREAT_EVALUATOR_VERSION };
    }
}
