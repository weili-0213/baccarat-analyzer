/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/ExecutionReceipt.js
 * Purpose: Builds the final immutable execution receipt.
 */
export const EXECUTION_RECEIPT_VERSION = "9.8.0";
export default class ExecutionReceipt {
    constructor({receiptId,task,monitoring,createdAt=Date.now()}={}){
        if(!receiptId)throw new TypeError("ExecutionReceipt requires receiptId.");
        this.version=EXECUTION_RECEIPT_VERSION;
        this.receiptId=receiptId;
        this.taskId=task?.taskId??null;
        this.plan=task?.plan??null;
        this.monitoring=monitoring??null;
        this.createdAt=createdAt;
        Object.freeze(this);
    }
}
