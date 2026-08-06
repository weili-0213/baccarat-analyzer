/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionQueue.js
 * Purpose: Stores pending execution tasks in FIFO order.
 */
export const EXECUTION_QUEUE_VERSION = "9.8.0";
export default class ExecutionQueue {
    constructor({capacity=100}={}){
        if(!Number.isInteger(capacity)||capacity<1)throw new RangeError("ExecutionQueue capacity must be positive.");
        this.capacity=capacity;
        this.items=[];
    }
    enqueue(task){
        if(this.items.length>=this.capacity)throw new Error("ExecutionQueue capacity exceeded.");
        this.items.push(task);
        return task;
    }
    dequeue(){return this.items.shift()??null;}
    peek(){return this.items[0]??null;}
    clear(){this.items=[];return this;}
    get summary(){return {version:EXECUTION_QUEUE_VERSION,capacity:this.capacity,size:this.items.length};}
}
