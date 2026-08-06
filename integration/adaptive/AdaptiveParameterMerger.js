/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveParameterMerger.js
 * Purpose: Merges all tuner outputs into one candidate parameter set.
 */
export const ADAPTIVE_PARAMETER_MERGER_VERSION = "9.6.0";
export default class AdaptiveParameterMerger {
    merge({current={},updates=[]}={}) {
        return updates.reduce((result,update)=>({
            ...result,
            ...update,
            predictionWeights:update.predictionWeights
                ?{...(result.predictionWeights??{}),...update.predictionWeights}
                :result.predictionWeights
        }),{...current});
    }
    get summary(){return {version:ADAPTIVE_PARAMETER_MERGER_VERSION};}
}
