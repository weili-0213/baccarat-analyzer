/** Baccarat Analyzer V9.2 */
export const STRATEGY_GATEWAY_VERSION = "9.2.0";
export default class StrategyGateway {
    constructor({strategy}={}) { if(!strategy || typeof strategy.evaluate!=="function") throw new TypeError("StrategyGateway requires strategy.evaluate()."); this.strategy=strategy; }
    async evaluate(input={}) { return this.strategy.evaluate(input); }
    get summary(){ return {version:STRATEGY_GATEWAY_VERSION}; }
}
