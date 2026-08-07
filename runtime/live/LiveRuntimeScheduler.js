/**
 * Baccarat Analyzer V10.2
 * Path: runtime/live/LiveRuntimeScheduler.js
 * Purpose: Serializes live runtime asynchronous tasks.
 */
export const LIVE_RUNTIME_SCHEDULER_VERSION="10.2.0";
export default class LiveRuntimeScheduler{
constructor(){this.running=false;this.currentTask=null;}
async run(taskId,task){if(this.running)throw new Error(`LiveRuntimeScheduler busy with ${this.currentTask}.`);if(typeof task!=="function")throw new TypeError("LiveRuntimeScheduler task must be a function.");
this.running=true;this.currentTask=taskId;try{return await task();}finally{this.running=false;this.currentTask=null;}}
reset(){this.running=false;this.currentTask=null;return this;}
get summary(){return{version:LIVE_RUNTIME_SCHEDULER_VERSION,running:this.running,currentTask:this.currentTask};}
}
