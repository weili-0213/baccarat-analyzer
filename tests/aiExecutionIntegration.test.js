/**
 * Baccarat Analyzer V9.8
 * Path: tests/aiExecutionIntegration.test.js
 * Purpose: Full V9.8 syntax-compatible runtime integration test.
 */
import {EXECUTION_INTEGRATION_STATE_VERSION,ExecutionIntegrationState,ExecutionIntegrationAction}
    from "../integration/execution/ExecutionIntegrationState.js";
import ExecutionIntegrationContext,{EXECUTION_INTEGRATION_CONTEXT_VERSION}
    from "../integration/execution/ExecutionIntegrationContext.js";
import ExecutionInputCollector,{EXECUTION_INPUT_COLLECTOR_VERSION}
    from "../integration/execution/ExecutionInputCollector.js";
import ExecutionPlanValidator,{EXECUTION_PLAN_VALIDATOR_VERSION}
    from "../integration/execution/ExecutionPlanValidator.js";
import ExecutionTask,{EXECUTION_TASK_VERSION}
    from "../integration/execution/ExecutionTask.js";
import ExecutionQueue,{EXECUTION_QUEUE_VERSION}
    from "../integration/execution/ExecutionQueue.js";
import BetExecutionGateway,{BET_EXECUTION_GATEWAY_VERSION}
    from "../integration/execution/BetExecutionGateway.js";
import ExecutionResultMonitor,{EXECUTION_RESULT_MONITOR_VERSION}
    from "../integration/execution/ExecutionResultMonitor.js";
import ExecutionReceipt,{EXECUTION_RECEIPT_VERSION}
    from "../integration/execution/ExecutionReceipt.js";
import ExecutionIntegrationHistory,{EXECUTION_INTEGRATION_HISTORY_VERSION}
    from "../integration/execution/ExecutionIntegrationHistory.js";
import AIExecutionIntegration,{AI_EXECUTION_INTEGRATION_VERSION,ExecutionIntegrationEvent}
    from "../integration/execution/AIExecutionIntegration.js";
import ExecutionIntegrationRuntimeAdapter,{EXECUTION_INTEGRATION_RUNTIME_ADAPTER_VERSION}
    from "../runtime/adapters/ExecutionIntegrationRuntimeAdapter.js";
import {AI_EXECUTION_INTEGRATION_FACTORY_VERSION}
    from "../integration/execution/createAIExecutionIntegration.js";

const assert=(c,m)=>{if(!c)throw new Error(m);};

export default async function aiExecutionIntegrationTest(){
    const messages=[];
    assert([
        EXECUTION_INTEGRATION_STATE_VERSION,EXECUTION_INTEGRATION_CONTEXT_VERSION,
        EXECUTION_INPUT_COLLECTOR_VERSION,EXECUTION_PLAN_VALIDATOR_VERSION,
        EXECUTION_TASK_VERSION,EXECUTION_QUEUE_VERSION,BET_EXECUTION_GATEWAY_VERSION,
        EXECUTION_RESULT_MONITOR_VERSION,EXECUTION_RECEIPT_VERSION,
        EXECUTION_INTEGRATION_HISTORY_VERSION,AI_EXECUTION_INTEGRATION_VERSION,
        EXECUTION_INTEGRATION_RUNTIME_ADAPTER_VERSION,AI_EXECUTION_INTEGRATION_FACTORY_VERSION
    ].every(v=>v==="9.8.0"),"V9.8 AI Execution Integration 版本錯誤");
    assert(ExecutionIntegrationAction.EXECUTE==="execute","Execution Action 錯誤");
    messages.push("✓ V9.8 AI Execution Integration 版本正確");

    const context=new ExecutionIntegrationContext({
        strategy:{action:"execute",strategyId:"balanced"},
        betPlan:{strategyId:"balanced",action:"bet",betType:"Banker",amount:20,
            confidence:.85,expectedValue:.02,risk:"low"},
        bankroll:{balance:1000},
        limits:{minBet:10,maxBet:100},
        session:{sessionId:"s1"},round:{roundId:"r1"}
    });
    assert(context.betPlan.betType==="Banker","Execution Context 錯誤");
    messages.push("✓ Execution Integration Context 正確");

    const input=new ExecutionInputCollector().collect(context);
    assert(input.betPlan.amount===20&&input.bankroll.balance===1000,
        "Execution Input Collector 錯誤");
    messages.push("✓ Execution Input Collector 正確");

    const validation=new ExecutionPlanValidator().validate({input});
    assert(validation.valid,"Execution Plan Validator 錯誤");
    const invalid=new ExecutionPlanValidator().validate({input:{
        ...input,betPlan:{...input.betPlan,amount:2000}
    }});
    assert(!invalid.valid&&invalid.errors.includes("insufficient-bankroll"),
        "Execution Plan Invalid Case 錯誤");
    messages.push("✓ Execution Plan Validator 正確");

    const task=new ExecutionTask({taskId:"t1",plan:input.betPlan});
    assert(task.plan.betType==="Banker","Execution Task 錯誤");
    messages.push("✓ Execution Task 正確");

    const queue=new ExecutionQueue({capacity:5});
    queue.enqueue(task);
    assert(queue.summary.size===1&&queue.peek().taskId==="t1","Execution Queue 錯誤");
    assert(queue.dequeue().taskId==="t1"&&queue.summary.size===0,"Execution Queue Dequeue 錯誤");
    messages.push("✓ Execution Queue 正確");

    const calls=[];
    const executor={
        async execute(executionTask){
            calls.push(executionTask);
            return {accepted:true,status:"accepted",executionId:"e1",
                amount:executionTask.plan.amount,betType:executionTask.plan.betType};
        }
    };
    const gateway=new BetExecutionGateway({executor});
    const execution=await gateway.execute(task);
    assert(execution.accepted&&execution.executionId==="e1","Bet Execution Gateway 錯誤");
    messages.push("✓ Bet Execution Gateway 正確");

    const monitoring=new ExecutionResultMonitor().inspect({task,result:execution});
    assert(monitoring.accepted&&monitoring.betType==="Banker","Execution Result Monitor 錯誤");
    messages.push("✓ Execution Result Monitor 正確");

    const receipt=new ExecutionReceipt({receiptId:"rct1",task,monitoring});
    assert(receipt.taskId==="t1"&&receipt.monitoring.accepted,"Execution Receipt 錯誤");
    messages.push("✓ Execution Receipt 正確");

    let now=100;
    const events=[];
    const integration=new AIExecutionIntegration({
        executionGateway:gateway,
        queue:new ExecutionQueue({capacity:20}),
        history:new ExecutionIntegrationHistory({limit:20}),
        eventBus:{emit(type,payload){events.push({type,payload});}},
        clock:()=>now++
    });
    assert(integration.state===ExecutionIntegrationState.IDLE,"Execution initial state 錯誤");

    const result=await integration.run({context});
    assert(result.action===ExecutionIntegrationAction.EXECUTE&&result.receipt&&
        result.monitoring.accepted&&integration.state===ExecutionIntegrationState.COMPLETED&&
        integration.summary.runCount===1&&integration.summary.history.count===1&&
        integration.summary.queue.size===0,"AI Execution Integration 錯誤");
    messages.push("✓ Collect → Validate → Queue → Execute → Monitor 正確");

    const rejectResult=await integration.run({context:new ExecutionIntegrationContext({
        betPlan:{action:"bet",betType:"Player",amount:500},
        bankroll:{balance:100},limits:{maxBet:200}
    })});
    assert(rejectResult.action===ExecutionIntegrationAction.REJECT&&rejectResult.receipt===null,
        "Execution Rejection 錯誤");
    messages.push("✓ Execution Rejection 正確");

    integration.pause();
    assert(await integration.run({context})===null&&integration.state===ExecutionIntegrationState.PAUSED,
        "Pause 錯誤");
    integration.resume();
    assert(integration.state===ExecutionIntegrationState.IDLE&&!integration.summary.paused,
        "Resume 錯誤");
    messages.push("✓ Pause／Resume 正確");

    const adapter=new ExecutionIntegrationRuntimeAdapter({integration});
    const adapterResult=await adapter.execute({context});
    assert(adapterResult&&adapter.summary.integration.runCount===3,"Runtime Adapter 錯誤");
    messages.push("✓ Runtime Adapter 正確");

    assert([
        ExecutionIntegrationEvent.STARTED,ExecutionIntegrationEvent.INPUT_COLLECTED,
        ExecutionIntegrationEvent.PLAN_VALIDATED,ExecutionIntegrationEvent.TASK_QUEUED,
        ExecutionIntegrationEvent.TASK_DEQUEUED,ExecutionIntegrationEvent.EXECUTION_COMPLETED,
        ExecutionIntegrationEvent.RESULT_MONITORED,ExecutionIntegrationEvent.RECEIPT_CREATED,
        ExecutionIntegrationEvent.COMPLETED
    ].every(type=>events.some(event=>event.type===type)),"Execution Events 錯誤");
    messages.push("✓ Execution Integration Events 正確");

    assert(calls.length>=3,"Execution Gateway Call Count 錯誤");

    integration.reset();
    assert(integration.state===ExecutionIntegrationState.IDLE&&integration.summary.runCount===0&&
        integration.summary.history.count===0&&integration.summary.queue.size===0,"Reset 錯誤");
    integration.destroy();
    assert(integration.state===ExecutionIntegrationState.DESTROYED&&integration.summary.destroyed,
        "Destroy 錯誤");
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Execution Integration V9.8 測試完成

Execution Integration State：通過
Execution Integration Context：通過
Execution Input Collector：通過
Execution Plan Validator：通過
Execution Task：通過
Execution Queue：通過
Bet Execution Gateway：通過
Execution Result Monitor：通過
Execution Receipt：通過
AI Execution Integration：通過
Execution Rejection：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
