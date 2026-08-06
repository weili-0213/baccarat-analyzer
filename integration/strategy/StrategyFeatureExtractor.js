/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/StrategyFeatureExtractor.js
 * Purpose: Extracts normalized features for strategy scoring.
 */
export const STRATEGY_FEATURE_EXTRACTOR_VERSION = "9.7.0";
export default class StrategyFeatureExtractor {
    extract(input={}){
        const predictionConfidence=input.prediction?.confidence??
            input.prediction?.fused?.confidence??0;
        const decisionConfidence=input.decision?.recommendation?.confidence??
            input.decision?.confidence??0;
        const reward=input.learning?.reward?.reward??
            input.learning?.reward??0;
        const riskTolerance=input.adaptive?.snapshot?.current?.riskTolerance??
            input.adaptive?.current?.riskTolerance??.5;
        const kellyMultiplier=input.adaptive?.snapshot?.current?.kellyMultiplier??
            input.adaptive?.current?.kellyMultiplier??.5;
        return {
            predictionConfidence:Number.isFinite(predictionConfidence)?predictionConfidence:0,
            decisionConfidence:Number.isFinite(decisionConfidence)?decisionConfidence:0,
            reward:Number.isFinite(reward)?reward:0,
            riskTolerance:Number.isFinite(riskTolerance)?riskTolerance:.5,
            kellyMultiplier:Number.isFinite(kellyMultiplier)?kellyMultiplier:.5,
            bankrollBalance:input.bankroll?.balance??0,
            recentProfit:input.bankroll?.profit??0,
            roundCount:input.statistics?.roundCount??0,
            roadmapSize:input.roadmap?.bigRoad?.length??0
        };
    }
    get summary(){return {version:STRATEGY_FEATURE_EXTRACTOR_VERSION};}
}
