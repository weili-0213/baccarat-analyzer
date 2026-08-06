/**
 * Baccarat Analyzer V9.6
 * Path: tests/aiAdaptiveIntegration.test.js
 * Purpose: Full V9.6 syntax-compatible runtime integration test.
 */
import {ADAPTIVE_INTEGRATION_STATE_VERSION,AdaptiveIntegrationState,AdaptiveAction}
    from "../integration/adaptive/AdaptiveIntegrationState.js";
import AdaptiveIntegrationContext,{ADAPTIVE_INTEGRATION_CONTEXT_VERSION}
    from "../integration/adaptive/AdaptiveIntegrationContext.js";
import AdaptiveInputCollector,{ADAPTIVE_INPUT_COLLECTOR_VERSION}
    from "../integration/adaptive/AdaptiveInputCollector.js";
import AdaptiveFeedbackAnalyzer,{ADAPTIVE_FEEDBACK_ANALYZER_VERSION}
    from "../integration/adaptive/AdaptiveFeedbackAnalyzer.js";
import ThresholdAutoTuner,{THRESHOLD_AUTO_TUNER_VERSION}
    from "../integration/adaptive/ThresholdAutoTuner.js";
import RiskAutoTuner,{RISK_AUTO_TUNER_VERSION}
    from "../integration/adaptive/RiskAutoTuner.js";
import KellyAutoTuner,{KELLY_AUTO_TUNER_VERSION}
    from "../integration/adaptive/KellyAutoTuner.js";
import PredictionWeightTuner,{PREDICTION_WEIGHT_TUNER_VERSION}
    from "../integration/adaptive/PredictionWeightTuner.js";
import AdaptiveParameterMerger,{ADAPTIVE_PARAMETER_MERGER_VERSION}
    from "../integration/adaptive/AdaptiveParameterMerger.js";
import AdaptiveValidator,{ADAPTIVE_VALIDATOR_VERSION}
    from "../integration/adaptive/AdaptiveValidator.js";
import AdaptiveParameterStore,{ADAPTIVE_PARAMETER_STORE_VERSION}
    from "../integration/adaptive/AdaptiveParameterStore.js";
import AdaptiveIntegrationHistory,{ADAPTIVE_INTEGRATION_HISTORY_VERSION}
    from "../integration/adaptive/AdaptiveIntegrationHistory.js";
import AIAdaptiveIntegration,{AI_ADAPTIVE_INTEGRATION_VERSION,AdaptiveIntegrationEvent}
    from "../integration/adaptive/AIAdaptiveIntegration.js";
import AdaptiveIntegrationRuntimeAdapter,{ADAPTIVE_INTEGRATION_RUNTIME_ADAPTER_VERSION}
    from "../runtime/adapters/AdaptiveIntegrationRuntimeAdapter.js";
import {AI_ADAPTIVE_INTEGRATION_FACTORY_VERSION}
    from "../integration/adaptive/createAIAdaptiveIntegration.js";

const assert=(c,m)=>{if(!c)throw new Error(m);};

export default async function aiAdaptiveIntegrationTest(){
    const messages=[];
    assert([
        ADAPTIVE_INTEGRATION_STATE_VERSION,ADAPTIVE_INTEGRATION_CONTEXT_VERSION,
        ADAPTIVE_INPUT_COLLECTOR_VERSION,ADAPTIVE_FEEDBACK_ANALYZER_VERSION,
        THRESHOLD_AUTO_TUNER_VERSION,RISK_AUTO_TUNER_VERSION,KELLY_AUTO_TUNER_VERSION,
        PREDICTION_WEIGHT_TUNER_VERSION,ADAPTIVE_PARAMETER_MERGER_VERSION,
        ADAPTIVE_VALIDATOR_VERSION,ADAPTIVE_PARAMETER_STORE_VERSION,
        ADAPTIVE_INTEGRATION_HISTORY_VERSION,AI_ADAPTIVE_INTEGRATION_VERSION,
        ADAPTIVE_INTEGRATION_RUNTIME_ADAPTER_VERSION,AI_ADAPTIVE_INTEGRATION_FACTORY_VERSION
    ].every(v=>v==="9.6.0"),"V9.6 AI Adaptive Integration 版本錯誤");
    assert(AdaptiveAction.APPLY==="apply","Adaptive Action 錯誤");
    messages.push("✓ V9.6 AI Adaptive Integration 版本正確");

    const context=new AdaptiveIntegrationContext({
        learning:{reward:{reward:8},predictionEvaluation:{correct:true,confidenceError:.1},
            decisionEvaluation:{correct:true},outcome:{profit:95}},
        parameters:{minimumConfidence:.6,riskTolerance:.5,kellyMultiplier:.5,
            predictionWeights:{trend:.33,pattern:.33,simulation:.34}},
        constraints:{thresholdStep:.02,riskStep:.05,kellyStep:.05,weightStep:.1},
        baseline:{minimumConfidence:.65,riskTolerance:.4,kellyMultiplier:.4,
            predictionWeights:{trend:.33,pattern:.33,simulation:.34}}
    });
    assert(context.parameters.minimumConfidence===.6,"Adaptive Context 錯誤");
    messages.push("✓ Adaptive Integration Context 正確");

    const input=new AdaptiveInputCollector().collect(context);
    assert(input.parameters.kellyMultiplier===.5,"Adaptive Input Collector 錯誤");
    messages.push("✓ Adaptive Input Collector 正確");

    const feedback=new AdaptiveFeedbackAnalyzer().analyze(input);
    assert(feedback.positive&&feedback.predictionCorrect&&feedback.decisionCorrect,
        "Adaptive Feedback Analyzer 錯誤");
    messages.push("✓ Adaptive Feedback Analyzer 正確");

    const threshold=new ThresholdAutoTuner().tune({parameters:input.parameters,feedback,constraints:input.constraints});
    const risk=new RiskAutoTuner().tune({parameters:input.parameters,feedback,constraints:input.constraints});
    const kelly=new KellyAutoTuner().tune({parameters:input.parameters,feedback,constraints:input.constraints});
    const weights=new PredictionWeightTuner().tune({parameters:input.parameters,feedback,constraints:input.constraints});
    assert(threshold.minimumConfidence<.6&&risk.riskTolerance>.5&&kelly.kellyMultiplier>.5,
        "Adaptive Tuners 錯誤");
    assert(Math.abs(Object.values(weights.predictionWeights).reduce((a,b)=>a+b,0)-1)<.0001,
        "Prediction Weight Tuner 錯誤");
    messages.push("✓ Threshold、Risk、Kelly、Weight Tuner 正確");

    const candidate=new AdaptiveParameterMerger().merge({
        current:input.parameters,updates:[threshold,risk,kelly,weights]
    });
    const validation=new AdaptiveValidator().validate({candidate,constraints:input.constraints});
    assert(validation.valid,"Adaptive Parameter Merger／Validator 錯誤");
    messages.push("✓ Parameter Merger 與 Validator 正確");

    const store=new AdaptiveParameterStore(input.parameters);
    store.apply(candidate);
    assert(store.snapshot().revision===1&&store.snapshot().current.minimumConfidence<.6,
        "Adaptive Parameter Store 錯誤");
    store.rollback();
    assert(store.snapshot().revision===2&&store.snapshot().current.minimumConfidence===.6,
        "Adaptive Rollback 錯誤");
    messages.push("✓ Parameter Store 與 Rollback 正確");

    let now=100;
    const events=[];
    const integration=new AIAdaptiveIntegration({
        store:new AdaptiveParameterStore(input.parameters),
        history:new AdaptiveIntegrationHistory({limit:20}),
        eventBus:{emit(type,payload){events.push({type,payload});}},
        clock:()=>now++
    });
    assert(integration.state===AdaptiveIntegrationState.IDLE,"Adaptive initial state 錯誤");

    const result=await integration.run({context});
    assert(result.action===AdaptiveAction.APPLY&&result.validation.valid&&
        integration.state===AdaptiveIntegrationState.COMPLETED&&
        integration.summary.runCount===1&&integration.summary.history.count===1&&
        integration.summary.store.revision===1,"AI Adaptive Integration 錯誤");
    messages.push("✓ Collect → Analyze → Tune → Validate → Apply 正確");

    const rollbackResult=await integration.run({context:new AdaptiveIntegrationContext({
        learning:{reward:{reward:-6},predictionEvaluation:{correct:false,confidenceError:.9},
            decisionEvaluation:{correct:false},outcome:{profit:-100}},
        parameters:result.snapshot.current,baseline:context.baseline
    })});
    assert(rollbackResult.action===AdaptiveAction.ROLLBACK,"Adaptive Negative Rollback 錯誤");
    messages.push("✓ Negative Feedback Rollback 正確");

    integration.pause();
    assert(await integration.run({context})===null&&integration.state===AdaptiveIntegrationState.PAUSED,
        "Pause 錯誤");
    integration.resume();
    assert(integration.state===AdaptiveIntegrationState.IDLE&&!integration.summary.paused,"Resume 錯誤");
    messages.push("✓ Pause／Resume 正確");

    const adapter=new AdaptiveIntegrationRuntimeAdapter({integration});
    const adapterResult=await adapter.adapt({context});
    assert(adapterResult&&adapter.summary.integration.runCount===3,"Runtime Adapter 錯誤");
    messages.push("✓ Runtime Adapter 正確");

    assert([
        AdaptiveIntegrationEvent.STARTED,AdaptiveIntegrationEvent.INPUT_COLLECTED,
        AdaptiveIntegrationEvent.FEEDBACK_ANALYZED,AdaptiveIntegrationEvent.PARAMETERS_TUNED,
        AdaptiveIntegrationEvent.CANDIDATE_VALIDATED,AdaptiveIntegrationEvent.PARAMETERS_APPLIED,
        AdaptiveIntegrationEvent.PARAMETERS_ROLLED_BACK,AdaptiveIntegrationEvent.COMPLETED
    ].every(type=>events.some(event=>event.type===type)),"Adaptive Events 錯誤");
    messages.push("✓ Adaptive Integration Events 正確");

    integration.reset();
    assert(integration.state===AdaptiveIntegrationState.IDLE&&integration.summary.runCount===0&&
        integration.summary.history.count===0&&integration.summary.store.revision===0,"Reset 錯誤");
    integration.destroy();
    assert(integration.state===AdaptiveIntegrationState.DESTROYED&&integration.summary.destroyed,
        "Destroy 錯誤");
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Adaptive Integration V9.6 測試完成

Adaptive Integration State：通過
Adaptive Integration Context：通過
Adaptive Input Collector：通過
Adaptive Feedback Analyzer：通過
Threshold Auto Tuner：通過
Risk Auto Tuner：通過
Kelly Auto Tuner：通過
Prediction Weight Tuner：通過
Adaptive Parameter Merger：通過
Adaptive Validator：通過
Adaptive Parameter Store：通過
AI Adaptive Integration：通過
Negative Feedback Rollback：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
