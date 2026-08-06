/**
 * Baccarat Analyzer V9.5
 * Path: integration/learning/AILearningIntegration.js
 * Purpose: Coordinates outcome evaluation, reward calculation and learning.
 */
import {LearningIntegrationState} from "./LearningIntegrationState.js";
import LearningIntegrationContext from "./LearningIntegrationContext.js";
import LearningInputCollector from "./LearningInputCollector.js";
import OutcomeCollector from "./OutcomeCollector.js";
import PredictionEvaluator from "./PredictionEvaluator.js";
import DecisionEvaluator from "./DecisionEvaluator.js";
import IntegrationRewardCalculator from "./IntegrationRewardCalculator.js";
import LearningMemoryStore from "./LearningMemoryStore.js";
import LearningIntegrationHistory from "./LearningIntegrationHistory.js";

export const AI_LEARNING_INTEGRATION_VERSION = "9.5.0";
export const LearningIntegrationEvent = Object.freeze({
    STATE_CHANGE:"ai-learning-integration:state-change",
    STARTED:"ai-learning-integration:started",
    INPUT_COLLECTED:"ai-learning-integration:input-collected",
    OUTCOME_COLLECTED:"ai-learning-integration:outcome-collected",
    PREDICTION_EVALUATED:"ai-learning-integration:prediction-evaluated",
    DECISION_EVALUATED:"ai-learning-integration:decision-evaluated",
    REWARD_CALCULATED:"ai-learning-integration:reward-calculated",
    LEARNING_COMPLETED:"ai-learning-integration:learning-completed",
    MEMORY_UPDATED:"ai-learning-integration:memory-updated",
    COMPLETED:"ai-learning-integration:completed",
    PAUSED:"ai-learning-integration:paused",
    RESUMED:"ai-learning-integration:resumed",
    ERROR:"ai-learning-integration:error",
    DESTROYED:"ai-learning-integration:destroyed"
});

export default class AILearningIntegration {
    constructor({collector=null,outcomeCollector=null,predictionEvaluator=null,decisionEvaluator=null,
        rewardCalculator=null,learningGateway,memory=null,history=null,eventBus=null,clock=()=>Date.now()}={}) {
        if(!learningGateway||typeof learningGateway.learn!=="function")
            throw new TypeError("AILearningIntegration requires learningGateway.");
        if(eventBus!==null&&typeof eventBus.emit!=="function")throw new TypeError("eventBus requires emit().");
        if(typeof clock!=="function")throw new TypeError("clock must be a function.");
        this.collector=collector??new LearningInputCollector();
        this.outcomeCollector=outcomeCollector??new OutcomeCollector();
        this.predictionEvaluator=predictionEvaluator??new PredictionEvaluator();
        this.decisionEvaluator=decisionEvaluator??new DecisionEvaluator();
        this.rewardCalculator=rewardCalculator??new IntegrationRewardCalculator();
        this.learningGateway=learningGateway;
        this.memory=memory??new LearningMemoryStore();
        this.history=history??new LearningIntegrationHistory();
        this.eventBus=eventBus; this.clock=clock;
        this.state=LearningIntegrationState.IDLE; this.previousState=null;
        this.paused=false; this.destroyed=false; this.sequence=0; this.runCount=0;
        this.lastResult=null; this.lastError=null;
    }
    emit(type,payload=null){return this.eventBus?.emit(type,payload,{source:"ai-learning-integration"})??null;}
    setState(state){
        const previous=this.state; this.previousState=previous; this.state=state;
        this.emit(LearningIntegrationEvent.STATE_CHANGE,{previous,current:state});
        return this;
    }
    assertNotDestroyed(){if(this.destroyed)throw new Error("AILearningIntegration has been destroyed.");}
    async run({context={}}={}) {
        this.assertNotDestroyed();
        if(this.paused)return null;
        const learningContext=context instanceof LearningIntegrationContext
            ?context:new LearningIntegrationContext(context);
        this.sequence++;
        const integrationId=`learning-integration-${this.clock()}-${this.sequence}`;
        this.setState(LearningIntegrationState.COLLECTING);
        this.emit(LearningIntegrationEvent.STARTED,{integrationId,context:learningContext});
        try {
            const input=this.collector.collect(learningContext);
            this.emit(LearningIntegrationEvent.INPUT_COLLECTED,input);
            const outcome=this.outcomeCollector.collect(input.actualOutcome??{});
            this.emit(LearningIntegrationEvent.OUTCOME_COLLECTED,outcome);
            this.setState(LearningIntegrationState.EVALUATING);
            const predictionEvaluation=this.predictionEvaluator.evaluate({prediction:input.prediction??{},outcome});
            this.emit(LearningIntegrationEvent.PREDICTION_EVALUATED,predictionEvaluation);
            const decisionEvaluation=this.decisionEvaluator.evaluate({decision:input.decision??{},outcome});
            this.emit(LearningIntegrationEvent.DECISION_EVALUATED,decisionEvaluation);
            this.setState(LearningIntegrationState.REWARDING);
            const rewardResult=this.rewardCalculator.calculate({predictionEvaluation,decisionEvaluation,outcome});
            this.emit(LearningIntegrationEvent.REWARD_CALCULATED,rewardResult);
            const experience={
                experienceId:`experience-${integrationId}`,simulation:input.simulation,
                prediction:input.prediction,decision:input.decision,outcome,predictionEvaluation,
                decisionEvaluation,reward:rewardResult.reward,learningAction:rewardResult.action,
                statistics:input.statistics,bankroll:input.bankroll,before:input.before,after:input.after,
                metadata:input.metadata,createdAt:this.clock()
            };
            this.setState(LearningIntegrationState.LEARNING);
            const learningResult=await this.learningGateway.learn({
                decision:input.decision,prediction:input.prediction,simulation:input.simulation,
                outcome,evaluation:{prediction:predictionEvaluation,decision:decisionEvaluation},
                reward:rewardResult,experience,statistics:input.statistics,bankroll:input.bankroll,
                before:input.before,after:input.after
            });
            this.emit(LearningIntegrationEvent.LEARNING_COMPLETED,learningResult);
            this.setState(LearningIntegrationState.UPDATING);
            this.memory.add(experience);
            this.emit(LearningIntegrationEvent.MEMORY_UPDATED,this.memory.summary);
            const result={version:AI_LEARNING_INTEGRATION_VERSION,integrationId,input,outcome,
                predictionEvaluation,decisionEvaluation,reward:rewardResult,experience,learningResult,
                createdAt:this.clock()};
            this.lastResult=result; this.runCount++; this.history.add(result);
            this.setState(LearningIntegrationState.COMPLETED);
            this.emit(LearningIntegrationEvent.COMPLETED,result);
            return result;
        } catch(error) {return this.handleError(error,"run");}
    }
    learn(input={}){return this.run(input);}
    pause(){this.assertNotDestroyed();this.paused=true;this.setState(LearningIntegrationState.PAUSED);
        this.emit(LearningIntegrationEvent.PAUSED,this.summary);return this.summary;}
    resume(){this.assertNotDestroyed();this.paused=false;this.setState(LearningIntegrationState.IDLE);
        this.emit(LearningIntegrationEvent.RESUMED,this.summary);return this.summary;}
    reset(){this.assertNotDestroyed();this.memory.clear();this.history.clear();this.runCount=0;
        this.lastResult=null;this.lastError=null;this.paused=false;this.setState(LearningIntegrationState.IDLE);return this;}
    handleError(error,phase){this.lastError=error;this.setState(LearningIntegrationState.ERROR);
        this.emit(LearningIntegrationEvent.ERROR,{phase,message:error?.message??String(error)});throw error;}
    destroy(){if(this.destroyed)return this;this.memory.clear();this.history.clear();this.lastResult=null;
        this.lastError=null;this.destroyed=true;this.setState(LearningIntegrationState.DESTROYED);
        this.emit(LearningIntegrationEvent.DESTROYED,null);return this;}
    get summary(){return {version:AI_LEARNING_INTEGRATION_VERSION,state:this.state,
        previousState:this.previousState,paused:this.paused,destroyed:this.destroyed,runCount:this.runCount,
        hasResult:Boolean(this.lastResult),lastError:this.lastError?.message??null,
        collector:this.collector.summary,outcomeCollector:this.outcomeCollector.summary,
        predictionEvaluator:this.predictionEvaluator.summary,decisionEvaluator:this.decisionEvaluator.summary,
        rewardCalculator:this.rewardCalculator.summary,learningGateway:this.learningGateway.summary,
        memory:this.memory.summary,history:this.history.summary};}
}
