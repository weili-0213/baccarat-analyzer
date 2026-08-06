/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/AIExecutionIntegration.js
 * Purpose: Coordinates validation, queueing, execution, monitoring and receipts.
 */
import {ExecutionIntegrationState,ExecutionIntegrationAction} from "./ExecutionIntegrationState.js";
import ExecutionIntegrationContext from "./ExecutionIntegrationContext.js";
import ExecutionInputCollector from "./ExecutionInputCollector.js";
import ExecutionPlanValidator from "./ExecutionPlanValidator.js";
import ExecutionTask from "./ExecutionTask.js";
import ExecutionQueue from "./ExecutionQueue.js";
import ExecutionResultMonitor from "./ExecutionResultMonitor.js";
import ExecutionReceipt from "./ExecutionReceipt.js";
import ExecutionIntegrationHistory from "./ExecutionIntegrationHistory.js";

export const AI_EXECUTION_INTEGRATION_VERSION = "9.8.0";
export const ExecutionIntegrationEvent = Object.freeze({
    STATE_CHANGE:"ai-execution-integration:state-change",
    STARTED:"ai-execution-integration:started",
    INPUT_COLLECTED:"ai-execution-integration:input-collected",
    PLAN_VALIDATED:"ai-execution-integration:plan-validated",
    TASK_QUEUED:"ai-execution-integration:task-queued",
    TASK_DEQUEUED:"ai-execution-integration:task-dequeued",
    EXECUTION_COMPLETED:"ai-execution-integration:execution-completed",
    RESULT_MONITORED:"ai-execution-integration:result-monitored",
    RECEIPT_CREATED:"ai-execution-integration:receipt-created",
    COMPLETED:"ai-execution-integration:completed",
    PAUSED:"ai-execution-integration:paused",
    RESUMED:"ai-execution-integration:resumed",
    ERROR:"ai-execution-integration:error",
    DESTROYED:"ai-execution-integration:destroyed"
});

export default class AIExecutionIntegration {
    constructor({
        collector=null,validator=null,queue=null,executionGateway,
        monitor=null,history=null,eventBus=null,clock=()=>Date.now()
    }={}){
        if(!executionGateway||typeof executionGateway.execute!=="function")
            throw new TypeError("AIExecutionIntegration requires executionGateway.");
        if(eventBus!==null&&typeof eventBus.emit!=="function")
            throw new TypeError("eventBus requires emit().");
        if(typeof clock!=="function")throw new TypeError("clock must be a function.");
        this.collector=collector??new ExecutionInputCollector();
        this.validator=validator??new ExecutionPlanValidator();
        this.queue=queue??new ExecutionQueue();
        this.executionGateway=executionGateway;
        this.monitor=monitor??new ExecutionResultMonitor();
        this.history=history??new ExecutionIntegrationHistory();
        this.eventBus=eventBus;this.clock=clock;
        this.state=ExecutionIntegrationState.IDLE;this.previousState=null;
        this.paused=false;this.destroyed=false;this.sequence=0;this.runCount=0;
        this.lastResult=null;this.lastError=null;
    }
    emit(type,payload=null){return this.eventBus?.emit(type,payload,{source:"ai-execution-integration"})??null;}
    setState(state){const previous=this.state;this.previousState=previous;this.state=state;
        this.emit(ExecutionIntegrationEvent.STATE_CHANGE,{previous,current:state});return this;}
    assertNotDestroyed(){if(this.destroyed)throw new Error("AIExecutionIntegration has been destroyed.");}
    async run({context={}}={}){
        this.assertNotDestroyed();
        if(this.paused)return null;
        const executionContext=context instanceof ExecutionIntegrationContext
            ?context:new ExecutionIntegrationContext(context);
        this.sequence++;
        const integrationId=`execution-integration-${this.clock()}-${this.sequence}`;
        this.setState(ExecutionIntegrationState.COLLECTING);
        this.emit(ExecutionIntegrationEvent.STARTED,{integrationId,context:executionContext});
        try{
            const input=this.collector.collect(executionContext);
            this.emit(ExecutionIntegrationEvent.INPUT_COLLECTED,input);
            this.setState(ExecutionIntegrationState.VALIDATING);
            const validation=this.validator.validate({input});
            this.emit(ExecutionIntegrationEvent.PLAN_VALIDATED,validation);
            if(!validation.valid){
                const result={version:AI_EXECUTION_INTEGRATION_VERSION,integrationId,input,
                    validation,task:null,execution:null,monitoring:null,receipt:null,
                    action:input.betPlan?ExecutionIntegrationAction.REJECT:ExecutionIntegrationAction.SKIP,
                    createdAt:this.clock()};
                this.lastResult=result;this.runCount++;this.history.add(result);
                this.setState(ExecutionIntegrationState.COMPLETED);
                this.emit(ExecutionIntegrationEvent.COMPLETED,result);
                return result;
            }
            this.setState(ExecutionIntegrationState.QUEUING);
            const task=new ExecutionTask({
                taskId:`execution-task-${this.clock()}-${this.sequence}`,
                plan:input.betPlan,session:input.session,round:input.round,createdAt:this.clock()
            });
            this.queue.enqueue(task);
            this.emit(ExecutionIntegrationEvent.TASK_QUEUED,task);
            const queuedTask=this.queue.dequeue();
            this.emit(ExecutionIntegrationEvent.TASK_DEQUEUED,queuedTask);
            this.setState(ExecutionIntegrationState.EXECUTING);
            const execution=await this.executionGateway.execute(queuedTask);
            this.emit(ExecutionIntegrationEvent.EXECUTION_COMPLETED,execution);
            this.setState(ExecutionIntegrationState.MONITORING);
            const monitoring=this.monitor.inspect({task:queuedTask,result:execution});
            this.emit(ExecutionIntegrationEvent.RESULT_MONITORED,monitoring);
            const receipt=new ExecutionReceipt({
                receiptId:`execution-receipt-${this.clock()}-${this.sequence}`,
                task:queuedTask,monitoring,createdAt:this.clock()
            });
            this.emit(ExecutionIntegrationEvent.RECEIPT_CREATED,receipt);
            const result={version:AI_EXECUTION_INTEGRATION_VERSION,integrationId,input,
                validation,task:queuedTask,execution,monitoring,receipt,
                action:monitoring.accepted?ExecutionIntegrationAction.EXECUTE:ExecutionIntegrationAction.REJECT,
                createdAt:this.clock()};
            this.lastResult=result;this.runCount++;this.history.add(result);
            this.setState(ExecutionIntegrationState.COMPLETED);
            this.emit(ExecutionIntegrationEvent.COMPLETED,result);
            return result;
        }catch(error){return this.handleError(error,"run");}
    }
    execute(input={}){return this.run(input);}
    pause(){this.assertNotDestroyed();this.paused=true;this.setState(ExecutionIntegrationState.PAUSED);
        this.emit(ExecutionIntegrationEvent.PAUSED,this.summary);return this.summary;}
    resume(){this.assertNotDestroyed();this.paused=false;this.setState(ExecutionIntegrationState.IDLE);
        this.emit(ExecutionIntegrationEvent.RESUMED,this.summary);return this.summary;}
    reset(){this.assertNotDestroyed();this.queue.clear();this.history.clear();this.runCount=0;
        this.lastResult=null;this.lastError=null;this.paused=false;this.setState(ExecutionIntegrationState.IDLE);return this;}
    handleError(error,phase){this.lastError=error;this.setState(ExecutionIntegrationState.ERROR);
        this.emit(ExecutionIntegrationEvent.ERROR,{phase,message:error?.message??String(error)});throw error;}
    destroy(){if(this.destroyed)return this;this.queue.clear();this.history.clear();this.lastResult=null;
        this.lastError=null;this.destroyed=true;this.setState(ExecutionIntegrationState.DESTROYED);
        this.emit(ExecutionIntegrationEvent.DESTROYED,null);return this;}
    get summary(){return {version:AI_EXECUTION_INTEGRATION_VERSION,state:this.state,
        previousState:this.previousState,paused:this.paused,destroyed:this.destroyed,
        runCount:this.runCount,hasResult:Boolean(this.lastResult),lastError:this.lastError?.message??null,
        queue:this.queue.summary,history:this.history.summary};}
}
