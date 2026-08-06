/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveFeedbackAnalyzer.js
 * Purpose: Converts learning feedback into adaptive signals.
 */
export const ADAPTIVE_FEEDBACK_ANALYZER_VERSION = "9.6.0";
export default class AdaptiveFeedbackAnalyzer {
    analyze(input={}) {
        const reward=input.learning?.reward?.reward ??
            input.learning?.experience?.reward ??
            input.learning?.reward ?? 0;
        const predictionCorrect=Boolean(
            input.learning?.predictionEvaluation?.correct ??
            input.learning?.experience?.predictionEvaluation?.correct
        );
        const decisionCorrect=Boolean(
            input.learning?.decisionEvaluation?.correct ??
            input.learning?.experience?.decisionEvaluation?.correct
        );
        const profit=input.learning?.outcome?.profit ??
            input.learning?.experience?.outcome?.profit ?? 0;
        const confidenceError=input.learning?.predictionEvaluation?.confidenceError ??
            input.learning?.experience?.predictionEvaluation?.confidenceError ?? 1;
        return {
            reward:Number.isFinite(reward)?reward:0,
            predictionCorrect,
            decisionCorrect,
            profit:Number.isFinite(profit)?profit:0,
            confidenceError:Number.isFinite(confidenceError)?confidenceError:1,
            positive:Number.isFinite(reward)&&reward>0,
            severeNegative:Number.isFinite(reward)&&reward<=-4
        };
    }
    get summary(){return {version:ADAPTIVE_FEEDBACK_ANALYZER_VERSION};}
}
