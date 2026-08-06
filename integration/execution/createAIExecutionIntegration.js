/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/createAIExecutionIntegration.js
 * Purpose: Factory for V9.8 AI Execution Integration.
 */
import AIExecutionIntegration from "./AIExecutionIntegration.js";
import ExecutionInputCollector from "./ExecutionInputCollector.js";
import ExecutionPlanValidator from "./ExecutionPlanValidator.js";
import ExecutionQueue from "./ExecutionQueue.js";
import BetExecutionGateway from "./BetExecutionGateway.js";
import ExecutionResultMonitor from "./ExecutionResultMonitor.js";
import ExecutionIntegrationHistory from "./ExecutionIntegrationHistory.js";

export const AI_EXECUTION_INTEGRATION_FACTORY_VERSION = "9.8.0";
export default function createAIExecutionIntegration({
    executor,collector=null,validator=null,queue=null,monitor=null,history=null,
    eventBus=null,clock=()=>Date.now()
}={}){
    return new AIExecutionIntegration({
        collector:collector??new ExecutionInputCollector(),
        validator:validator??new ExecutionPlanValidator(),
        queue:queue??new ExecutionQueue(),
        executionGateway:new BetExecutionGateway({executor}),
        monitor:monitor??new ExecutionResultMonitor(),
        history:history??new ExecutionIntegrationHistory(),
        eventBus,clock
    });
}
