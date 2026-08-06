/**
 * Baccarat Analyzer V9.8
 * Path: integration/execution/BetExecutionGateway.js
 * Purpose: Adapts the existing Bet Engine or execution service.
 */
export const BET_EXECUTION_GATEWAY_VERSION = "9.8.0";
export default class BetExecutionGateway {
    constructor({executor}={}){
        if(!executor||typeof executor.execute!=="function")
            throw new TypeError("BetExecutionGateway requires executor.execute().");
        this.executor=executor;
    }
    async execute(task){return this.executor.execute(task);}
    get summary(){return {version:BET_EXECUTION_GATEWAY_VERSION};}
}
