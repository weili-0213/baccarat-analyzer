/**
 * Baccarat Analyzer V8.1
 * casino/ai/self-improvement/ImprovementGoalGenerator.js
 */

export const IMPROVEMENT_GOAL_GENERATOR_VERSION = "8.1.0";

export default class ImprovementGoalGenerator {
    generate(weaknessResult = {}) {
        const goals = [];

        for (const weakness of weaknessResult.weaknesses ?? []) {
            const goalByCode = {
                LOW_ASSURANCE: {
                    name: "Improve assurance score",
                    targetMetric: "assuranceScore",
                    direction: "increase",
                    target: 85
                },
                NEGATIVE_REWARD: {
                    name: "Improve learning reward",
                    targetMetric: "reward",
                    direction: "increase",
                    target: 0
                },
                LOW_SUCCESS_RATE: {
                    name: "Improve autonomous success rate",
                    targetMetric: "successRate",
                    direction: "increase",
                    target: 0.6
                },
                LOW_CONFIDENCE: {
                    name: "Improve decision confidence",
                    targetMetric: "confidence",
                    direction: "increase",
                    target: 0.5
                }
            };

            const template = goalByCode[weakness.code];

            if (!template) {
                continue;
            }

            goals.push({
                goalId: `improve-${weakness.code.toLowerCase()}`,
                weaknessCode: weakness.code,
                priority:
                    weakness.severity === "high"
                        ? 100
                        : 50,
                ...template
            });
        }

        return goals.sort(
            (a, b) =>
                b.priority - a.priority
        );
    }

    get summary() {
        return {
            version: IMPROVEMENT_GOAL_GENERATOR_VERSION
        };
    }
}
