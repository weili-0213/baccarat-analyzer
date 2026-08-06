/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionTask.js
 * Purpose: Represents one immutable execution task.
 */
export const EXECUTION_TASK_VERSION = "9.8.0";
export default class ExecutionTask {
    constructor({taskId,plan,session=null,round=null,createdAt=Date.now()}={}){
        if(!taskId)throw new TypeError("ExecutionTask requires taskId.");
        if(!plan)throw new TypeError("ExecutionTask requires plan.");
        this.version=EXECUTION_TASK_VERSION;
        this.taskId=taskId;
        this.plan={...plan};
        this.session=session;
        this.round=round;
        this.createdAt=createdAt;
        Object.freeze(this.plan);
        Object.freeze(this);
    }
}
