/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/ThresholdAutoTuner.js
 * Purpose: Tunes prediction and decision confidence thresholds.
 */
export const THRESHOLD_AUTO_TUNER_VERSION = "9.6.0";
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export default class ThresholdAutoTuner {
    tune({parameters={},feedback={},constraints={}}={}) {
        const current=Number.isFinite(parameters.minimumConfidence)
            ?parameters.minimumConfidence:.5;
        const step=Number.isFinite(constraints.thresholdStep)
            ?constraints.thresholdStep:.02;
        const next=feedback.decisionCorrect&&feedback.predictionCorrect
            ?current-step:current+step;
        return {
            minimumConfidence:clamp(
                next,
                constraints.minimumConfidenceMin??.1,
                constraints.minimumConfidenceMax??.95
            )
        };
    }
    get summary(){return {version:THRESHOLD_AUTO_TUNER_VERSION};}
}
