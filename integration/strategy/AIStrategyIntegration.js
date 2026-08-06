/**
 * Baccarat Analyzer V9.7
 * Path: integration/strategy/AIStrategyIntegration.js
 * Purpose: Coordinates strategy scoring, selection, conflict resolution and bet plan creation.
 */
import {StrategyIntegrationState,StrategyIntegrationAction} from "./StrategyIntegrationState.js";
import StrategyIntegrationContext from "./StrategyIntegrationContext.js";
import StrategyInputCollector from "./StrategyInputCollector.js";
import StrategyFeatureExtractor from "./StrategyFeatureExtractor.js";
import StrategyScorer from "./StrategyScorer.js";
import StrategySelector from "./StrategySelector.js";
import StrategyConflictResolver from "./StrategyConflictResolver.js";
import BetPlanBuilder from "./BetPlanBuilder.js";
import StrategyIntegrationHistory from "./StrategyIntegrationHistory.js";

export const AI_STRATEGY_INTEGRATION_VERSION = "9.7.0";
export const StrategyIntegrationEvent = Object.freeze({
    STATE_CHANGE:"ai-strategy-integration:state-change",
    STARTED:"ai-strategy-integration:started",
    INPUT_COLLECTED:"ai-strategy-integration:input-collected",
    FEATURES_EXTRACTED:"ai-strategy-integration:features-extracted",
    STRATEGIES_SCORED:"ai-strategy-integration:strategies-scored",
    STRATEGY_SELECTED:"ai-strategy-integration:strategy-selected",
    CONFLICT_RESOLVED:"ai-strategy-integration:conflict-resolved",
    PLAN_BUILT:"ai-strategy-integration:plan-built",
    COMPLETED:"ai-strategy-integration:completed",
    PAUSED:"ai-strategy-integration:paused",
    RESUMED:"ai-strategy-integration:resumed",
    ERROR:"ai-strategy-integration:error",
    DESTROYED:"ai-strategy-integration:destroyed"
});

export default class AIStrategyIntegration {
    constructor({
        repository,collector=null,featureExtractor=null,scorer=null,selector=null,
        conflictResolver=null,planBuilder=null,history=null,eventBus=null,clock=()=>Date.now()
    }={}){
        if(!repository||typeof repository.all!=="function")
            throw new TypeError("AIStrategyIntegration requires StrategyRepository.");
        if(eventBus!==null&&typeof eventBus.emit!=="function")
            throw new TypeError("eventBus requires emit().");
        if(typeof clock!=="function")throw new TypeError("clock must be a function.");
        this.repository=repository;
        this.collector=collector??new StrategyInputCollector();
        this.featureExtractor=featureExtractor??new StrategyFeatureExtractor();
        this.scorer=scorer??new StrategyScorer();
        this.selector=selector??new StrategySelector();
        this.conflictResolver=conflictResolver??new StrategyConflictResolver();
        this.planBuilder=planBuilder??new BetPlanBuilder();
        this.history=history??new StrategyIntegrationHistory();
        this.eventBus=eventBus;this.clock=clock;
        this.state=StrategyIntegrationState.IDLE;this.previousState=null;
        this.paused=false;this.destroyed=false;this.sequence=0;this.runCount=0;
        this.lastResult=null;this.lastError=null;
    }
    emit(type,payload=null){return this.eventBus?.emit(type,payload,{source:"ai-strategy-integration"})??null;}
    setState(state){const previous=this.state;this.previousState=previous;this.state=state;
        this.emit(StrategyIntegrationEvent.STATE_CHANGE,{previous,current:state});return this;}
    assertNotDestroyed(){if(this.destroyed)throw new Error("AIStrategyIntegration has been destroyed.");}
    async run({context={}}={}){
        this.assertNotDestroyed();
        if(this.paused)return null;
        const strategyContext=context instanceof StrategyIntegrationContext
            ?context:new StrategyIntegrationContext(context);
        this.sequence++;
        const integrationId=`strategy-integration-${this.clock()}-${this.sequence}`;
        this.setState(StrategyIntegrationState.COLLECTING);
        this.emit(StrategyIntegrationEvent.STARTED,{integrationId,context:strategyContext});
        try{
            const input=this.collector.collect(strategyContext);
            this.emit(StrategyIntegrationEvent.INPUT_COLLECTED,input);
            const features=this.featureExtractor.extract(input);
            this.emit(StrategyIntegrationEvent.FEATURES_EXTRACTED,features);
            this.setState(StrategyIntegrationState.SCORING);
            const strategies=this.repository.all();
            const scores=strategies.map(strategy=>this.scorer.score({strategy,features}));
            this.emit(StrategyIntegrationEvent.STRATEGIES_SCORED,scores);
            this.setState(StrategyIntegrationState.SELECTING);
            const selection=this.selector.select({
                strategies,scores,
                minimumScore:input.settings?.minimumStrategyScore??.3
            });
            this.emit(StrategyIntegrationEvent.STRATEGY_SELECTED,selection);
            this.setState(StrategyIntegrationState.RESOLVING);
            const resolution=this.conflictResolver.resolve({selection,input,features});
            this.emit(StrategyIntegrationEvent.CONFLICT_RESOLVED,resolution);
            this.setState(StrategyIntegrationState.BUILDING);
            const plan=resolution.allowed
                ?this.planBuilder.build({strategy:resolution.strategy,input,features})
                :null;
            if(plan)this.emit(StrategyIntegrationEvent.PLAN_BUILT,plan);
            const action=plan?StrategyIntegrationAction.EXECUTE:
                selection.strategy?StrategyIntegrationAction.WAIT:StrategyIntegrationAction.REJECT;
            const result={version:AI_STRATEGY_INTEGRATION_VERSION,integrationId,input,features,
                strategies,scores,selection,resolution,plan,action,createdAt:this.clock()};
            this.lastResult=result;this.runCount++;this.history.add(result);
            this.setState(StrategyIntegrationState.COMPLETED);
            this.emit(StrategyIntegrationEvent.COMPLETED,result);
            return result;
        }catch(error){return this.handleError(error,"run");}
    }
    strategize(input={}){return this.run(input);}
    pause(){this.assertNotDestroyed();this.paused=true;this.setState(StrategyIntegrationState.PAUSED);
        this.emit(StrategyIntegrationEvent.PAUSED,this.summary);return this.summary;}
    resume(){this.assertNotDestroyed();this.paused=false;this.setState(StrategyIntegrationState.IDLE);
        this.emit(StrategyIntegrationEvent.RESUMED,this.summary);return this.summary;}
    reset(){this.assertNotDestroyed();this.history.clear();this.runCount=0;this.lastResult=null;
        this.lastError=null;this.paused=false;this.setState(StrategyIntegrationState.IDLE);return this;}
    handleError(error,phase){this.lastError=error;this.setState(StrategyIntegrationState.ERROR);
        this.emit(StrategyIntegrationEvent.ERROR,{phase,message:error?.message??String(error)});throw error;}
    destroy(){if(this.destroyed)return this;this.history.clear();this.lastResult=null;
        this.lastError=null;this.destroyed=true;this.setState(StrategyIntegrationState.DESTROYED);
        this.emit(StrategyIntegrationEvent.DESTROYED,null);return this;}
    get summary(){return {version:AI_STRATEGY_INTEGRATION_VERSION,state:this.state,
        previousState:this.previousState,paused:this.paused,destroyed:this.destroyed,
        runCount:this.runCount,hasResult:Boolean(this.lastResult),
        lastError:this.lastError?.message??null,repository:this.repository.summary,
        history:this.history.summary};}
}
