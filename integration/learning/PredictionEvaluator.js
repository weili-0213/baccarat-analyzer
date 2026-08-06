/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/PredictionEvaluator.js
 * Purpose: Evaluates predicted outcome against the actual result.
 */
export const PREDICTION_EVALUATOR_VERSION = "9.5.0";
export default class PredictionEvaluator {
    evaluate({prediction={},outcome={}}={}) {
        const predictedOutcome=prediction.predictedOutcome??prediction.bestOutcome??
            prediction.fused?.predictedOutcome??null;
        const confidence=Number.isFinite(prediction.confidence)?prediction.confidence:
            Number.isFinite(prediction.fused?.confidence)?prediction.fused.confidence:0;
        const actualProbability=prediction.fused?.probabilities?.[outcome.winner]??
            prediction.probabilities?.[outcome.winner]??0;
        const correct=Boolean(predictedOutcome&&outcome.winner&&predictedOutcome===outcome.winner);
        return {predictedOutcome,actualOutcome:outcome.winner??null,correct,confidence,
            actualProbability,confidenceError:Math.abs((correct?1:0)-confidence),
            probabilityError:Math.abs(1-actualProbability)};
    }
    get summary(){return {version:PREDICTION_EVALUATOR_VERSION};}
}
