/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AdaptiveValidator.js
 * Purpose: Validates candidate parameters against constraints.
 */
export const ADAPTIVE_VALIDATOR_VERSION = "9.6.0";
export default class AdaptiveValidator {
    validate({candidate={},constraints={}}={}) {
        const errors=[];
        const check=(name,min,max)=>{
            const value=candidate[name];
            if(Number.isFinite(value)&&(value<min||value>max))errors.push(name);
        };
        check("minimumConfidence",constraints.minimumConfidenceMin??.1,
            constraints.minimumConfidenceMax??.95);
        check("riskTolerance",constraints.riskToleranceMin??.05,
            constraints.riskToleranceMax??.95);
        check("kellyMultiplier",constraints.kellyMultiplierMin??.1,
            constraints.kellyMultiplierMax??1);
        const weights=candidate.predictionWeights??{};
        const weightTotal=Object.values(weights).reduce((sum,value)=>sum+value,0);
        if(Object.keys(weights).length&&Math.abs(weightTotal-1)>.0001)errors.push("predictionWeights");
        return {valid:errors.length===0,errors};
    }
    get summary(){return {version:ADAPTIVE_VALIDATOR_VERSION};}
}
