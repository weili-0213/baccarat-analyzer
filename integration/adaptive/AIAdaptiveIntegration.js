/**
 * Baccarat Analyzer V9.6
 * Path: integration/adaptive/AIAdaptiveIntegration.js
 * Purpose: Coordinates feedback analysis, tuning, validation and parameter application.
 */
import {AdaptiveIntegrationState,AdaptiveAction} from "./AdaptiveIntegrationState.js";
import AdaptiveIntegrationContext from "./AdaptiveIntegrationContext.js";
import AdaptiveInputCollector from "./AdaptiveInputCollector.js";
import AdaptiveFeedbackAnalyzer from "./AdaptiveFeedbackAnalyzer.js";
import ThresholdAutoTuner from "./ThresholdAutoTuner.js";
import RiskAutoTuner from "./RiskAutoTuner.js";
import KellyAutoTuner from "./KellyAutoTuner.js";
import PredictionWeightTuner from "./PredictionWeightTuner.js";
import AdaptiveParameterMerger from "./AdaptiveParameterMerger.js";
import AdaptiveValidator from "./AdaptiveValidator.js";
import AdaptiveParameterStore from "./AdaptiveParameterStore.js";
import AdaptiveIntegrationHistory from "./AdaptiveIntegrationHistory.js";

export const AI_ADAPTIVE_INTEGRATION_VERSION = "9.6.0";
export const AdaptiveIntegrationEvent = Object.freeze({
    STATE_CHANGE:"ai-adaptive-integration:state-change",
    STARTED:"ai-adaptive-integration:started",
    INPUT_COLLECTED:"ai-adaptive-integration:input-collected",
    FEEDBACK_ANALYZED:"ai-adaptive-integration:feedback-analyzed",
    PARAMETERS_TUNED:"ai-adaptive-integration:parameters-tuned",
    CANDIDATE_VALIDATED:"ai-adaptive-integration:candidate-validated",
    PARAMETERS_APPLIED:"ai-adaptive-integration:parameters-applied",
    PARAMETERS_ROLLED_BACK:"ai-adaptive-integration:parameters-rolled-back",
    COMPLETED:"ai-adaptive-integration:completed",
    PAUSED:"ai-adaptive-integration:paused",
    RESUMED:"ai-adaptive-integration:resumed",
    ERROR:"ai-adaptive-integration:error",
    DESTROYED:"ai-adaptive-integration:destroyed"
});

export default class AIAdaptiveIntegration {
    constructor({
        collector=null,feedbackAnalyzer=null,thresholdTuner=null,riskTuner=null,
        kellyTuner=null,weightTuner=null,merger=null,validator=null,store=null,
        history=null,eventBus=null,clock=()=>Date.now()
    }={}) {
        if(eventBus!==null&&typeof eventBus.emit!=="function")throw new TypeError("eventBus requires emit().");
        if(typeof clock!=="function")throw new TypeError("clock must be a function.");
        this.collector=collector??new AdaptiveInputCollector();
        this.feedbackAnalyzer=feedbackAnalyzer??new AdaptiveFeedbackAnalyzer();
        this.thresholdTuner=thresholdTuner??new ThresholdAutoTuner();
        this.riskTuner=riskTuner??new RiskAutoTuner();
        this.kellyTuner=kellyTuner??new KellyAutoTuner();
        this.weightTuner=weightTuner??new PredictionWeightTuner();
        this.merger=merger??new AdaptiveParameterMerger();
        this.validator=validator??new AdaptiveValidator();
        this.store=store??new AdaptiveParameterStore();
        this.history=history??new AdaptiveIntegrationHistory();
        this.eventBus=eventBus;this.clock=clock;
        this.state=AdaptiveIntegrationState.IDLE;this.previousState=null;
        this.paused=false;this.destroyed=false;this.sequence=0;this.runCount=0;
        this.lastResult=null;this.lastError=null;
    }
    emit(type,payload=null){return this.eventBus?.emit(type,payload,{source:"ai-adaptive-integration"})??null;}
    setState(state){const previous=this.state;this.previousState=previous;this.state=state;
        this.emit(AdaptiveIntegrationEvent.STATE_CHANGE,{previous,current:state});return this;}
    assertNotDestroyed(){if(this.destroyed)throw new Error("AIAdaptiveIntegration has been destroyed.");}
    async run({context={}}={}) {
        this.assertNotDestroyed();
        if(this.paused)return null;
        const adaptiveContext=context instanceof AdaptiveIntegrationContext
            ?context:new AdaptiveIntegrationContext(context);
        this.sequence++;
        const integrationId=`adaptive-integration-${this.clock()}-${this.sequence}`;
        this.setState(AdaptiveIntegrationState.COLLECTING);
        this.emit(AdaptiveIntegrationEvent.STARTED,{integrationId,context:adaptiveContext});
        try{
            const input=this.collector.collect(adaptiveContext);
            this.emit(AdaptiveIntegrationEvent.INPUT_COLLECTED,input);
            this.setState(AdaptiveIntegrationState.ANALYZING);
            const feedback=this.feedbackAnalyzer.analyze(input);
            this.emit(AdaptiveIntegrationEvent.FEEDBACK_ANALYZED,feedback);
            this.setState(AdaptiveIntegrationState.TUNING);
            const updates=[
                this.thresholdTuner.tune({parameters:input.parameters,feedback,constraints:input.constraints}),
                this.riskTuner.tune({parameters:input.parameters,feedback,constraints:input.constraints}),
                this.kellyTuner.tune({parameters:input.parameters,feedback,constraints:input.constraints}),
                this.weightTuner.tune({parameters:input.parameters,feedback,constraints:input.constraints})
            ];
            const candidate=this.merger.merge({current:input.parameters,updates});
            this.emit(AdaptiveIntegrationEvent.PARAMETERS_TUNED,{updates,candidate});
            this.setState(AdaptiveIntegrationState.VALIDATING);
            const validation=this.validator.validate({candidate,constraints:input.constraints});
            this.emit(AdaptiveIntegrationEvent.CANDIDATE_VALIDATED,validation);
            this.setState(AdaptiveIntegrationState.APPLYING);
            let action=AdaptiveAction.OBSERVE;
            let snapshot=this.store.snapshot();
            if(feedback.severeNegative&&input.baseline){
                this.store.apply(input.baseline);
                action=AdaptiveAction.ROLLBACK;
                snapshot=this.store.snapshot();
                this.emit(AdaptiveIntegrationEvent.PARAMETERS_ROLLED_BACK,snapshot);
            } else if(validation.valid) {
                this.store.apply(candidate);
                action=AdaptiveAction.APPLY;
                snapshot=this.store.snapshot();
                this.emit(AdaptiveIntegrationEvent.PARAMETERS_APPLIED,snapshot);
            }
            const result={version:AI_ADAPTIVE_INTEGRATION_VERSION,integrationId,input,feedback,
                updates,candidate,validation,action,snapshot,createdAt:this.clock()};
            this.lastResult=result;this.runCount++;this.history.add(result);
            this.setState(AdaptiveIntegrationState.COMPLETED);
            this.emit(AdaptiveIntegrationEvent.COMPLETED,result);
            return result;
        }catch(error){return this.handleError(error,"run");}
    }
    adapt(input={}){return this.run(input);}
    rollback(){this.assertNotDestroyed();const snapshot=this.store.rollback();
        this.emit(AdaptiveIntegrationEvent.PARAMETERS_ROLLED_BACK,snapshot);return snapshot;}
    pause(){this.assertNotDestroyed();this.paused=true;this.setState(AdaptiveIntegrationState.PAUSED);
        this.emit(AdaptiveIntegrationEvent.PAUSED,this.summary);return this.summary;}
    resume(){this.assertNotDestroyed();this.paused=false;this.setState(AdaptiveIntegrationState.IDLE);
        this.emit(AdaptiveIntegrationEvent.RESUMED,this.summary);return this.summary;}
    reset(){this.assertNotDestroyed();this.store.reset();this.history.clear();this.runCount=0;
        this.lastResult=null;this.lastError=null;this.paused=false;this.setState(AdaptiveIntegrationState.IDLE);return this;}
    handleError(error,phase){this.lastError=error;this.setState(AdaptiveIntegrationState.ERROR);
        this.emit(AdaptiveIntegrationEvent.ERROR,{phase,message:error?.message??String(error)});throw error;}
    destroy(){if(this.destroyed)return this;this.store.reset();this.history.clear();this.lastResult=null;
        this.lastError=null;this.destroyed=true;this.setState(AdaptiveIntegrationState.DESTROYED);
        this.emit(AdaptiveIntegrationEvent.DESTROYED,null);return this;}
    get summary(){return {version:AI_ADAPTIVE_INTEGRATION_VERSION,state:this.state,
        previousState:this.previousState,paused:this.paused,destroyed:this.destroyed,
        runCount:this.runCount,hasResult:Boolean(this.lastResult),lastError:this.lastError?.message??null,
        store:this.store.snapshot(),history:this.history.summary};}
}
