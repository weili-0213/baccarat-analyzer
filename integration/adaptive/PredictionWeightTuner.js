/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/PredictionWeightTuner.js
 * Purpose: Tunes trend, pattern and simulation fusion weights.
 */
export const PREDICTION_WEIGHT_TUNER_VERSION = "9.6.0";
const normalize=weights=>{
    const total=Object.values(weights).reduce((sum,value)=>sum+value,0);
    if(total<=0)return {trend:1/3,pattern:1/3,simulation:1/3};
    return Object.fromEntries(Object.entries(weights).map(([key,value])=>[key,value/total]));
};
export default class PredictionWeightTuner {
    tune({parameters={},feedback={},constraints={}}={}) {
        const current={
            trend:parameters.predictionWeights?.trend??1,
            pattern:parameters.predictionWeights?.pattern??1,
            simulation:parameters.predictionWeights?.simulation??1
        };
        const step=constraints.weightStep??.1;
        if(feedback.predictionCorrect) current.simulation+=step;
        else {
            current.trend+=step/2;
            current.pattern+=step/2;
            current.simulation=Math.max(.01,current.simulation-step);
        }
        return {predictionWeights:normalize(current)};
    }
    get summary(){return {version:PREDICTION_WEIGHT_TUNER_VERSION};}
}
