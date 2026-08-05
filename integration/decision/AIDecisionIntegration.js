/**
 * Baccarat Analyzer V9.2
 * integration/decision/AIDecisionIntegration.js
 */
import { DecisionIntegrationState } from "./DecisionIntegrationState.js";
import DecisionIntegrationContext from "./DecisionIntegrationContext.js";
import DecisionInputCollector from "./DecisionInputCollector.js";
import BetRecommendationMapper from "./BetRecommendationMapper.js";
import DecisionIntegrationHistory from "./DecisionIntegrationHistory.js";

export const AI_DECISION_INTEGRATION_VERSION = "9.2.0";
export const DecisionIntegrationEvent = Object.freeze({
    STATE_CHANGE:"ai-decision-integration:state-change", STARTED:"ai-decision-integration:started",
    INPUT_COLLECTED:"ai-decision-integration:input-collected", ANALYSIS_COMPLETED:"ai-decision-integration:analysis-completed",
    STRATEGY_COMPLETED:"ai-decision-integration:strategy-completed", DECISION_COMPLETED:"ai-decision-integration:decision-completed",
    RECOMMENDATION_MAPPED:"ai-decision-integration:recommendation-mapped", COMPLETED:"ai-decision-integration:completed",
    PAUSED:"ai-decision-integration:paused", RESUMED:"ai-decision-integration:resumed", ERROR:"ai-decision-integration:error",
    DESTROYED:"ai-decision-integration:destroyed"
});
const isFunction=value=>typeof value==="function";
export default class AIDecisionIntegration {
    constructor({collector=null,analyzerGateway,strategyGateway,decisionGateway,mapper=null,history=null,eventBus=null,clock=()=>Date.now()}={}) {
        if(!analyzerGateway||!isFunction(analyzerGateway.analyze)) throw new TypeError("AIDecisionIntegration requires analyzerGateway.");
        if(!strategyGateway||!isFunction(strategyGateway.evaluate)) throw new TypeError("AIDecisionIntegration requires strategyGateway.");
        if(!decisionGateway||!isFunction(decisionGateway.decide)) throw new TypeError("AIDecisionIntegration requires decisionGateway.");
        if(eventBus!==null&&!isFunction(eventBus.emit)) throw new TypeError("eventBus requires emit().");
        if(!isFunction(clock)) throw new TypeError("clock must be a function.");
        this.collector=collector??new DecisionInputCollector(); this.analyzerGateway=analyzerGateway; this.strategyGateway=strategyGateway;
        this.decisionGateway=decisionGateway; this.mapper=mapper??new BetRecommendationMapper(); this.history=history??new DecisionIntegrationHistory();
        this.eventBus=eventBus; this.clock=clock; this.state=DecisionIntegrationState.IDLE; this.previousState=null; this.paused=false;
        this.destroyed=false; this.sequence=0; this.runCount=0; this.lastResult=null; this.lastError=null;
    }
    emit(type,payload=null){ return this.eventBus?.emit(type,payload,{source:"ai-decision-integration"})??null; }
    setState(state){ const previous=this.state; this.previousState=previous; this.state=state; this.emit(DecisionIntegrationEvent.STATE_CHANGE,{previous,current:state}); return this; }
    assertNotDestroyed(){ if(this.destroyed) throw new Error("AIDecisionIntegration has been destroyed."); }
    async run({context={}}={}) {
        this.assertNotDestroyed(); if(this.paused) return null;
        const integrationContext=context instanceof DecisionIntegrationContext?context:new DecisionIntegrationContext(context);
        this.sequence++; const integrationId=`decision-integration-${this.clock()}-${this.sequence}`;
        this.setState(DecisionIntegrationState.COLLECTING); this.emit(DecisionIntegrationEvent.STARTED,{integrationId,context:integrationContext});
        try {
            const input=this.collector.collect(integrationContext); this.emit(DecisionIntegrationEvent.INPUT_COLLECTED,input);
            this.setState(DecisionIntegrationState.ANALYZING); const analysis=await this.analyzerGateway.analyze(input.analyzerInput); this.emit(DecisionIntegrationEvent.ANALYSIS_COMPLETED,analysis);
            this.setState(DecisionIntegrationState.STRATEGIZING); const strategy=await this.strategyGateway.evaluate({analysis,context:integrationContext}); this.emit(DecisionIntegrationEvent.STRATEGY_COMPLETED,strategy);
            this.setState(DecisionIntegrationState.DECIDING); const decision=await this.decisionGateway.decide({analysis,strategy,context:integrationContext}); this.emit(DecisionIntegrationEvent.DECISION_COMPLETED,decision);
            this.setState(DecisionIntegrationState.MAPPING); const recommendation=this.mapper.map({analysis,strategy,decision,bankroll:integrationContext.bankroll??{}}); this.emit(DecisionIntegrationEvent.RECOMMENDATION_MAPPED,recommendation);
            const result={version:AI_DECISION_INTEGRATION_VERSION,integrationId,input,analysis,strategy,decision,recommendation,createdAt:this.clock()};
            this.lastResult=result; this.runCount++; this.history.add(result); this.setState(DecisionIntegrationState.COMPLETED); this.emit(DecisionIntegrationEvent.COMPLETED,result); return result;
        } catch(error){ return this.handleError(error,"run"); }
    }
    pause(){ this.assertNotDestroyed(); this.paused=true; this.setState(DecisionIntegrationState.PAUSED); this.emit(DecisionIntegrationEvent.PAUSED,this.summary); return this.summary; }
    resume(){ this.assertNotDestroyed(); this.paused=false; this.setState(DecisionIntegrationState.IDLE); this.emit(DecisionIntegrationEvent.RESUMED,this.summary); return this.summary; }
    reset(){ this.assertNotDestroyed(); this.history.clear(); this.runCount=0; this.lastResult=null; this.lastError=null; this.paused=false; this.setState(DecisionIntegrationState.IDLE); return this; }
    handleError(error,phase){ this.lastError=error; this.setState(DecisionIntegrationState.ERROR); this.emit(DecisionIntegrationEvent.ERROR,{phase,message:error?.message??String(error)}); throw error; }
    destroy(){ if(this.destroyed) return this; this.history.clear(); this.lastResult=null; this.lastError=null; this.destroyed=true; this.setState(DecisionIntegrationState.DESTROYED); this.emit(DecisionIntegrationEvent.DESTROYED,null); return this; }
    get summary(){ return {version:AI_DECISION_INTEGRATION_VERSION,state:this.state,previousState:this.previousState,paused:this.paused,destroyed:this.destroyed,runCount:this.runCount,hasResult:Boolean(this.lastResult),lastError:this.lastError?.message??null,collector:this.collector.summary,analyzerGateway:this.analyzerGateway.summary,strategyGateway:this.strategyGateway.summary,decisionGateway:this.decisionGateway.summary,mapper:this.mapper.summary,history:this.history.summary}; }
}
