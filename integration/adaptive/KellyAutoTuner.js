/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/KellyAutoTuner.js
 * Purpose: Adjusts Kelly exposure multiplier.
 */
export const KELLY_AUTO_TUNER_VERSION = "9.6.0";
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export default class KellyAutoTuner {
    tune({parameters={},feedback={},constraints={}}={}) {
        const current=Number.isFinite(parameters.kellyMultiplier)
            ?parameters.kellyMultiplier:.5;
        const step=Number.isFinite(constraints.kellyStep)?constraints.kellyStep:.05;
        const next=feedback.profit<0?current-step:
            feedback.decisionCorrect&&feedback.reward>0?current+step:current;
        return {
            kellyMultiplier:clamp(
                next,
                constraints.kellyMultiplierMin??.1,
                constraints.kellyMultiplierMax??1
            )
        };
    }
    get summary(){return {version:KELLY_AUTO_TUNER_VERSION};}
}
