/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionResultMonitor.js
 * Purpose: Normalizes and classifies execution results.
 */
export const EXECUTION_RESULT_MONITOR_VERSION = "9.8.0";
export default class ExecutionResultMonitor {
    inspect({task,result}={}){
        const accepted=Boolean(result?.accepted??result?.success);
        const status=result?.status??(accepted?"accepted":"rejected");
        return {
            taskId:task?.taskId??null,
            accepted,
            status,
            executionId:result?.executionId??null,
            amount:result?.amount??task?.plan?.amount??0,
            betType:result?.betType??task?.plan?.betType??null,
            reason:result?.reason??null,
            raw:result??null
        };
    }
    get summary(){return {version:EXECUTION_RESULT_MONITOR_VERSION};}
}
