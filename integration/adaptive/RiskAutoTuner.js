/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/RiskAutoTuner.js
 * Purpose: Tunes risk tolerance from reward and profit feedback.
 */
export const RISK_AUTO_TUNER_VERSION = "9.6.0";
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export default class RiskAutoTuner {
    tune({parameters={},feedback={},constraints={}}={}) {
        const current=Number.isFinite(parameters.riskTolerance)
            ?parameters.riskTolerance:.5;
        const step=Number.isFinite(constraints.riskStep)?constraints.riskStep:.05;
        const next=feedback.severeNegative||feedback.profit<0
            ?current-step:feedback.reward>3?current+step:current;
        return {
            riskTolerance:clamp(
                next,
                constraints.riskToleranceMin??.05,
                constraints.riskToleranceMax??.95
            )
        };
    }
    get summary(){return {version:RISK_AUTO_TUNER_VERSION};}
}
